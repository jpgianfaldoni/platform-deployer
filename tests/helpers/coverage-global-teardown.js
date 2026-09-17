/**
 * Playwright global teardown for coverage runs.
 * Runs collect-coverage.js after all tests finish.
 */

const path = require('path');
const { execSync } = require('child_process');

module.exports = async function globalTeardown() {
  console.log('[coverage] Generating coverage report...');
  try {
    execSync('node scripts/collect-coverage.js', {
      cwd: path.join(__dirname, '../..'),
      stdio: 'inherit',
    });
  } catch (e) {
    console.warn('[coverage] Coverage collection failed:', e.message);
  }
};
