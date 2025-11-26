/**
 * Validation helper functions for E2E tests
 */

class ValidationHelpers {
  /**
   * Check if flash message is displayed
   */
  static async hasFlashMessage(page, message, type = null) {
    const flashContainer = page.locator('#flash-messages');
    const alerts = flashContainer.locator('.alert');
    
    const count = await alerts.count();
    for (let i = 0; i < count; i++) {
      const alert = alerts.nth(i);
      const text = await alert.textContent();
      const alertType = await alert.getAttribute('class');
      
      if (text && text.includes(message)) {
        if (type) {
          return alertType.includes(`alert-${type}`);
        }
        return true;
      }
    }
    
    return false;
  }

  /**
   * Wait for flash message to appear
   * Improved for Chromium compatibility - ensures messages are fully rendered
   */
  static async waitForFlashMessage(page, message, timeout = 5000) {
    try {
      // First, wait for the flash messages container to exist in the DOM
      await page.waitForSelector('#flash-messages', { 
        timeout: Math.min(timeout, 3000), 
        state: 'attached' 
      }).catch(() => {
        // Container might not exist yet, continue anyway
      });
      
      // Wait for at least one alert to be present in the DOM
      // This ensures the message has been added to the DOM
      try {
        await page.waitForSelector('#flash-messages .alert', { 
          timeout: Math.min(timeout, 4000), 
          state: 'attached' 
        });
      } catch {
        // No alerts found yet, but continue to check content
      }
      
      // Give a small delay for Chromium to fully render the content
      await page.waitForTimeout(500);
      
      // Now check if the message content is present
      // Use waitForFunction with a more robust check
      const found = await page.waitForFunction(
        (msg) => {
          const container = document.getElementById('flash-messages');
          if (!container) return false;
          
          // Check container text content (case-insensitive for better matching)
          const containerText = (container.textContent || '').toLowerCase();
          const searchMsg = msg.toLowerCase();
          if (containerText.includes(searchMsg)) {
            return true;
          }
          
          // Also check individual alert elements for more accuracy
          const alerts = container.querySelectorAll('.alert');
          for (const alert of alerts) {
            const alertText = (alert.textContent || '').toLowerCase();
            if (alertText.includes(searchMsg)) {
              return true;
            }
          }
          
          return false;
        },
        message,
        { timeout: Math.max(timeout - 1000, 2000) } // Account for the waitForTimeout above, but ensure minimum timeout
      ).catch(() => false);
      
      if (found) {
        // Additional small wait to ensure content is stable
        await page.waitForTimeout(300);
        return true;
      }
      
      // Final check: try one more time with a direct check
      await page.waitForTimeout(500);
      const flashContainer = page.locator('#flash-messages');
      const containerText = await flashContainer.textContent().catch(() => '');
      if (containerText && containerText.toLowerCase().includes(message.toLowerCase())) {
        return true;
      }
      
      // Check individual alerts
      const alerts = flashContainer.locator('.alert');
      const count = await alerts.count();
      for (let i = 0; i < count; i++) {
        const alertText = await alerts.nth(i).textContent().catch(() => '');
        if (alertText && alertText.toLowerCase().includes(message.toLowerCase())) {
          return true;
        }
      }
      
      return false;
    } catch {
      // Final fallback: check if message exists right now
      try {
        const flashContainer = page.locator('#flash-messages');
        const containerText = await flashContainer.textContent().catch(() => '');
        if (containerText && containerText.toLowerCase().includes(message.toLowerCase())) {
          return true;
        }
        
        // Check individual alerts
        const alerts = flashContainer.locator('.alert');
        const count = await alerts.count();
        for (let i = 0; i < count; i++) {
          const alertText = await alerts.nth(i).textContent().catch(() => '');
          if (alertText && alertText.toLowerCase().includes(message.toLowerCase())) {
            return true;
          }
        }
      } catch {
        // Ignore errors in fallback
      }
      
      return false;
    }
  }

  /**
   * Check if form validation prevents submission
   */
  static async canSubmitForm(page) {
    const submitBtn = page.locator('#submit-btn');
    const isDisabled = await submitBtn.isDisabled();
    return !isDisabled;
  }

  /**
   * Check if field is required
   */
  static async isFieldRequired(page, fieldName) {
    const field = page.locator(`input[name="${fieldName}"], select[name="${fieldName}"]`);
    const required = await field.getAttribute('required');
    return required !== null;
  }

  /**
   * Get field validation message
   */
  static async getFieldValidationMessage(page, fieldName) {
    // Wait for field to be visible
    const field = page.locator(`input[name="${fieldName}"], select[name="${fieldName}"]`);
    await field.waitFor({ state: 'visible', timeout: 5000 });
    
    // Check HTML5 validation message
    const validity = await field.evaluate((el) => {
      if (el.validity) {
        return {
          valid: el.validity.valid,
          valueMissing: el.validity.valueMissing,
          patternMismatch: el.validity.patternMismatch,
          tooShort: el.validity.tooShort,
          tooLong: el.validity.tooLong,
          customError: el.validity.customError,
          validationMessage: el.validationMessage
        };
      }
      return null;
    });
    
    return validity;
  }

  /**
   * Check if private link warning is displayed
   */
  static async hasPrivateLinkWarning(page) {
    const warning = page.locator('#private-link-warning');
    return await warning.isVisible();
  }

  /**
   * Check if a field has validation error using data-* attributes
   * @param {Page} page - Playwright page object
   * @param {string} fieldName - Name of the field to check
   * @param {string} errorText - Optional text to search for in error message
   * @returns {Promise<boolean>} True if field has validation error
   */
  static async hasFieldValidationError(page, fieldName, errorText = null) {
    // Special handling for availability_zones - check container
    if (fieldName === 'availability_zones') {
      return await this.hasAvailabilityZoneError(page, errorText);
    }
    
    const field = page.locator(`input[name="${fieldName}"], select[name="${fieldName}"]`);
    
    // Check if field has data-invalid attribute
    const hasInvalidAttr = await field.getAttribute('data-invalid').catch(() => null);
    if (hasInvalidAttr !== 'true') {
      // For checkboxes, also check parent container
      if (fieldName === 'enable_private_link') {
        const checkbox = page.locator(`input[name="${fieldName}"][type="checkbox"]`);
        const formCheck = checkbox.locator('..').locator('.form-check');
        const hasInvalidClass = await formCheck.evaluate(el => el.classList.contains('is-invalid')).catch(() => false);
        if (hasInvalidClass) {
          if (errorText) {
            // For checkboxes, we need to check the error message differently
            // The error might be in a nearby element or flash message
            const errorMessage = await checkbox.getAttribute('data-error').catch(() => null);
            if (errorMessage && errorMessage.toLowerCase().includes(errorText.toLowerCase())) {
              return true;
            }
            // Fallback: check flash message
            return await this.waitForFlashMessage(page, errorText, 2000);
          }
          return true;
        }
      }
      return false;
    }
    
    // If errorText is provided, check if it's in the error message
    if (errorText) {
      const errorMessage = await field.getAttribute('data-error').catch(() => null);
      if (errorMessage && errorMessage.toLowerCase().includes(errorText.toLowerCase())) {
        return true;
      }
      return false;
    }
    
    return true;
  }

  /**
   * Get field validation error message from data-error attribute
   * @param {Page} page - Playwright page object
   * @param {string} fieldName - Name of the field to check
   * @returns {Promise<string|null>} Error message or null if no error
   */
  static async getFieldValidationError(page, fieldName) {
    const field = page.locator(`input[name="${fieldName}"], select[name="${fieldName}"]`);
    const errorMessage = await field.getAttribute('data-error');
    return errorMessage;
  }

  /**
   * Check if availability zones container has validation error
   * @param {Page} page - Playwright page object
   * @param {string} errorText - Optional text to search for in error message
   * @returns {Promise<boolean>} True if container has validation error
   */
  static async hasAvailabilityZoneError(page, errorText = null) {
    const container = page.locator('#az-container');
    
    const hasInvalidAttr = await container.getAttribute('data-invalid');
    if (hasInvalidAttr !== 'true') {
      return false;
    }
    
    if (errorText) {
      const errorMessage = await container.getAttribute('data-error');
      if (errorMessage && errorMessage.toLowerCase().includes(errorText.toLowerCase())) {
        return true;
      }
      return false;
    }
    
    return true;
  }

  /**
   * Verify subnet calculation is displayed
   */
  static async hasSubnetCalculation(page) {
    const preview = page.locator('#subnets-preview');
    return await preview.isVisible();
  }

  /**
   * Verify network summary is displayed
   */
  static async hasNetworkSummary(page) {
    const summary = page.locator('#network-summary');
    return await summary.isVisible();
  }

  /**
   * Check if continue button is enabled in provider selection
   */
  static async canContinueFromProviderSelection(page) {
    const continueBtn = page.locator('#continue-btn');
    const isDisabled = await continueBtn.isDisabled();
    return !isDisabled;
  }

  /**
   * Check if generate button is enabled in summary
   */
  static async canGenerateFromSummary(page) {
    const generateBtn = page.locator('#generate-btn');
    const isDisabled = await generateBtn.isDisabled();
    return !isDisabled;
  }
}

module.exports = ValidationHelpers;

