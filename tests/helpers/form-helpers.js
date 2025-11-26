/**
 * Form helper functions for E2E tests
 */

class FormHelpers {
  /**
   * Select a cloud provider
   */
  static async selectProvider(page, provider) {
    await page.goto('/#/select-provider');
    await page.waitForLoadState('networkidle');
    
    const providerCard = page.locator(`.provider-option[data-provider="${provider}"]`);
    await providerCard.click();
    await page.waitForTimeout(300);
    
    const continueBtn = page.locator('#continue-btn');
    await continueBtn.click();
    await page.waitForLoadState('networkidle');
  }

  /**
   * Fill basic configuration fields
   */
  static async fillBasicConfig(page, config) {
    // Wait for form to be ready
    await page.waitForSelector('#config-form', { timeout: 5000 });
    
    if (config.project_prefix) {
      const field = page.locator('input[name="project_prefix"]');
      await field.waitFor({ state: 'visible', timeout: 5000 });
      await field.fill(config.project_prefix);
      await field.blur(); // Trigger validation
    }
    
    if (config.region) {
      const field = page.locator('input[name="region"]');
      await field.waitFor({ state: 'visible', timeout: 5000 });
      await field.fill(config.region);
      await field.blur();
    }
    
    if (config.pricing_tier) {
      const field = page.locator('select[name="pricing_tier"]');
      await field.waitFor({ state: 'visible', timeout: 5000 });
      await field.selectOption(config.pricing_tier);
      await page.waitForTimeout(300); // Wait for any dependent fields to update
    }
    
    if (config.resource_group_name) {
      const field = page.locator('input[name="resource_group_name"]');
      await field.waitFor({ state: 'visible', timeout: 5000 });
      await field.fill(config.resource_group_name);
      await field.blur();
    }
    
    if (config.project_id) {
      const field = page.locator('input[name="project_id"]');
      await field.waitFor({ state: 'visible', timeout: 5000 });
      await field.fill(config.project_id);
      await field.blur();
    }
    
    await page.waitForTimeout(300); // Small delay for any async updates
  }

  /**
   * Fill network configuration
   */
  static async fillNetworkConfig(page, config) {
    // Toggle create new VPC
    const createNewVpc = page.locator('#create_new_vpc');
    const isChecked = await createNewVpc.isChecked();
    
    if (config.create_new_vpc !== undefined && config.create_new_vpc !== isChecked) {
      await createNewVpc.click();
      await page.waitForTimeout(300);
    }
    
    // Fill existing VPC name if not creating new
    if (config.existing_vpc_name !== undefined && !config.create_new_vpc) {
      const existingVpcField = page.locator('input[name="existing_vpc_name"]');
      if (await existingVpcField.isVisible()) {
        await existingVpcField.fill(config.existing_vpc_name);
      }
    }
    
    // Fill VPC CIDR
    if (config.vpc_cidr) {
      await page.fill('input[name="vpc_cidr"]', config.vpc_cidr);
      await page.waitForTimeout(800); // Wait for subnet calculation
    }
    
    // Set availability zones
    if (config.availability_zones && Array.isArray(config.availability_zones)) {
      // Wait for zone container to be ready
      await page.waitForSelector('#az-container', { timeout: 5000 });
      
      // Get current zone inputs
      const zoneInputs = page.locator('#az-container input[name="availability_zones"]');
      const currentCount = await zoneInputs.count();
      
      // Update existing zones
      for (let i = 0; i < Math.min(config.availability_zones.length, currentCount); i++) {
        await zoneInputs.nth(i).fill(config.availability_zones[i]);
      }
      
      // Add additional zones if needed
      if (config.availability_zones.length > currentCount) {
        for (let i = currentCount; i < config.availability_zones.length; i++) {
          await page.locator('#add-az').click();
          await page.waitForTimeout(300);
          const newZoneInputs = page.locator('#az-container input[name="availability_zones"]');
          await newZoneInputs.nth(i).fill(config.availability_zones[i]);
        }
      }
      
      // Remove extra zones if needed (keep at least one)
      if (currentCount > config.availability_zones.length && currentCount > 1) {
        const removeButtons = page.locator('.remove-az-btn');
        const removeCount = await removeButtons.count();
        for (let i = removeCount - 1; i >= config.availability_zones.length; i--) {
          await removeButtons.nth(i).click();
          await page.waitForTimeout(200);
        }
      }
      
      await page.waitForTimeout(500); // Wait for subnet calculation
    }
    
    // Toggle private link
    if (config.enable_private_link !== undefined) {
      const privateLinkCheckbox = page.locator('#enable_private_link');
      const isChecked = await privateLinkCheckbox.isChecked();
      
      if (config.enable_private_link !== isChecked) {
        await privateLinkCheckbox.click();
        await page.waitForTimeout(500); // Wait for recalculation
      }
    }
  }

  /**
   * Submit configuration form
   * @param {Page} page - Playwright page object
   * @param {boolean} allowInvalid - If true, don't throw error on validation failure (for validation tests)
   */
  static async submitConfigForm(page, allowInvalid = false) {
    // Ensure form is ready
    await page.waitForSelector('#config-form', { timeout: 5000 });
    
    // Check form validity before submitting
    const formValid = await page.evaluate(() => {
      const form = document.getElementById('config-form');
      return form && form.checkValidity();
    });
    
    if (!formValid && !allowInvalid) {
      // Get validation errors
      const invalidFields = await page.evaluate(() => {
        const form = document.getElementById('config-form');
        const invalid = [];
        const inputs = form.querySelectorAll('input[required], select[required]');
        inputs.forEach(input => {
          if (!input.validity.valid) {
            invalid.push({
              name: input.name,
              message: input.validationMessage
            });
          }
        });
        return invalid;
      });
      
      if (invalidFields.length > 0) {
        throw new Error(`Form validation failed: ${invalidFields.map(f => `${f.name}: ${f.message}`).join(', ')}`);
      }
    }
    
    // If allowInvalid is true and form is invalid, trigger validation first
    if (allowInvalid && !formValid) {
      // Trigger HTML5 validation on all fields first
      await page.evaluate(() => {
        const form = document.getElementById('config-form');
        if (form) {
          // Report validity on all fields to trigger HTML5 validation messages
          const fields = form.querySelectorAll('input[required], select[required]');
          fields.forEach(field => {
            if (!field.validity.valid) {
              field.reportValidity();
            }
          });
        }
      });
      await page.waitForTimeout(300);
    }
    
    // Normal form submission (even if allowInvalid is true, we still try to submit)
    const submitBtn = page.locator('#submit-btn');
    await submitBtn.scrollIntoViewIfNeeded();
    await submitBtn.click();
    
    // Wait for either navigation or error message
    try {
      // Wait for navigation first
      try {
        await page.waitForURL(/.*#\/summary/, { timeout: 5000 });
        await page.waitForLoadState('networkidle');
        return;
      } catch (navError) {
        // Navigation didn't happen, check for error messages
        const currentUrl = page.url();
        
        if (currentUrl.includes('#/configure')) {
          // Wait for flash messages to potentially appear
          await page.waitForSelector('#flash-messages .alert', { timeout: 2000, state: 'attached' }).catch(() => {
            // No alerts yet, that's okay
          });
          
          await page.waitForTimeout(500);
          
          const flashMessages = page.locator('#flash-messages .alert');
          const errorMessages = await flashMessages.allTextContents();
          
          if (errorMessages.length > 0) {
            // If allowInvalid is true, don't throw - let test check validation
            if (!allowInvalid) {
              throw new Error(`Form submission failed: ${errorMessages.join(', ')}`);
            }
            // Wait a bit more for validation to be fully applied
            await page.waitForTimeout(500);
            return;
          }
          
          // If no errors but still on configure, might be a timing issue
          await page.waitForTimeout(1000);
          const finalUrl = page.url();
          if (finalUrl.includes('#/configure')) {
            // If allowInvalid is true, don't throw - validation prevented navigation
            if (!allowInvalid) {
              throw new Error('Form submission did not navigate to summary page');
            }
            // Wait a bit more for validation to be fully applied
            await page.waitForTimeout(500);
            return;
          }
        } else {
          // Navigated somewhere else, assume success
          await page.waitForLoadState('networkidle');
          return;
        }
      }
    } catch (error) {
      // If allowInvalid is true, don't throw - let test check validation
      if (allowInvalid) {
        await page.waitForTimeout(500);
        return;
      }
      // Log the error for debugging
      const currentUrl = page.url();
      const flashMessages = page.locator('#flash-messages .alert');
      const flashText = await flashMessages.allTextContents().catch(() => []);
      console.log(`Form submission failed. URL: ${currentUrl}, Errors: ${flashText.join(', ')}`);
      throw error;
    }
  }

  /**
   * Confirm and generate project in summary page
   */
  static async confirmAndGenerate(page) {
    const confirmCheckbox = page.locator('#confirm');
    await confirmCheckbox.check();
    
    const generateBtn = page.locator('#generate-btn');
    await generateBtn.click();
    
    // Wait for download to start (or error message)
    await page.waitForTimeout(2000);
  }

  /**
   * Get validation error messages
   */
  static async getValidationErrors(page) {
    const flashMessages = page.locator('#flash-messages .alert');
    const errors = [];
    
    const count = await flashMessages.count();
    for (let i = 0; i < count; i++) {
      const message = await flashMessages.nth(i).textContent();
      errors.push(message);
    }
    
    return errors;
  }

  /**
   * Check if field has validation error
   */
  static async hasFieldError(page, fieldName) {
    const field = page.locator(`input[name="${fieldName}"], select[name="${fieldName}"]`);
    const isInvalid = await field.evaluate((el) => {
      return el.classList.contains('is-invalid') || 
             el.getAttribute('aria-invalid') === 'true';
    });
    return isInvalid;
  }

  /**
   * Get subnet preview data
   */
  static async getSubnetPreview(page) {
    const preview = page.locator('#subnets-preview');
    const isVisible = await preview.isVisible();
    
    if (!isVisible) {
      return null;
    }
    
    const subnets = [];
    const subnetCards = page.locator('.subnet-card');
    const count = await subnetCards.count();
    
    for (let i = 0; i < count; i++) {
      const card = subnetCards.nth(i);
      const name = await card.locator('.card-title').textContent();
      // Use a more specific selector to avoid strict mode violations
      // The CIDR is inside .text-muted.small > div with "CIDR:" text
      const cidrText = await card.locator('.text-muted.small div:has-text("CIDR:")').first().textContent();
      const typeBadge = card.locator('.subnet-type');
      const type = await typeBadge.textContent();
      
      // Extract CIDR from text like "CIDR: 10.0.0.0/24"
      const cidrMatch = cidrText?.match(/CIDR:\s*([^\s]+)/);
      const cidr = cidrMatch ? cidrMatch[1] : '';
      
      subnets.push({
        name: name?.trim() || '',
        cidr: cidr.trim(),
        type: type?.trim() || ''
      });
    }
    
    return subnets;
  }

  /**
   * Get network summary data
   */
  static async getNetworkSummary(page) {
    const summary = page.locator('#network-summary');
    const isVisible = await summary.isVisible();
    
    if (!isVisible) {
      return null;
    }
    
    // Try to get values from the summary card
    const totalIPsElement = summary.locator('.text-primary').first();
    const usedIPsElement = summary.locator('.text-success').first();
    const utilizationElement = summary.locator('.text-info').first();
    
    const totalIPs = await totalIPsElement.textContent().catch(() => null);
    const usedIPs = await usedIPsElement.textContent().catch(() => null);
    const utilization = await utilizationElement.textContent().catch(() => null);
    
    return {
      total_ips: totalIPs?.trim() || '',
      used_ips: usedIPs?.trim() || '',
      utilization_percent: utilization?.trim() || ''
    };
  }
}

module.exports = FormHelpers;

