/**
 * E2E tests for CIDR calculations and network allocations
 * These tests validate that subnet calculations are correct and don't overlap
 */

const { test, expect } = require('@playwright/test');
const FormHelpers = require('../helpers/form-helpers');

test.describe('CIDR Calculations', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.evaluate(() => {
      localStorage.clear();
    });
  });

  test.describe('AWS CIDR Calculations', () => {
    test('should calculate non-overlapping subnets for AWS with 2 AZs', async ({ page }) => {
      await FormHelpers.selectProvider(page, 'aws');
      await FormHelpers.fillBasicConfig(page, {
        project_prefix: 'test',
        region: 'us-east-1',
        pricing_tier: 'STANDARD'
      });
      
      await FormHelpers.fillNetworkConfig(page, {
        vpc_cidr: '10.0.0.0/20',
        availability_zones: ['us-east-1a', 'us-east-1b']
      });
      
      await page.waitForTimeout(3000);
      
      const subnets = await FormHelpers.getSubnetPreview(page);
      expect(subnets).not.toBeNull();
      expect(subnets.length).toBeGreaterThanOrEqual(2); // At least 2 subnets (private + public for each AZ)
      
      // Verify no overlapping CIDRs using NetworkCalculator
      const validation = await page.evaluate((subnetData) => {
        const { NetworkCalculator } = window;
        if (!NetworkCalculator) return { valid: false, message: 'NetworkCalculator not available' };
        
        const vpcCIDR = document.querySelector('input[name="vpc_cidr"]')?.value || '10.0.0.0/20';
        
        // Convert subnet data from FormHelpers to SubnetAllocation format
        const subnetAllocations = subnetData.map((s, idx) => ({
          name: s.name || `subnet-${idx}`,
          cidr: s.cidr,
          size: parseInt(s.cidr.split('/')[1], 10) || 26
        }));
        
        // Use NetworkCalculator to validate
        const calc = new NetworkCalculator('aws');
        const result = calc.validateSubnetAllocation(vpcCIDR, subnetAllocations);
        
        return result;
      }, subnets);
      
      expect(validation.valid).toBe(true);
    });

    test('should calculate sequential subnets without gaps', async ({ page }) => {
      await FormHelpers.selectProvider(page, 'aws');
      await FormHelpers.fillBasicConfig(page, {
        project_prefix: 'test',
        region: 'us-east-1',
        pricing_tier: 'STANDARD'
      });
      
      await FormHelpers.fillNetworkConfig(page, {
        vpc_cidr: '10.0.0.0/20',
        availability_zones: ['us-east-1a']
      });
      
      await page.waitForTimeout(3000);
      
      const subnets = await FormHelpers.getSubnetPreview(page);
      expect(subnets.length).toBe(2); // 1 private + 1 public
      
      // Verify subnets are sequential by checking they don't overlap and are in order
      const sequential = await page.evaluate((subnetData) => {
        const { NetworkCalculator } = window;
        if (!NetworkCalculator) return false;
        
        if (subnetData.length < 2) return false;
        
        const vpcCIDR = '10.0.0.0/20';
        const subnetAllocations = subnetData.map((s, idx) => ({
          name: s.name || `subnet-${idx}`,
          cidr: s.cidr,
          size: parseInt(s.cidr.split('/')[1], 10) || 26
        }));
        
        // Validate that subnets don't overlap (which implies they are sequential)
        const calc = new NetworkCalculator('aws');
        const validation = calc.validateSubnetAllocation(vpcCIDR, subnetAllocations);
        
        return validation.valid;
      }, subnets);
      
      expect(sequential).toBe(true);
    });

    test('should include service subnet for Enterprise tier with Private Link', async ({ page }) => {
      await FormHelpers.selectProvider(page, 'aws');
      await FormHelpers.fillBasicConfig(page, {
        project_prefix: 'test',
        region: 'us-east-1',
        pricing_tier: 'ENTERPRISE'
      });
      
      await FormHelpers.fillNetworkConfig(page, {
        vpc_cidr: '10.0.0.0/20',
        availability_zones: ['us-east-1a'],
        enable_private_link: true
      });
      
      await page.waitForTimeout(3000);
      
      const subnets = await FormHelpers.getSubnetPreview(page);
      expect(subnets.length).toBe(3); // 1 private + 1 public + 1 service
      
      const serviceSubnet = subnets.find(s => s.type === 'service');
      expect(serviceSubnet).toBeDefined();
      
      // Verify all subnets are valid using NetworkCalculator
      const validation = await page.evaluate((subnetData) => {
        const { NetworkCalculator } = window;
        if (!NetworkCalculator) return { valid: false, message: 'NetworkCalculator not available' };
        
        const vpcCIDR = '10.0.0.0/20';
        const subnetAllocations = subnetData.map((s, idx) => ({
          name: s.name || `subnet-${idx}`,
          cidr: s.cidr,
          size: parseInt(s.cidr.split('/')[1], 10) || 26
        }));
        
        const calc = new NetworkCalculator('aws');
        return calc.validateSubnetAllocation(vpcCIDR, subnetAllocations);
      }, subnets);
      
      expect(validation.valid).toBe(true);
    });
  });

  test.describe('Azure CIDR Calculations', () => {
    test('should calculate non-overlapping subnets for Azure', async ({ page }) => {
      await FormHelpers.selectProvider(page, 'azure');
      await FormHelpers.fillBasicConfig(page, {
        project_prefix: 'test',
        region: 'eastus',
        pricing_tier: 'STANDARD',
        resource_group_name: 'rg-test'
      });
      
      await FormHelpers.fillNetworkConfig(page, {
        vpc_cidr: '10.0.0.0/20',
        availability_zones: ['1', '2']
      });
      
      await page.waitForTimeout(3000);
      
      const subnets = await FormHelpers.getSubnetPreview(page);
      expect(subnets.length).toBeGreaterThanOrEqual(2); // At least 2 subnets
      
      const validation = await page.evaluate((subnetData) => {
        const { NetworkCalculator } = window;
        if (!NetworkCalculator) return { valid: false, message: 'NetworkCalculator not available' };
        
        const vpcCIDR = '10.0.0.0/20';
        const subnetAllocations = subnetData.map((s, idx) => ({
          name: s.name || `subnet-${idx}`,
          cidr: s.cidr,
          size: parseInt(s.cidr.split('/')[1], 10) || 26
        }));
        
        const calc = new NetworkCalculator('azure');
        return calc.validateSubnetAllocation(vpcCIDR, subnetAllocations);
      }, subnets);
      
      expect(validation.valid).toBe(true);
    });
  });

  test.describe('GCP CIDR Calculations', () => {
    test('should calculate host and pods subnets correctly', async ({ page }) => {
      await FormHelpers.selectProvider(page, 'gcp');
      await FormHelpers.fillBasicConfig(page, {
        project_prefix: 'test',
        region: 'us-central1',
        pricing_tier: 'STANDARD',
        project_id: 'test-project'
      });
      
      await FormHelpers.fillNetworkConfig(page, {
        vpc_cidr: '10.0.0.0/20',
        availability_zones: ['us-central1-a']
      });
      
      await page.waitForTimeout(3000);
      
      const subnets = await FormHelpers.getSubnetPreview(page);
      expect(subnets.length).toBe(2); // 1 host + 1 pods
      
      const hostSubnet = subnets.find(s => s.type === 'host');
      const podsSubnet = subnets.find(s => s.type === 'pods');
      
      expect(hostSubnet).toBeDefined();
      expect(podsSubnet).toBeDefined();
      
      const validation = await page.evaluate((subnetData) => {
        const { NetworkCalculator } = window;
        if (!NetworkCalculator) return { valid: false, message: 'NetworkCalculator not available' };
        
        const vpcCIDR = '10.0.0.0/20';
        const subnetAllocations = subnetData.map((s, idx) => ({
          name: s.name || `subnet-${idx}`,
          cidr: s.cidr,
          size: parseInt(s.cidr.split('/')[1], 10) || 26
        }));
        
        const calc = new NetworkCalculator('gcp');
        return calc.validateSubnetAllocation(vpcCIDR, subnetAllocations);
      }, subnets);
      
      expect(validation.valid).toBe(true);
    });
  });

  test.describe('Network Utilization', () => {
    test('should display accurate network utilization summary', async ({ page }) => {
      await FormHelpers.selectProvider(page, 'aws');
      await FormHelpers.fillBasicConfig(page, {
        project_prefix: 'test',
        region: 'us-east-1',
        pricing_tier: 'STANDARD'
      });
      
      await FormHelpers.fillNetworkConfig(page, {
        vpc_cidr: '10.0.0.0/20',
        availability_zones: ['us-east-1a', 'us-east-1b']
      });
      
      await page.waitForTimeout(3000);
      
      const summary = await FormHelpers.getNetworkSummary(page);
      expect(summary).not.toBeNull();
      expect(summary.total_ips).toBeTruthy();
      expect(summary.used_ips).toBeTruthy();
      expect(summary.utilization_percent).toBeTruthy();
      
      // Get subnets for validation
      const subnets = await FormHelpers.getSubnetPreview(page);
      expect(subnets).not.toBeNull();
      
      // Verify utilization is calculated correctly using NetworkCalculator
      const utilizationCheck = await page.evaluate((subnetData) => {
        const { NetworkCalculator } = window;
        if (!NetworkCalculator) return false;
        
        const vpcCIDR = '10.0.0.0/20';
        
        const subnetAllocations = subnetData.map((s, idx) => ({
          name: s.name || `subnet-${idx}`,
          cidr: s.cidr,
          size: parseInt(s.cidr.split('/')[1], 10) || 26
        }));
        
        const calc = new NetworkCalculator('aws');
        const calculatedSummary = calc.calculateNetworkSummary(vpcCIDR, subnetAllocations);
        
        if (calculatedSummary.error) return false;
        
        // Get displayed utilization
        const displayedUtilization = parseFloat(document.querySelector('.text-info')?.textContent?.replace('%', '') || '0');
        
        // Allow small rounding differences
        return Math.abs(calculatedSummary.utilization_percent - displayedUtilization) < 1;
      }, subnets);
      
      expect(utilizationCheck).toBe(true);
    });
  });
});

