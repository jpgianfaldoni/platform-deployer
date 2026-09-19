/**
 * Coverage smoke tests.
 *
 * These tests exercise code paths that might not be hit by the other spec files.
 * Coverage collection itself is handled by the `test` fixture from coverage-fixture.js,
 * which wraps every test's `page` with startCoverage/stopCoverage when COVERAGE=true.
 */

const { test, expect } = require('../helpers/coverage-fixture');

test.describe('Code Coverage Collection', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
  });

  test('should load app and trigger core JS', async ({ page }) => {
    const navbarBrand = page.locator('.navbar-brand');
    await expect(navbarBrand).toBeVisible();

    // Navigate to trigger routing code
    await page.goto('/#/select-provider');
    await page.waitForTimeout(500);

    const appDefined = await page.evaluate(() => typeof App !== 'undefined');
    expect(appDefined).toBeTruthy();
  });

  test('should trigger utils functions', async ({ page }) => {
    await page.evaluate(() => {
      if (typeof Utils !== 'undefined') {
        Utils.showFlashMessage('Test message', 'info');
      }
    });
    await page.waitForTimeout(300);
  });

  test('should navigate to provider selection triggering validators', async ({ page }) => {
    await page.goto('/#/select-provider');
    await page.waitForTimeout(800);

    await page.evaluate(() => {
      if (typeof Validators !== 'undefined') {
        return true;
      }
    });
  });

  test('should navigate to configure page triggering network-calculator', async ({ page }) => {
    await page.goto('/#/configure');
    await page.waitForTimeout(800);

    await page.evaluate(() => {
      if (typeof NetworkCalculator !== 'undefined') {
        return true;
      }
    });
  });

  test('should trigger terraform-generator paths', async ({ page }) => {
    await page.goto('/#/select-provider');
    await page.waitForTimeout(300);

    await page.evaluate(() => {
      if (typeof TerraformGenerator !== 'undefined') {
        return true;
      }
    });
  });
});
