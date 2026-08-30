const { test, expect } = require('@playwright/test');
const JSZip = require('jszip');

async function openAwsForm(page) {
  await page.goto('/');
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
  expect(Object.keys(zip.files)).toContain('LICENSE.md');
  const tfvars = await zip.file('tf/terraform.tfvars').async('string');
  expect(tfvars).toMatch(/^aws_account_id\s*= "123456789012"$/m);
  expect(tfvars).not.toMatch(/^network_configuration\s*=/m);
  expect(externalGithubRequests).toEqual([]);
});

test('switches to the fully private PrivateLink source and Enterprise tier', async ({ page }) => {
  const externalGithubRequests = [];
  page.on('request', request => { if (request.url().includes('github.com')) externalGithubRequests.push(request.url()); });
  await openAwsForm(page);
  await page.locator('#project_prefix').fill('private-workspace');
  await page.locator('#databricks_account_id').fill('12345678-1234-1234-1234-123456789012');
  await page.locator('#enable_private_link').check();
  await expect(page.locator('#network_configuration')).toBeVisible();
  await page.locator('#network_configuration').selectOption('fully_private');
  await expect(page.getByText('Fully private mode creates no NAT gateway')).toBeVisible();
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
  const tfvars = await zip.file('tf/terraform.tfvars').async('string');
  expect(tfvars).toMatch(/^network_configuration\s*= "fully_private"$/m);
  expect(tfvars).toMatch(/^endpoint_subnet_cidr\s*= "10\.0\.2\.0\/27"$/m);
  expect(tfvars).not.toMatch(/^aws_account_id\s*=/m);
  expect(externalGithubRequests).toEqual([]);
});
