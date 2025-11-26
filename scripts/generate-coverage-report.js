#!/usr/bin/env node

/**
 * Script to generate coverage report from Playwright V8 coverage data
 * Converts V8 coverage format to Istanbul format and generates HTML report
 */

const fs = require('fs');
const path = require('path');
const { convert } = require('v8-to-istanbul');

const COVERAGE_DIR = path.join(__dirname, '../.coverage');
const REPORT_DIR = path.join(__dirname, '../coverage');
const DEPLOY_DIR = path.join(__dirname, '../deploy');

// Ensure directories exist
if (!fs.existsSync(COVERAGE_DIR)) {
  console.log('No coverage data found. Run tests with --coverage flag first.');
  process.exit(0);
}

// Create report directory
if (!fs.existsSync(REPORT_DIR)) {
  fs.mkdirSync(REPORT_DIR, { recursive: true });
}

// Read coverage files
const coverageFiles = fs.readdirSync(COVERAGE_DIR).filter(f => f.endsWith('.json'));

if (coverageFiles.length === 0) {
  console.log('No coverage files found.');
  process.exit(0);
}

console.log(`Found ${coverageFiles.length} coverage file(s).`);

// Aggregate coverage data
const coverageMap = new Map();

coverageFiles.forEach(file => {
  const coverageData = JSON.parse(fs.readFileSync(path.join(COVERAGE_DIR, file), 'utf8'));
  
  Object.entries(coverageData).forEach(([url, coverage]) => {
    // Extract file path from URL
    const urlObj = new URL(url);
    let filePath = urlObj.pathname;
    
    // Remove leading slash and convert to relative path
    if (filePath.startsWith('/')) {
      filePath = filePath.substring(1);
    }
    
    // Only process JavaScript files from deploy/js directory
    if (!filePath.startsWith('js/') && !filePath.includes('/js/')) {
      return;
    }
    
    // Convert to absolute path for processing
    const absolutePath = path.join(DEPLOY_DIR, filePath);
    
    if (!fs.existsSync(absolutePath)) {
      return;
    }
    
    // Read source file
    const source = fs.readFileSync(absolutePath, 'utf8');
    
    try {
      // Convert V8 coverage to Istanbul format
      const converter = convert(source, absolutePath, {
        source: source,
        wrapperLength: 0,
      });
      
      // Apply coverage data
      converter.applyCoverage(coverage.functions || []);
      
      // Get Istanbul coverage
      const istanbulCoverage = converter.toIstanbul();
      
      // Merge with existing coverage
      if (coverageMap.has(filePath)) {
        // Merge coverage data (simplified - in production use proper merging)
        const existing = coverageMap.get(filePath);
        coverageMap.set(filePath, {
          ...existing,
          ...istanbulCoverage[absolutePath],
        });
      } else {
        coverageMap.set(filePath, istanbulCoverage[absolutePath]);
      }
    } catch (error) {
      console.warn(`Failed to process ${filePath}:`, error.message);
    }
  });
});

// Generate summary
const summary = {
  total: {
    lines: { total: 0, covered: 0, pct: 0 },
    statements: { total: 0, covered: 0, pct: 0 },
    functions: { total: 0, covered: 0, pct: 0 },
    branches: { total: 0, covered: 0, pct: 0 },
  },
  files: {},
};

coverageMap.forEach((coverage, filePath) => {
  const fileSummary = {
    lines: { total: 0, covered: 0, pct: 0 },
    statements: { total: 0, covered: 0, pct: 0 },
    functions: { total: 0, covered: 0, pct: 0 },
    branches: { total: 0, covered: 0, pct: 0 },
  };
  
  // Calculate coverage percentages (simplified)
  Object.values(coverage.statementMap || {}).forEach(() => {
    fileSummary.statements.total++;
    summary.total.statements.total++;
  });
  
  Object.values(coverage.fnMap || {}).forEach(() => {
    fileSummary.functions.total++;
    summary.total.functions.total++;
  });
  
  summary.files[filePath] = fileSummary;
});

// Write coverage summary
const summaryPath = path.join(REPORT_DIR, 'coverage-summary.json');
fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));

// Generate simple HTML report
const htmlReport = `
<!DOCTYPE html>
<html>
<head>
  <title>Code Coverage Report</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    h1 { color: #333; }
    table { border-collapse: collapse; width: 100%; margin-top: 20px; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #4CAF50; color: white; }
    tr:nth-child(even) { background-color: #f2f2f2; }
    .coverage-high { color: #4CAF50; font-weight: bold; }
    .coverage-medium { color: #ff9800; font-weight: bold; }
    .coverage-low { color: #f44336; font-weight: bold; }
  </style>
</head>
<body>
  <h1>Code Coverage Report</h1>
  <p>Generated: ${new Date().toLocaleString()}</p>
  
  <h2>Summary</h2>
  <table>
    <tr>
      <th>Metric</th>
      <th>Total</th>
      <th>Covered</th>
      <th>Percentage</th>
    </tr>
    <tr>
      <td>Statements</td>
      <td>${summary.total.statements.total}</td>
      <td>-</td>
      <td>-</td>
    </tr>
    <tr>
      <td>Functions</td>
      <td>${summary.total.functions.total}</td>
      <td>-</td>
      <td>-</td>
    </tr>
  </table>
  
  <h2>Files</h2>
  <table>
    <tr>
      <th>File</th>
      <th>Statements</th>
      <th>Functions</th>
    </tr>
    ${Object.entries(summary.files).map(([file, data]) => `
    <tr>
      <td>${file}</td>
      <td>${data.statements.total}</td>
      <td>${data.functions.total}</td>
    </tr>
    `).join('')}
  </table>
  
  <p><em>Note: Detailed coverage percentages require full Istanbul coverage data. 
  Run tests with --coverage flag to collect detailed coverage information.</em></p>
</body>
</html>
`;

const htmlReportPath = path.join(REPORT_DIR, 'index.html');
fs.writeFileSync(htmlReportPath, htmlReport);

console.log(`Coverage report generated at: ${REPORT_DIR}/index.html`);
console.log(`Summary: ${coverageMap.size} file(s) analyzed`);

