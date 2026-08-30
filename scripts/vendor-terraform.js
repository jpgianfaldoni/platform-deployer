const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const repoRoot = path.resolve(__dirname, '..');
const configPath = path.join(repoRoot, 'config', 'upstreams.json');

function runGit(args, cwd, encoding = 'utf8') {
  return execFileSync('git', args, {
    cwd,
    encoding,
    maxBuffer: 32 * 1024 * 1024,
    stdio: ['ignore', 'pipe', 'pipe']
  });
}

function sha256(content) {
  return crypto.createHash('sha256').update(content).digest('hex');
}

function safeRelativePath(value) {
  if (!value || path.isAbsolute(value) || value.split('/').includes('..')) {
    throw new Error(`Unsafe upstream path: ${value}`);
  }
  return value.replaceAll('\\', '/');
}

function prepareRepository(config) {
  if (process.env.TERRAFORM_SOURCE_DIR) {
    const sourceDir = path.resolve(process.env.TERRAFORM_SOURCE_DIR);
    const actual = runGit(['rev-parse', 'HEAD'], sourceDir).trim();
    if (actual !== config.commit) {
      throw new Error(`TERRAFORM_SOURCE_DIR is at ${actual}; expected ${config.commit}`);
    }
    return { sourceDir, cleanup: false };
  }

  const sourceDir = fs.mkdtempSync(path.join(os.tmpdir(), 'platform-deployer-upstream-'));
  runGit(['init', '--quiet'], sourceDir);
  runGit(['remote', 'add', 'origin', config.repository], sourceDir);
  runGit(['fetch', '--quiet', '--depth=1', '--filter=blob:none', 'origin', config.commit], sourceDir);
  const actual = runGit(['rev-parse', 'FETCH_HEAD'], sourceDir).trim();
  if (actual !== config.commit) {
    throw new Error(`Fetched ${actual}; expected pinned commit ${config.commit}`);
  }
  return { sourceDir, cleanup: true };
}

function listTrackedFiles(sourceDir, commit, sourcePath) {
  const output = runGit(['ls-tree', '-r', '--name-only', commit, '--', sourcePath], sourceDir);
  return output.split('\n').map(line => line.trim()).filter(Boolean);
}

function readTrackedFile(sourceDir, commit, filePath) {
  return runGit(['show', `${commit}:${filePath}`], sourceDir, null);
}

function writeTrackedFile(sourceDir, commit, upstreamPath, outputPath) {
  const content = readTrackedFile(sourceDir, commit, upstreamPath);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, content);
  return { content, hash: sha256(content) };
}

function vendorTerraform(outputRoot = path.join(repoRoot, 'dist', 'terraform-sources')) {
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  if (!/^[0-9a-f]{40}$/.test(config.commit)) {
    throw new Error('The Technical Services source must be pinned to a full 40-character commit SHA.');
  }

  const { sourceDir, cleanup } = prepareRepository(config);
  const commitRoot = path.join(outputRoot, config.commit);
  fs.rmSync(outputRoot, { recursive: true, force: true });
  fs.mkdirSync(commitRoot, { recursive: true });

  try {
    const commonFiles = [];
    for (const licensePath of config.licenseFiles) {
      const cleanPath = safeRelativePath(licensePath);
      const outputPath = path.join(commitRoot, cleanPath);
      const { hash } = writeTrackedFile(sourceDir, config.commit, cleanPath, outputPath);
      commonFiles.push({ path: cleanPath, sha256: hash });
    }

    const variants = {};
    for (const [id, variant] of Object.entries(config.variants)) {
      const sourcePath = safeRelativePath(variant.path).replace(/\/$/, '');
      const trackedFiles = listTrackedFiles(sourceDir, config.commit, sourcePath);
      if (!trackedFiles.some(file => file === `${sourcePath}/README.md`) ||
          !trackedFiles.some(file => file === `${sourcePath}/tf/variables.tf`)) {
        throw new Error(`Variant ${id} is missing its expected README.md or tf/variables.tf.`);
      }

      const files = [];
      for (const upstreamPath of trackedFiles) {
        const relative = safeRelativePath(upstreamPath.slice(sourcePath.length + 1));
        const outputPath = path.join(commitRoot, id, relative);
        const { hash } = writeTrackedFile(sourceDir, config.commit, upstreamPath, outputPath);
        files.push({ path: relative, sha256: hash });
      }
      variants[id] = {
        label: variant.label,
        privateLink: variant.privateLink,
        upstreamPath: sourcePath,
        files
      };
    }

    const manifest = {
      schemaVersion: config.schemaVersion,
      repository: config.repository.replace(/\.git$/, ''),
      commit: config.commit,
      sourceUrl: `${config.repository.replace(/\.git$/, '')}/tree/${config.commit}`,
      commonFiles,
      variants
    };
    fs.writeFileSync(path.join(outputRoot, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
    return manifest;
  } finally {
    if (cleanup) fs.rmSync(sourceDir, { recursive: true, force: true });
  }
}

if (require.main === module) {
  const outputArg = process.argv.indexOf('--output');
  const outputRoot = outputArg >= 0 ? path.resolve(process.argv[outputArg + 1]) : undefined;
  const manifest = vendorTerraform(outputRoot);
  process.stdout.write(`Vendored ${Object.keys(manifest.variants).length} Terraform variants at ${manifest.commit}.\n`);
}

module.exports = { vendorTerraform, safeRelativePath, sha256 };
