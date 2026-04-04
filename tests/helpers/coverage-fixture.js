/**
 * Playwright fixture that wraps every test with V8 coverage collection.
 * Import `test` from this module instead of `@playwright/test` in spec files
 * that need per-test coverage wrapping.
 *
 * When COVERAGE !== 'true' the fixture is a transparent pass-through so the
 * same spec files work in both normal and coverage modes.
 */

const { test: base } = require('@playwright/test');
const { startCoverage, stopCoverage, isCoverageEnabled } = require('./coverage');

const test = base.extend({
  page: async ({ page }, use, testInfo) => {
    if (isCoverageEnabled()) {
      await startCoverage(page);
    }
    await use(page);
    if (isCoverageEnabled()) {
      await stopCoverage(page, testInfo.title);
    }
  },
});

module.exports = { test, expect: base.expect };
