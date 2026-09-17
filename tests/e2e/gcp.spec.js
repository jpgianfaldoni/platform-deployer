const fs = require('fs');
const JSZip = require('jszip');
const { test, expect } = require('../helpers/coverage-fixture');
const FormHelpers = require('../helpers/form-helpers');
const ValidationHelpers = require('../helpers/validation-helpers');

async function downloadTerraformProject(page) {
  const downloadPromise = page.waitForEvent('download', { timeout: 15000 });
  await FormHelpers.confirmAndGenerate(page);
  const download = await downloadPromise;
  const downloadPath = await download.path();
  const archive = await JSZip.loadAsync(await fs.promises.readFile(downloadPath));
  return { download, archive };
}

test.describe('GCP Provider Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.evaluate(() => localStorage.clear());
    await FormHelpers.selectProvider(page, 'gcp');
  });

  test('shows only inputs supported by the standalone BYOVPC source', async ({ page }) => {
    await expect(page.locator('label', { hasText: 'Workspace Name' }).first()).toBeVisible();
    await expect(page.locator('[name="project_prefix"]')).toBeVisible();
    await expect(page.locator('[name="project_id"]')).toBeVisible();
    await expect(page.locator('[name="google_service_account_email"]')).toBeVisible();
    await expect(page.locator('[name="databricks_account_id"]')).toBeVisible();
    await expect(page.locator('[name="databricks_admin_user"]')).toBeVisible();
    await expect(page.locator('[name="subnet_cidr"]')).toBeVisible();

    await expect(page.getByText('This deployment creates a new VPC', { exact: false })).toBeVisible();
    await expect(page.locator('[name="pricing_tier"]')).toHaveCount(0);
    await expect(page.locator('#create_new_vpc')).toHaveCount(0);
    await expect(page.locator('#availability-zones-select')).toHaveCount(0);
    await expect(page.locator('#enable_private_link')).toHaveCount(0);
    await expect(page.locator('#nat_gateway_mode')).toHaveCount(0);
    await expect(page.locator('#subnets-preview')).toHaveCount(0);
  });

  test('validates the GCP source-specific inputs', async ({ page }) => {
    await FormHelpers.fillGcpConfig(page, {
      google_service_account_email: 'not-a-service-account@example.com',
      databricks_account_id: 'account-id',
      databricks_admin_user: 'admin@example.com',
      subnet_cidr: '10.10.0.1/20'
    });

    await FormHelpers.submitConfigForm(page, true);
    await expect(page).toHaveURL(/.*#\/configure/);
    expect(await ValidationHelpers.hasFieldValidationError(page, 'google_service_account_email')).toBeTruthy();
    await expect(page.locator('[name="databricks_account_id"]')).toHaveAttribute('required', '');
    expect(await ValidationHelpers.hasFieldValidationError(page, 'subnet_cidr', 'network address')).toBeTruthy();
  });

  test('summarizes the fixed GCP topology and required identities', async ({ page }) => {
    await FormHelpers.fillGcpConfig(page, {
      project_prefix: 'gcp-summary',
      project_id: 'gcp-summary-project',
      google_service_account_email: 'creator@gcp-summary-project.iam.gserviceaccount.com',
      databricks_account_id: '22222222-2222-4222-8222-222222222222',
      databricks_admin_user: 'workspace-admin@example.com',
      subnet_cidr: '10.20.0.0/20'
    });
    await FormHelpers.submitConfigForm(page);

    await expect(page).toHaveURL(/.*#\/summary/);
    await expect(page.getByText('gcp-summary', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('gcp-summary-project', { exact: true })).toBeVisible();
    await expect(page.getByText('creator@gcp-summary-project.iam.gserviceaccount.com', { exact: true })).toBeVisible();
    await expect(page.getByText('workspace-admin@example.com', { exact: true })).toBeVisible();
    await expect(page.getByText('10.20.0.0/20', { exact: true })).toBeVisible();
    await expect(page.getByText('Created', { exact: true })).toBeVisible();
    await expect(page.getByText('Pricing Tier:', { exact: true })).toHaveCount(0);
  });

  test('downloads the generated GCP Terraform project', async ({ page }) => {
    await FormHelpers.fillGcpConfig(page, {
      project_prefix: 'gcp-download',
      region: 'us-east1',
      project_id: 'gcp-download-project',
      google_service_account_email: 'creator@gcp-download-project.iam.gserviceaccount.com',
      databricks_account_id: '33333333-3333-4333-8333-333333333333',
      databricks_admin_user: 'admin+gcp@example.com',
      subnet_cidr: '10.30.0.0/20'
    });
    await FormHelpers.submitConfigForm(page);

    const { download, archive } = await downloadTerraformProject(page);
    expect(download.suggestedFilename()).toBe('gcp-download-gcp-terraform.zip');
    expect(Object.keys(archive.files)).toEqual(expect.arrayContaining([
      'databricks.tf',
      'network.tf',
      'outputs.tf',
      'providers.tf',
      'variables.tf',
      'versions.tf',
      'terraform.tfvars',
      'README.md',
      'LICENSE.md',
      'NOTICE.md'
    ]));
    expect(archive.file('main.tf')).toBeNull();
    expect(archive.file('modules/')).toBeNull();

    const tfvars = await archive.file('terraform.tfvars').async('string');
    expect(tfvars).toContain('google_service_account_email = "creator@gcp-download-project.iam.gserviceaccount.com"');
    expect(tfvars).toContain('google_project_name          = "gcp-download-project"');
    expect(tfvars).toContain('google_region                = "us-east1"');
    expect(tfvars).toContain('databricks_account_id     = "33333333-3333-4333-8333-333333333333"');
    expect(tfvars).toContain('databricks_workspace_name = "gcp-download"');
    expect(tfvars).toContain('databricks_admin_user     = "admin+gcp@example.com"');
    expect(tfvars).toContain('subnet_cidr = "10.30.0.0/20"');
    expect(tfvars).not.toContain('pricing_tier');
    expect(tfvars).not.toContain('private_service_connect');

    const networkTf = await archive.file('network.tf').async('string');
    expect(networkTf).toContain('resource "google_compute_network" "databricks_vpc"');
    expect(networkTf).toContain('resource "google_compute_router_nat" "databricks_nat"');
    const databricksTf = await archive.file('databricks.tf').async('string');
    expect(databricksTf).toContain('resource "databricks_mws_workspaces" "databricks_workspace"');
    expect(databricksTf).not.toContain('unity_catalog');

    const readme = await archive.file('README.md').async('string');
    expect(readme).toContain('GOOGLE_OAUTH_ACCESS_TOKEN');
    expect(readme).toContain('does not configure Private Service Connect or Unity Catalog');
  });
});
