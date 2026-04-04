const { test, expect } = require('../helpers/coverage-fixture');
const FormHelpers = require('../helpers/form-helpers');
const NavigationHelpers = require('../helpers/navigation-helpers');
const ValidationHelpers = require('../helpers/validation-helpers');

test.describe('GCP Provider Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.evaluate(() => {
      localStorage.clear();
    });
  });

  test.describe('Complete Flow', () => {
    test('should complete full GCP deployment flow with Premium tier and Private Service Connect', async ({ page }) => {
      // Step 1: Select GCP provider
      await FormHelpers.selectProvider(page, 'gcp');
      await expect(page).toHaveURL(/.*#\/configure/);

      // Step 2: Fill basic configuration (including Project ID)
      await FormHelpers.fillBasicConfig(page, {
        project_prefix: 'test-gcp',
        region: 'us-central1',
        pricing_tier: 'PREMIUM',
        project_id: 'my-gcp-project-123'
      });
      await page.waitForTimeout(500);

      // Step 3: Fill network configuration
      await FormHelpers.fillNetworkConfig(page, {
        create_new_vpc: true,
        vpc_cidr: '10.0.0.0/12',
        availability_zones: ['us-central1-a', 'us-central1-b'],
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
      await expect(page.locator('text=test-gcp')).toBeVisible();
      await expect(page.locator('code:has-text("us-central1")').first()).toBeVisible();
      await expect(page.locator('text=PREMIUM')).toBeVisible();
      await expect(page.locator('text=my-gcp-project-123')).toBeVisible();
      
      // Step 6: Confirm and generate
      await FormHelpers.confirmAndGenerate(page);
      
      // Should navigate to download page or stay on summary
      await page.waitForTimeout(2000);
      const currentRoute = await NavigationHelpers.getCurrentRoute(page);
      expect(['/download', '/summary']).toContain(currentRoute);
    });

    test('should complete GCP flow with Standard tier without Private Service Connect', async ({ page }) => {
      await FormHelpers.selectProvider(page, 'gcp');
      
      await FormHelpers.fillBasicConfig(page, {
        project_prefix: 'gcp-standard',
        region: 'us-east1',
        pricing_tier: 'STANDARD',
        project_id: 'gcp-standard-project'
      });
      await page.waitForTimeout(500);

      await FormHelpers.fillNetworkConfig(page, {
        create_new_vpc: true,
        vpc_cidr: '10.16.0.0/12',
        availability_zones: ['us-east1-a', 'us-east1-b', 'us-east1-c'],
        enable_private_link: false
      });

      await expect(page.locator('#subnets-preview')).toBeVisible({ timeout: 5000 });
      await page.waitForTimeout(1000);
      await FormHelpers.submitConfigForm(page);
      await page.waitForTimeout(1000);
      await expect(page).toHaveURL(/.*#\/summary/, { timeout: 10000 });
    });

    test('should complete GCP flow using existing VPC', async ({ page }) => {
      await FormHelpers.selectProvider(page, 'gcp');

      await FormHelpers.fillBasicConfig(page, {
        project_prefix: 'gcp-existing',
        region: 'europe-west1',
        pricing_tier: 'PREMIUM',
        project_id: 'gcp-existing-project'
      });

      // Uncheck Create New VPC
      const createNewVpc = page.locator('#create_new_vpc');
      if (await createNewVpc.isChecked()) {
        await createNewVpc.click();
        await page.waitForTimeout(500);
      }

      // Fill existing VPC name
      const existingVpcName = page.locator('#existing_vpc_id');
      await existingVpcName.waitFor({ state: 'visible', timeout: 5000 });
      await existingVpcName.fill('my-existing-vpc');

      // Fill existing subnet and range names
      const subnetName = page.locator('#existing_subnet_name');
      await subnetName.waitFor({ state: 'visible', timeout: 5000 });
      await subnetName.fill('databricks-primary-subnet');

      const podRange = page.locator('#existing_pod_range_name');
      await podRange.fill('pods');

      const serviceRange = page.locator('#existing_service_range_name');
      await serviceRange.fill('services');

      await page.waitForTimeout(500);
      await FormHelpers.submitConfigForm(page);
      await expect(page).toHaveURL(/.*#\/summary/, { timeout: 10000 });
    });
  });

  test.describe('Field Validations', () => {
    test.beforeEach(async ({ page }) => {
      await FormHelpers.selectProvider(page, 'gcp');
    });

    test('should require project ID', async ({ page }) => {
      await FormHelpers.fillBasicConfig(page, {
        project_prefix: 'test',
        region: 'us-central1',
        pricing_tier: 'STANDARD'
      });
      
      await FormHelpers.fillNetworkConfig(page, {
        vpc_cidr: '10.0.0.0/20',
        availability_zones: ['us-central1-a']
      });

      const projectIdField = page.locator('input[name="project_id"]');
      await projectIdField.clear();
      
      await FormHelpers.submitConfigForm(page, true); // allowInvalid = true for validation tests
      const validity = await ValidationHelpers.getFieldValidationMessage(page, 'project_id');
      expect(validity.valueMissing).toBeTruthy();
    });

    test('should require project prefix', async ({ page }) => {
      await FormHelpers.fillBasicConfig(page, {
        region: 'us-central1',
        pricing_tier: 'STANDARD',
        project_id: 'test-project'
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
        region: 'us-central1',
        project_id: 'test-project'
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

    test('should require VPC CIDR', async ({ page }) => {
      await FormHelpers.fillBasicConfig(page, {
        project_prefix: 'test',
        region: 'us-central1',
        pricing_tier: 'STANDARD',
        project_id: 'test-project'
      });
      
      const vpcCidrField = page.locator('input[name="vpc_cidr"]');
      await vpcCidrField.clear();
      
      await FormHelpers.submitConfigForm(page, true); // allowInvalid = true for validation tests
      const validity = await ValidationHelpers.getFieldValidationMessage(page, 'vpc_cidr');
      expect(validity.valueMissing).toBeTruthy();
    });

    test('should require at least one availability zone', async ({ page }) => {
      await FormHelpers.fillBasicConfig(page, {
        project_prefix: 'test',
        region: 'us-central1',
        pricing_tier: 'STANDARD',
        project_id: 'test-project'
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
      await FormHelpers.selectProvider(page, 'gcp');
    });

    test('should validate availability zones format for GCP', async ({ page }) => {
      await FormHelpers.fillBasicConfig(page, {
        project_prefix: 'test',
        region: 'us-central1',
        pricing_tier: 'STANDARD',
        project_id: 'test-project'
      });
      
      await FormHelpers.fillNetworkConfig(page, {
        vpc_cidr: '10.0.0.0/22',
        availability_zones: ['invalid-zone']
      });
      
      await FormHelpers.submitConfigForm(page, true); // allowInvalid=true for validation tests
      await page.waitForTimeout(500); // Wait for validation to be applied
      // Availability zone validation is checked on the availability_zones field or container
      const hasError = await ValidationHelpers.hasFieldValidationError(page, 'availability_zones', 'availability zone') ||
                      await ValidationHelpers.hasAvailabilityZoneError(page, 'availability zone');
      expect(hasError).toBeTruthy();
    });

    test('should validate VPC CIDR format', async ({ page }) => {
      await FormHelpers.fillBasicConfig(page, {
        project_prefix: 'test',
        region: 'us-central1',
        pricing_tier: 'STANDARD',
        project_id: 'test-project'
      });
      
      await FormHelpers.fillNetworkConfig(page, {
        vpc_cidr: 'invalid-cidr',
        availability_zones: ['us-central1-a', 'us-central1-b'] // GCP requires at least 2 AZs
      });
      
      await FormHelpers.submitConfigForm(page, true); // allowInvalid=true for validation tests
      await page.waitForTimeout(500); // Wait for validation to be applied
      const hasError = await ValidationHelpers.hasFieldValidationError(page, 'vpc_cidr', 'CIDR');
      expect(hasError).toBeTruthy();
    });
  });

  test.describe('Dependency Validations', () => {
    test.beforeEach(async ({ page }) => {
      await FormHelpers.selectProvider(page, 'gcp');
      await FormHelpers.fillBasicConfig(page, {
        project_prefix: 'test',
        region: 'us-central1',
        project_id: 'test-project'
      });
    });

    test('should show warning when Private Service Connect enabled with Standard tier', async ({ page }) => {
      await FormHelpers.fillBasicConfig(page, {
        project_prefix: 'test',
        region: 'us-central1',
        pricing_tier: 'STANDARD',
        project_id: 'test-project'
      });
      
      await FormHelpers.fillNetworkConfig(page, {
        vpc_cidr: '10.0.0.0/20',
        availability_zones: ['us-central1-a'],
        enable_private_link: true
      });
      
      const hasWarning = await ValidationHelpers.hasPrivateLinkWarning(page);
      expect(hasWarning).toBeTruthy();
    });

    test('should allow Private Service Connect with Premium tier', async ({ page }) => {
      await FormHelpers.fillBasicConfig(page, {
        project_prefix: 'test',
        region: 'us-central1',
        pricing_tier: 'PREMIUM',
        project_id: 'test-project'
      });
      await page.waitForTimeout(500);
      
      await FormHelpers.fillNetworkConfig(page, {
        vpc_cidr: '10.0.0.0/20',
        availability_zones: ['us-central1-a'],
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

    test('should prevent submission with Private Service Connect and Standard tier', async ({ page }) => {
      await FormHelpers.fillBasicConfig(page, {
        project_prefix: 'test',
        region: 'us-central1',
        pricing_tier: 'STANDARD',
        project_id: 'test-project'
      });
      
      await FormHelpers.fillNetworkConfig(page, {
        vpc_cidr: '10.0.0.0/20',
        availability_zones: ['us-central1-a', 'us-central1-b'], // GCP requires at least 2 AZs
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
      await FormHelpers.selectProvider(page, 'gcp');
      await FormHelpers.fillBasicConfig(page, {
        project_prefix: 'test',
        region: 'us-central1',
        pricing_tier: 'STANDARD',
        project_id: 'test-project'
      });
    });

    test('should recalculate subnets when VPC CIDR changes', async ({ page }) => {
      await FormHelpers.fillNetworkConfig(page, {
        vpc_cidr: '10.0.0.0/20',
        availability_zones: ['us-central1-a', 'us-central1-b']
      });
      
      await page.waitForTimeout(2000);
      const subnets1 = await FormHelpers.getSubnetPreview(page);
      expect(subnets1).not.toBeNull();
      expect(subnets1.length).toBeGreaterThan(0);
      
      // Change VPC CIDR
      await page.fill('input[name="vpc_cidr"]', '10.1.0.0/20');
      await page.waitForTimeout(2000);
      
      const subnets2 = await FormHelpers.getSubnetPreview(page);
      expect(subnets2).not.toBeNull();
      expect(subnets2.length).toBeGreaterThan(0);
      
      // Subnets should be different
      expect(subnets1[0].cidr).not.toBe(subnets2[0].cidr);
    });

    test('should toggle existing VPC section', async ({ page }) => {
      const createNewVpc = page.locator('#create_new_vpc');
      const existingVpcSection = page.locator('#existing-vpc-section');
      
      // Initially should be creating new VPC
      expect(await createNewVpc.isChecked()).toBeTruthy();
      expect(await existingVpcSection.isVisible()).toBeFalsy();
      
      // Uncheck to use existing VPC
      await createNewVpc.click();
      await page.waitForTimeout(300);
      expect(await existingVpcSection.isVisible()).toBeTruthy();
      
      // Check again to create new
      await createNewVpc.click();
      await page.waitForTimeout(300);
      expect(await existingVpcSection.isVisible()).toBeFalsy();
    });

    test('should recalculate subnets when pricing tier changes', async ({ page }) => {
      await FormHelpers.fillNetworkConfig(page, {
        vpc_cidr: '10.0.0.0/20',
        availability_zones: ['us-central1-a'],
        enable_private_link: true
      });
      
      await page.waitForTimeout(2000);
      
      // Change to Premium tier
      await FormHelpers.fillBasicConfig(page, {
        project_prefix: 'test',
        region: 'us-central1',
        pricing_tier: 'PREMIUM',
        project_id: 'test-project'
      });
      await page.waitForTimeout(2000);
      
      const subnets = await FormHelpers.getSubnetPreview(page);
      expect(subnets).not.toBeNull();
      expect(subnets.length).toBeGreaterThan(0);
      
      // Should now have service subnet
      const serviceSubnet = subnets.find(s => s.type === 'service');
      expect(serviceSubnet).toBeDefined();
    });

    test('should recalculate subnets when Private Service Connect toggles', async ({ page }) => {
      await FormHelpers.fillBasicConfig(page, {
        project_prefix: 'test',
        region: 'us-central1',
        pricing_tier: 'PREMIUM',
        project_id: 'test-project'
      });
      await page.waitForTimeout(500);
      
      await FormHelpers.fillNetworkConfig(page, {
        vpc_cidr: '10.0.0.0/22',
        availability_zones: ['us-central1-a'],
        enable_private_link: false
      });
      
      await page.waitForTimeout(2000);
      const subnets1 = await FormHelpers.getSubnetPreview(page);
      const count1 = subnets1 ? subnets1.length : 0;
      expect(count1).toBeGreaterThan(0);
      
      // Enable Private Service Connect
      await page.locator('#enable_private_link').check();
      await page.waitForTimeout(2000);
      
      const subnets2 = await FormHelpers.getSubnetPreview(page);
      const count2 = subnets2 ? subnets2.length : 0;
      
      // Should have one more subnet (service subnet)
      expect(count2).toBe(count1 + 1);
    });
  });

  test.describe('Network Calculations', () => {
    test.beforeEach(async ({ page }) => {
      await FormHelpers.selectProvider(page, 'gcp');
      await FormHelpers.fillBasicConfig(page, {
        project_prefix: 'test',
        region: 'us-central1',
        pricing_tier: 'STANDARD',
        project_id: 'test-project'
      });
    });

    test('should calculate GCP-specific subnets (host and pods)', async ({ page }) => {
      await FormHelpers.fillNetworkConfig(page, {
        vpc_cidr: '10.0.0.0/20',
        availability_zones: ['us-central1-a', 'us-central1-b']
      });
      
      await page.waitForTimeout(3000);
      
      const subnets = await FormHelpers.getSubnetPreview(page);
      expect(subnets).not.toBeNull();
      expect(subnets.length).toBeGreaterThan(0);
      
      // GCP should have host and pods subnets
      const hostSubnets = subnets.filter(s => s.type === 'host');
      const podsSubnets = subnets.filter(s => s.type === 'pods');
      
      expect(hostSubnets.length).toBeGreaterThanOrEqual(1);
      expect(podsSubnets.length).toBeGreaterThanOrEqual(1);
    });

    test('should display network utilization summary', async ({ page }) => {
      await FormHelpers.fillNetworkConfig(page, {
        vpc_cidr: '10.0.0.0/20',
        availability_zones: ['us-central1-a', 'us-central1-b']
      });
      
      await page.waitForTimeout(2000);
      
      const summary = await FormHelpers.getNetworkSummary(page);
      expect(summary).not.toBeNull();
      expect(summary.total_ips).toBeTruthy();
      expect(summary.used_ips).toBeTruthy();
      expect(summary.utilization_percent).toBeTruthy();
    });

    test('should calculate service subnet for Premium tier with Private Service Connect', async ({ page }) => {
      await FormHelpers.fillBasicConfig(page, {
        project_prefix: 'test',
        region: 'us-central1',
        pricing_tier: 'PREMIUM',
        project_id: 'test-project'
      });
      await page.waitForTimeout(500);
      
      await FormHelpers.fillNetworkConfig(page, {
        vpc_cidr: '10.0.0.0/20',
        availability_zones: ['us-central1-a'],
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

  test.describe('GCP-Specific Features', () => {
    test('should display Project ID field', async ({ page }) => {
      await FormHelpers.selectProvider(page, 'gcp');
      
      const projectIdField = page.locator('input[name="project_id"]');
      await expect(projectIdField).toBeVisible();
      const isRequired = await ValidationHelpers.isFieldRequired(page, 'project_id');
      expect(isRequired).toBeTruthy();
    });

    test('should only show Standard and Premium pricing tiers', async ({ page }) => {
      await FormHelpers.selectProvider(page, 'gcp');
      
      const pricingTierSelect = page.locator('select[name="pricing_tier"]');
      const options = await pricingTierSelect.locator('option').allTextContents();
      
      expect(options).toContain('Standard');
      expect(options).toContain('Premium');
      expect(options).not.toContain('Enterprise');
    });

    test('should display Private Service Connect label', async ({ page }) => {
      await FormHelpers.selectProvider(page, 'gcp');
      
      const privateLinkLabel = page.locator('label:has-text("Private Service Connect")');
      await expect(privateLinkLabel).toBeVisible();
    });

    test('should calculate host and pods subnets for GCP', async ({ page }) => {
      await FormHelpers.selectProvider(page, 'gcp');
      await FormHelpers.fillBasicConfig(page, {
        project_prefix: 'test',
        region: 'us-central1',
        pricing_tier: 'STANDARD',
        project_id: 'test-project'
      });
      await page.waitForTimeout(500);
      
      await FormHelpers.fillNetworkConfig(page, {
        vpc_cidr: '10.0.0.0/20',
        availability_zones: ['us-central1-a']
      });
      
      await page.waitForTimeout(3000);
      
      const subnets = await FormHelpers.getSubnetPreview(page);
      expect(subnets).not.toBeNull();
      expect(subnets.length).toBeGreaterThan(0);
      const hostSubnet = subnets.find(s => s.type === 'host');
      const podsSubnet = subnets.find(s => s.type === 'pods');
      
      expect(hostSubnet).toBeDefined();
      expect(podsSubnet).toBeDefined();
    });
  });

  test.describe('Navigation', () => {
    test('should navigate back from configure to provider selection', async ({ page }) => {
      await FormHelpers.selectProvider(page, 'gcp');
      await expect(page).toHaveURL(/.*#\/configure/);
      
      await NavigationHelpers.navigateBack(page);
      await expect(page).toHaveURL(/.*#\/select-provider/);
    });

    test('should persist data when navigating between steps', async ({ page }) => {
      await FormHelpers.selectProvider(page, 'gcp');
      await FormHelpers.fillBasicConfig(page, {
        project_prefix: 'persist-test',
        region: 'us-central1',
        pricing_tier: 'STANDARD',
        project_id: 'persist-project'
      });
      await page.waitForTimeout(500);
      
      // Submit form to save to localStorage (GCP requires at least 2 AZs)
      await FormHelpers.fillNetworkConfig(page, {
        vpc_cidr: '10.0.0.0/12',
        availability_zones: ['us-central1-a', 'us-central1-b']
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
      
      const projectId = await page.locator('input[name="project_id"]').inputValue();
      expect(projectId).toBe('persist-project');
    });
  });

  test.describe('Availability Zone Combobox Tests', () => {
    test.beforeEach(async ({ page }) => {
      await FormHelpers.selectProvider(page, 'gcp');
      await FormHelpers.fillBasicConfig(page, {
        project_prefix: 'test-gcp',
        region: 'us-central1',
        pricing_tier: 'PREMIUM',
        project_id: 'my-gcp-project'
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
      
      // Verify options contain GCP zone format - read from select element
      const optionText = await azSelect.locator('option').nth(1).textContent();
      expect(optionText).toMatch(/us-central1-[a-f]/);
    });

    test('should allow selecting and deselecting multiple availability zones', async ({ page }) => {
      // Clear any existing selections first
      await FormHelpers.selectAvailabilityZones(page, []);
      
      // Select 2 zones using helper
      await FormHelpers.selectAvailabilityZones(page, ['us-central1-a', 'us-central1-b']);
      
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
      expect(selectedCount).toBe(2);
      
      // Deselect one zone
      await FormHelpers.selectAvailabilityZones(page, ['us-central1-a']);
      
      const afterDeselectCount = await page.evaluate(() => {
        const select = document.getElementById('availability-zones-select');
        if (!select) return 0;
        const choicesInstance = select.choicesInstance;
        if (choicesInstance && choicesInstance.getValue) {
          const values = choicesInstance.getValue(true);
          return Array.isArray(values) ? values.length : 0;
        }
        return Array.from(select.selectedOptions).length;
      });
      expect(afterDeselectCount).toBe(1);
    });

    test('should enforce minimum availability zones for GCP (2)', async ({ page }) => {
      // Select only 1 zone (below minimum of 2) using helper
      await FormHelpers.selectAvailabilityZones(page, ['us-central1-a']);
      
      // Try to submit - should fail validation
      await FormHelpers.submitConfigForm(page, true);
      await page.waitForTimeout(500);
      
      // Should show error about minimum availability zones
      const hasError = await ValidationHelpers.hasAvailabilityZoneError(page, 'availability zone');
      expect(hasError).toBeTruthy();
    });

    test('should update availability zone options when region changes', async ({ page }) => {
      // Get initial options from select element (even though hidden)
      const azSelect = page.locator('#availability-zones-select');
      const initialOptions = await azSelect.locator('option').allTextContents();
      expect(initialOptions.some(opt => opt.includes('us-central1'))).toBeTruthy();
      
      // Change region
      await page.selectOption('select[name="region"]', 'us-west1');
      await page.waitForTimeout(1000); // Wait for Choices.js to update
      
      // Verify options updated - read from select element
      const updatedOptions = await azSelect.locator('option').allTextContents();
      expect(updatedOptions.some(opt => opt.includes('us-west1'))).toBeTruthy();
      
      // Verify default zones for new region are auto-selected
      const tags = page.locator('.choices__list--multiple .choices__item');
      const tagCount = await tags.count();
      expect(tagCount).toBeGreaterThanOrEqual(2); // Default zones are auto-selected
    });

    test('should allow selecting multiple different availability zones', async ({ page }) => {
      // Select multiple different zones using helper
      await FormHelpers.selectAvailabilityZones(page, ['us-central1-a', 'us-central1-b', 'us-central1-c']);
      
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

    test('should enforce minimum availability zones for GCP (2) on submit', async ({ page }) => {
      // Select only 1 zone (below minimum) using helper
      await FormHelpers.selectAvailabilityZones(page, ['us-central1-a']);
      
      // Try to submit - should fail validation
      await FormHelpers.submitConfigForm(page, true);
      await page.waitForTimeout(500);
      
      const hasError = await ValidationHelpers.hasAvailabilityZoneError(page, 'availability zone');
      expect(hasError).toBeTruthy();
    });

    test('should enforce maximum availability zones for GCP (6)', async ({ page }) => {
      // Clear any existing selections first
      await FormHelpers.selectAvailabilityZones(page, []);
      await page.waitForTimeout(300);
      
      // Try to select 6 zones (maximum) using helper
      await FormHelpers.selectAvailabilityZones(page, ['us-central1-a', 'us-central1-b', 'us-central1-c', 'us-central1-d', 'us-central1-e', 'us-central1-f']);
      
      // Verify 6 zones are selected (maximum allowed)
      const tags = page.locator('.choices__list--multiple .choices__item');
      const tagCount = await tags.count();
      expect(tagCount).toBeLessThanOrEqual(6);
      
      // Verify we can select exactly 6 zones (should NOT fail validation)
      // Choices.js maxItemCount option limits selection to 6, preventing more
      expect(tagCount).toBe(6);
    });

    test('should only show valid availability zones for selected region', async ({ page }) => {
      const azSelect = page.locator('#availability-zones-select');
      const options = await azSelect.locator('option').allTextContents();
      
      // All options should be valid for us-central1
      const validOptions = options.filter(opt => opt !== 'Select one or more availability zones' && opt !== '');
      validOptions.forEach(opt => {
        expect(opt).toMatch(/^us-central1-[a-f]$/);
      });
      
      // Change region
      await page.selectOption('select[name="region"]', 'us-west1');
      await page.waitForTimeout(500);
      
      // Verify options updated to us-west1
      const updatedOptions = await azSelect.locator('option').allTextContents();
      const validUpdatedOptions = updatedOptions.filter(opt => opt !== 'Select one or more availability zones' && opt !== '');
      validUpdatedOptions.forEach(opt => {
        expect(opt).toMatch(/^us-west1-[a-f]$/);
      });
    });
  });
});

