const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const Configuration = require('../deploy/js/configuration');
const Tfvars = require('../deploy/js/tfvars-generator');

const repoRoot = path.resolve(__dirname, '..');
const sourceRoot = path.join(repoRoot, 'dist', 'terraform-sources');
const manifest = JSON.parse(fs.readFileSync(path.join(sourceRoot, 'manifest.json'), 'utf8'));

const fixtures = {
  'aws-standard': {
    project_prefix: 'validation-workspace', databricks_account_id: '12345678-1234-1234-1234-123456789012',
    aws_account_id: '123456789012', region: 'us-west-2', availability_zones: ['us-west-2a', 'us-west-2b'],
    vpc_cidr_range: '10.20.0.0/16', subnet_prefix: 24, enable_private_link: false,
    metastore_mode: 'new', metastore_name: 'validation-metastore',
    tags: { Environment: 'validation', Team: 'data-platform' }
  },
  'aws-privatelink': {
    project_prefix: 'validation-workspace', databricks_account_id: '12345678-1234-1234-1234-123456789012',
    region: 'us-west-2', availability_zones: ['us-west-2a', 'us-west-2b'], vpc_cidr_range: '10.30.0.0/16',
    subnet_prefix: 24, enable_private_link: true, network_configuration: 'fully_private',
    metastore_mode: 'new', metastore_name: 'validation-metastore'
  }
};

function hashFile(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

function declaredVariables(content) {
  return new Set([...content.matchAll(/variable\s+"([A-Za-z0-9_]+)"\s*\{/g)].map(match => match[1]));
}

function assignedVariables(content) {
  return new Set([...content.matchAll(/^([A-Za-z0-9_]+)\s*=/gm)].map(match => match[1]));
}

for (const common of manifest.commonFiles) {
  const filePath = path.join(sourceRoot, manifest.commit, common.path);
  if (hashFile(filePath) !== common.sha256) throw new Error(`Hash mismatch: ${common.path}`);
}

for (const [id, variant] of Object.entries(manifest.variants)) {
  const variantRoot = path.join(sourceRoot, manifest.commit, id);
  for (const file of variant.files) {
    if (hashFile(path.join(variantRoot, file.path)) !== file.sha256) throw new Error(`Hash mismatch: ${id}/${file.path}`);
  }

  const tfvars = Tfvars.generate(fixtures[id]);
  const declared = declaredVariables(fs.readFileSync(path.join(variantRoot, 'tf', 'variables.tf'), 'utf8'));
  const unknown = [...assignedVariables(tfvars)].filter(name => !declared.has(name));
  if (unknown.length) throw new Error(`${id} generated undeclared variables: ${unknown.join(', ')}`);

  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), `platform-deployer-${id}-`));
  const tfRoot = path.join(tempRoot, 'tf');
  fs.cpSync(path.join(variantRoot, 'tf'), tfRoot, { recursive: true });
  fs.writeFileSync(path.join(tfRoot, 'terraform.tfvars'), tfvars);
  try {
    execFileSync('terraform', ['fmt', '-check', '-diff', 'terraform.tfvars'], { cwd: tfRoot, stdio: 'inherit' });
    execFileSync('terraform', ['init', '-backend=false', '-input=false', '-no-color'], { cwd: tfRoot, stdio: 'inherit' });
    execFileSync('terraform', ['validate', '-no-color'], { cwd: tfRoot, stdio: 'inherit' });
    const consoleOutput = execFileSync('terraform', ['console', '-var-file=terraform.tfvars'], {
      cwd: tfRoot, input: 'var.region\n', encoding: 'utf8'
    }).trim();
    if (consoleOutput !== '"us-west-2"') throw new Error(`${id} did not load the generated tfvars.`);
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
}

process.stdout.write(`Validated ${Object.keys(manifest.variants).length} pinned Terraform variants and generated tfvars interfaces.\n`);
