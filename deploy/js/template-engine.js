/**
 * TemplateEngine - Renders templates with variable substitution
 * Supports simple placeholders {{variable}} and loops for arrays
 */
class TemplateEngine {
  /**
   * Render template with variables
   * @param {string} template - Template content
   * @param {Object} variables - Variables object
   * @returns {string} Rendered template
   */
  render(template, variables) {
    let result = template;
    
    // Process loops first ({{#each array}}...{{/each}})
    result = this._processLoops(result, variables);
    
    // Process conditionals ({{#if condition}}...{{/if}})
    result = this._processConditionals(result, variables);
    
    // Process simple variable substitutions {{variable}}
    result = this._processVariables(result, variables);
    
    return result;
  }

  /**
   * Process loop blocks {{#each array}}...{{/each}}
   * @private
   */
  _processLoops(template, variables) {
    // Match {{#each arrayName}}...{{/each}} blocks
    const loopRegex = /\{\{#each\s+(\w+)\}\}([\s\S]*?)\{\{\/each\}\}/g;
    
    return template.replace(loopRegex, (match, arrayName, content) => {
      const array = this._getNestedValue(variables, arrayName);
      
      if (!Array.isArray(array) || array.length === 0) {
        return '';
      }

      // Process each item in the array
      return array.map(item => {
        // Create a context with item properties and parent variables
        const context = { ...variables, ...item };
        
        // Process nested content with item context
        let itemContent = content;
        
        // Replace {{property}} with item property values
        itemContent = this._processVariables(itemContent, context);
        
        // Process nested loops and conditionals
        itemContent = this._processLoops(itemContent, context);
        itemContent = this._processConditionals(itemContent, context);
        
        return itemContent;
      }).join('');
    });
  }

  /**
   * Process conditional blocks {{#if condition}}...{{/if}} and {{#unless condition}}...{{/unless}}
   * @private
   */
  _processConditionals(template, variables) {
    let result = template;
    
    // Process {{#unless condition}}...{{/unless}} blocks
    const unlessRegex = /\{\{#unless\s+(\w+)\}\}([\s\S]*?)\{\{\/unless\}\}/g;
    result = result.replace(unlessRegex, (match, conditionName, content) => {
      const condition = this._getNestedValue(variables, conditionName);
      
      if (!condition || condition === '' || condition === false || condition === 0) {
        let processedContent = content;
        processedContent = this._processVariables(processedContent, variables);
        processedContent = this._processLoops(processedContent, variables);
        processedContent = this._processConditionals(processedContent, variables);
        return processedContent;
      }
      
      return '';
    });
    
    // Process {{#if condition}}...{{/if}} blocks
    const ifRegex = /\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g;
    result = result.replace(ifRegex, (match, conditionName, content) => {
      const condition = this._getNestedValue(variables, conditionName);
      
      // Check if condition is truthy
      if (condition && condition !== '' && condition !== false && condition !== 0) {
        // Process content with variables
        let processedContent = content;
        processedContent = this._processVariables(processedContent, variables);
        processedContent = this._processLoops(processedContent, variables);
        processedContent = this._processConditionals(processedContent, variables);
        return processedContent;
      }
      
      return '';
    });
    
    return result;
  }


  /**
   * Process simple variable substitutions {{variable}}
   * @private
   */
  _processVariables(template, variables) {
    // Match {{variable}} or {{variable.property}}
    const varRegex = /\{\{([^}]+)\}\}/g;
    
    return template.replace(varRegex, (match, varPath) => {
      const value = this._getNestedValue(variables, varPath.trim());
      
      if (value === undefined || value === null) {
        return match; // Keep original if not found
      }
      
      // Handle different types
      if (typeof value === 'boolean') {
        return value.toString();
      }
      
      if (typeof value === 'object') {
        return JSON.stringify(value);
      }
      
      return String(value);
    });
  }

  /**
   * Get nested value from object using dot notation or array access
   * @private
   */
  _getNestedValue(obj, path) {
    const parts = path.split('.');
    let value = obj;
    
    for (const part of parts) {
      if (value === null || value === undefined) {
        return undefined;
      }
      value = value[part];
    }
    
    return value;
  }

  /**
   * Prepare variables for template rendering
   * Adds computed properties and formats data
   * @param {Object} config - Configuration object
   * @returns {Object} Prepared variables
   */
  prepareVariables(config) {
    const vars = { ...config };
    
    // Add computed properties for subnets
    if (config.calculated_subnets && Array.isArray(config.calculated_subnets)) {
      vars.calculated_subnets = config.calculated_subnets.map(subnet => ({
        ...subnet,
        name_replace: subnet.name ? subnet.name.replace(/-/g, '_') : ''
      }));
    } else {
      vars.calculated_subnets = [];
    }
    
    // Format boolean values
    vars.create_new_vpc = config.create_new_vpc === true || config.create_new_vpc === 'true';
    vars.enable_private_link = config.enable_private_link === true || config.enable_private_link === 'true';
    vars.enable_nat_gateway = config.enable_nat_gateway !== false && config.enable_nat_gateway !== 'false';
    
    // Format arrays - ensure they're always strings for template
    if (config.availability_zones && Array.isArray(config.availability_zones)) {
      vars.availability_zones = JSON.stringify(config.availability_zones);
    } else {
      vars.availability_zones = '[]';
    }
    
    // Format tags - ensure it's always a valid JSON object
    if (config.tags && typeof config.tags === 'object') {
      vars.common_tags = JSON.stringify(config.tags);
    } else {
      vars.common_tags = '{}';
    }
    
    // Add computed values for readme
    vars.private_link_status = vars.enable_private_link ? 'Enabled' : 'Disabled';
    vars.generated_date = new Date().toLocaleString();
    vars.provider_upper = (config.provider || '').toUpperCase();
    
    // Handle optional values with defaults
    vars.resource_group_name = config.resource_group_name || '';
    vars.project_id = config.project_id || '';
    vars.existing_vpc_name = config.existing_vpc_name || '';
    vars.cross_account_role_arn = config.cross_account_role_arn || '';
    
    return vars;
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = TemplateEngine;
}

