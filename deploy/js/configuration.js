(function (root, factory) {
  const api = factory(root.CIDR || (typeof require !== 'undefined' ? require('./cidr-utils') : null));
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.PlatformConfiguration = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (CIDR) {
  const REGIONS = [
    'ap-northeast-1', 'ap-northeast-2', 'ap-south-1', 'ap-southeast-1',
    'ap-southeast-2', 'ca-central-1', 'eu-central-1', 'eu-west-1',
    'eu-west-2', 'eu-west-3', 'sa-east-1', 'us-east-1', 'us-east-2', 'us-west-2'
  ];
  const STANDARD_PORTS = [443, 3306, 2443, 5432, 8443, 8444, 8445, 8446, 8447, 8448, 8449, 8450, 8451];
  const PRIVATELINK_PORTS = [443, 2443, 5432, 6666, 8443, 8444, 8445, 8446, 8447, 8448, 8449, 8450, 8451];

  function toBoolean(value, fallback = false) {
    if (value === undefined || value === null || value === '') return fallback;
    return value === true || value === 'true' || value === 'on' || value === '1';
  }

  function toList(value) {
    if (Array.isArray(value)) return value.map(item => String(item).trim()).filter(Boolean);
    return String(value || '').split(/[\n,]+/).map(item => item.trim()).filter(Boolean);
  }

  function toPorts(value, fallback) {
    const values = toList(value).map(Number).filter(Number.isFinite);
    return values.length ? [...new Set(values)] : [...fallback];
  }

  function toTags(value) {
    if (value && typeof value === 'object' && !Array.isArray(value)) return { ...value };
    const tags = {};
    toList(value).forEach(entry => {
      const separator = entry.indexOf('=');
      if (separator > 0) tags[entry.slice(0, separator).trim()] = entry.slice(separator + 1).trim();
    });
    return tags;
  }

  function normalize(input = {}) {
    const privateLink = toBoolean(input.enable_private_link);
    const config = {
      schemaVersion: 1,
      provider: 'aws',
      project_prefix: String(input.project_prefix || 'databricks-workspace').trim(),
      resource_prefix: String(input.resource_prefix || input.project_prefix || 'databricks-workspace').trim(),
      databricks_account_id: String(input.databricks_account_id || '').trim(),
      aws_account_id: String(input.aws_account_id || '').trim(),
      region: String(input.region || 'us-west-2').trim(),
      enable_private_link: privateLink,
      pricing_tier: privateLink ? 'ENTERPRISE' : String(input.pricing_tier || 'PREMIUM').toUpperCase(),
      network_mode: String(input.network_mode || 'managed'),
      network_configuration: String(input.network_configuration || 'standard'),
      vpc_cidr_range: String(input.vpc_cidr_range || '10.0.0.0/16').trim(),
      subnet_prefix: Number(input.subnet_prefix || 24),
      availability_zones: toList(input.availability_zones).length ? toList(input.availability_zones) : ['us-west-2a', 'us-west-2b'],
      vpc_id: String(input.vpc_id || '').trim(),
      subnet_ids: toList(input.subnet_ids),
      security_group_ids: toList(input.security_group_ids),
      backend_rest_aws_vpce_id: String(input.backend_rest_aws_vpce_id || '').trim(),
      backend_relay_aws_vpce_id: String(input.backend_relay_aws_vpce_id || '').trim(),
      tags: toTags(input.tags),
      new_security_group_name: String(input.new_security_group_name || '').trim(),
      sg_egress_ports: toPorts(input.sg_egress_ports, privateLink ? PRIVATELINK_PORTS : STANDARD_PORTS),
      additional_egress_ips: toList(input.additional_egress_ips),
      metastore_mode: String(input.metastore_mode || 'new'),
      metastore_id: String(input.metastore_id || '').trim(),
      metastore_name: String(input.metastore_name || `${input.project_prefix || 'databricks-workspace'}-metastore`).trim(),
      new_catalog: toBoolean(input.new_catalog, true),
      catalog_name: String(input.catalog_name || '').trim(),
      external_location_name: String(input.external_location_name || '').trim(),
      storage_credential_name: String(input.storage_credential_name || '').trim(),
      new_cluster: toBoolean(input.new_cluster, false),
      cluster_autotermination_minutes: Number(input.cluster_autotermination_minutes || 10)
    };

    const managed = !privateLink
      ? config.network_mode === 'managed'
      : ['standard', 'fully_private'].includes(config.network_configuration);
    if (managed && CIDR.isValid(config.vpc_cidr_range)) {
      try {
        const network = CIDR.allocate(config.vpc_cidr_range, config.availability_zones, config.subnet_prefix, {
          publicSubnets: !privateLink || config.network_configuration === 'standard',
          intraSubnet: !privateLink,
          endpointSubnet: privateLink && config.network_configuration === 'fully_private'
        });
        config.private_subnets_cidr = network.privateSubnets;
        config.public_subnets_cidr = network.publicSubnets;
        config.intra_subnet_cidr = network.intraSubnets;
        config.endpoint_subnet_cidr = network.endpointSubnet;
        config.calculated_subnets = network.allocations;
      } catch (error) {
        config.network_error = error.message;
      }
    } else {
      config.private_subnets_cidr = [];
      config.public_subnets_cidr = [];
      config.intra_subnet_cidr = [];
      config.endpoint_subnet_cidr = '';
      config.calculated_subnets = [];
    }
    return config;
  }

  function validate(input) {
    const config = normalize(input);
    const errors = [];
    const add = (field, message) => errors.push({ field, message });
    const resourceId = (value, prefix) => new RegExp(`^${prefix}-[0-9a-f]+$`).test(value);

    if (!/^[a-z0-9-.]{1,40}$/.test(config.project_prefix)) add('project_prefix', 'Use 1-40 lowercase letters, numbers, hyphens, or dots.');
    if (!/^[a-z0-9-.]{1,40}$/.test(config.resource_prefix)) add('resource_prefix', 'Use 1-40 lowercase letters, numbers, hyphens, or dots.');
    if (!/^[A-Za-z0-9-]{6,64}$/.test(config.databricks_account_id)) add('databricks_account_id', 'Enter a valid Databricks account ID.');
    if (!config.enable_private_link && !/^\d{12}$/.test(config.aws_account_id)) add('aws_account_id', 'Enter the 12-digit AWS account ID.');
    if (!REGIONS.includes(config.region)) add('region', 'Choose a region supported by the pinned Terraform source.');
    if (!config.enable_private_link && !['PREMIUM', 'ENTERPRISE'].includes(config.pricing_tier)) add('pricing_tier', 'Choose Premium or Enterprise.');

    const managed = !config.enable_private_link
      ? config.network_mode === 'managed'
      : ['standard', 'fully_private'].includes(config.network_configuration);
    if (managed) {
      if (!CIDR.isValid(config.vpc_cidr_range)) add('vpc_cidr_range', 'Enter a canonical IPv4 CIDR such as 10.0.0.0/16.');
      else {
        const prefix = CIDR.parse(config.vpc_cidr_range).prefix;
        if (prefix < 8 || prefix > 24) add('vpc_cidr_range', 'VPC prefix must be between /8 and /24.');
      }
      if (config.availability_zones.length < 2 || config.availability_zones.length > 6) add('availability_zones', 'Select between two and six availability zones.');
      if (config.availability_zones.some(zone => !zone.startsWith(config.region))) add('availability_zones', 'Availability zones must belong to the selected region.');
      if (!Number.isInteger(config.subnet_prefix) || config.subnet_prefix < 17 || config.subnet_prefix > 26) add('subnet_prefix', 'Workspace subnets must be between /17 and /26.');
      if (config.network_error) add('vpc_cidr_range', config.network_error);
    }

    if (!config.enable_private_link && config.network_mode === 'existing') {
      if (!resourceId(config.vpc_id, 'vpc')) add('vpc_id', 'Enter an AWS VPC ID.');
      if (config.subnet_ids.length < 2 || config.subnet_ids.some(id => !resourceId(id, 'subnet'))) add('subnet_ids', 'Provide at least two valid subnet IDs in different availability zones.');
      if (config.security_group_ids.some(id => !resourceId(id, 'sg'))) add('security_group_ids', 'Security group IDs must start with sg-.');
    }

    if (config.enable_private_link && !['standard', 'fully_private', 'custom'].includes(config.network_configuration)) {
      add('network_configuration', 'Choose standard, fully private, or custom.');
    }
    if (config.enable_private_link && config.network_configuration === 'custom') {
      if (!resourceId(config.vpc_id, 'vpc')) add('vpc_id', 'Enter an AWS VPC ID.');
      if (config.subnet_ids.length < 2 || config.subnet_ids.some(id => !resourceId(id, 'subnet'))) add('subnet_ids', 'Provide at least two valid subnet IDs in different availability zones.');
      if (!config.security_group_ids.length || config.security_group_ids.some(id => !resourceId(id, 'sg'))) add('security_group_ids', 'Provide at least one valid workspace security group ID.');
      if (!resourceId(config.backend_rest_aws_vpce_id, 'vpce')) add('backend_rest_aws_vpce_id', 'Enter the REST API VPC endpoint ID.');
      if (!resourceId(config.backend_relay_aws_vpce_id, 'vpce')) add('backend_relay_aws_vpce_id', 'Enter the SCC relay VPC endpoint ID.');
    }

    if (config.metastore_mode === 'existing' && !config.metastore_id) add('metastore_id', 'Enter the existing Unity Catalog metastore ID.');
    if (config.metastore_mode !== 'existing' && !config.metastore_name) add('metastore_name', 'Enter a name for the new Unity Catalog metastore.');
    if (config.sg_egress_ports.some(port => !Number.isInteger(port) || port < 1 || port > 65535)) add('sg_egress_ports', 'Egress ports must be integers from 1 to 65535.');
    if (config.additional_egress_ips.some(cidr => !CIDR.isValid(cidr))) add('additional_egress_ips', 'Additional egress entries must be canonical IPv4 CIDRs.');
    if (config.new_cluster && (!Number.isInteger(config.cluster_autotermination_minutes) || config.cluster_autotermination_minutes < 10)) add('cluster_autotermination_minutes', 'Cluster auto-termination must be at least 10 minutes.');

    return { valid: errors.length === 0, errors, config };
  }

  function variantFor(config) {
    return config.enable_private_link ? 'aws-privatelink' : 'aws-standard';
  }

  return { REGIONS, STANDARD_PORTS, PRIVATELINK_PORTS, normalize, validate, variantFor, toList, toTags };
});
