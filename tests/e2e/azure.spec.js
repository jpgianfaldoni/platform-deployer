const fs = require('fs');
const JSZip = require('jszip');
const { test, expect } = require('../helpers/coverage-fixture');
const FormHelpers = require('../helpers/form-helpers');
const ValidationHelpers = require('../helpers/validation-helpers');

const EXISTING_VNET_ID = '/subscriptions/11111111-1111-4111-8111-111111111111/resourceGroups/rg-existing-network/providers/Microsoft.Network/virtualNetworks/existing-vnet';

async function enablePrivateLink(page, resourceGroupMode = 'new') {
  await FormHelpers.fillNetworkConfig(page, { enable_private_link: true });
  await page.locator('#azure_resource_group_mode').selectOption(resourceGroupMode);
  if (resourceGroupMode === 'existing') {
    await page.locator('[name="azure_existing_resource_group_name"]').fill('rg-existing-data-plane');
  }
}

async function downloadTerraformProject(page) {
  const downloadPromise = page.waitForEvent('download', { timeout: 15000 });
  await FormHelpers.confirmAndGenerate(page);
  const download = await downloadPromise;
  const downloadPath = await download.path();
  const archive = await JSZip.loadAsync(await fs.promises.readFile(downloadPath));
  return { download, archive };
}

test.describe('Azure Provider Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.evaluate(() => localStorage.clear());
    await FormHelpers.selectProvider(page, 'azure');
  });

  test('completes the standard Azure flow with a new VNet', async ({ page }) => {
    await FormHelpers.fillAzureConfig(page, {
      project_prefix: 'azure-standard',
      resource_group_name: 'rg-azure-workspace',
      azure_vnet_resource_group_name: 'rg-azure-network'
    });
    await FormHelpers.fillNetworkConfig(page, {
      create_new_vpc: true,
      vpc_cidr: '10.16.0.0/20',
      enable_private_link: false
    });

    await expect(page.locator('#subnets-preview')).toBeVisible();
    const subnets = await FormHelpers.getSubnetPreview(page);
    expect(subnets).toHaveLength(2);
    expect(subnets.map(subnet => subnet.type).sort()).toEqual(['private', 'public']);

    await FormHelpers.submitConfigForm(page);
    await expect(page).toHaveURL(/.*#\/summary/);
    await expect(page.getByText('azure-standard', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('rg-azure-workspace', { exact: true })).toBeVisible();
    await expect(page.getByText('oneclick_catalog', { exact: true })).toBeVisible();
    await expect(page.getByText('PREMIUM', { exact: true })).toBeVisible();
  });

  test('completes the standard Azure flow with an existing VNet', async ({ page }) => {
    await FormHelpers.fillAzureConfig(page, {
      project_prefix: 'azure-existing',
      resource_group_name: 'rg-azure-workspace'
    });
    await FormHelpers.fillNetworkConfig(page, {
      create_new_vpc: false,
      existing_vpc_id: EXISTING_VNET_ID,
      vpc_cidr: '10.32.0.0/20'
    });

    await expect(page.locator('#existing-vpc-section')).toBeVisible();
    await expect(page.locator('[name="azure_vnet_resource_group_name"]')).not.toBeVisible();
    await expect(page.getByText('Terraform creates two delegated Databricks subnets', { exact: false })).toBeVisible();

    await FormHelpers.submitConfigForm(page);
    await expect(page).toHaveURL(/.*#\/summary/);
    await expect(page.getByText(EXISTING_VNET_ID, { exact: true })).toBeVisible();
    await expect(page.getByText('Use Existing', { exact: true })).toBeVisible();
  });

  test('switches to the Private Link source and enforces its topology', async ({ page }) => {
    await FormHelpers.fillAzureConfig(page, { project_prefix: 'azure-private' });
    await enablePrivateLink(page, 'existing');

    await expect(page.locator('#azure-standard-fields')).not.toBeVisible();
    await expect(page.locator('#azure-private-link-fields')).toBeVisible();
    await expect(page.locator('#metastore-configuration')).not.toBeVisible();
    await expect(page.locator('#create_new_vpc')).toBeChecked();
    await expect(page.locator('#create_new_vpc')).toBeDisabled();
    await expect(page.locator('#availability-zones-select')).toHaveCount(0);
    await expect(page.locator('#azure-nat-gateway-zone-section')).not.toBeVisible();
    await expect(page.locator('#nat-gateway-section')).toBeVisible();
    await expect(page.locator('#nat_gateway_mode')).toHaveValue('single');
    await expect(page.locator('#nat_gateway_mode option')).toHaveCount(2);
    await expect(page.locator('#azure-private-link-nat-gateway-zone-section')).toBeVisible();
    await expect(page.locator('#azure_private_link_nat_gateway_zone')).toHaveValue('');

    await page.locator('#nat_gateway_mode').selectOption('none');
    await expect(page.locator('#azure-private-link-nat-gateway-zone-section')).not.toBeVisible();
    await expect(page.locator('#nat-gateway-private-link-message')).toBeVisible();
    await page.locator('#nat_gateway_mode').selectOption('single');
    await expect(page.locator('#azure-private-link-nat-gateway-zone-section')).toBeVisible();

    const subnets = await FormHelpers.getSubnetPreview(page);
    expect(subnets).toHaveLength(3);
    expect(subnets.map(subnet => subnet.type).sort()).toEqual(['private', 'public', 'service']);

    await FormHelpers.submitConfigForm(page);
    await expect(page).toHaveURL(/.*#\/summary/);
    await expect(page.getByText('rg-existing-data-plane', { exact: true })).toBeVisible();
    await expect(page.getByText('Create New', { exact: true })).toBeVisible();
  });

  test('shows the supported Azure tier and NAT gateway placements', async ({ page }) => {
    const pricingValues = await page.locator('[name="pricing_tier"] option').evaluateAll(options =>
      options.map(option => option.value).filter(Boolean)
    );
    const natGatewayZoneValues = await page.locator('#azure_nat_gateway_zone option').evaluateAll(options =>
      options.map(option => option.value)
    );

    expect(pricingValues).toEqual(['PREMIUM']);
    await expect(page.locator('[name="pricing_tier"]')).toHaveValue('PREMIUM');
    await expect(page.locator('#availability-zones-select')).toHaveCount(0);
    await expect(page.locator('#azure-nat-gateway-zone-section')).toBeVisible();
    await expect(page.locator('#nat-gateway-section')).not.toBeVisible();
    await expect(page.locator('#azure_nat_gateway_zone')).toHaveValue('1');
    expect(natGatewayZoneValues).toEqual(['1', '2', '3', '']);
  });

  test('validates Azure source-specific required fields', async ({ page }) => {
    await FormHelpers.fillAzureConfig(page, {
      azure_subscription_id: '',
      azure_tenant_id: '',
      resource_group_name: '',
      azure_admin_user: '',
      azure_root_storage_name: '',
      azure_uc_storage_account_name: '',
      azure_catalog_name: '',
      azure_storage_credential_name: '',
      azure_external_location_name: '',
      azure_vnet_resource_group_name: ''
    });

    await FormHelpers.submitConfigForm(page, true);

    for (const fieldName of [
      'azure_subscription_id',
      'azure_tenant_id',
      'resource_group_name',
      'azure_admin_user',
      'azure_root_storage_name',
      'azure_uc_storage_account_name',
      'azure_catalog_name',
      'azure_storage_credential_name',
      'azure_external_location_name',
      'azure_vnet_resource_group_name'
    ]) {
      const validation = await ValidationHelpers.getFieldValidationMessage(page, fieldName);
      expect(validation.valueMissing, `${fieldName} should be required`).toBeTruthy();
    }
    await expect(page).toHaveURL(/.*#\/configure/);
  });

  test('validates VNet CIDR and existing VNet resource IDs', async ({ page }) => {
    await FormHelpers.fillAzureConfig(page);
    await page.locator('[name="vpc_cidr"]').fill('invalid-cidr');
    await FormHelpers.submitConfigForm(page, true);
    expect(await ValidationHelpers.hasFieldValidationError(page, 'vpc_cidr', 'CIDR')).toBeTruthy();

    await page.locator('[name="vpc_cidr"]').fill('10.0.0.0/20');
    await FormHelpers.fillNetworkConfig(page, {
      create_new_vpc: false,
      existing_vpc_id: 'not-an-azure-resource-id'
    });
    await FormHelpers.submitConfigForm(page, true);
    expect(await ValidationHelpers.hasFieldValidationError(page, 'existing_vpc_id', 'VNet Resource ID')).toBeTruthy();
  });

  test('downloads the standard upstream Terraform plus generated tfvars', async ({ page }) => {
    await FormHelpers.fillAzureConfig(page, {
      project_prefix: 'azure-download',
      resource_group_name: 'rg-download-workspace',
      azure_vnet_resource_group_name: 'rg-download-network'
    });
    await FormHelpers.fillNetworkConfig(page, {
      vpc_cidr: '10.48.0.0/20',
      azure_nat_gateway_zone: '2'
    });
    await FormHelpers.submitConfigForm(page);

    const { download, archive } = await downloadTerraformProject(page);
    expect(download.suggestedFilename()).toBe('azure-download-azure-terraform.zip');
    expect(Object.keys(archive.files)).toEqual(expect.arrayContaining([
      'azure.tf',
      'cluster.tf',
      'databricks.tf',
      'network.tf',
      'providers.tf',
      'unity_catalog.tf',
      'variables.tf',
      'versions.tf',
      'terraform.tfvars',
      'README.md'
    ]));

    const tfvars = await archive.file('terraform.tfvars').async('string');
    expect(tfvars).toContain('azure_subscription_id = "11111111-1111-4111-8111-111111111111"');
    expect(tfvars).toContain('resource_group_name   = "rg-download-workspace"');
    expect(tfvars).toContain('create_new_vnet          = true');
    expect(tfvars).toContain('nat_gateway_zones        = ["2"]');
    expect(tfvars).toContain('create_cluster = false');
    expect(tfvars).not.toContain('databricks_account_id =');

    const networkTf = await archive.file('network.tf').async('string');
    expect(networkTf).toContain('zones               = var.nat_gateway_zones');

    const unityCatalogTf = await archive.file('unity_catalog.tf').async('string');
    expect(unityCatalogTf).toContain('min_tls_version                   = "TLS1_2"');
    expect(unityCatalogTf).toContain('infrastructure_encryption_enabled = true');
  });

  test('downloads the Private Link upstream Terraform plus compatible tfvars', async ({ page }) => {
    await FormHelpers.fillAzureConfig(page, { project_prefix: 'azure-pl-download' });
    await enablePrivateLink(page, 'existing');
    await page.locator('#nat_gateway_mode').selectOption('single');
    await page.locator('#azure_private_link_nat_gateway_zone').selectOption('3');
    await FormHelpers.fillNetworkConfig(page, { vpc_cidr: '10.64.0.0/20' });
    await FormHelpers.submitConfigForm(page);

    const { archive } = await downloadTerraformProject(page);
    expect(Object.keys(archive.files)).toEqual(expect.arrayContaining([
      'dns_zones.tf',
      'ncc.tf',
      'pe_backend.tf',
      'pe_dbfs.tf',
      'service_endpoint_policy.tf',
      '.terraform.lock.hcl',
      'terraform.tfvars',
      'README.md'
    ]));
    expect(archive.file('unity_catalog.tf')).toBeNull();

    const tfvars = await archive.file('terraform.tfvars').async('string');
    expect(tfvars).toContain('az_subscription = "11111111-1111-4111-8111-111111111111"');
    expect(tfvars).toContain('create_data_plane_resource_group        = false');
    expect(tfvars).toContain('existing_data_plane_resource_group_name = "rg-existing-data-plane"');
    expect(tfvars).toContain('create_nat_gateway = true');
    expect(tfvars).toContain('nat_gateway_zones = ["3"]');
    expect(tfvars).toContain('service_endpoint_policy_storage_accounts = []');
    expect(tfvars).toContain('metastore_id = ""');
    expect(tfvars).not.toContain('\nprefix =');
    expect(tfvars).not.toContain('subnets_service_endpoints');
    expect(tfvars).toMatch(/subnet_workspace_cidrs\s+= \["[^"]+", "[^"]+"\]/);
    expect(tfvars).toMatch(/subnet_private_endpoint_cidr = "[^"]+"/);

    const networkTf = await archive.file('network.tf').async('string');
    expect(networkTf).toContain('count               = var.create_nat_gateway ? 1 : 0');
    expect(networkTf).toContain('zones = var.nat_gateway_zones');
  });

  test('downloads the Private Link topology without a NAT gateway', async ({ page }) => {
    await FormHelpers.fillAzureConfig(page, { project_prefix: 'azure-pl-no-nat' });
    await enablePrivateLink(page);
    await page.locator('#nat_gateway_mode').selectOption('none');
    await FormHelpers.fillNetworkConfig(page, { vpc_cidr: '10.80.0.0/20' });
    await FormHelpers.submitConfigForm(page);

    await expect(page.getByText('None', { exact: true })).toBeVisible();
    const { archive } = await downloadTerraformProject(page);
    const tfvars = await archive.file('terraform.tfvars').async('string');
    const readme = await archive.file('README.md').async('string');

    expect(tfvars).toContain('create_nat_gateway = false');
    expect(tfvars).toContain('nat_gateway_zones = []');
    expect(readme).toContain('classic cluster nodes have no general internet egress by default');
  });
});
