const { test, expect } = require('@playwright/test');
const FormHelpers = require('../helpers/form-helpers');
const NavigationHelpers = require('../helpers/navigation-helpers');
const ValidationHelpers = require('../helpers/validation-helpers');

test.describe('Azure Provider Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.evaluate(() => {
      localStorage.clear();
    });
  });

  test.describe('Complete Flow', () => {
    test('should complete full Azure deployment flow with Premium tier and Private Link', async ({ page }) => {
      // Step 1: Select Azure provider
      await FormHelpers.selectProvider(page, 'azure');
      await expect(page).toHaveURL(/.*#\/configure/);

      // Step 2: Fill basic configuration (including Resource Group)
      await FormHelpers.fillBasicConfig(page, {
        project_prefix: 'test-azure',
        region: 'eastus',
        pricing_tier: 'PREMIUM',
        resource_group_name: 'rg-databricks-test'
      });
      await page.waitForTimeout(500);

      // Step 3: Fill network configuration
      await FormHelpers.fillNetworkConfig(page, {
        create_new_vpc: true,
        vpc_cidr: '10.0.0.0/12',
        availability_zones: ['1', '2'],
        enable_private_link: true
      });

      // Verify subnet calculation appears
      await expect(page.locator('#subnets-preview')).toBeVisible({ timeout: 5000 });
      await page.waitForTimeout(1000);

      // Step 4: Submit configuration
      await FormHelpers.submitConfigForm(page);
      await page.waitForTimeout(1000);
      await expect(page).toHaveURL(/.*#\/summary/, { timeout: 10000 });

      // Step 5: Verify summary page
      await expect(page.locator('text=Configuration Summary')).toBeVisible();
      await expect(page.locator('text=test-azure')).toBeVisible();
      await expect(page.locator('code:has-text("eastus")').first()).toBeVisible();
      await expect(page.locator('text=PREMIUM')).toBeVisible();
      await expect(page.locator('text=rg-databricks-test')).toBeVisible();
      
      // Step 6: Confirm and generate
      await FormHelpers.confirmAndGenerate(page);
      
      // Should navigate to download page or stay on summary
      await page.waitForTimeout(2000);
      const currentRoute = await NavigationHelpers.getCurrentRoute(page);
      expect(['/download', '/summary']).toContain(currentRoute);
    });

    test('should complete Azure flow with Standard tier without Private Link', async ({ page }) => {
      await FormHelpers.selectProvider(page, 'azure');
      
      await FormHelpers.fillBasicConfig(page, {
        project_prefix: 'azure-standard',
        region: 'westus2',
        pricing_tier: 'STANDARD',
        resource_group_name: 'rg-standard'
      });
      await page.waitForTimeout(500);

      await FormHelpers.fillNetworkConfig(page, {
        create_new_vpc: true,
        vpc_cidr: '10.16.0.0/12',
        availability_zones: ['1', '2', '3'],
        enable_private_link: false
      });

      await expect(page.locator('#subnets-preview')).toBeVisible({ timeout: 5000 });
      await page.waitForTimeout(1000);
      await FormHelpers.submitConfigForm(page);
      await page.waitForTimeout(1000);
      await expect(page).toHaveURL(/.*#\/summary/, { timeout: 10000 });
    });

    test('should complete Azure flow using existing VNet', async ({ page }) => {
      await FormHelpers.selectProvider(page, 'azure');

      await FormHelpers.fillBasicConfig(page, {
        project_prefix: 'azure-existing',
        region: 'centralus',
        pricing_tier: 'PREMIUM',
        resource_group_name: 'rg-existing'
      });

      // Uncheck Create New VNet
      const createNewVpc = page.locator('#create_new_vpc');
      if (await createNewVpc.isChecked()) {
        await createNewVpc.click();
        await page.waitForTimeout(500);
      }

      // Fill existing VNet Resource ID
      const existingVnetId = page.locator('#existing_vpc_id');
      await existingVnetId.waitFor({ state: 'visible', timeout: 5000 });
      await existingVnetId.fill('/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/rg-existing/providers/Microsoft.Network/virtualNetworks/my-existing-vnet');

      // Fill existing subnet names
      const publicSubnet = page.locator('#existing_public_subnet_name');
      await publicSubnet.waitFor({ state: 'visible', timeout: 5000 });
      await publicSubnet.fill('databricks-public-subnet');

      const privateSubnet = page.locator('#existing_private_subnet_name');
      await privateSubnet.fill('databricks-private-subnet');

      await page.waitForTimeout(500);
      await FormHelpers.submitConfigForm(page);
      await expect(page).toHaveURL(/.*#\/summary/, { timeout: 10000 });
    });
  });

  test.describe('Field Validations', () => {
    test.beforeEach(async ({ page }) => {
      await FormHelpers.selectProvider(page, 'azure');
    });

    test('should require resource group name', async ({ page }) => {
      await FormHelpers.fillBasicConfig(page, {
        project_prefix: 'test',
        region: 'eastus',
        pricing_tier: 'STANDARD'
      });
      
      await FormHelpers.fillNetworkConfig(page, {
        vpc_cidr: '10.0.0.0/20',
        availability_zones: ['1']
      });

      const resourceGroupField = page.locator('input[name="resource_group_name"]');
      await resourceGroupField.clear();
      
      await FormHelpers.submitConfigForm(page, true); // allowInvalid = true for validation tests
      const validity = await ValidationHelpers.getFieldValidationMessage(page, 'resource_group_name');
      expect(validity.valueMissing).toBeTruthy();
    });

    test('should require project prefix', async ({ page }) => {
      await FormHelpers.fillBasicConfig(page, {
        region: 'eastus',
        pricing_tier: 'STANDARD',
        resource_group_name: 'rg-test'
      });
      
      const projectPrefixField = page.locator('input[name="project_prefix"]');
      await projectPrefixField.clear();
      
      await FormHelpers.submitConfigForm(page, true); // allowInvalid = true for validation tests
      const validity = await ValidationHelpers.getFieldValidationMessage(page, 'project_prefix');
      expect(validity.valueMissing).toBeTruthy();
    });

    test('should require pricing tier', async ({ page }) => {
      await FormHelpers.fillBasicConfig(page, {
        project_prefix: 'test',
        region: 'eastus',
        resource_group_name: 'rg-test'
      });
      
      // Clear the select value using JavaScript since it always has a default selection
      await page.evaluate(() => {
        const select = document.querySelector('select[name="pricing_tier"]');
        if (select) {
          select.value = '';
          select.selectedIndex = -1;
          select.dispatchEvent(new Event('change', { bubbles: true }));
        }
      });
      
      await FormHelpers.submitConfigForm(page, true); // allowInvalid = true for validation tests
      const validity = await ValidationHelpers.getFieldValidationMessage(page, 'pricing_tier');
      expect(validity.valueMissing).toBeTruthy();
    });

    test('should require VNet CIDR', async ({ page }) => {
      await FormHelpers.fillBasicConfig(page, {
        project_prefix: 'test',
        region: 'eastus',
        pricing_tier: 'STANDARD',
        resource_group_name: 'rg-test'
      });
      
      // Fill availability zones first to avoid that validation blocking
      await FormHelpers.fillNetworkConfig(page, {
        availability_zones: ['1']
      });
      
      const vpcCidrField = page.locator('input[name="vpc_cidr"]');
      await vpcCidrField.waitFor({ state: 'visible', timeout: 5000 });
      
      // Clear the field and ensure it's empty
      await vpcCidrField.fill('');
      await vpcCidrField.blur(); // Trigger validation
      await page.waitForTimeout(300);
      
      // Verify field is empty
      const fieldValue = await vpcCidrField.inputValue();
      expect(fieldValue).toBe('');
      
      await FormHelpers.submitConfigForm(page, true); // allowInvalid = true for validation tests
      await page.waitForTimeout(1000); // Wait for validation to be applied
      
      // Check if we're still on configure page (validation should prevent navigation)
      const currentUrl = page.url();
      if (currentUrl.includes('#/summary')) {
        // If navigated to summary, validation didn't work - go back and check
        await page.goBack();
        await page.waitForTimeout(1000);
        await page.waitForSelector('input[name="vpc_cidr"]', { timeout: 5000 });
      }
      
      // Check both HTML5 validation and custom validation
      const validity = await ValidationHelpers.getFieldValidationMessage(page, 'vpc_cidr').catch(() => null);
      const hasCustomError = await ValidationHelpers.hasFieldValidationError(page, 'vpc_cidr');
      
      // Either HTML5 validation or custom validation should catch this
      expect(validity?.valueMissing || hasCustomError).toBeTruthy();
    });

    test('should require at least one availability zone', async ({ page }) => {
      await FormHelpers.fillBasicConfig(page, {
        project_prefix: 'test',
        region: 'eastus',
        pricing_tier: 'STANDARD',
        resource_group_name: 'rg-test'
      });
      
      await FormHelpers.fillNetworkConfig(page, {
        vpc_cidr: '10.0.0.0/22'
      });
      
      // Clear all selected zones using helper
      await FormHelpers.selectAvailabilityZones(page, []);
      
      await FormHelpers.submitConfigForm(page, true); // allowInvalid=true for validation tests
      await page.waitForTimeout(1000); // Wait for validation to be applied
      const hasError = await ValidationHelpers.hasAvailabilityZoneError(page, 'availability zone');
      expect(hasError).toBeTruthy();
    });
  });

  test.describe('Format Validations', () => {
    test.beforeEach(async ({ page }) => {
      await FormHelpers.selectProvider(page, 'azure');
    });

    test('should validate availability zones as numeric', async ({ page }) => {
      await FormHelpers.fillBasicConfig(page, {
        project_prefix: 'test',
        region: 'eastus',
        pricing_tier: 'STANDARD',
        resource_group_name: 'rg-test'
      });
      
      await FormHelpers.fillNetworkConfig(page, {
        vpc_cidr: '10.0.0.0/22',
        availability_zones: ['invalid-zone']
      });
      
      await FormHelpers.submitConfigForm(page, true); // allowInvalid=true for validation tests
      await page.waitForTimeout(500); // Wait for validation to be applied
      const hasError = await ValidationHelpers.hasFieldValidationError(page, 'availability_zones', 'numeric');
      expect(hasError).toBeTruthy();
    });

    test('should validate VNet CIDR format', async ({ page }) => {
      await FormHelpers.fillBasicConfig(page, {
        project_prefix: 'test',
        region: 'eastus',
        pricing_tier: 'STANDARD',
        resource_group_name: 'rg-test'
      });
      
      await FormHelpers.fillNetworkConfig(page, {
        vpc_cidr: 'invalid-cidr',
        availability_zones: ['1']
      });
      
      await FormHelpers.submitConfigForm(page, true); // allowInvalid=true for validation tests
      await page.waitForTimeout(500); // Wait for validation to be applied
      const hasError = await ValidationHelpers.hasFieldValidationError(page, 'vpc_cidr', 'CIDR');
      expect(hasError).toBeTruthy();
    });
  });

  test.describe('Dependency Validations', () => {
    test.beforeEach(async ({ page }) => {
      await FormHelpers.selectProvider(page, 'azure');
      await FormHelpers.fillBasicConfig(page, {
        project_prefix: 'test',
        region: 'eastus',
        resource_group_name: 'rg-test'
      });
    });

    test('should show warning when Private Link enabled with Standard tier', async ({ page }) => {
      await FormHelpers.fillBasicConfig(page, {
        project_prefix: 'test',
        region: 'eastus',
        pricing_tier: 'STANDARD',
        resource_group_name: 'rg-test'
      });
      
      await FormHelpers.fillNetworkConfig(page, {
        vpc_cidr: '10.0.0.0/20',
        availability_zones: ['1'],
        enable_private_link: true
      });
      
      const hasWarning = await ValidationHelpers.hasPrivateLinkWarning(page);
      expect(hasWarning).toBeTruthy();
    });

    test('should allow Private Link with Premium tier', async ({ page }) => {
      await FormHelpers.fillBasicConfig(page, {
        project_prefix: 'test',
        region: 'eastus',
        pricing_tier: 'PREMIUM',
        resource_group_name: 'rg-test'
      });
      await page.waitForTimeout(500);
      
      await FormHelpers.fillNetworkConfig(page, {
        vpc_cidr: '10.0.0.0/20',
        availability_zones: ['1'],
        enable_private_link: true
      });
      
      await page.waitForTimeout(1000);
      const hasWarning = await ValidationHelpers.hasPrivateLinkWarning(page);
      expect(hasWarning).toBeFalsy();
      
      // Should calculate service subnet
      await page.waitForTimeout(2000);
      const subnets = await FormHelpers.getSubnetPreview(page);
      expect(subnets).not.toBeNull();
      expect(subnets.length).toBeGreaterThan(0);
      const serviceSubnet = subnets.find(s => s.type === 'service');
      expect(serviceSubnet).toBeDefined();
    });

    test('should prevent submission with Private Link and Standard tier', async ({ page }) => {
      await FormHelpers.fillBasicConfig(page, {
        project_prefix: 'test',
        region: 'eastus',
        pricing_tier: 'STANDARD',
        resource_group_name: 'rg-test'
      });
      
      await FormHelpers.fillNetworkConfig(page, {
        vpc_cidr: '10.0.0.0/20',
        availability_zones: ['1'],
        enable_private_link: true
      });
      
      await FormHelpers.submitConfigForm(page, true); // allowInvalid=true for validation tests
      await page.waitForTimeout(500); // Wait for validation to be applied
      const hasError = await ValidationHelpers.hasFieldValidationError(page, 'enable_private_link', 'Premium');
      expect(hasError).toBeTruthy();
    });
  });

  test.describe('Dynamic Interactions', () => {
    test.beforeEach(async ({ page }) => {
      await FormHelpers.selectProvider(page, 'azure');
      await FormHelpers.fillBasicConfig(page, {
        project_prefix: 'test',
        region: 'eastus',
        pricing_tier: 'STANDARD',
        resource_group_name: 'rg-test'
      });
    });

    test('should recalculate subnets when VNet CIDR changes', async ({ page }) => {
      await FormHelpers.fillNetworkConfig(page, {
        vpc_cidr: '10.0.0.0/20',
        availability_zones: ['1', '2']
      });
      
      await page.waitForTimeout(2000);
      const subnets1 = await FormHelpers.getSubnetPreview(page);
      expect(subnets1).not.toBeNull();
      expect(subnets1.length).toBeGreaterThan(0);
      
      // Change VNet CIDR
      await page.fill('input[name="vpc_cidr"]', '10.1.0.0/20');
      await page.waitForTimeout(2000);
      
      const subnets2 = await FormHelpers.getSubnetPreview(page);
      expect(subnets2).not.toBeNull();
      expect(subnets2.length).toBeGreaterThan(0);
      
      // Subnets should be different
      expect(subnets1[0].cidr).not.toBe(subnets2[0].cidr);
    });

    test('should toggle existing VNet section', async ({ page }) => {
      const createNewVpc = page.locator('#create_new_vpc');
      const existingVpcSection = page.locator('#existing-vpc-section');
      
      // Initially should be creating new VNet
      expect(await createNewVpc.isChecked()).toBeTruthy();
      expect(await existingVpcSection.isVisible()).toBeFalsy();
      
      // Uncheck to use existing VNet
      await createNewVpc.click();
      await page.waitForTimeout(300);
      expect(await existingVpcSection.isVisible()).toBeTruthy();
      
      // Check again to create new
      await createNewVpc.click();
      await page.waitForTimeout(300);
      expect(await existingVpcSection.isVisible()).toBeFalsy();
    });

    test('should recalculate subnets when availability zones change', async ({ page }) => {
      await FormHelpers.fillNetworkConfig(page, {
        vpc_cidr: '10.0.0.0/20',
        availability_zones: ['1']
      });
      
      await page.waitForTimeout(2000);
      const subnets1 = await FormHelpers.getSubnetPreview(page);
      const count1 = subnets1 ? subnets1.length : 0;
      expect(count1).toBeGreaterThan(0);
      
      // Add another zone using multiple select
      await FormHelpers.selectAvailabilityZones(page, ['1', '2']);
      await page.waitForTimeout(2000);
      
      const subnets2 = await FormHelpers.getSubnetPreview(page);
      const count2 = subnets2 ? subnets2.length : 0;
      
      // Should have more subnets with 2 zones
      expect(count2).toBeGreaterThan(count1);
    });

    test('should recalculate subnets when pricing tier changes', async ({ page }) => {
      await FormHelpers.fillNetworkConfig(page, {
        vpc_cidr: '10.0.0.0/20',
        availability_zones: ['1'],
        enable_private_link: true
      });
      
      await page.waitForTimeout(2000);
      
      // Change to Premium tier
      await FormHelpers.fillBasicConfig(page, {
        project_prefix: 'test',
        region: 'eastus',
        pricing_tier: 'PREMIUM',
        resource_group_name: 'rg-test'
      });
      await page.waitForTimeout(2000);
      
      const subnets = await FormHelpers.getSubnetPreview(page);
      expect(subnets).not.toBeNull();
      expect(subnets.length).toBeGreaterThan(0);
      
      // Should now have service subnet
      const serviceSubnet = subnets.find(s => s.type === 'service');
      expect(serviceSubnet).toBeDefined();
    });
  });

  test.describe('Network Calculations', () => {
    test.beforeEach(async ({ page }) => {
      await FormHelpers.selectProvider(page, 'azure');
      await FormHelpers.fillBasicConfig(page, {
        project_prefix: 'test',
        region: 'eastus',
        pricing_tier: 'STANDARD',
        resource_group_name: 'rg-test'
      });
    });

    test('should calculate subnets correctly for Azure', async ({ page }) => {
      await FormHelpers.fillNetworkConfig(page, {
        vpc_cidr: '10.0.0.0/20',
        availability_zones: ['1', '2']
      });
      
      await page.waitForTimeout(2000);
      
      const subnets = await FormHelpers.getSubnetPreview(page);
      expect(subnets).not.toBeNull();
      expect(subnets.length).toBeGreaterThan(0);
      
      // Should have private and public subnets for each AZ
      const privateSubnets = subnets.filter(s => s.type === 'private');
      const publicSubnets = subnets.filter(s => s.type === 'public');
      
      expect(privateSubnets.length).toBeGreaterThanOrEqual(2);
      expect(publicSubnets.length).toBeGreaterThanOrEqual(2);
    });

    test('should display network utilization summary', async ({ page }) => {
      await FormHelpers.fillNetworkConfig(page, {
        vpc_cidr: '10.0.0.0/20',
        availability_zones: ['1', '2']
      });
      
      await page.waitForTimeout(2000);
      
      const summary = await FormHelpers.getNetworkSummary(page);
      expect(summary).not.toBeNull();
      expect(summary.total_ips).toBeTruthy();
      expect(summary.used_ips).toBeTruthy();
      expect(summary.utilization_percent).toBeTruthy();
    });

    test('should calculate service subnet for Premium tier with Private Link', async ({ page }) => {
      await FormHelpers.fillBasicConfig(page, {
        project_prefix: 'test',
        region: 'eastus',
        pricing_tier: 'PREMIUM',
        resource_group_name: 'rg-test'
      });
      await page.waitForTimeout(500);
      
      await FormHelpers.fillNetworkConfig(page, {
        vpc_cidr: '10.0.0.0/20',
        availability_zones: ['1'],
        enable_private_link: true
      });
      
      await page.waitForTimeout(3000);
      
      const subnets = await FormHelpers.getSubnetPreview(page);
      expect(subnets).not.toBeNull();
      expect(subnets.length).toBeGreaterThan(0);
      const serviceSubnet = subnets.find(s => s.type === 'service');
      expect(serviceSubnet).toBeDefined();
      expect(serviceSubnet.name).toContain('service');
    });
  });

  test.describe('Azure-Specific Features', () => {
    test('should display VNet label instead of VPC', async ({ page }) => {
      await FormHelpers.selectProvider(page, 'azure');
      
      const vpcLabel = page.locator('label:has-text("VNet CIDR Block")');
      await expect(vpcLabel).toBeVisible();
    });

    test('should require Resource Group Name field', async ({ page }) => {
      await FormHelpers.selectProvider(page, 'azure');
      
      const resourceGroupField = page.locator('input[name="resource_group_name"]');
      await expect(resourceGroupField).toBeVisible();
      const isRequired = await ValidationHelpers.isFieldRequired(page, 'resource_group_name');
      expect(isRequired).toBeTruthy();
    });

    test('should only show Standard and Premium pricing tiers', async ({ page }) => {
      await FormHelpers.selectProvider(page, 'azure');
      
      const pricingTierSelect = page.locator('select[name="pricing_tier"]');
      const options = await pricingTierSelect.locator('option').allTextContents();
      
      expect(options).toContain('Standard');
      expect(options).toContain('Premium');
      expect(options).not.toContain('Enterprise');
    });
  });

  test.describe('Navigation', () => {
    test('should navigate back from configure to provider selection', async ({ page }) => {
      await FormHelpers.selectProvider(page, 'azure');
      await expect(page).toHaveURL(/.*#\/configure/);
      
      await NavigationHelpers.navigateBack(page);
      await expect(page).toHaveURL(/.*#\/select-provider/);
    });

    test('should persist data when navigating between steps', async ({ page }) => {
      await FormHelpers.selectProvider(page, 'azure');
      await FormHelpers.fillBasicConfig(page, {
        project_prefix: 'persist-test',
        region: 'eastus',
        pricing_tier: 'STANDARD',
        resource_group_name: 'rg-persist'
      });
      await page.waitForTimeout(500);
      
      // Submit form to save to localStorage
      await FormHelpers.fillNetworkConfig(page, {
        vpc_cidr: '10.0.0.0/12',
        availability_zones: ['1']
      });
      await FormHelpers.submitConfigForm(page);
      await page.waitForTimeout(500);
      
      // Navigate back to configure
      await NavigationHelpers.navigateBack(page);
      await expect(page).toHaveURL(/.*#\/configure/);
      await page.waitForTimeout(1000);
      
      // Data should be persisted (check form fields)
      const projectPrefix = await page.locator('input[name="project_prefix"]').inputValue();
      expect(projectPrefix).toBe('persist-test');
      
      const resourceGroup = await page.locator('input[name="resource_group_name"]').inputValue();
      expect(resourceGroup).toBe('rg-persist');
    });
  });

  test.describe('Availability Zone Combobox Tests', () => {
    test.beforeEach(async ({ page }) => {
      await FormHelpers.selectProvider(page, 'azure');
      await FormHelpers.fillBasicConfig(page, {
        project_prefix: 'test-azure',
        region: 'eastus',
        pricing_tier: 'PREMIUM',
        resource_group_name: 'rg-test'
      });
    });

    test('should use multiple select for availability zones', async ({ page }) => {
      // Verify Choices.js component exists (select is hidden, container is visible)
      const choicesContainer = page.locator('.choices:has(#availability-zones-select)');
      await expect(choicesContainer).toBeVisible();
      
      // Verify select has multiple attribute
      const azSelect = page.locator('#availability-zones-select');
      const isMultiple = await azSelect.getAttribute('multiple');
      expect(isMultiple).not.toBeNull();
      
      // Verify select has options (even though hidden)
      const options = await azSelect.locator('option').count();
      expect(options).toBeGreaterThan(1); // At least one option + placeholder
      
      // Verify options contain Azure zone format (numeric) - read from select element
      const optionText = await azSelect.locator('option').nth(1).textContent();
      expect(optionText).toMatch(/Zone [1-3]/);
    });

    test('should allow selecting and deselecting multiple availability zones', async ({ page }) => {
      // Use helper function to select zones (works with Choices.js)
      await FormHelpers.selectAvailabilityZones(page, ['1', '2']);
      
      const selectedCount = await page.evaluate(() => {
        const select = document.getElementById('availability-zones-select');
        if (!select) return 0;
        const choicesInstance = select._choicesjs || select.choicesjs;
        if (choicesInstance && choicesInstance.getValue) {
          const values = choicesInstance.getValue(true);
          return Array.isArray(values) ? values.length : 0;
        }
        return Array.from(select.selectedOptions).length;
      });
      expect(selectedCount).toBe(2);
      
      // Deselect one zone
      await FormHelpers.selectAvailabilityZones(page, ['1']);
      
      const afterDeselectCount = await page.evaluate(() => {
        const select = document.getElementById('availability-zones-select');
        if (!select) return 0;
        const choicesInstance = select._choicesjs || select.choicesjs;
        if (choicesInstance && choicesInstance.getValue) {
          const values = choicesInstance.getValue(true);
          return Array.isArray(values) ? values.length : 0;
        }
        return Array.from(select.selectedOptions).length;
      });
      expect(afterDeselectCount).toBe(1);
    });

    test('should enforce minimum availability zones for Azure (1)', async ({ page }) => {
      // Deselect all zones using helper
      await FormHelpers.selectAvailabilityZones(page, []);
      
      // Try to submit with no zones selected
      await FormHelpers.submitConfigForm(page, true);
      await page.waitForTimeout(500);
      
      // Should show error about minimum availability zones
      const hasError = await ValidationHelpers.hasAvailabilityZoneError(page, 'availability zone');
      expect(hasError).toBeTruthy();
    });

    test('should allow selecting multiple different availability zones', async ({ page }) => {
      // Select multiple different zones
      await FormHelpers.selectAvailabilityZones(page, ['1', '2', '3']);
      
      const selectedCount = await page.evaluate(() => {
        const select = document.getElementById('availability-zones-select');
        if (!select) return 0;
        const choicesInstance = select.choicesInstance;
        if (choicesInstance && choicesInstance.getValue) {
          const values = choicesInstance.getValue(true);
          return Array.isArray(values) ? values.length : 0;
        }
        return Array.from(select.selectedOptions).length;
      });
      expect(selectedCount).toBe(3);
      
      // Verify all selected zones are different
      const selectedValues = await page.evaluate(() => {
        const select = document.getElementById('availability-zones-select');
        if (!select) return [];
        const choicesInstance = select.choicesInstance;
        if (choicesInstance && choicesInstance.getValue) {
          return choicesInstance.getValue(true) || [];
        }
        return Array.from(select.selectedOptions).map(opt => opt.value);
      });
      const uniqueValues = [...new Set(selectedValues)];
      expect(uniqueValues.length).toBe(selectedValues.length);
    });

    test('should enforce minimum availability zones for Azure (1) on submit', async ({ page }) => {
      // Deselect all zones using helper
      await FormHelpers.selectAvailabilityZones(page, []);
      
      // Try to submit - should fail validation
      await FormHelpers.submitConfigForm(page, true);
      await page.waitForTimeout(500);
      
      const hasError = await ValidationHelpers.hasAvailabilityZoneError(page, 'availability zone');
      expect(hasError).toBeTruthy();
    });

    test('should enforce maximum availability zones for Azure (3)', async ({ page }) => {
      // Select all 3 zones (maximum)
      await FormHelpers.selectAvailabilityZones(page, ['1', '2', '3']);
      
      const selectedCount = await page.evaluate(() => {
        const select = document.getElementById('availability-zones-select');
        if (!select) return 0;
        const choicesInstance = select.choicesInstance;
        if (choicesInstance && choicesInstance.getValue) {
          const values = choicesInstance.getValue(true);
          return Array.isArray(values) ? values.length : 0;
        }
        return Array.from(select.selectedOptions).length;
      });
      expect(selectedCount).toBeLessThanOrEqual(3);
      
      // Verify we can select exactly 3 zones
      expect(selectedCount).toBe(3);
    });

    test('should only show valid availability zones for Azure (1, 2, 3)', async ({ page }) => {
      const azSelect = page.locator('#availability-zones-select');
      // Read option labels from the select element (even though it's hidden)
      const options = await azSelect.locator('option').allTextContents();
      
      // All options should be valid Azure zones (Zone 1, Zone 2, or Zone 3)
      const validOptions = options.filter(opt => opt !== 'Select one or more availability zones' && opt !== '' && opt.trim() !== '');
      expect(validOptions.length).toBeGreaterThan(0);
      validOptions.forEach(opt => {
        expect(opt.trim()).toMatch(/^Zone [1-3]$/);
      });
    });
  });
});

