const Configuration = require('../../deploy/js/configuration');
const Tfvars = require('../../deploy/js/tfvars-generator');

const base = {
  project_prefix: 'test-workspace', databricks_account_id: '12345678-1234-1234-1234-123456789012',
  aws_account_id: '123456789012', region: 'us-west-2', availability_zones: ['us-west-2a', 'us-west-2b'],
  vpc_cidr_range: '10.0.0.0/16', subnet_prefix: 24, metastore_name: 'test-metastore'
};

describe('AWS configuration', () => {
  it('normalizes and validates managed non-PrivateLink input', () => {
    const result = Configuration.validate(base);
    expect(result.valid).toBe(true);
    expect(Configuration.variantFor(result.config)).toBe('aws-standard');
    expect(result.config.nat_gateway_mode).toBe('single');
    expect(result.config.intra_subnet_cidr).toEqual(['10.0.2.32/27']);
  });

  it('requires backend PrivateLink when no NAT gateway is selected', () => {
    const result = Configuration.validate({ ...base, nat_gateway_mode: 'none' });
    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual({
      field: 'enable_private_link',
      message: 'Backend PrivateLink is required when no NAT gateway is selected.'
    });
  });

  it('maps no NAT with PrivateLink to fully private networking', () => {
    const result = Configuration.validate({ ...base, enable_private_link: true, nat_gateway_mode: 'none' });
    expect(result.valid).toBe(true);
    expect(result.config.network_configuration).toBe('fully_private');
    expect(result.config.public_subnets_cidr).toEqual([]);
    expect(result.config.endpoint_subnet_cidr).toBe('10.0.2.0/27');
  });

  it('requires complete custom PrivateLink resources', () => {
    const result = Configuration.validate({ ...base, enable_private_link: true, network_configuration: 'custom' });
    expect(result.valid).toBe(false);
    expect(result.errors.map(error => error.field)).toContain('backend_rest_aws_vpce_id');
    expect(result.errors.map(error => error.field)).toContain('security_group_ids');
  });

  it('accepts a complete custom PrivateLink configuration', () => {
    const result = Configuration.validate({
      ...base, enable_private_link: true, network_configuration: 'custom', vpc_id: 'vpc-0123abcd',
      subnet_ids: ['subnet-1111aaaa', 'subnet-2222bbbb'], security_group_ids: ['sg-1234abcd'],
      backend_rest_aws_vpce_id: 'vpce-1111aaaa', backend_relay_aws_vpce_id: 'vpce-2222bbbb'
    });
    expect(result.valid).toBe(true);
    expect(result.config.pricing_tier).toBe('ENTERPRISE');
  });

  it('accepts an existing VPC with existing subnet IDs', () => {
    const result = Configuration.validate({
      ...base,
      network_mode: 'existing',
      vpc_id: 'vpc-0123abcd',
      subnet_ids: ['subnet-1111aaaa', 'subnet-2222bbbb']
    });
    expect(result.valid).toBe(true);
    expect(result.config.calculated_subnets).toEqual([]);
  });

  it('enforces the fixed settings formerly exposed as advanced configuration', () => {
    const config = Configuration.normalize({
      ...base,
      resource_prefix: 'custom-prefix',
      tags: { Team: 'Custom' },
      new_security_group_name: 'custom-sg',
      security_group_ids: ['sg-1234abcd'],
      sg_egress_ports: [1],
      additional_egress_ips: ['198.51.100.5/32'],
      new_catalog: true,
      catalog_name: 'custom-catalog',
      new_cluster: true
    });
    expect(config.resource_prefix).toBe('test-workspace');
    expect(config.tags).toEqual({});
    expect(config.new_security_group_name).toBe('test-workspace-databricks-sg');
    expect(config.security_group_ids).toEqual([]);
    expect(config.sg_egress_ports).toEqual(Configuration.STANDARD_PORTS);
    expect(config.additional_egress_ips).toEqual([]);
    expect(config.new_catalog).toBe(false);
    expect(config.catalog_name).toBe('');
    expect(config.new_cluster).toBe(false);
  });
});

describe('tfvars generation', () => {
  it('emits only non-PrivateLink source variables', () => {
    const output = Tfvars.generate({ ...base, nat_gateway_mode: 'per_az' });
    expect(output).toMatch(/^aws_account_id\s*= "123456789012"$/m);
    expect(output).toMatch(/^nat_gateway_mode\s*= "per_az"$/m);
    expect(output).toMatch(/^intra_subnet_cidr\s*= \["10\.0\.2\.32\/27"\]$/m);
    expect(output).toMatch(/^new_security_group_name\s*= "test-workspace-databricks-sg"$/m);
    expect(output).toMatch(/^new_catalog\s*= false$/m);
    expect(output).toMatch(/^new_cluster\s*= false$/m);
    expect(output).not.toMatch(/^network_configuration\s*=/m);
    expect(output).not.toMatch(/^backend_rest_aws_vpce_id\s*=/m);
  });

  it('emits the fully private source contract with fixed security defaults', () => {
    const output = Tfvars.generate({
      ...base, project_prefix: 'safe-name', enable_private_link: true,
      network_configuration: 'fully_private', tags: { Team: 'Data "Platform"' }
    });
    expect(output).toMatch(/^network_configuration\s*= "fully_private"$/m);
    expect(output).toMatch(/^nat_gateway_mode\s*= "single"$/m);
    expect(output).toMatch(/^endpoint_subnet_cidr\s*= "10\.0\.2\.0\/27"$/m);
    expect(output).toMatch(/^tags\s*= \{\}$/m);
    expect(output).toMatch(/^additional_egress_ips\s*= \[\]$/m);
    expect(output).not.toMatch(/^aws_account_id\s*=/m);
    expect(output).not.toMatch(/^pricing_tier\s*=/m);
    expect(output).not.toMatch(/^new_catalog\s*=/m);
  });
});
