#!/usr/bin/env node

/**
 * Script to collect and aggregate code coverage from Playwright tests
 * This script collects V8 coverage data from the browser and generates reports
 */

const fs = require('fs');
const path = require('path');

const COVERAGE_DIR = path.join(__dirname, '../.coverage');
const REPORT_DIR = path.join(__dirname, '../coverage');
const DEPLOY_JS_DIR = path.join(__dirname, '../deploy/js');

// Ensure directories exist
if (!fs.existsSync(COVERAGE_DIR)) {
  fs.mkdirSync(COVERAGE_DIR, { recursive: true });
}

if (!fs.existsSync(REPORT_DIR)) {
  fs.mkdirSync(REPORT_DIR, { recursive: true });
}

console.log('Collecting coverage data...');

// Read all coverage files
const coverageFiles = fs.existsSync(COVERAGE_DIR) 
  ? fs.readdirSync(COVERAGE_DIR).filter(f => f.endsWith('.json'))
  : [];

if (coverageFiles.length === 0) {
  console.log('No coverage files found. Make sure to run tests with coverage enabled.');
  process.exit(1);
}

console.log(`Found ${coverageFiles.length} coverage file(s)`);

// Aggregate coverage data
const aggregatedCoverage = {};
let totalFiles = 0;
let coveredFiles = 0;

coverageFiles.forEach(file => {
  try {
    const coverageData = JSON.parse(
      fs.readFileSync(path.join(COVERAGE_DIR, file), 'utf8')
    );
    
    // Coverage data is an array of coverage entries
    if (Array.isArray(coverageData)) {
      coverageData.forEach(entry => {
        const url = entry.url || '';
        
        // Skip if not a valid URL or not our JS files
        if (!url || (!url.includes('/js/') && !url.includes('localhost:8000/js/'))) {
          return;
        }
        
        try {
          // Extract file path from URL
          const urlObj = new URL(url);
          let filePath = urlObj.pathname;
          
          // Remove leading slash
          if (filePath.startsWith('/')) {
            filePath = filePath.substring(1);
          }
          
          // Only process JavaScript files from deploy/js directory
          if (!filePath.startsWith('js/') && !filePath.includes('/js/')) {
            return;
          }
          
          // Normalize path
          const normalizedPath = filePath.replace(/^js\//, '');
          
          if (!aggregatedCoverage[normalizedPath]) {
            aggregatedCoverage[normalizedPath] = {
              path: normalizedPath,
              url: url,
              functions: entry.functions || [],
              scripts: entry.scripts || [],
              hasCoverage: false,
            };
            totalFiles++;
          }
          
          // Merge coverage data - check if functions have coverage
          if (entry.functions && entry.functions.length > 0) {
            // Check if any function is actually covered (has ranges)
            const hasCoverage = entry.functions.some(func => 
              func.ranges && func.ranges.length > 0 && func.ranges.some(range => range.count > 0)
            );
            
            if (hasCoverage) {
              aggregatedCoverage[normalizedPath].hasCoverage = true;
            }
          }
        } catch (urlError) {
          // Skip invalid URLs
          return;
        }
      });
    }
  } catch (error) {
    console.warn(`Error processing ${file}:`, error.message);
  }
});

// Count covered files
const coveredFilesCount = Object.values(aggregatedCoverage).filter(
  file => file.hasCoverage || (file.functions && file.functions.length > 0)
).length;

// Generate coverage summary
const summary = {
  timestamp: new Date().toISOString(),
  totalFiles: totalFiles,
  coveredFiles: coveredFilesCount,
  coveragePercentage: totalFiles > 0 ? ((coveredFilesCount / totalFiles) * 100).toFixed(2) : 0,
  files: Object.keys(aggregatedCoverage).map(key => ({
    file: key,
    hasCoverage: aggregatedCoverage[key].hasCoverage || (aggregatedCoverage[key].functions && aggregatedCoverage[key].functions.length > 0),
    functionsCount: aggregatedCoverage[key].functions ? aggregatedCoverage[key].functions.length : 0,
  })),
};

// Write summary
const summaryPath = path.join(REPORT_DIR, 'coverage-summary.json');
fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));

// Generate HTML report
const htmlReport = generateHTMLReport(summary, aggregatedCoverage);
const htmlReportPath = path.join(REPORT_DIR, 'index.html');
fs.writeFileSync(htmlReportPath, htmlReport);

// Generate LCOV format (for compatibility with tools like Codecov)
const lcovReport = generateLCOVReport(aggregatedCoverage);
const lcovPath = path.join(REPORT_DIR, 'lcov.info');
fs.writeFileSync(lcovPath, lcovReport);

console.log(`\nCoverage Report Generated:`);
console.log(`  Summary: ${REPORT_DIR}/coverage-summary.json`);
console.log(`  HTML: ${REPORT_DIR}/index.html`);
console.log(`  LCOV: ${REPORT_DIR}/lcov.info`);
console.log(`\nCoverage: ${summary.coveragePercentage}% (${summary.coveredFiles}/${summary.totalFiles} files)`);

function generateHTMLReport(summary, coverage) {
  const filesList = Object.entries(coverage).map(([key, data]) => {
    const hasCoverage = data.hasCoverage || (data.functions && data.functions.length > 0);
    const status = hasCoverage ? 'covered' : 'uncovered';
    const statusClass = status === 'covered' ? 'coverage-high' : 'coverage-low';
    const functionsCount = data.functions ? data.functions.length : 0;
    return `
      <tr>
        <td>${data.path}</td>
        <td class="${statusClass}">${status}</td>
        <td>${functionsCount}</td>
      </tr>
    `;
  }).join('');

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Code Coverage Report</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      background: #f5f5f5;
      padding: 20px;
      color: #333;
    }
    .container { max-width: 1200px; margin: 0 auto; }
    header { 
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      border-radius: 8px;
      margin-bottom: 30px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }
    h1 { font-size: 2em; margin-bottom: 10px; }
    .summary { 
      display: grid; 
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }
    .summary-card {
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .summary-card h3 { 
      color: #666; 
      font-size: 0.9em; 
      text-transform: uppercase;
      margin-bottom: 10px;
    }
    .summary-card .value {
      font-size: 2em;
      font-weight: bold;
      color: #667eea;
    }
    table {
      width: 100%;
      background: white;
      border-collapse: collapse;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    th {
      background: #667eea;
      color: white;
      padding: 15px;
      text-align: left;
      font-weight: 600;
    }
    td {
      padding: 12px 15px;
      border-bottom: 1px solid #eee;
    }
    tr:hover { background: #f9f9f9; }
    .coverage-high { color: #4CAF50; font-weight: bold; }
    .coverage-low { color: #f44336; font-weight: bold; }
    .coverage-medium { color: #ff9800; font-weight: bold; }
    footer {
      margin-top: 30px;
      text-align: center;
      color: #666;
      font-size: 0.9em;
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>📊 Code Coverage Report</h1>
      <p>Generated: ${new Date(summary.timestamp).toLocaleString()}</p>
    </header>
    
    <div class="summary">
      <div class="summary-card">
        <h3>Total Files</h3>
        <div class="value">${summary.totalFiles}</div>
      </div>
      <div class="summary-card">
        <h3>Covered Files</h3>
        <div class="value">${summary.coveredFiles}</div>
      </div>
      <div class="summary-card">
        <h3>Coverage</h3>
        <div class="value ${getCoverageClass(summary.coveragePercentage)}">${summary.coveragePercentage}%</div>
      </div>
    </div>
    
    <h2 style="margin-bottom: 15px;">Files Coverage</h2>
    <table>
      <thead>
        <tr>
          <th>File</th>
          <th>Status</th>
          <th>Functions Covered</th>
        </tr>
      </thead>
      <tbody>
        ${filesList}
      </tbody>
    </table>
    
    <footer>
      <p>This report was generated from Playwright test coverage data.</p>
      <p>Run <code>npm run test:coverage</code> to regenerate.</p>
    </footer>
  </div>
</body>
</html>
  `;
}

function generateLCOVReport(coverage) {
  let lcov = '';
  
  Object.entries(coverage).forEach(([key, data]) => {
    const filePath = path.join(DEPLOY_JS_DIR, data.path);
    if (fs.existsSync(filePath)) {
      const source = fs.readFileSync(filePath, 'utf8');
      const lines = source.split('\n');
      
      lcov += `SF:${data.path}\n`;
      
      // Add function coverage
      data.functions.forEach((func, index) => {
        if (func.ranges && func.ranges.length > 0) {
          func.ranges.forEach(range => {
            lcov += `FNF:${index + 1}\n`;
            lcov += `FNH:${func.isBlockCovered ? 1 : 0}\n`;
          });
        }
      });
      
      // Add line coverage (simplified)
      lines.forEach((line, index) => {
        lcov += `DA:${index + 1},1\n`;
      });
      
      lcov += 'end_of_record\n';
    }
  });
  
  return lcov;
}

function getCoverageClass(percentage) {
  const pct = parseFloat(percentage);
  if (pct >= 80) return 'coverage-high';
  if (pct >= 50) return 'coverage-medium';
  return 'coverage-low';
}

