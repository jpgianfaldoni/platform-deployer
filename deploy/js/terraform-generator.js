(function (root, factory) {
  const Generator = factory(
    root.PlatformConfiguration || (typeof require !== 'undefined' ? require('./configuration') : null),
    root.TfvarsGenerator || (typeof require !== 'undefined' ? require('./tfvars-generator') : null),
    root.TerraformSourceLoader || (typeof require !== 'undefined' ? require('./source-loader') : null)
  );
  if (typeof module !== 'undefined' && module.exports) module.exports = Generator;
  root.TerraformGenerator = Generator;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (Configuration, Tfvars, SourceLoader) {
  class TerraformGenerator {
    constructor(options = {}) {
      this.loader = options.loader || new SourceLoader(options.basePath);
      this.JSZip = options.JSZip || globalThis.JSZip;
    }

    async generateProject(input) {
      if (!this.JSZip) throw new Error('JSZip is not available.');
      const result = Configuration.validate(input);
      if (!result.valid) throw new Error(result.errors.map(error => error.message).join(' '));
      const config = result.config;
      const variantId = Configuration.variantFor(config);
      const source = await this.loader.loadVariant(variantId);
      const zip = new this.JSZip();

      source.files.forEach(file => zip.file(file.path, file.content));
      source.commonFiles.forEach(file => zip.file(file.path, file.content));
      zip.file('tf/terraform.tfvars', Tfvars.generate(config));
      zip.file('SOURCE_MANIFEST.json', `${JSON.stringify({
        repository: source.manifest.repository,
        commit: source.manifest.commit,
        sourceUrl: source.manifest.sourceUrl,
        variant: variantId,
        upstreamPath: source.variant.upstreamPath,
        generatedBy: 'Platform Deployer'
      }, null, 2)}\n`);

      return {
        blob: await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' }),
        filename: `${config.project_prefix}-aws-${config.enable_private_link ? 'privatelink' : 'standard'}-terraform.zip`,
        config,
        variantId,
        sourceCommit: source.manifest.commit
      };
    }
  }

  return TerraformGenerator;
});
