/**
 * Playwright global setup for coverage runs.
 * Cleans the .coverage directory before tests begin.
 */

const fs = require('fs');
const path = require('path');

module.exports = async function globalSetup() {
  const dir = path.join(__dirname, '../../.coverage');
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true });
  }
  fs.mkdirSync(dir, { recursive: true });
  console.log('[coverage] Cleaned .coverage directory');
};
