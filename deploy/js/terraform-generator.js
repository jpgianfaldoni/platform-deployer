/**
 * Terraform Generator - Generates Terraform projects for Databricks deployments
 */

class TerraformGenerator {
  constructor() {
    this.templates = {
      aws: {
        provider: this.getAWSProviderTemplate(),
        variables: this.getAWSVariablesTemplate(),
        tfvars: this.getAWSTfvarsTemplate(),
        main: this.getAWSMainTemplate(),
        outputs: this.getAWSOutputsTemplate(),
        versions: this.getAWSVersionsTemplate(),
        readme: this.getAWSReadmeTemplate()
      },
      azure: {
        provider: this.getAzureProviderTemplate(),
        variables: this.getAzureVariablesTemplate(),
        tfvars: this.getAzureTfvarsTemplate(),
        main: this.getAzureMainTemplate(),
        outputs: this.getAzureOutputsTemplate(),
        versions: this.getAzureVersionsTemplate(),
        readme: this.getAzureReadmeTemplate()
      },
      gcp: {
        provider: this.getGCPProviderTemplate(),
        variables: this.getGCPVariablesTemplate(),
        tfvars: this.getGCPTfvarsTemplate(),
        main: this.getGCPMainTemplate(),
        outputs: this.getGCPOutputsTemplate(),
        versions: this.getGCPVersionsTemplate(),
        readme: this.getGCPReadmeTemplate()
      }
    };
  }

  /**
   * Generate complete Terraform project as ZIP
   */
  async generateProject(config) {
    // Check if JSZip is available
    if (typeof JSZip === 'undefined') {
      throw new Error('JSZip library is not loaded. Please ensure the JSZip script is loaded before generating the project.');
    }
    
    const zip = new JSZip();
    const provider = config.provider.toLowerCase();
    
    // Generate main files
    zip.file('provider.tf', this.renderTemplate(provider, 'provider', config));
    zip.file('variables.tf', this.renderTemplate(provider, 'variables', config));
    zip.file('terraform.tfvars', this.renderTemplate(provider, 'tfvars', config));
    zip.file('main.tf', this.renderTemplate(provider, 'main', config));
    zip.file('outputs.tf', this.renderTemplate(provider, 'outputs', config));
    zip.file('versions.tf', this.renderTemplate(provider, 'versions', config));
    zip.file('README.md', this.renderTemplate(provider, 'readme', config));
    
    // Generate modules directory structure
    const modulesDir = zip.folder('modules');
    const networkDir = modulesDir.folder('network');
    const databricksDir = modulesDir.folder('databricks');
    
    // Generate module files (simplified versions)
    networkDir.file('main.tf', this.getNetworkModuleTemplate(provider));
    networkDir.file('variables.tf', this.getNetworkVariablesTemplate(provider));
    networkDir.file('outputs.tf', this.getNetworkOutputsTemplate(provider));
    
    databricksDir.file('main.tf', this.getDatabricksModuleTemplate(provider));
    databricksDir.file('variables.tf', this.getDatabricksVariablesTemplate(provider));
    databricksDir.file('outputs.tf', this.getDatabricksOutputsTemplate(provider));
    
    // Generate ZIP blob
    return await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
  }

  /**
   * Render template with config
   */
  renderTemplate(provider, templateName, config) {
    const template = this.templates[provider]?.[templateName];
    if (!template) {
      throw new Error(`Template not found: ${provider}/${templateName}`);
    }
    
    return typeof template === 'function' ? template(config) : template;
  }

  // AWS Templates
  getAWSProviderTemplate() {
    return (config) => `terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    databricks = {
      source  = "databricks/databricks"
      version = "~> 1.26"
    }
  }
}

# Configure the AWS Provider
provider "aws" {
  region = var.aws_region
  
  default_tags {
    tags = merge(
      var.common_tags,
      {
        Project     = "${config.project_prefix}"
        Environment = "dev"
        ManagedBy   = "terraform"
        CreatedBy   = "databricks-deployer"
      }
    )
  }
}

# Configure the Databricks Provider for AWS
provider "databricks" {
  alias      = "mws"
  host       = "https://accounts.cloud.databricks.com"
  account_id = var.databricks_account_id
}

provider "databricks" {
  alias = "workspace"
  host  = databricks_mws_workspaces.this.workspace_url
}
`;
  }

  getAWSVariablesTemplate() {
    return (config) => {
      const subnets = config.calculated_subnets || [];
      const subnetVars = subnets.map(s => 
        `variable "${s.name.replace(/-/g, '_')}_subnet_cidr" {
  description = "CIDR block for ${s.name} subnet"
  type        = string
  default     = "${s.cidr}"
}`
      ).join('\n\n');
      
      return `# AWS Configuration Variables
variable "aws_region" {
  description = "AWS region for resource deployment"
  type        = string
  default     = "${config.region}"
}

variable "project_prefix" {
  description = "Prefix for all resource names"
  type        = string
  default     = "${config.project_prefix}"
  
  validation {
    condition     = can(regex("^[a-z0-9][a-z0-9-]*[a-z0-9]$", var.project_prefix))
    error_message = "Project prefix must contain only lowercase letters, numbers, and hyphens."
  }
}

# VPC Configuration
variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
  default     = "${config.vpc_cidr}"
  
  validation {
    condition     = can(cidrhost(var.vpc_cidr, 0))
    error_message = "VPC CIDR must be a valid IPv4 CIDR block."
  }
}

variable "create_new_vpc" {
  description = "Whether to create a new VPC or use an existing one"
  type        = bool
  default     = ${config.create_new_vpc}
}

variable "existing_vpc_id" {
  description = "ID of existing VPC to use (required if create_new_vpc is false)"
  type        = string
  default     = ""
}

variable "availability_zones" {
  description = "List of availability zones for subnet deployment"
  type        = list(string)
  default     = ${JSON.stringify(config.availability_zones || [])}
}

# Subnet Configuration
${subnetVars}

# Databricks Configuration
variable "databricks_account_id" {
  description = "Databricks account ID"
  type        = string
  sensitive   = true
}

variable "pricing_tier" {
  description = "Databricks workspace pricing tier"
  type        = string
  default     = "${config.pricing_tier}"
  
  validation {
    condition = contains([
      "STANDARD",
      "PREMIUM", 
      "ENTERPRISE"
    ], var.pricing_tier)
    error_message = "Pricing tier must be STANDARD, PREMIUM, or ENTERPRISE."
  }
}

variable "workspace_name" {
  description = "Name of the Databricks workspace"
  type        = string
  default     = "${config.project_prefix}-workspace"
}

# Security Configuration
variable "enable_private_link" {
  description = "Enable AWS PrivateLink for private connectivity"
  type        = bool
  default     = ${config.enable_private_link || false}
}

${config.cross_account_role_arn ? `variable "cross_account_role_arn" {
  description = "ARN of cross-account IAM role for Databricks access"
  type        = string
  default     = "${config.cross_account_role_arn}"
}` : ''}

# Advanced Configuration
variable "enable_nat_gateway" {
  description = "Enable NAT Gateway for private subnet internet access"
  type        = bool
  default     = ${config.enable_nat_gateway !== false}
}

variable "common_tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
  default = merge(
    ${JSON.stringify(config.tags || {})},
    {
      Project     = "${config.project_prefix}"
      Environment = "dev"
      ManagedBy   = "terraform"
      Provider    = "aws"
    }
  )
}
`;
    };
  }

  getAWSTfvarsTemplate() {
    return (config) => {
      const subnets = config.calculated_subnets || [];
      const subnetVars = subnets.map(s => 
        `${s.name.replace(/-/g, '_')}_subnet_cidr = "${s.cidr}"`
      ).join('\n');
      
      return `# AWS Configuration
aws_region     = "${config.region}"
project_prefix = "${config.project_prefix}"

# VPC Configuration
vpc_cidr        = "${config.vpc_cidr}"
create_new_vpc  = ${config.create_new_vpc}
${!config.create_new_vpc && config.existing_vpc_name ? `existing_vpc_id = "${config.existing_vpc_name}"  # Update this with actual VPC ID` : ''}

availability_zones = ${JSON.stringify(config.availability_zones || [])}

# Subnet CIDR blocks (calculated automatically)
${subnetVars}

# Databricks Configuration
# IMPORTANT: Set these values before running terraform apply
databricks_account_id = ""  # Your Databricks account ID (required)
pricing_tier          = "${config.pricing_tier}"
workspace_name        = "${config.project_prefix}-workspace"

# Security Configuration
enable_private_link = ${config.enable_private_link || false}

${config.cross_account_role_arn ? `cross_account_role_arn = "${config.cross_account_role_arn}"` : ''}

# Advanced Configuration
enable_nat_gateway    = ${config.enable_nat_gateway !== false}
enable_vpc_endpoints  = true
enable_flow_logs      = true

# Resource Tags
common_tags = ${JSON.stringify(config.tags || {})}

# Additional tags will be automatically merged:
# - Project: ${config.project_prefix}
# - Environment: dev
# - ManagedBy: terraform
# - Provider: aws
# - CreatedBy: databricks-deployer
`;
    };
  }

  getAWSMainTemplate() {
    return (config) => {
      // Simplified main.tf - full version would be much longer
      return `# Data sources for AWS resources
data "aws_caller_identity" "current" {}
data "aws_partition" "current" {}

# Get availability zone details
data "aws_availability_zones" "available" {
  state = "available"
  filter {
    name   = "opt-in-status"
    values = ["opt-in-not-required"]
  }
}

# Databricks E2 account
data "databricks_aws_assume_role_policy" "this" {
  external_id = var.databricks_account_id
}

data "databricks_aws_crossaccount_policy" "this" {}

# Create VPC if needed
resource "aws_vpc" "this" {
  count = var.create_new_vpc ? 1 : 0
  
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true
  
  tags = merge(
    var.common_tags,
    {
      Name = "\${var.project_prefix}-vpc"
    }
  )
}

# Internet Gateway
resource "aws_internet_gateway" "this" {
  count = var.create_new_vpc ? 1 : 0
  
  vpc_id = aws_vpc.this[0].id
  
  tags = merge(
    var.common_tags,
    {
      Name = "\${var.project_prefix}-igw"
    }
  )
}

# Local values for VPC reference
locals {
  vpc_id = var.create_new_vpc ? aws_vpc.this[0].id : var.existing_vpc_id
}

# Note: Full subnet, NAT gateway, security groups, and Databricks resources
# would be included here. This is a simplified version.
# See the full template in the original project for complete implementation.

# Databricks Workspace
resource "databricks_mws_workspaces" "this" {
  provider        = databricks.mws
  account_id      = var.databricks_account_id
  aws_region      = var.aws_region
  workspace_name  = var.workspace_name
  deployment_name = var.workspace_name
  
  # Note: Credentials, storage, and network IDs would be configured here
  # This is a simplified version
  
  token {
    comment = "Terraform provisioning token"
  }
}
`;
    };
  }

  getAWSOutputsTemplate() {
    return (config) => `# Outputs
output "workspace_url" {
  description = "Databricks workspace URL"
  value       = databricks_mws_workspaces.this.workspace_url
}

output "workspace_id" {
  description = "Databricks workspace ID"
  value       = databricks_mws_workspaces.this.workspace_id
}

output "vpc_id" {
  description = "VPC ID"
  value       = local.vpc_id
}
`;
  }

  getAWSVersionsTemplate() {
    return (config) => `terraform {
  required_version = ">= 1.0"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    databricks = {
      source  = "databricks/databricks"
      version = "~> 1.26"
    }
  }
}
`;
  }

  getAWSReadmeTemplate() {
    return (config) => `# Databricks Deployment on AWS

This Terraform project deploys a Databricks workspace on Amazon Web Services.

## Configuration

- **Provider**: AWS
- **Region**: ${config.region}
- **Project Prefix**: ${config.project_prefix}
- **Pricing Tier**: ${config.pricing_tier}
- **VPC CIDR**: ${config.vpc_cidr}
- **Private Link**: ${config.enable_private_link ? 'Enabled' : 'Disabled'}

## Prerequisites

1. AWS account with appropriate permissions
2. Databricks account ID
3. Terraform >= 1.0 installed
4. AWS CLI configured

## Deployment Steps

1. **Set your Databricks account ID** in \`terraform.tfvars\`

2. **Configure AWS credentials**:
   \`\`\`bash
   aws configure
   \`\`\`

3. **Initialize Terraform**:
   \`\`\`bash
   terraform init
   \`\`\`

4. **Review the plan**:
   \`\`\`bash
   terraform plan
   \`\`\`

5. **Apply the configuration**:
   \`\`\`bash
   terraform apply
   \`\`\`

## Generated: ${new Date().toLocaleString()}
`;
  }

  // Azure Templates (simplified)
  getAzureProviderTemplate() {
    return (config) => `terraform {
  required_version = ">= 1.0"
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"
    }
    databricks = {
      source  = "databricks/databricks"
      version = "~> 1.26"
    }
  }
}

provider "azurerm" {
  features {}
}

provider "databricks" {
  host = "https://accounts.azuredatabricks.net"
}
`;
  }

  getAzureVariablesTemplate() {
    return (config) => `# Azure Configuration Variables
variable "resource_group_name" {
  description = "Azure Resource Group name"
  type        = string
  default     = "${config.resource_group_name || ''}"
}

variable "region" {
  description = "Azure region"
  type        = string
  default     = "${config.region}"
}

variable "project_prefix" {
  description = "Prefix for all resource names"
  type        = string
  default     = "${config.project_prefix}"
}
`;
  }

  getAzureTfvarsTemplate() {
    return (config) => `# Azure Configuration
resource_group_name = "${config.resource_group_name || ''}"
region             = "${config.region}"
project_prefix     = "${config.project_prefix}"
`;
  }

  getAzureMainTemplate() {
    return (config) => `# Azure Databricks Deployment
# Main Terraform configuration for Azure
# Note: Full implementation would include VNet, subnets, and Databricks workspace
`;
  }

  getAzureOutputsTemplate() {
    return (config) => `# Outputs
output "workspace_url" {
  description = "Databricks workspace URL"
  value       = "Configured in main.tf"
}
`;
  }

  getAzureVersionsTemplate() {
    return (config) => `terraform {
  required_version = ">= 1.0"
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"
    }
    databricks = {
      source  = "databricks/databricks"
      version = "~> 1.26"
    }
  }
}
`;
  }

  getAzureReadmeTemplate() {
    return (config) => `# Databricks Deployment on Azure

This Terraform project deploys a Databricks workspace on Microsoft Azure.

## Configuration

- **Provider**: Azure
- **Region**: ${config.region}
- **Resource Group**: ${config.resource_group_name || 'Not set'}
- **Project Prefix**: ${config.project_prefix}

## Prerequisites

1. Azure subscription
2. Terraform >= 1.0
3. Azure CLI configured

## Deployment Steps

1. **Login to Azure**:
   \`\`\`bash
   az login
   \`\`\`

2. **Initialize Terraform**:
   \`\`\`bash
   terraform init
   \`\`\`

3. **Apply**:
   \`\`\`bash
   terraform apply
   \`\`\`

## Generated: ${new Date().toLocaleString()}
`;
  }

  // GCP Templates (simplified)
  getGCPProviderTemplate() {
    return (config) => `terraform {
  required_version = ">= 1.0"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
    databricks = {
      source  = "databricks/databricks"
      version = "~> 1.26"
    }
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

provider "databricks" {
  host = "https://accounts.gcp.databricks.com"
}
`;
  }

  getGCPVariablesTemplate() {
    return (config) => `# GCP Configuration Variables
variable "project_id" {
  description = "GCP Project ID"
  type        = string
  default     = "${config.project_id || ''}"
}

variable "region" {
  description = "GCP region"
  type        = string
  default     = "${config.region}"
}

variable "project_prefix" {
  description = "Prefix for all resource names"
  type        = string
  default     = "${config.project_prefix}"
}
`;
  }

  getGCPTfvarsTemplate() {
    return (config) => `# GCP Configuration
project_id     = "${config.project_id || ''}"
region         = "${config.region}"
project_prefix = "${config.project_prefix}"
`;
  }

  getGCPMainTemplate() {
    return (config) => `# GCP Databricks Deployment
# Main Terraform configuration for GCP
# Note: Full implementation would include VPC, subnets, and Databricks workspace
`;
  }

  getGCPOutputsTemplate() {
    return (config) => `# Outputs
output "workspace_url" {
  description = "Databricks workspace URL"
  value       = "Configured in main.tf"
}
`;
  }

  getGCPVersionsTemplate() {
    return (config) => `terraform {
  required_version = ">= 1.0"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
    databricks = {
      source  = "databricks/databricks"
      version = "~> 1.26"
    }
  }
}
`;
  }

  getGCPReadmeTemplate() {
    return (config) => `# Databricks Deployment on GCP

This Terraform project deploys a Databricks workspace on Google Cloud Platform.

## Configuration

- **Provider**: GCP
- **Project ID**: ${config.project_id || 'Not set'}
- **Region**: ${config.region}
- **Project Prefix**: ${config.project_prefix}

## Prerequisites

1. GCP project with billing enabled
2. Terraform >= 1.0
3. gcloud CLI configured

## Deployment Steps

1. **Login to GCP**:
   \`\`\`bash
   gcloud auth login
   gcloud auth application-default login
   \`\`\`

2. **Initialize Terraform**:
   \`\`\`bash
   terraform init
   \`\`\`

3. **Apply**:
   \`\`\`bash
   terraform apply
   \`\`\`

## Generated: ${new Date().toLocaleString()}
`;
  }

  // Module Templates (simplified)
  getNetworkModuleTemplate(provider) {
    return `# Network Module for ${provider.toUpperCase()}
# Network configuration module
`;
  }

  getNetworkVariablesTemplate(provider) {
    return `# Network Module Variables
variable "vpc_cidr" {
  description = "VPC CIDR block"
  type        = string
}
`;
  }

  getNetworkOutputsTemplate(provider) {
    return `# Network Module Outputs
output "vpc_id" {
  description = "VPC ID"
  value       = "Configured in main.tf"
}
`;
  }

  getDatabricksModuleTemplate(provider) {
    return `# Databricks Module for ${provider.toUpperCase()}
# Databricks workspace configuration module
`;
  }

  getDatabricksVariablesTemplate(provider) {
    return `# Databricks Module Variables
variable "workspace_name" {
  description = "Workspace name"
  type        = string
}
`;
  }

  getDatabricksOutputsTemplate(provider) {
    return `# Databricks Module Outputs
output "workspace_url" {
  description = "Workspace URL"
  value       = "Configured in main.tf"
}
`;
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = TerraformGenerator;
}

