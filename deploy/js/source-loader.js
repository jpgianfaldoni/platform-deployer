(function (root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.TerraformSourceLoader = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  class SourceLoader {
    constructor(basePath = './terraform-sources') {
      this.basePath = basePath.replace(/\/$/, '');
      this.manifest = null;
    }

    async loadManifest() {
      if (this.manifest) return this.manifest;
      const response = await fetch(`${this.basePath}/manifest.json`, { cache: 'no-store' });
      if (!response.ok) throw new Error(`Unable to load Terraform source manifest (${response.status}).`);
      this.manifest = await response.json();
      return this.manifest;
    }

    async fetchVerified(path, expectedHash) {
      const response = await fetch(`${this.basePath}/${path}`);
      if (!response.ok) throw new Error(`Unable to load vendored Terraform file ${path}.`);
      const content = await response.arrayBuffer();
      if (globalThis.crypto?.subtle && expectedHash) {
        const digest = await globalThis.crypto.subtle.digest('SHA-256', content);
        const actual = [...new Uint8Array(digest)].map(value => value.toString(16).padStart(2, '0')).join('');
        if (actual !== expectedHash) throw new Error(`Integrity check failed for ${path}.`);
      }
      return content;
    }

    async loadVariant(id) {
      const manifest = await this.loadManifest();
      const variant = manifest.variants[id];
      if (!variant) throw new Error(`Unknown Terraform source variant: ${id}`);
      const files = await Promise.all(variant.files.map(async file => ({
        path: file.path,
        content: await this.fetchVerified(`${manifest.commit}/${id}/${file.path}`, file.sha256)
      })));
      return { manifest, variant, files };
    }
  }

  return SourceLoader;
});
