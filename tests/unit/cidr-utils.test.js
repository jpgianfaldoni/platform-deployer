const { CIDRUtils } = require('../../deploy/js/network-calculator.js');

describe('CIDRUtils', () => {
  describe('ipToInt', () => {
    it('converts 0.0.0.0 to 0', () => {
      expect(CIDRUtils.ipToInt('0.0.0.0')).toBe(0);
    });

    it('converts 255.255.255.255 to 4294967295', () => {
      expect(CIDRUtils.ipToInt('255.255.255.255')).toBe(4294967295);
    });

    it('converts 10.0.0.0 correctly', () => {
      expect(CIDRUtils.ipToInt('10.0.0.0')).toBe(167772160);
    });

    it('converts 192.168.1.1 correctly', () => {
      expect(CIDRUtils.ipToInt('192.168.1.1')).toBe(3232235777);
    });
  });

  describe('intToIp', () => {
    it('converts 0 to 0.0.0.0', () => {
      expect(CIDRUtils.intToIp(0)).toBe('0.0.0.0');
    });

    it('converts 4294967295 to 255.255.255.255', () => {
      expect(CIDRUtils.intToIp(4294967295)).toBe('255.255.255.255');
    });

    it('round-trips with ipToInt', () => {
      const ip = '172.16.254.1';
      expect(CIDRUtils.intToIp(CIDRUtils.ipToInt(ip))).toBe(ip);
    });
  });

  describe('getMask', () => {
    it('returns all 1s for /32', () => {
      expect(CIDRUtils.getMask(32)).toBe(4294967295);
    });

    it('returns all 1s for /0 (JavaScript bitshift wraps at 32)', () => {
      expect(CIDRUtils.getMask(0)).toBe(4294967295);
    });

    it('returns correct mask for /24', () => {
      expect(CIDRUtils.getMask(24)).toBe(4294967040);
    });

    it('returns correct mask for /16', () => {
      expect(CIDRUtils.getMask(16)).toBe(4294901760);
    });
  });

  describe('getNetworkAddress', () => {
    it('returns network for 10.0.1.5/24', () => {
      const net = CIDRUtils.getNetworkAddress('10.0.1.5', 24);
      expect(CIDRUtils.intToIp(net)).toBe('10.0.1.0');
    });

    it('returns network for 192.168.1.100/16', () => {
      const net = CIDRUtils.getNetworkAddress('192.168.1.100', 16);
      expect(CIDRUtils.intToIp(net)).toBe('192.168.0.0');
    });
  });

  describe('getBroadcastAddress', () => {
    it('returns broadcast for 10.0.0.0/24', () => {
      const net = CIDRUtils.ipToInt('10.0.0.0');
      const broadcast = CIDRUtils.getBroadcastAddress(net, 24);
      expect(CIDRUtils.intToIp(broadcast)).toBe('10.0.0.255');
    });

    it('returns broadcast for 10.0.0.0/16', () => {
      const net = CIDRUtils.ipToInt('10.0.0.0');
      const broadcast = CIDRUtils.getBroadcastAddress(net, 16);
      expect(CIDRUtils.intToIp(broadcast)).toBe('10.0.255.255');
    });
  });

  describe('getSubnetSize', () => {
    it('returns 256 for /24', () => {
      expect(CIDRUtils.getSubnetSize(24)).toBe(256);
    });

    it('returns 1 for /32', () => {
      expect(CIDRUtils.getSubnetSize(32)).toBe(1);
    });

    it('returns 65536 for /16', () => {
      expect(CIDRUtils.getSubnetSize(16)).toBe(65536);
    });
  });

  describe('validateCIDR', () => {
    it('accepts valid CIDR 10.0.0.0/16', () => {
      expect(CIDRUtils.validateCIDR('10.0.0.0/16')).toBe(true);
    });

    it('accepts valid CIDR 192.168.0.0/24', () => {
      expect(CIDRUtils.validateCIDR('192.168.0.0/24')).toBe(true);
    });

    it('rejects host address 10.0.1.5/24 (not network address)', () => {
      expect(CIDRUtils.validateCIDR('10.0.1.5/24')).toBe(false);
    });

    it('rejects missing prefix', () => {
      expect(CIDRUtils.validateCIDR('10.0.0.0')).toBe(false);
    });

    it('rejects out-of-range prefix /33', () => {
      expect(CIDRUtils.validateCIDR('10.0.0.0/33')).toBe(false);
    });

    it('rejects invalid IP octet > 255', () => {
      expect(CIDRUtils.validateCIDR('10.0.0.256/16')).toBe(false);
    });
  });

  describe('overlaps', () => {
    it('detects overlapping CIDRs', () => {
      expect(CIDRUtils.overlaps('10.0.0.0/16', '10.0.1.0/24')).toBe(true);
    });

    it('detects non-overlapping CIDRs', () => {
      expect(CIDRUtils.overlaps('10.0.0.0/24', '10.0.1.0/24')).toBe(false);
    });

    it('detects identical CIDRs overlap', () => {
      expect(CIDRUtils.overlaps('10.0.0.0/24', '10.0.0.0/24')).toBe(true);
    });

    it('detects adjacent CIDRs do not overlap', () => {
      expect(CIDRUtils.overlaps('10.0.0.0/25', '10.0.0.128/25')).toBe(false);
    });
  });

  describe('isSubnetInVPC', () => {
    it('detects subnet inside VPC', () => {
      expect(CIDRUtils.isSubnetInVPC('10.0.1.0/24', '10.0.0.0/16')).toBe(true);
    });

    it('detects subnet outside VPC', () => {
      expect(CIDRUtils.isSubnetInVPC('10.1.0.0/24', '10.0.0.0/16')).toBe(false);
    });

    it('detects subnet same as VPC', () => {
      expect(CIDRUtils.isSubnetInVPC('10.0.0.0/16', '10.0.0.0/16')).toBe(true);
    });

    it('detects subnet partially outside VPC', () => {
      // 10.0.128.0/15 has network 10.0.0.0 and ends at 10.1.255.255, extending beyond 10.0.0.0/16
      expect(CIDRUtils.isSubnetInVPC('10.0.128.0/15', '10.0.0.0/16')).toBe(false);
    });
  });
});
