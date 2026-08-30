(function (root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.CIDR = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  function ipToInt(ip) {
    const parts = String(ip).split('.');
    if (parts.length !== 4) throw new Error(`Invalid IPv4 address: ${ip}`);
    const octets = parts.map(part => Number(part));
    if (octets.some(part => !Number.isInteger(part) || part < 0 || part > 255)) {
      throw new Error(`Invalid IPv4 address: ${ip}`);
    }
    return (((octets[0] * 256 + octets[1]) * 256 + octets[2]) * 256 + octets[3]);
  }

  function intToIp(value) {
    if (!Number.isInteger(value) || value < 0 || value > 0xffffffff) {
      throw new Error(`Invalid IPv4 integer: ${value}`);
    }
    return [
      Math.floor(value / 0x1000000) % 256,
      Math.floor(value / 0x10000) % 256,
      Math.floor(value / 0x100) % 256,
      value % 256
    ].join('.');
  }

  function parse(cidr) {
    const [ip, rawPrefix, extra] = String(cidr || '').trim().split('/');
    const prefix = Number(rawPrefix);
    if (extra !== undefined || !Number.isInteger(prefix) || prefix < 0 || prefix > 32) {
      throw new Error(`Invalid CIDR: ${cidr}`);
    }
    const address = ipToInt(ip);
    const size = 2 ** (32 - prefix);
    const network = Math.floor(address / size) * size;
    if (address !== network) throw new Error(`CIDR must use its network address: ${cidr}`);
    return {
      cidr: `${intToIp(network)}/${prefix}`,
      prefix,
      network,
      size,
      end: network + size - 1
    };
  }

  function isValid(cidr) {
    try {
      parse(cidr);
      return true;
    } catch {
      return false;
    }
  }

  function contains(parentCidr, childCidr) {
    const parent = parse(parentCidr);
    const child = parse(childCidr);
    return child.network >= parent.network && child.end <= parent.end;
  }

  function overlaps(firstCidr, secondCidr) {
    const first = parse(firstCidr);
    const second = parse(secondCidr);
    return first.network <= second.end && second.network <= first.end;
  }

  function nextAligned(cursor, prefix) {
    const size = 2 ** (32 - prefix);
    return Math.ceil(cursor / size) * size;
  }

  function allocate(vpcCidr, availabilityZones, workspacePrefix, options = {}) {
    const vpc = parse(vpcCidr);
    const zones = [...availabilityZones];
    if (zones.length < 2) throw new Error('At least two availability zones are required.');
    if (!Number.isInteger(workspacePrefix) || workspacePrefix < 17 || workspacePrefix > 26 || workspacePrefix <= vpc.prefix) {
      throw new Error('Workspace subnet prefix must be between /17 and /26 and smaller than the VPC.');
    }

    const requests = [];
    zones.forEach(zone => requests.push({ type: 'private', zone, prefix: workspacePrefix }));
    if (options.publicSubnets) {
      zones.forEach(zone => requests.push({ type: 'public', zone, prefix: 28 }));
    }
    if (options.intraSubnet) requests.push({ type: 'intra', zone: zones[0], prefix: 27 });
    if (options.endpointSubnet) requests.push({ type: 'endpoint', zone: zones[0], prefix: 27 });

    let cursor = vpc.network;
    const allocations = requests.map(request => {
      const network = nextAligned(cursor, request.prefix);
      const size = 2 ** (32 - request.prefix);
      const end = network + size - 1;
      if (end > vpc.end) throw new Error('The VPC CIDR is too small for the selected zones and subnet size.');
      cursor = end + 1;
      return {
        ...request,
        cidr: `${intToIp(network)}/${request.prefix}`,
        usableIps: Math.max(0, size - 5)
      };
    });

    return {
      allocations,
      privateSubnets: allocations.filter(item => item.type === 'private').map(item => item.cidr),
      publicSubnets: allocations.filter(item => item.type === 'public').map(item => item.cidr),
      intraSubnets: allocations.filter(item => item.type === 'intra').map(item => item.cidr),
      endpointSubnet: allocations.find(item => item.type === 'endpoint')?.cidr || ''
    };
  }

  return { ipToInt, intToIp, parse, isValid, contains, overlaps, allocate };
});
