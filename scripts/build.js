const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { vendorTerraform } = require('./vendor-terraform');

const repoRoot = path.resolve(__dirname, '..');
const deployDir = path.join(repoRoot, 'deploy');
const distDir = path.join(repoRoot, 'dist');

function gitRevision() {
  if (process.env.GITHUB_SHA) return process.env.GITHUB_SHA;
  try {
    return execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repoRoot, encoding: 'utf8' }).trim();
  } catch {
    return 'unknown';
  }
}

function build() {
  fs.rmSync(distDir, { recursive: true, force: true });
  fs.cpSync(deployDir, distDir, { recursive: true });
  const manifest = vendorTerraform(path.join(distDir, 'terraform-sources'));
  fs.writeFileSync(path.join(distDir, '.nojekyll'), '');
  fs.writeFileSync(path.join(distDir, 'version.json'), `${JSON.stringify({
    appCommit: gitRevision(),
    terraformCommit: manifest.commit,
    builtAt: new Date().toISOString()
  }, null, 2)}\n`);
  process.stdout.write(`Built GitHub Pages artifact in ${path.relative(repoRoot, distDir)}.\n`);
}

if (require.main === module) build();

module.exports = { build };
