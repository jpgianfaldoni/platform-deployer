/**
 * Validators for form fields and configuration
 * Uses centralized CIDRUtils for network calculations
 */

class Validators {
  /**
   * Validate CIDR notation format
   * Uses centralized CIDRUtils for validation
   */
  static validateCIDR(cidr, minPrefix = null, maxPrefix = null) {
    if (!cidr) return { valid: true, message: '' };
    
    try {
      const [ip, prefix] = cidr.split('/');
      if (!ip || !prefix) {
        return { valid: false, message: 'Invalid CIDR format (e.g., 10.0.0.0/16)' };
      }
      
      const parts = ip.split('.').map(Number);
      if (parts.length !== 4 || parts.some(p => p < 0 || p > 255)) {
        return { valid: false, message: 'Invalid IP address format' };
      }
      
      const prefixLen = parseInt(prefix, 10);
      if (isNaN(prefixLen) || prefixLen < 0 || prefixLen > 32) {
        return { valid: false, message: 'Prefix length must be between 0 and 32' };
      }
      
      if (minPrefix !== null && maxPrefix !== null && (prefixLen < minPrefix || prefixLen > maxPrefix)) {
        return { valid: false, message: `Network prefix must be between /${minPrefix} and /${maxPrefix}` };
      }
      
      if (minPrefix !== null && prefixLen < minPrefix) {
        return { valid: false, message: `Network prefix must be at least /${minPrefix}` };
      }
      
      if (maxPrefix !== null && prefixLen > maxPrefix) {
        return { valid: false, message: `Network prefix cannot exceed /${maxPrefix}` };
      }
      
      // Validate network address using centralized utility
      if (!CIDRUtils.validateCIDR(cidr)) {
        return { valid: false, message: 'Invalid network address (must be network address, not host address)' };
      }
      
      return { valid: true, message: '' };
    } catch {
      return { valid: false, message: 'Invalid CIDR notation format' };
    }
  }

  /**
   * Convert IP to integer (delegates to CIDRUtils)
   */
  static ipToInt(ip) {
    return CIDRUtils.ipToInt(ip);
  }

  /**
   * Validate project name
   */
  static validateProjectName(name, minLength = 2, maxLength = 20) {
    if (!name) {
      return { valid: false, message: 'Project name is required' };
    }
    
    const trimmed = name.trim();
    
    if (trimmed.length < minLength || trimmed.length > maxLength) {
      return { 
        valid: false, 
        message: `Name must be between ${minLength} and ${maxLength} characters` 
      };
    }
    
    if (!/^[a-zA-Z0-9][a-zA-Z0-9_-]*[a-zA-Z0-9]$/.test(trimmed)) {
      return { 
        valid: false, 
        message: 'Name must contain only letters, numbers, hyphens, and underscores' 
      };
    }
    
    return { valid: true, message: '' };
  }

  /**
   * Validate region format based on provider
   */
  static validateRegion(region, provider) {
    if (!region) {
      return { valid: false, message: 'Region is required' };
    }
    
    const patterns = {
      aws: /^[a-z]{2}-[a-z]+-\d+$/,  // e.g., us-east-1
      azure: /^[a-z]+[a-z0-9]*$/,    // e.g., eastus
      gcp: /^[a-z]+-[a-z]+\d+$/      // e.g., us-central1
    };
    
    const pattern = patterns[provider?.toLowerCase()];
    if (pattern && !pattern.test(region)) {
      return { valid: false, message: `Invalid ${provider.toUpperCase()} region format` };
    }
    
    return { valid: true, message: '' };
  }

  /**
   * Validate pricing tier for provider
   */
  static validatePricingTier(tier, provider) {
    if (!tier) {
      return { valid: false, message: 'Pricing tier is required' };
    }
    
    const validTiers = {
      aws: ['STANDARD', 'PREMIUM', 'ENTERPRISE'],
      azure: ['STANDARD', 'PREMIUM'],
      gcp: ['STANDARD', 'PREMIUM']
    };
    
    const tiers = validTiers[provider?.toLowerCase()];
    if (tiers && !tiers.includes(tier)) {
      return { 
        valid: false, 
        message: `Invalid pricing tier. Valid options: ${tiers.join(', ')}` 
      };
    }
    
    return { valid: true, message: '' };
  }

  /**
   * Validate pricing tier features
   */
  static validatePricingTierFeatures(config) {
    const errors = {};
    const { provider, pricing_tier, enable_private_link } = config;
    
    if (enable_private_link) {
      if (provider === 'aws' && pricing_tier !== 'ENTERPRISE') {
        errors.enable_private_link = 'AWS PrivateLink requires Enterprise pricing tier. Please upgrade to Enterprise tier.';
      } else if ((provider === 'azure' || provider === 'gcp') && pricing_tier !== 'PREMIUM') {
        const serviceName = provider === 'azure' ? 'Private Link' : 'Private Service Connect';
        errors.enable_private_link = `${serviceName} requires Premium pricing tier`;
      }
    }
    
    return errors;
  }

  /**
   * Validate availability zones
   */
  static validateAvailabilityZones(zones, provider, region, minZones = 1, maxZones = 3) {
    if (!zones || zones.length === 0) {
      return { valid: false, message: 'At least one availability zone is required' };
    }
    
    if (zones.length < minZones) {
      return { valid: false, message: `At least ${minZones} availability zone(s) required` };
    }
    
    if (zones.length > maxZones) {
      return { valid: false, message: `Maximum ${maxZones} availability zones allowed` };
    }
    
    // Basic format validation
    for (const zone of zones) {
      if (provider === 'aws' && region && !zone.startsWith(region)) {
        return { valid: false, message: `AWS availability zone must start with region '${region}'` };
      } else if (provider === 'gcp' && region && !zone.startsWith(region)) {
        return { valid: false, message: `GCP availability zone must start with region '${region}'` };
      } else if (provider === 'azure' && !/^\d+$/.test(zone)) {
        return { valid: false, message: 'Azure availability zones must be numeric (1, 2, 3)' };
      }
    }
    
    return { valid: true, message: '' };
  }

  /**
   * Validate JSON tags
   */
  static validateTags(tagsJson) {
    if (!tagsJson || tagsJson.trim() === '') {
      return { valid: true, message: '', parsed: {} };
    }
    
    try {
      const parsed = JSON.parse(tagsJson);
      if (typeof parsed !== 'object' || Array.isArray(parsed)) {
        return { valid: false, message: 'Tags must be a JSON object', parsed: null };
      }
      return { valid: true, message: '', parsed };
    } catch (e) {
      return { valid: false, message: 'Invalid JSON format for tags', parsed: null };
    }
  }

  /**
   * Validate entire configuration
   */
  static validateConfiguration(config) {
    const errors = {};
    
    // Basic fields
    const projectNameCheck = this.validateProjectName(config.project_prefix);
    if (!projectNameCheck.valid) {
      errors.project_prefix = projectNameCheck.message;
    }
    
    const regionCheck = this.validateRegion(config.region, config.provider);
    if (!regionCheck.valid) {
      errors.region = regionCheck.message;
    }
    
    const tierCheck = this.validatePricingTier(config.pricing_tier, config.provider);
    if (!tierCheck.valid) {
      errors.pricing_tier = tierCheck.message;
    }
    
    // Network
    const cidrCheck = this.validateCIDR(config.vpc_cidr, 8, 24);
    if (!cidrCheck.valid) {
      errors.vpc_cidr = cidrCheck.message;
    }
    
    // Availability zones
    if (config.availability_zones) {
      const azCheck = this.validateAvailabilityZones(
        config.availability_zones, 
        config.provider, 
        config.region
      );
      if (!azCheck.valid) {
        errors.availability_zones = azCheck.message;
      }
    }
    
    // Provider-specific
    if (config.provider === 'azure' && !config.resource_group_name) {
      errors.resource_group_name = 'Resource group name is required for Azure';
    }
    
    if (config.provider === 'gcp' && !config.project_id) {
      errors.project_id = 'GCP Project ID is required';
    }
    
    // Pricing tier features
    const featureErrors = this.validatePricingTierFeatures(config);
    Object.assign(errors, featureErrors);
    
    // Tags
    if (config.tags) {
      const tagsCheck = this.validateTags(config.tags);
      if (!tagsCheck.valid) {
        errors.tags = tagsCheck.message;
      }
    }
    
    return {
      valid: Object.keys(errors).length === 0,
      errors
    };
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Validators;
}

