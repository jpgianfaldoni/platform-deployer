const { test, expect } = require('@playwright/test');

test.describe('Basic Application Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the home page before each test
    await page.goto('/');
  });

  test('should load the main page successfully', async ({ page }) => {
    // Check page title
    await expect(page).toHaveTitle(/One-Click Deployer/i);
    
    // Check that the page loaded without errors
    const errors = [];
    page.on('pageerror', (error) => errors.push(error));
    
    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle');
    
    // Verify no critical errors occurred
    expect(errors.length).toBe(0);
  });

  test('should display navbar with main elements', async ({ page }) => {
    // Check navbar brand (which serves as home link)
    const navbarBrand = page.locator('.navbar-brand');
    await expect(navbarBrand).toBeVisible();
    await expect(navbarBrand).toContainText('One-Click Deployer');
    await expect(navbarBrand).toHaveAttribute('href', '#/');
    
    // On mobile, menu might be collapsed - check if toggler exists
    const navbarToggler = page.locator('.navbar-toggler');
    const isMobile = await navbarToggler.isVisible();
    
    if (isMobile) {
      // Open mobile menu
      await navbarToggler.click();
      await page.waitForTimeout(300); // Wait for menu animation
    }
    
    // Check navigation links
    const startOverLink = page.locator('a.nav-link[href="#/reset"]');
    await expect(startOverLink).toBeVisible();
    await expect(startOverLink).toContainText('Start Over');
  });

  test('should display footer with content', async ({ page }) => {
    const footer = page.locator('footer');
    await expect(footer).toBeVisible();
    
    // Check footer content
    await expect(footer).toContainText('One-Click Deployer');
    await expect(footer).toContainText('Databricks');
  });

  test('should navigate to home route', async ({ page }) => {
    // Click navbar brand which serves as home link
    const navbarBrand = page.locator('.navbar-brand[href="#/"]');
    await expect(navbarBrand).toBeVisible();
    await navbarBrand.click();
    
    // Wait for navigation
    await page.waitForTimeout(500);
    
    // Check URL hash
    const hash = await page.evaluate(() => window.location.hash);
    expect(hash).toBe('#/');
  });

  test('should navigate to reset route', async ({ page }) => {
    // Navigate directly to reset route
    await page.goto('/#/reset');
    
    // Wait for navigation and reset to complete
    await page.waitForTimeout(1500);
    
    // After reset, should redirect to home
    const finalHash = await page.evaluate(() => window.location.hash);
    expect(finalHash).toBe('#/');
  });

  test('should have main content container', async ({ page }) => {
    const mainContent = page.locator('#app-content');
    await expect(mainContent).toBeVisible();
  });

  test('should load JavaScript files', async ({ page }) => {
    // Check that required scripts are loaded
    const appJsLoaded = await page.evaluate(() => {
      return typeof App !== 'undefined';
    });
    
    // Wait a bit for scripts to load
    await page.waitForTimeout(1000);
    
    // Verify that the App class is available (indicating app.js loaded)
    const hasApp = await page.evaluate(() => {
      return typeof window.app !== 'undefined' || typeof App !== 'undefined';
    });
    
    expect(hasApp).toBeTruthy();
  });

  test('should display flash messages container', async ({ page }) => {
    const flashContainer = page.locator('#flash-messages');
    // Element exists in DOM but may be hidden initially (empty container)
    await expect(flashContainer).toHaveCount(1);
  });

  test('should have loading overlay element', async ({ page }) => {
    const loadingOverlay = page.locator('#loading-overlay');
    // Element exists in DOM but is hidden initially (has d-none class)
    await expect(loadingOverlay).toHaveCount(1);
    
    // Initially should be hidden
    const isVisible = await loadingOverlay.isVisible();
    expect(isVisible).toBe(false);
  });

  test('should be responsive on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Check that navbar is still visible
    const navbar = page.locator('.navbar');
    await expect(navbar).toBeVisible();
    
    // Check that navbar toggler button exists (for mobile menu)
    const navbarToggler = page.locator('.navbar-toggler');
    await expect(navbarToggler).toBeVisible();
    
    // Check that main content is visible
    const mainContent = page.locator('#app-content');
    await expect(mainContent).toBeVisible();
  });

  test('should be responsive on tablet viewport', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    
    // Check that navbar is still visible
    const navbar = page.locator('.navbar');
    await expect(navbar).toBeVisible();
    
    // Check that main content is visible
    const mainContent = page.locator('#app-content');
    await expect(mainContent).toBeVisible();
  });

  test('should handle hash navigation', async ({ page }) => {
    // Navigate using hash
    await page.goto('/#/select-provider');
    
    // Wait for route to load
    await page.waitForTimeout(500);
    
    // Verify hash is set
    const hash = await page.evaluate(() => window.location.hash);
    expect(hash).toBe('#/select-provider');
  });
});

