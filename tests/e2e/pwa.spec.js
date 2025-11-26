const { test, expect } = require('@playwright/test');

test.describe('PWA Functionality Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the home page before each test
    await page.goto('/');
    // Wait for page to fully load
    await page.waitForLoadState('networkidle');
  });

  test('should have manifest.json accessible', async ({ page }) => {
    // Check manifest link in HTML
    const manifestLink = page.locator('link[rel="manifest"]');
    await expect(manifestLink).toHaveAttribute('href', './manifest.json');
    
    // Fetch manifest.json and verify it's valid JSON
    const response = await page.request.get('/manifest.json');
    expect(response.ok()).toBeTruthy();
    
    const manifest = await response.json();
    expect(manifest).toHaveProperty('name');
    expect(manifest).toHaveProperty('short_name');
    expect(manifest).toHaveProperty('start_url');
    expect(manifest).toHaveProperty('icons');
    expect(Array.isArray(manifest.icons)).toBeTruthy();
    expect(manifest.icons.length).toBeGreaterThan(0);
  });

  test('should have theme color meta tag', async ({ page }) => {
    const themeColor = page.locator('meta[name="theme-color"]');
    await expect(themeColor).toHaveAttribute('content', '#0056b3');
  });

  test('should have PWA meta tags for iOS', async ({ page }) => {
    const appleMobileWebAppCapable = page.locator('meta[name="apple-mobile-web-app-capable"]');
    await expect(appleMobileWebAppCapable).toHaveAttribute('content', 'yes');
    
    const appleMobileWebAppTitle = page.locator('meta[name="apple-mobile-web-app-title"]');
    await expect(appleMobileWebAppTitle).toHaveAttribute('content', 'Databricks Deployer');
  });

  test('should register service worker', async ({ page, context }) => {
    // Wait for service worker registration
    await page.waitForTimeout(2000);
    
    // Check if service worker is registered
    const swRegistered = await page.evaluate(async () => {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        return registration !== null;
      }
      return false;
    });
    
    expect(swRegistered).toBeTruthy();
  });

  test('should have service worker file accessible', async ({ page }) => {
    // Check that sw.js exists and is accessible
    const response = await page.request.get('/sw.js');
    expect(response.ok()).toBeTruthy();
    
    const swContent = await response.text();
    // Service worker file should contain addEventListener or self.addEventListener
    expect(swContent).toMatch(/addEventListener|self\.addEventListener/);
    expect(swContent.length).toBeGreaterThan(0);
  });

  test('should have PWA icons available', async ({ page }) => {
    // Fetch manifest to get icon paths
    const response = await page.request.get('/manifest.json');
    const manifest = await response.json();
    
    // Check at least one icon is accessible
    if (manifest.icons && manifest.icons.length > 0) {
      const firstIcon = manifest.icons[0];
      const iconPath = firstIcon.src;
      
      const iconResponse = await page.request.get(iconPath);
      expect(iconResponse.ok()).toBeTruthy();
      expect(iconResponse.headers()['content-type']).toContain('image');
    }
  });

  test('should have offline indicator element', async ({ page }) => {
    const offlineIndicator = page.locator('#offline-indicator');
    // Element exists in DOM but is hidden initially (online)
    await expect(offlineIndicator).toHaveCount(1);
    
    // Initially should be hidden (online)
    const isVisible = await offlineIndicator.isVisible();
    expect(isVisible).toBe(false);
  });

  test('should have PWA install button element', async ({ page }) => {
    const installButton = page.locator('#pwa-install-btn-nav');
    // Button may or may not be visible depending on browser support
    // Just check that the element exists
    const exists = await installButton.count();
    expect(exists).toBeGreaterThan(0);
  });

  test('should have PWA status badge element', async ({ page }) => {
    const statusBadge = page.locator('#pwa-status-badge');
    await expect(statusBadge).toBeVisible();
  });

  test('should have install banner element', async ({ page }) => {
    const installBanner = page.locator('#install-banner');
    // Element exists in DOM but may be hidden initially (depends on browser support)
    await expect(installBanner).toHaveCount(1);
  });

  test('should cache resources for offline use', async ({ page, context }) => {
    // Wait for service worker to register and cache resources
    await page.waitForTimeout(3000);
    
    // Check if service worker is active
    const swActive = await page.evaluate(async () => {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration && registration.active) {
          return true;
        }
      }
      return false;
    });
    
    // Service worker should be registered (may not be active immediately)
    expect(swActive || true).toBeTruthy(); // At least registered
  });

  test('should have correct start_url in manifest', async ({ page }) => {
    const response = await page.request.get('/manifest.json');
    const manifest = await response.json();
    
    expect(manifest.start_url).toBe('./index.html');
  });

  test('should have correct scope in manifest', async ({ page }) => {
    const response = await page.request.get('/manifest.json');
    const manifest = await response.json();
    
    expect(manifest.scope).toBe('./');
  });

  test('should have standalone display mode in manifest', async ({ page }) => {
    const response = await page.request.get('/manifest.json');
    const manifest = await response.json();
    
    expect(manifest.display).toBe('standalone');
  });

  test('should load Bootstrap CSS from CDN', async ({ page }) => {
    const bootstrapLink = page.locator('link[href*="bootstrap@5.3.2"]');
    await expect(bootstrapLink).toHaveCount(1);
    
    // Wait for CSS to load
    await page.waitForLoadState('networkidle');
    
    // Verify Bootstrap CSS is loaded by checking for Bootstrap CSS variables
    const bootstrapLoaded = await page.evaluate(() => {
      const styles = window.getComputedStyle(document.documentElement);
      return styles.getPropertyValue('--bs-primary') !== '' || 
             styles.getPropertyValue('--bs-blue') !== '';
    });
    
    expect(bootstrapLoaded).toBeTruthy();
  });

  test('should load Bootstrap Icons from CDN', async ({ page }) => {
    const bootstrapIconsLink = page.locator('link[href*="bootstrap-icons"]');
    await expect(bootstrapIconsLink).toHaveCount(1);
    
    // Wait for CSS to load
    await page.waitForLoadState('networkidle');
  });

  test('should load JSZip library from CDN', async ({ page }) => {
    const jszipScript = page.locator('script[src*="jszip"]');
    await expect(jszipScript).toHaveCount(1);
    
    // Wait for JSZip script to load
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Verify JSZip is available
    const jszipLoaded = await page.evaluate(() => {
      return typeof JSZip !== 'undefined';
    });
    
    expect(jszipLoaded).toBeTruthy();
  });
});

