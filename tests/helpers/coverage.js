/**
 * Coverage helper for Playwright tests.
 * Collects V8 coverage data from the browser and writes it to .coverage/.
 *
 * startCoverage / stopCoverage are no-ops when coverage is not enabled so
 * these helpers can safely be imported from any spec file.
 */

const fs = require('fs');
const path = require('path');

const COVERAGE_DIR = path.join(__dirname, '../../.coverage');

/**
 * Returns true when coverage collection is requested via the COVERAGE env var.
 */
function isCoverageEnabled() {
  return process.env.COVERAGE === 'true';
}

/**
 * Start collecting V8 JS coverage for `page`.
 * No-op when coverage is not enabled.
 */
async function startCoverage(page) {
  if (!isCoverageEnabled()) return;
  await page.coverage.startJSCoverage({
    reportAnonymousScripts: false,
  });
}

/**
 * Stop collecting V8 JS coverage and persist it to .coverage/<testName>.json.
 * No-op when coverage is not enabled.
 */
async function stopCoverage(page, testName) {
  if (!isCoverageEnabled()) return [];

  const coverage = await page.coverage.stopJSCoverage();

  if (!coverage || coverage.length === 0) return [];

  // Keep only our own JS files
  const filtered = coverage.filter(entry => {
    const url = entry.url || '';
    return url.includes('/js/');
  });

  if (filtered.length === 0) return [];

  // Ensure output directory exists (may have been cleaned by globalSetup)
  fs.mkdirSync(COVERAGE_DIR, { recursive: true });

  const coverageFile = path.join(
    COVERAGE_DIR,
    `${testName.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}.json`
  );

  const serializable = filtered.map(entry => ({
    url: entry.url,
    functions: entry.functions || [],
  }));

  fs.writeFileSync(coverageFile, JSON.stringify(serializable, null, 2));

  return filtered;
}

module.exports = {
  isCoverageEnabled,
  startCoverage,
  stopCoverage,
};
