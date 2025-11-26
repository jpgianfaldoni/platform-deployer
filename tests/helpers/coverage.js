/**
 * Coverage helper for Playwright tests
 * Collects V8 coverage data from the browser
 */

const fs = require('fs');
const path = require('path');

const COVERAGE_DIR = path.join(__dirname, '../../.coverage');

// Ensure coverage directory exists
if (!fs.existsSync(COVERAGE_DIR)) {
  fs.mkdirSync(COVERAGE_DIR, { recursive: true });
}

/**
 * Start collecting coverage
 */
async function startCoverage(page) {
  await page.coverage.startJSCoverage({
    reportAnonymousScripts: false,
  });
}

/**
 * Stop collecting coverage and save to file
 */
async function stopCoverage(page, testName) {
  const coverage = await page.coverage.stopJSCoverage();
  
  if (coverage && coverage.length > 0) {
    // Filter coverage to only include our JS files
    const filteredCoverage = coverage.filter(entry => {
      const url = entry.url || '';
      return url.includes('/js/') || url.includes('localhost:8000/js/');
    });
    
    if (filteredCoverage.length > 0) {
      // Save coverage data
      const coverageFile = path.join(
        COVERAGE_DIR,
        `${testName.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}.json`
      );
      
      // Convert to serializable format
      const serializableCoverage = filteredCoverage.map(entry => ({
        url: entry.url,
        functions: entry.functions || [],
        scripts: entry.scripts || [],
      }));
      
      fs.writeFileSync(
        coverageFile,
        JSON.stringify(serializableCoverage, null, 2)
      );
      
      return filteredCoverage;
    }
  }
  
  return [];
}

module.exports = {
  startCoverage,
  stopCoverage,
};

