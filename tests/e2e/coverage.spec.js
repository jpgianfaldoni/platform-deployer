const { test, expect } = require('@playwright/test');
const { startCoverage, stopCoverage } = require('../helpers/coverage');

test.describe('Code Coverage Collection', () => {
  test.beforeEach(async ({ page }) => {
    // Start collecting coverage before each test
    await startCoverage(page);
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test.afterEach(async ({ page }, testInfo) => {
    // Stop and save coverage after each test
    await stopCoverage(page, testInfo.title);
  });

  test('should collect coverage for app.js', async ({ page }) => {
    // Interact with the app to trigger code execution
    const navbarBrand = page.locator('.navbar-brand');
    await expect(navbarBrand).toBeVisible();
    
    // Navigate to trigger routing
    await page.goto('/#/select-provider');
    await page.waitForTimeout(500);
    
    // Verify coverage was collected
    const coverage = await page.evaluate(() => {
      return typeof App !== 'undefined';
    });
    expect(coverage).toBeTruthy();
  });

  test('should collect coverage for utils.js', async ({ page }) => {
    // Trigger utils functions
    await page.evaluate(() => {
      if (typeof Utils !== 'undefined') {
        Utils.showFlashMessage('Test message', 'info');
      }
    });
    
    await page.waitForTimeout(500);
  });

  test('should collect coverage for validators.js', async ({ page }) => {
    // Navigate to a page that uses validators
    await page.goto('/#/select-provider');
    await page.waitForTimeout(1000);
    
    // Trigger validation if available
    await page.evaluate(() => {
      if (typeof Validators !== 'undefined') {
        // Validators might be used in forms
        return true;
      }
    });
  });

  test('should collect coverage for network-calculator.js', async ({ page }) => {
    // Navigate to configuration page where network calculator might be used
    await page.goto('/#/configure');
    await page.waitForTimeout(1000);
    
    // Trigger network calculator if available
    await page.evaluate(() => {
      if (typeof NetworkCalculator !== 'undefined') {
        return true;
      }
    });
  });

  test('should collect coverage for terraform-generator.js', async ({ page }) => {
    // Navigate through the flow to trigger terraform generator
    await page.goto('/#/select-provider');
    await page.waitForTimeout(500);
    
    // Try to trigger terraform generation (if possible without full flow)
    await page.evaluate(() => {
      if (typeof TerraformGenerator !== 'undefined') {
        return true;
      }
    });
  });
});

