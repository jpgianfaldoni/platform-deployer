const CIDR = require('../../deploy/js/cidr-utils');

describe('CIDR allocation', () => {
  it('allocates standard workspace, NAT, and endpoint subnets without overlap', () => {
    const result = CIDR.allocate('10.0.0.0/16', ['us-west-2a', 'us-west-2b'], 24, {
      publicSubnets: true, intraSubnet: true
    });
    expect(result.privateSubnets).toEqual(['10.0.0.0/24', '10.0.1.0/24']);
    expect(result.publicSubnets).toEqual(['10.0.2.0/28', '10.0.2.16/28']);
    expect(result.intraSubnets).toEqual(['10.0.2.32/27']);
    result.allocations.forEach(subnet => expect(CIDR.contains('10.0.0.0/16', subnet.cidr)).toBe(true));
  });

  it('allocates a dedicated /27 for fully private endpoints', () => {
    const result = CIDR.allocate('10.10.0.0/16', ['us-east-1a', 'us-east-1b'], 24, { endpointSubnet: true });
    expect(result.publicSubnets).toEqual([]);
    expect(result.endpointSubnet).toBe('10.10.2.0/27');
  });

  it('rejects an undersized VPC', () => {
    expect(() => CIDR.allocate('10.0.0.0/24', ['us-east-1a', 'us-east-1b'], 24, { publicSubnets: true })).toThrow();
  });
});
