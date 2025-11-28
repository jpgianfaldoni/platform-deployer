/**
 * TemplateLoader - Loads Terraform templates from external files
 * Supports caching for offline PWA functionality
 */
class TemplateLoader {
  constructor() {
    this.cache = new Map();
    this.basePath = './templates/';
    this.loadingPromises = new Map();
  }

  /**
   * Load a template file
   * @param {string} provider - Provider name (aws, azure, gcp)
   * @param {string} templateName - Template name (provider, variables, etc.)
   * @returns {Promise<string>} Template content
   */
  async loadTemplate(provider, templateName) {
    const cacheKey = `${provider}/${templateName}`;
    
    // Return cached template if available
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    // Return existing loading promise if already loading
    if (this.loadingPromises.has(cacheKey)) {
      return this.loadingPromises.get(cacheKey);
    }

    // Start loading
    const loadPromise = this._fetchTemplate(provider, templateName)
      .then(content => {
        this.cache.set(cacheKey, content);
        this.loadingPromises.delete(cacheKey);
        return content;
      })
      .catch(error => {
        this.loadingPromises.delete(cacheKey);
        throw error;
      });

    this.loadingPromises.set(cacheKey, loadPromise);
    return loadPromise;
  }

  /**
   * Load module template
   * @param {string} moduleName - Module name (network, databricks)
   * @param {string} templateName - Template name (main, variables, outputs)
   * @returns {Promise<string>} Template content
   */
  async loadModuleTemplate(moduleName, templateName) {
    const cacheKey = `modules/${moduleName}/${templateName}`;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    if (this.loadingPromises.has(cacheKey)) {
      return this.loadingPromises.get(cacheKey);
    }

    const loadPromise = this._fetchModuleTemplate(moduleName, templateName)
      .then(content => {
        this.cache.set(cacheKey, content);
        this.loadingPromises.delete(cacheKey);
        return content;
      })
      .catch(error => {
        this.loadingPromises.delete(cacheKey);
        throw error;
      });

    this.loadingPromises.set(cacheKey, loadPromise);
    return loadPromise;
  }

  /**
   * Load provider config
   * @param {string} provider - Provider name
   * @returns {Promise<Object>} Config object
   */
  async loadConfig(provider) {
    const cacheKey = `${provider}/config`;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const configPath = `${this.basePath}${provider}/config.json`;
    const response = await fetch(configPath);
    
    if (!response.ok) {
      throw new Error(`Failed to load config for ${provider}: ${response.statusText}`);
    }

    const config = await response.json();
    this.cache.set(cacheKey, config);
    return config;
  }

  /**
   * Fetch template file
   * @private
   */
  async _fetchTemplate(provider, templateName) {
    // Map template names to file names
    const fileMap = {
      'provider': 'provider.tf.template',
      'variables': 'variables.tf.template',
      'tfvars': 'tfvars.tf.template',
      'main': 'main.tf.template',
      'outputs': 'outputs.tf.template',
      'versions': 'versions.tf.template',
      'readme': 'readme.md.template'
    };

    const fileName = fileMap[templateName];
    if (!fileName) {
      throw new Error(`Unknown template name: ${templateName}`);
    }

    const templatePath = `${this.basePath}${provider}/${fileName}`;
    const response = await fetch(templatePath);
    
    if (!response.ok) {
      throw new Error(`Failed to load template ${provider}/${templateName}: ${response.statusText}`);
    }

    return await response.text();
  }

  /**
   * Fetch module template file
   * @private
   */
  async _fetchModuleTemplate(moduleName, templateName) {
    const fileMap = {
      'main': 'main.tf.template',
      'variables': 'variables.tf.template',
      'outputs': 'outputs.tf.template'
    };

    const fileName = fileMap[templateName];
    if (!fileName) {
      throw new Error(`Unknown module template name: ${templateName}`);
    }

    const templatePath = `${this.basePath}modules/${moduleName}/${fileName}`;
    const response = await fetch(templatePath);
    
    if (!response.ok) {
      throw new Error(`Failed to load module template ${moduleName}/${templateName}: ${response.statusText}`);
    }

    return await response.text();
  }

  /**
   * Preload all templates for a provider
   * @param {string} provider - Provider name
   * @returns {Promise<void>}
   */
  async preloadProvider(provider) {
    try {
      const config = await this.loadConfig(provider);
      const loadPromises = config.template_files.map(file => {
        const templateName = file.replace('.tf.template', '').replace('.md.template', '');
        return this.loadTemplate(provider, templateName).catch(err => {
          console.warn(`Failed to preload ${provider}/${templateName}:`, err);
        });
      });
      await Promise.all(loadPromises);
    } catch (error) {
      console.warn(`Failed to preload provider ${provider}:`, error);
    }
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
    this.loadingPromises.clear();
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = TemplateLoader;
}

