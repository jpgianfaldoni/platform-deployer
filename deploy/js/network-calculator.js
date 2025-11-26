/**
 * Network Calculator for multi-cloud Databricks deployments
 * Handles CIDR calculations, subnet allocations, and validation
 */

class SubnetAllocation {
  constructor(name, cidr, size, availabilityZone, subnetType) {
    this.name = name;
    this.cidr = cidr;
    this.size = size;
    this.availability_zone = availabilityZone;
    this.subnet_type = subnetType;
  }
}

/**
 * Centralized CIDR utility functions
 */
class CIDRUtils {
  /**
   * Parse IP address to integer
   */
  static ipToInt(ip) {
    return ip.split('.').reduce((int, oct) => (int << 8) + parseInt(oct, 10), 0) >>> 0;
  }

  /**
   * Convert integer to IP address
   */
  static intToIp(int) {
    return [
      (int >>> 24) & 255,
      (int >>> 16) & 255,
      (int >>> 8) & 255,
      int & 255
    ].join('.');
  }

  /**
   * Get network mask for a given prefix length
   */
  static getMask(prefixLen) {
    return (0xFFFFFFFF << (32 - prefixLen)) >>> 0;
  }

  /**
   * Get network address from IP and prefix length
   */
  static getNetworkAddress(ip, prefixLen) {
    const ipInt = CIDRUtils.ipToInt(ip);
    const mask = CIDRUtils.getMask(prefixLen);
    return ipInt & mask;
  }

  /**
   * Get broadcast address from network address and prefix length
   */
  static getBroadcastAddress(networkAddress, prefixLen) {
    const mask = CIDRUtils.getMask(prefixLen);
    return networkAddress | (~mask >>> 0);
  }

  /**
   * Get number of IPs in a subnet (including network and broadcast)
   */
  static getSubnetSize(prefixLen) {
    return Math.pow(2, 32 - prefixLen);
  }

  /**
   * Validate CIDR notation format
   */
  static validateCIDR(cidr) {
    try {
      const [ip, prefix] = cidr.split('/');
      if (!ip || !prefix) return false;
      
      const parts = ip.split('.').map(Number);
      if (parts.length !== 4) return false;
      if (parts.some(p => p < 0 || p > 255)) return false;
      
      const prefixLen = parseInt(prefix, 10);
      if (isNaN(prefixLen) || prefixLen < 0 || prefixLen > 32) return false;
      
      // Validate network address
      const network = CIDRUtils.ipToInt(ip);
      const networkAddr = CIDRUtils.getNetworkAddress(ip, prefixLen);
      
      return networkAddr === network;
    } catch {
      return false;
    }
  }

  /**
   * Check if two CIDR blocks overlap
   */
  static overlaps(cidr1, cidr2) {
    const [ip1, prefix1] = cidr1.split('/');
    const [ip2, prefix2] = cidr2.split('/');
    
    const net1 = CIDRUtils.getNetworkAddress(ip1, parseInt(prefix1, 10));
    const net2 = CIDRUtils.getNetworkAddress(ip2, parseInt(prefix2, 10));
    
    const size1 = CIDRUtils.getSubnetSize(parseInt(prefix1, 10));
    const size2 = CIDRUtils.getSubnetSize(parseInt(prefix2, 10));
    
    const end1 = net1 + size1 - 1;
    const end2 = net2 + size2 - 1;
    
    return (net1 <= end2 && end1 >= net2);
  }

  /**
   * Check if a subnet CIDR is within a VPC CIDR
   */
  static isSubnetInVPC(subnetCIDR, vpcCIDR) {
    const [subnetIP, subnetPrefix] = subnetCIDR.split('/');
    const [vpcIP, vpcPrefix] = vpcCIDR.split('/');
    
    const subnetNet = CIDRUtils.getNetworkAddress(subnetIP, parseInt(subnetPrefix, 10));
    const vpcNet = CIDRUtils.getNetworkAddress(vpcIP, parseInt(vpcPrefix, 10));
    
    const subnetSize = CIDRUtils.getSubnetSize(parseInt(subnetPrefix, 10));
    const vpcSize = CIDRUtils.getSubnetSize(parseInt(vpcPrefix, 10));
    
    const subnetEnd = subnetNet + subnetSize - 1;
    const vpcEnd = vpcNet + vpcSize - 1;
    
    return subnetNet >= vpcNet && subnetEnd <= vpcEnd;
  }
}

class NetworkCalculator {
  constructor(provider) {
    this.provider = provider.toLowerCase();
    this.MIN_VPC_SIZE = 8;
    this.MAX_VPC_SIZE = 24;
    this.MIN_SUBNET_SIZE = 26;
    this.SERVICE_SUBNET_SIZE = 28;
  }

  /**
   * Parse IP address to integer (delegates to CIDRUtils)
   */
  ipToInt(ip) {
    return CIDRUtils.ipToInt(ip);
  }

  /**
   * Convert integer to IP address (delegates to CIDRUtils)
   */
  intToIp(int) {
    return CIDRUtils.intToIp(int);
  }

  /**
   * Validate CIDR notation format (delegates to CIDRUtils)
   */
  validateCIDR(cidr) {
    return CIDRUtils.validateCIDR(cidr);
  }

  /**
   * Validate VPC/VNet CIDR size is within acceptable range
   */
  validateVPCSize(vpcCIDR) {
    try {
      const prefixLen = parseInt(vpcCIDR.split('/')[1], 10);
      
      if (prefixLen < this.MIN_VPC_SIZE || prefixLen > this.MAX_VPC_SIZE) {
        return {
          valid: false,
          message: `VPC size must be between /${this.MIN_VPC_SIZE} and /${this.MAX_VPC_SIZE}`
        };
      }
      
      return { valid: true, message: '' };
    } catch {
      return { valid: false, message: 'Invalid CIDR format' };
    }
  }

  /**
   * Calculate subnet size based on VPC size and offset
   * Ensures subnet is smaller than VPC and respects minimum subnet size
   */
  calculateSubnetSize(vpcSize, offset = 1) {
    // Subnet must be smaller than VPC (higher prefix = smaller network)
    // For example: VPC /12 needs subnets /13 or smaller
    // But we also want to respect minimum subnet size (e.g., /26)
    // So we take the maximum (smaller network) between (vpcSize + offset) and MIN_SUBNET_SIZE
    const calculatedSize = vpcSize + offset;
    // If calculated size is larger than MIN_SUBNET_SIZE, use MIN_SUBNET_SIZE
    // Otherwise, ensure we don't exceed the VPC size (subnet must be >= vpcSize + 1)
    return Math.max(calculatedSize, this.MIN_SUBNET_SIZE);
  }

  /**
   * Get default subnet sizes for the provider
   */
  getDefaultSubnetSizes(vpcSize, pricingTier = null) {
    if (this.provider === 'aws') {
      return this._getAWSSubnetSizes(vpcSize, pricingTier);
    } else if (this.provider === 'azure') {
      return this._getAzureSubnetSizes(vpcSize, pricingTier);
    } else if (this.provider === 'gcp') {
      return this._getGCPSubnetSizes(vpcSize, pricingTier);
    } else {
      throw new Error(`Unsupported provider: ${this.provider}`);
    }
  }

  _getAWSSubnetSizes(vpcSize, pricingTier) {
    const sizes = {
      private: this.calculateSubnetSize(vpcSize, 1),
      public: this.calculateSubnetSize(vpcSize, 1)
    };
    
    if (pricingTier === 'ENTERPRISE') {
      sizes.service = this.SERVICE_SUBNET_SIZE;
    }
    
    return sizes;
  }

  _getAzureSubnetSizes(vpcSize, pricingTier) {
    const sizes = {
      private: this.calculateSubnetSize(vpcSize, 1),
      public: this.calculateSubnetSize(vpcSize, 1)
    };
    
    if (pricingTier === 'PREMIUM') {
      sizes.service = this.SERVICE_SUBNET_SIZE;
    }
    
    return sizes;
  }

  _getGCPSubnetSizes(vpcSize, pricingTier) {
    const sizes = {
      host: this.calculateSubnetSize(vpcSize, 2),
      pods: this.calculateSubnetSize(vpcSize, 1)
    };
    
    if (pricingTier === 'PREMIUM') {
      sizes.service = this.SERVICE_SUBNET_SIZE;
    }
    
    return sizes;
  }

  /**
   * Get next subnet CIDR starting from a given IP address
   * Ensures the subnet is aligned to its network boundary
   */
  getNextSubnetCIDR(startIP, prefixLen) {
    const mask = CIDRUtils.getMask(prefixLen);
    const network = startIP & mask;
    return `${this.intToIp(network)}/${prefixLen}`;
  }

  /**
   * Get the next IP address after a subnet (for sequential allocation)
   */
  getNextIPAfterSubnet(subnetCIDR) {
    const [ip, prefix] = subnetCIDR.split('/');
    const prefixLen = parseInt(prefix, 10);
    const network = CIDRUtils.getNetworkAddress(ip, prefixLen);
    const subnetSize = CIDRUtils.getSubnetSize(prefixLen);
    return network + subnetSize;
  }

  /**
   * Allocate subnet CIDRs within the VPC
   */
  allocateSubnets(vpcCIDR, availabilityZones, pricingTier = null, enablePrivateLink = false) {
    if (!this.validateCIDR(vpcCIDR)) {
      throw new Error('Invalid VPC CIDR format');
    }

    const [vpcIP, vpcPrefix] = vpcCIDR.split('/');
    const vpcSize = parseInt(vpcPrefix, 10);
    const vpcNetworkIP = this.ipToInt(vpcIP);
    
    // Get subnet sizes for the provider
    const subnetSizes = this.getDefaultSubnetSizes(vpcSize, pricingTier);
    
    const subnets = [];
    let currentIP = vpcNetworkIP;
    
    if (this.provider === 'aws' || this.provider === 'azure') {
      subnets.push(...this._allocateAWSAzureSubnets(
        currentIP, availabilityZones, subnetSizes, enablePrivateLink
      ));
    } else if (this.provider === 'gcp') {
      subnets.push(...this._allocateGCPSubnets(
        currentIP, availabilityZones, subnetSizes, enablePrivateLink
      ));
    }
    
    return subnets;
  }

  _allocateAWSAzureSubnets(startIP, availabilityZones, subnetSizes, enablePrivateLink) {
    const subnets = [];
    let currentIP = startIP;
    
    // Allocation order: private, public, service
    for (const az of availabilityZones) {
      // Private subnet
      const privateSize = subnetSizes.private;
      const privateCIDR = this.getNextSubnetCIDR(currentIP, privateSize);
      subnets.push(new SubnetAllocation(
        `private-${az}`,
        privateCIDR,
        privateSize,
        az,
        'private'
      ));
      // Move to next IP after this subnet
      currentIP = this.getNextIPAfterSubnet(privateCIDR);
      
      // Public subnet
      const publicSize = subnetSizes.public;
      const publicCIDR = this.getNextSubnetCIDR(currentIP, publicSize);
      subnets.push(new SubnetAllocation(
        `public-${az}`,
        publicCIDR,
        publicSize,
        az,
        'public'
      ));
      // Move to next IP after this subnet
      currentIP = this.getNextIPAfterSubnet(publicCIDR);
    }
    
    // Service subnet (if Private Link is enabled)
    if (enablePrivateLink && subnetSizes.service) {
      const serviceSize = subnetSizes.service;
      const serviceCIDR = this.getNextSubnetCIDR(currentIP, serviceSize);
      subnets.push(new SubnetAllocation(
        'service',
        serviceCIDR,
        serviceSize,
        availabilityZones[0],
        'service'
      ));
    }
    
    return subnets;
  }

  _allocateGCPSubnets(startIP, availabilityZones, subnetSizes, enablePrivateLink) {
    const subnets = [];
    let currentIP = startIP;
    
    // Host subnet
    const hostSize = subnetSizes.host;
    const hostCIDR = this.getNextSubnetCIDR(currentIP, hostSize);
    subnets.push(new SubnetAllocation(
      'host',
      hostCIDR,
      hostSize,
      availabilityZones[0],
      'host'
    ));
    // Move to next IP after this subnet
    currentIP = this.getNextIPAfterSubnet(hostCIDR);
    
    // Pods subnet
    const podsSize = subnetSizes.pods;
    const podsCIDR = this.getNextSubnetCIDR(currentIP, podsSize);
    subnets.push(new SubnetAllocation(
      'pods',
      podsCIDR,
      podsSize,
      availabilityZones[0],
      'pods'
    ));
    // Move to next IP after this subnet
    currentIP = this.getNextIPAfterSubnet(podsCIDR);
    
    // Service subnet (if Private Service Connect is enabled)
    if (enablePrivateLink && subnetSizes.service) {
      const serviceSize = subnetSizes.service;
      const serviceCIDR = this.getNextSubnetCIDR(currentIP, serviceSize);
      subnets.push(new SubnetAllocation(
        'service',
        serviceCIDR,
        serviceSize,
        availabilityZones[0],
        'service'
      ));
    }
    
    return subnets;
  }

  /**
   * Validate that all subnets fit within VPC and don't overlap
   */
  validateSubnetAllocation(vpcCIDR, subnets) {
    try {
      // Check each subnet is within VPC using centralized utility
      for (const subnet of subnets) {
        if (!CIDRUtils.isSubnetInVPC(subnet.cidr, vpcCIDR)) {
          return {
            valid: false,
            message: `Subnet ${subnet.name} (${subnet.cidr}) is not within VPC ${vpcCIDR}`
          };
        }
      }
      
      // Check for overlaps using centralized utility
      for (let i = 0; i < subnets.length; i++) {
        for (let j = i + 1; j < subnets.length; j++) {
          if (CIDRUtils.overlaps(subnets[i].cidr, subnets[j].cidr)) {
            return {
              valid: false,
              message: `Subnets ${subnets[i].name} and ${subnets[j].name} overlap`
            };
          }
        }
      }
      
      return { valid: true, message: '' };
    } catch (e) {
      return { valid: false, message: `Validation error: ${e.message}` };
    }
  }

  /**
   * Calculate network utilization summary
   */
  calculateNetworkSummary(vpcCIDR, subnets) {
    try {
      const [vpcIP, vpcPrefix] = vpcCIDR.split('/');
      const vpcSize = parseInt(vpcPrefix, 10);
      const totalIPs = CIDRUtils.getSubnetSize(vpcSize);
      
      const usedIPs = subnets.reduce((sum, subnet) => {
        return sum + CIDRUtils.getSubnetSize(subnet.size);
      }, 0);
      
      const availableIPs = totalIPs - usedIPs;
      const utilizationPercent = totalIPs > 0 
        ? Math.round((usedIPs / totalIPs) * 100 * 100) / 100 
        : 0;
      
      return {
        vpc_cidr: vpcCIDR,
        total_ips: totalIPs,
        used_ips: usedIPs,
        available_ips: availableIPs,
        utilization_percent: utilizationPercent,
        subnet_count: subnets.length
      };
    } catch (e) {
      return { error: e.message };
    }
  }

  /**
   * Get default availability zones for a region
   */
  getAvailabilityZones(region, provider = null) {
    const prov = provider || this.provider;
    
    if (prov === 'aws') {
      return [`${region}a`, `${region}b`];
    } else if (prov === 'azure') {
      return ['1', '2'];
    } else if (prov === 'gcp') {
      return [`${region}-a`, `${region}-b`];
    }
    
    return [];
  }
}

// Export for use in other modules (Node.js)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { NetworkCalculator, SubnetAllocation, CIDRUtils };
}

// Make available globally for browser environment
if (typeof window !== 'undefined') {
  window.NetworkCalculator = NetworkCalculator;
  window.SubnetAllocation = SubnetAllocation;
  window.CIDRUtils = CIDRUtils;
}

