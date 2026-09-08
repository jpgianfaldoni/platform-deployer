const { test, expect } = require('@playwright/test');
const JSZip = require('jszip');

async function openAwsForm(page) {
  await page.goto('/');
  await expect(page.getByText('One-Click Deployer simplifies Databricks infrastructure deployment across AWS, Azure, and GCP.')).toBeVisible();
  await page.getByRole('link', { name: 'Get Started' }).click();
  await expect(page.locator('[data-provider="azure"]')).toContainText('Coming Soon');
  await page.getByRole('button', { name: 'Continue with AWS' }).click();
}

async function fillIdentity(page) {
  await page.locator('#project_prefix').fill('e2e-workspace');
  await page.locator('#databricks_account_id').fill('12345678-1234-1234-1234-123456789012');
  await page.locator('#aws_account_id').fill('123456789012');
}

test('generates the non-PrivateLink ZIP from same-origin vendored files', async ({ page }) => {
  const externalGithubRequests = [];
  page.on('request', request => { if (request.url().includes('github.com')) externalGithubRequests.push(request.url()); });
  await openAwsForm(page);
  await expect(page.locator('#create_new_vpc')).toBeChecked();
  await expect(page.locator('#nat_gateway_mode')).toHaveValue('single');
  await page.locator('#nat_gateway_mode').selectOption('per_az');
  await expect(page.locator('.choices__list--multiple .choices__item')).toHaveCount(2);
  await expect(page.locator('#subnet-size-slider')).toHaveAttribute('min', '24');
  await expect(page.locator('#subnet-size-slider')).toHaveValue('24');
  await expect(page.getByText('Calculated Subnet Allocation')).toBeVisible();
  await expect(page.getByText('Network Utilization Summary')).toBeVisible();
  const zonePicker = page.locator('.choices');
  await zonePicker.locator('.choices__input--cloned').fill('us-west-2c');
  await zonePicker.locator('.choices__item--choice', { hasText: 'us-west-2c' }).click();
  await expect(page.locator('.choices__list--multiple .choices__item')).toHaveCount(3);
  await expect(page.locator('.subnet-card')).toHaveCount(7);
  await fillIdentity(page);
  await page.getByRole('button', { name: 'Review Configuration' }).click();
  await expect(page).toHaveURL(/#\/summary$/);

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Generate Terraform ZIP' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('e2e-workspace-aws-standard-terraform.zip');
  const zip = await JSZip.loadAsync(await require('fs').promises.readFile(await download.path()));
  expect(Object.keys(zip.files)).toContain('tf/network.tf');
  expect(Object.keys(zip.files)).not.toContain('tf/privatelink.tf');
  expect(Object.keys(zip.files)).not.toContain('LICENSE.md');
  expect(Object.keys(zip.files)).not.toContain('NOTICE.md');
  expect(Object.keys(zip.files)).not.toContain('SOURCE_MANIFEST.json');
  const tfvars = await zip.file('tf/terraform.tfvars').async('string');
  expect(tfvars).toMatch(/^aws_account_id\s*= "123456789012"$/m);
  expect(tfvars).toMatch(/^nat_gateway_mode\s*= "per_az"$/m);
  expect(tfvars).not.toMatch(/^network_configuration\s*=/m);
  expect(externalGithubRequests).toEqual([]);
});

test('requires PrivateLink for no NAT and generates the fully private source', async ({ page }) => {
  const externalGithubRequests = [];
  page.on('request', request => { if (request.url().includes('github.com')) externalGithubRequests.push(request.url()); });
  await openAwsForm(page);
  await page.locator('#project_prefix').fill('private-workspace');
  await page.locator('#databricks_account_id').fill('12345678-1234-1234-1234-123456789012');
  await page.locator('#nat_gateway_mode').selectOption('none');
  await expect(page.getByText('Backend PrivateLink is required.', { exact: false }).first()).toBeVisible();
  await expect(page.getByRole('button', { name: 'Review Configuration' })).toBeDisabled();
  await page.locator('#enable_private_link').check();
  await expect(page.locator('#nat_gateway_mode')).toHaveValue('none');
  await expect(page.getByText('Backend PrivateLink provides the required control-plane communication.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Review Configuration' })).toBeEnabled();
  await expect(page.getByText('The ZIP will contain aws-byovpc-classic-privatelink.')).toHaveCount(0);
  await page.getByRole('button', { name: 'Review Configuration' }).click();
  await expect(page.getByText('fully_private', { exact: true })).toBeVisible();
  await expect(page.getByText('ENTERPRISE', { exact: true })).toBeVisible();

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Generate Terraform ZIP' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('private-workspace-aws-privatelink-terraform.zip');
  const zip = await JSZip.loadAsync(await require('fs').promises.readFile(await download.path()));
  expect(Object.keys(zip.files)).toContain('tf/privatelink.tf');
  expect(Object.keys(zip.files)).toContain('tf/endpoints.tf');
  expect(Object.keys(zip.files)).not.toContain('tf/cluster.tf');
  expect(Object.keys(zip.files)).not.toContain('LICENSE.md');
  expect(Object.keys(zip.files)).not.toContain('NOTICE.md');
  expect(Object.keys(zip.files)).not.toContain('SOURCE_MANIFEST.json');
  const tfvars = await zip.file('tf/terraform.tfvars').async('string');
  expect(tfvars).toMatch(/^network_configuration\s*= "fully_private"$/m);
  expect(tfvars).toMatch(/^nat_gateway_mode\s*= "single"$/m);
  expect(tfvars).toMatch(/^endpoint_subnet_cidr\s*= "10\.0\.2\.0\/27"$/m);
  expect(tfvars).not.toMatch(/^aws_account_id\s*=/m);
  expect(externalGithubRequests).toEqual([]);
});

test('uses existing VPC and subnet IDs without advanced configuration', async ({ page }) => {
  await openAwsForm(page);
  await expect(page.locator('#advanced-accordion')).toHaveCount(0);
  await page.locator('#create_new_vpc').uncheck();
  await expect(page.getByLabel('Existing VPC ID')).toBeVisible();
  await expect(page.getByLabel('Existing Subnet IDs')).toBeVisible();
  await expect(page.getByLabel('Workspace Security Group IDs')).toHaveCount(0);
  await expect(page.getByText('The non-PrivateLink source does not create AWS service endpoints')).toHaveCount(0);
  await expect(page.locator('#nat_gateway_mode')).toHaveCount(0);
  await expect(page.locator('#vpc_cidr_range')).toHaveCount(0);

  await fillIdentity(page);
  await page.getByLabel('Existing VPC ID').fill('vpc-0123abcd');
  await page.getByLabel('Existing Subnet IDs').fill('subnet-1111aaaa\nsubnet-2222bbbb');
  await page.getByRole('button', { name: 'Review Configuration' }).click();
  await expect(page).toHaveURL(/#\/summary$/);

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Generate Terraform ZIP' }).click();
  const download = await downloadPromise;
  const zip = await JSZip.loadAsync(await require('fs').promises.readFile(await download.path()));
  const tfvars = await zip.file('tf/terraform.tfvars').async('string');
  expect(tfvars).toMatch(/^vpc_id\s*= "vpc-0123abcd"$/m);
  expect(tfvars).toMatch(/^subnet_ids\s*= \["subnet-1111aaaa", "subnet-2222bbbb"\]$/m);
  expect(tfvars).toMatch(/^new_security_group_name\s*= "e2e-workspace-databricks-sg"$/m);
  expect(tfvars).toMatch(/^new_catalog\s*= false$/m);
  expect(tfvars).toMatch(/^new_cluster\s*= false$/m);
});
