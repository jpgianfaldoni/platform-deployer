(function () {
  const STORAGE_KEY = 'platform-deployer-config-v1';
  const REGION_NAMES = {
    'ap-northeast-1': 'Asia Pacific (Tokyo)', 'ap-northeast-2': 'Asia Pacific (Seoul)',
    'ap-south-1': 'Asia Pacific (Mumbai)', 'ap-southeast-1': 'Asia Pacific (Singapore)',
    'ap-southeast-2': 'Asia Pacific (Sydney)', 'ca-central-1': 'Canada (Central)',
    'eu-central-1': 'Europe (Frankfurt)', 'eu-west-1': 'Europe (Ireland)',
    'eu-west-2': 'Europe (London)', 'eu-west-3': 'Europe (Paris)',
    'sa-east-1': 'South America (São Paulo)', 'us-east-1': 'US East (N. Virginia)',
    'us-east-2': 'US East (Ohio)', 'us-west-2': 'US West (Oregon)'
  };

  const escapeHtml = value => String(value ?? '').replace(/[&<>'"]/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  })[char]);

  class App {
    constructor() {
      this.config = this.loadConfig();
      this.download = null;
      this.routes = {
        '/': () => this.renderHome(),
        '/select-provider': () => this.renderProviderSelection(),
        '/configure': () => this.renderConfiguration(),
        '/summary': () => this.renderSummary(),
        '/download': () => this.renderDownload(),
        '/reset': () => this.reset()
      };
      this.bindShell();
      this.route();
      this.loadVersion();
      this.registerServiceWorker();
    }

    loadConfig() {
      try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {
          provider: 'aws', project_prefix: 'databricks-workspace', resource_prefix: 'databricks-workspace',
          region: 'us-west-2', availability_zones: ['us-west-2a', 'us-west-2b'], subnet_prefix: 24,
          pricing_tier: 'PREMIUM', network_mode: 'managed', network_configuration: 'standard',
          vpc_cidr_range: '10.0.0.0/16', metastore_mode: 'new', metastore_name: 'databricks-workspace-metastore',
          new_catalog: true, new_cluster: false
        };
      } catch {
        localStorage.removeItem(STORAGE_KEY);
        return {};
      }
    }

    saveConfig() { localStorage.setItem(STORAGE_KEY, JSON.stringify(this.config)); }

    bindShell() {
      window.addEventListener('hashchange', () => this.route());
      window.addEventListener('online', () => this.updateOnlineStatus());
      window.addEventListener('offline', () => this.updateOnlineStatus());
      document.getElementById('theme-toggle').addEventListener('click', () => {
        const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
        document.documentElement.dataset.theme = next;
        localStorage.setItem('platform-deployer-theme', next);
        document.getElementById('theme-color-meta').content = next === 'dark' ? '#0a0e1a' : '#f8fafc';
      });
      this.updateOnlineStatus();
    }

    updateOnlineStatus() { document.getElementById('offline-indicator').hidden = navigator.onLine; }

    route() {
      const path = window.location.hash.slice(1) || '/';
      (this.routes[path] || this.routes['/'])();
      window.scrollTo({ top: 0, behavior: 'instant' });
    }

    render(content) { document.getElementById('app-content').innerHTML = content; }

    updateProgress(step) {
      const indicator = document.getElementById('progress-indicator');
      indicator.hidden = step === 0;
      document.getElementById('progress-bar').style.width = `${step / 3 * 100}%`;
      for (let index = 1; index <= 3; index += 1) {
        document.getElementById(`step-${index}`).classList.toggle('active', index <= step);
      }
    }

    flash(message, type = 'danger') {
      const container = document.getElementById('flash-messages');
      container.innerHTML = `<div class="alert alert-${type} alert-dismissible fade show" role="alert">${escapeHtml(message)}<button type="button" class="btn-close" data-bs-dismiss="alert"></button></div>`;
    }

    renderHome() {
      this.updateProgress(0);
      this.render(`
        <section class="hero-section">
          <div class="container"><div class="row align-items-center min-vh-50">
            <div class="col-lg-6">
              <span class="badge bg-primary-subtle text-primary mb-3">AWS available now</span>
              <h1 class="hero-title">Deploy Databricks Infrastructure in Minutes</h1>
              <p class="hero-subtitle">Choose your AWS topology, review the calculated network, and download the exact pinned Technical Services Terraform code with a ready-to-use <code>terraform.tfvars</code>.</p>
              <div class="hero-cta"><a href="#/select-provider" class="btn btn-primary btn-lg"><i class="bi bi-rocket-takeoff me-2"></i>Get Started</a></div>
              <div class="row mt-5 g-3 stagger-children">
                <div class="col-4"><div class="glass p-3 rounded-3 text-center"><div class="h2 fw-bold mb-1 text-gradient">2</div><div class="text-sm text-muted">Reviewed Sources</div></div></div>
                <div class="col-4"><div class="glass p-3 rounded-3 text-center"><div class="h2 fw-bold mb-1 text-gradient">100%</div><div class="text-sm text-muted">Static & Private</div></div></div>
                <div class="col-4"><div class="glass p-3 rounded-3 text-center"><div class="h2 fw-bold mb-1 text-gradient">0</div><div class="text-sm text-muted">Runtime GitHub Calls</div></div></div>
              </div>
            </div>
            <div class="col-lg-6">
              <div class="hero-illustration animate-fade-up"><div class="hero-terminal">
                <div class="hero-terminal-header"><span class="hero-terminal-dot red"></span><span class="hero-terminal-dot yellow"></span><span class="hero-terminal-dot green"></span></div>
                <div class="hero-terminal-body">
                  <div class="hero-code-line"><span class="prompt">$</span> <span class="command">terraform init</span></div>
                  <div class="hero-code-line"><span class="output">Initializing pinned providers...</span></div>
                  <div class="hero-code-line"><span class="success">✓ Source integrity verified</span></div>
                  <div class="hero-code-line mt-2"><span class="prompt">$</span> <span class="command">terraform apply</span></div>
                  <div class="hero-code-line"><span class="success">✓ Databricks workspace ready</span></div>
                </div>
              </div><div class="hero-float-element aws d-none d-lg-flex align-items-center gap-2"><i class="bi bi-amazon text-warning"></i><span>AWS</span></div></div>
            </div>
          </div></div>
        </section>
        <section class="py-5 bg-surface"><div class="container">
          <div class="row g-4">
            ${this.feature('bi-git', 'Reviewed Terraform', 'Every deployment downloads a pinned Technical Services commit and records its provenance.')}
            ${this.feature('bi-diagram-3-fill', 'Topology-aware tfvars', 'Controls only appear when the selected upstream Terraform example can honor them.')}
            ${this.feature('bi-wifi-off', 'Offline downloads', 'The PWA caches both Terraform variants for reliable same-origin ZIP generation.')}
          </div>
        </div></section>`);
    }

    feature(icon, title, text) {
      return `<div class="col-md-4"><div class="what-we-do-card h-100"><div class="icon-wrapper"><i class="bi ${icon}"></i></div><h4>${title}</h4><p class="text-muted mb-0">${text}</p></div></div>`;
    }

    renderProviderSelection() {
      this.updateProgress(1);
      this.render(`<div class="container my-5 animate-fade-up"><div class="row"><div class="col-lg-10 mx-auto">
        <div class="text-center mb-5"><h1 class="text-gradient mb-3">Choose Your Cloud Provider</h1><p class="lead">AWS is available in this first release. Azure and GCP retain their place in the flow for future expansion.</p></div>
        <div class="row g-4 mb-5 stagger-children">
          ${this.providerCard('aws', 'bi-amazon', 'Amazon Web Services', 'VPC, PrivateLink, Unity Catalog, and existing-network paths.', false)}
          ${this.providerCard('azure', 'bi-microsoft', 'Microsoft Azure', 'Virtual networks and Private Link.', true)}
          ${this.providerCard('gcp', 'bi-google', 'Google Cloud Platform', 'VPC and Private Service Connect.', true)}
        </div>
        <div class="d-flex justify-content-between"><a href="#/" class="btn btn-outline-secondary"><i class="bi bi-arrow-left me-2"></i>Back</a><button id="continue-provider" class="btn btn-primary btn-lg">Continue with AWS<i class="bi bi-arrow-right ms-2"></i></button></div>
      </div></div></div>`);
      document.querySelector('[data-provider="aws"]').classList.add('selected');
      document.getElementById('continue-provider').addEventListener('click', () => {
        this.config.provider = 'aws'; this.saveConfig(); window.location.hash = '/configure';
      });
    }

    providerCard(id, icon, name, description, disabled) {
      return `<div class="col-lg-4"><div class="provider-option ${disabled ? 'provider-disabled' : ''}" data-provider="${id}" aria-disabled="${disabled}"><div class="provider-card ${id} h-100">
        <div class="selection-indicator"><i class="bi bi-check-lg"></i></div>${disabled ? '<span class="coming-soon-badge">Coming Soon</span>' : ''}
        <div class="provider-logo"><i class="bi ${icon}"></i></div><h4>${name}</h4><p>${description}</p>
        <ul class="list-unstyled text-start text-sm"><li><i class="bi ${disabled ? 'bi-clock' : 'bi-check2'} text-success me-2"></i>${disabled ? 'Planned provider' : 'Pinned Technical Services source'}</li></ul>
      </div></div></div>`;
    }

    renderConfiguration() {
      this.updateProgress(2);
      const c = PlatformConfiguration.normalize(this.config);
      const pl = c.enable_private_link;
      const existing = !pl ? c.network_mode === 'existing' : c.network_configuration === 'custom';
      const managed = !existing;
      const fullyPrivate = pl && c.network_configuration === 'fully_private';
      this.render(`<div class="container my-5"><div class="row"><div class="col-xl-9 mx-auto">
        <div class="text-center mb-5"><div class="provider-badge mb-3"><i class="bi bi-amazon text-warning me-2" style="font-size:2rem"></i><span class="h2 fw-bold">AWS Configuration</span></div><p class="lead text-muted">All fields map directly to the selected pinned Terraform example.</p></div>
        <form id="config-form" novalidate>
          ${this.card('bg-primary text-white', 'bi-gear-fill', 'Basic Configuration', this.basicFields(c))}
          ${this.card('bg-success text-white', 'bi-diagram-3-fill', 'Network Configuration', this.networkFields(c, managed, existing, fullyPrivate))}
          ${this.card('bg-warning text-dark', 'bi-shield-check', 'Private Connectivity', this.privateLinkFields(c))}
          ${this.card('bg-info text-dark', 'bi-database-fill', 'Unity Catalog Metastore', this.metastoreFields(c))}
          <div class="accordion mb-4" id="advanced-accordion"><div class="accordion-item"><h2 class="accordion-header"><button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#advanced-fields"><i class="bi bi-sliders me-2"></i>Advanced Configuration</button></h2><div id="advanced-fields" class="accordion-collapse collapse"><div class="accordion-body">${this.advancedFields(c)}</div></div></div></div>
          <div class="d-flex justify-content-between"><a href="#/select-provider" class="btn btn-outline-secondary btn-lg"><i class="bi bi-arrow-left me-2"></i>Back</a><button type="submit" class="btn btn-primary btn-lg">Review Configuration<i class="bi bi-arrow-right ms-2"></i></button></div>
        </form>
      </div></div></div>`);
      this.bindConfigurationForm();
    }

    card(color, icon, title, body) {
      return `<div class="card mb-4"><div class="card-header ${color}"><h5 class="card-title mb-0"><i class="bi ${icon} me-2"></i>${title}</h5></div><div class="card-body">${body}</div></div>`;
    }

    basicFields(c) {
      return `<div class="row g-3">
        ${this.input('project_prefix', 'Project Prefix', c.project_prefix, 'my-databricks-workspace', 'col-md-6', true, 'Used for Databricks resource names.')}
        ${this.select('region', 'AWS Region', c.region, PlatformConfiguration.REGIONS.map(region => [region, `${REGION_NAMES[region]} (${region})`]), 'col-md-6')}
        ${this.input('databricks_account_id', 'Databricks Account ID', c.databricks_account_id, 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', 'col-md-6', true, 'An identifier only; OAuth secrets are never collected.')}
        ${!c.enable_private_link ? this.input('aws_account_id', 'AWS Account ID', c.aws_account_id, '123456789012', 'col-md-6', true, 'Required by the Unity Catalog resources in this source.') : ''}
        ${!c.enable_private_link ? this.select('pricing_tier', 'Pricing Tier', c.pricing_tier, [['PREMIUM', 'Premium'], ['ENTERPRISE', 'Enterprise']], 'col-md-6') : '<div class="col-md-6"><label class="form-label fw-semibold">Pricing Tier</label><input class="form-control" value="Enterprise (required by PrivateLink)" disabled></div>'}
      </div>`;
    }

    networkFields(c, managed, existing, fullyPrivate) {
      const mode = c.enable_private_link
        ? this.select('network_configuration', 'Network Path', c.network_configuration, [['standard', 'Managed VPC — standard NAT'], ['fully_private', 'Managed VPC — fully private'], ['custom', 'Existing custom network']], 'col-md-12')
        : this.select('network_mode', 'Network Path', c.network_mode, [['managed', 'Create a managed VPC'], ['existing', 'Use an existing VPC and subnets']], 'col-md-12');
      const managedFields = `<div class="row g-3 mt-1">
        ${this.input('vpc_cidr_range', 'VPC CIDR', c.vpc_cidr_range, '10.0.0.0/16', 'col-md-6', true)}
        ${this.select('subnet_prefix', 'Workspace Subnet Size', String(c.subnet_prefix), Array.from({ length: 10 }, (_, index) => { const value = String(17 + index); return [value, `/${value}`]; }), 'col-md-6')}
        <div class="col-12"><label class="form-label fw-semibold">Availability Zones <span class="text-danger">*</span></label><div class="zone-grid">${this.zoneOptions(c)}</div><div class="form-text">Choose at least two zones. Workspace subnets are limited to /17 through /26.</div></div>
        <div class="col-12"><div id="network-preview">${this.networkPreview(c)}</div></div>
      </div>`;
      const existingFields = `<div class="row g-3 mt-1">
        ${this.input('vpc_id', 'Existing VPC ID', c.vpc_id, 'vpc-0123456789abcdef0', 'col-md-6', true)}
        ${this.textarea('subnet_ids', 'Workspace Subnet IDs', c.subnet_ids.join('\n'), 'subnet-...\nsubnet-...', 'col-md-6', 'At least two private subnets in different AZs.')}
        ${this.textarea('security_group_ids', 'Workspace Security Group IDs', c.security_group_ids.join('\n'), 'sg-...', 'col-md-6', c.enable_private_link ? 'At least one is required for custom PrivateLink.' : 'Optional; leave empty to let the source create one.')}
        ${c.enable_private_link ? this.input('backend_rest_aws_vpce_id', 'Backend REST VPC Endpoint ID', c.backend_rest_aws_vpce_id, 'vpce-...', 'col-md-6', true) + this.input('backend_relay_aws_vpce_id', 'SCC Relay VPC Endpoint ID', c.backend_relay_aws_vpce_id, 'vpce-...', 'col-md-6', true) : '<div class="col-12"><div class="alert alert-warning mb-0"><i class="bi bi-exclamation-triangle me-2"></i>The non-PrivateLink source does not create AWS service endpoints when reusing a VPC; prepare required routing and endpoints beforehand.</div></div>'}
      </div>`;
      return `${mode}${managed ? managedFields : existingFields}${fullyPrivate ? '<div class="alert alert-info mt-3 mb-0"><i class="bi bi-lock me-2"></i>Fully private mode creates no NAT gateway or internet gateway and uses a dedicated /27 endpoint subnet.</div>' : ''}`;
    }

    privateLinkFields(c) {
      return `<div class="form-check form-switch"><input class="form-check-input" type="checkbox" id="enable_private_link" name="enable_private_link" ${c.enable_private_link ? 'checked' : ''}><label class="form-check-label fw-semibold" for="enable_private_link">Enable AWS PrivateLink</label></div>
        <div class="form-text">Switches the downloaded project to the dedicated Classic PrivateLink source. PrivateLink requires Enterprise tier.</div>
        <div class="alert alert-info mt-3 mb-0"><i class="bi bi-info-circle me-2"></i>${c.enable_private_link ? 'The ZIP will contain aws-byovpc-classic-privatelink.' : 'The ZIP will contain aws-byovpc-uc. Its NAT settings are hard-coded to a single NAT gateway.'}</div>`;
    }

    metastoreFields(c) {
      return `<div class="row g-3">${this.select('metastore_mode', 'Metastore', c.metastore_mode, [['new', 'Create a new metastore'], ['existing', 'Attach an existing metastore']], 'col-md-6')}
        ${c.metastore_mode === 'existing' ? this.input('metastore_id', 'Existing Metastore ID', c.metastore_id, 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', 'col-md-6', true) : this.input('metastore_name', 'New Metastore Name', c.metastore_name, 'my-metastore', 'col-md-6', true)}</div>`;
    }

    advancedFields(c) {
      return `<div class="row g-3">
        ${this.input('resource_prefix', 'AWS Resource Prefix', c.resource_prefix, c.project_prefix, 'col-md-6', true, 'Lowercase letters, numbers, dots, and hyphens; maximum 40 characters.')}
        ${this.textarea('tags', 'AWS Tags', Object.entries(c.tags).map(([key, value]) => `${key}=${value}`).join('\n'), 'Environment=dev\nTeam=data-platform', 'col-md-6', 'One key=value pair per line.')}
        ${this.textarea('sg_egress_ports', 'Security Group Egress Ports', c.sg_egress_ports.join(', '), '443, 2443, 8443', 'col-md-6')}
        ${c.enable_private_link ? this.textarea('additional_egress_ips', 'Additional Egress CIDRs', c.additional_egress_ips.join('\n'), '198.51.100.5/32', 'col-md-6') : this.input('new_security_group_name', 'New Security Group Name', c.new_security_group_name, `${c.resource_prefix}-databricks-sg`, 'col-md-6')}
        ${!c.enable_private_link ? `<div class="col-12"><hr><div class="form-check form-switch"><input class="form-check-input" type="checkbox" name="new_catalog" id="new_catalog" ${c.new_catalog ? 'checked' : ''}><label class="form-check-label fw-semibold" for="new_catalog">Create user-defined Unity Catalog catalog</label></div></div>
          ${this.input('catalog_name', 'Catalog Name Override', c.catalog_name, 'Optional', 'col-md-4')}${this.input('external_location_name', 'External Location Override', c.external_location_name, 'Optional', 'col-md-4')}${this.input('storage_credential_name', 'Storage Credential Override', c.storage_credential_name, 'Optional', 'col-md-4')}
          <div class="col-12"><div class="form-check form-switch"><input class="form-check-input" type="checkbox" name="new_cluster" id="new_cluster" ${c.new_cluster ? 'checked' : ''}><label class="form-check-label fw-semibold" for="new_cluster">Create validation cluster</label></div></div>
          ${this.input('cluster_autotermination_minutes', 'Cluster Auto-termination (minutes)', c.cluster_autotermination_minutes, '10', 'col-md-4', false, 'Minimum 10 minutes.', 'number', '10')}` : ''}
      </div>`;
    }

    input(name, label, value, placeholder, width = 'col-md-6', required = false, help = '', type = 'text', min = '') {
      return `<div class="${width}"><label class="form-label fw-semibold" for="${name}">${label}${required ? ' <span class="text-danger">*</span>' : ''}</label><input type="${type}" class="form-control" id="${name}" name="${name}" value="${escapeHtml(value)}" placeholder="${escapeHtml(placeholder)}" ${required ? 'required' : ''} ${min ? `min="${min}"` : ''}>${help ? `<div class="form-text">${help}</div>` : ''}<div class="invalid-feedback"></div></div>`;
    }

    textarea(name, label, value, placeholder, width = 'col-md-6', help = '') {
      return `<div class="${width}"><label class="form-label fw-semibold" for="${name}">${label}</label><textarea class="form-control" id="${name}" name="${name}" rows="3" placeholder="${escapeHtml(placeholder)}">${escapeHtml(value)}</textarea>${help ? `<div class="form-text">${help}</div>` : ''}<div class="invalid-feedback"></div></div>`;
    }

    select(name, label, selected, options, width = 'col-md-6') {
      return `<div class="${width}"><label class="form-label fw-semibold" for="${name}">${label}</label><select class="form-select" id="${name}" name="${name}">${options.map(([value, text]) => `<option value="${escapeHtml(value)}" ${String(value) === String(selected) ? 'selected' : ''}>${escapeHtml(text)}</option>`).join('')}</select><div class="invalid-feedback"></div></div>`;
    }

    zoneOptions(c) {
      return ['a', 'b', 'c', 'd', 'e', 'f'].map(letter => {
        const zone = `${c.region}${letter}`;
        return `<label class="zone-option"><input class="form-check-input" type="checkbox" name="availability_zones" value="${zone}" ${c.availability_zones.includes(zone) ? 'checked' : ''}><span>${zone}</span></label>`;
      }).join('');
    }

    networkPreview(c) {
      if (c.network_error) return `<div class="alert alert-danger mb-0"><i class="bi bi-exclamation-triangle me-2"></i>${escapeHtml(c.network_error)}</div>`;
      if (!c.calculated_subnets.length) return '';
      return `<div class="subnet-preview"><h6><i class="bi bi-calculator me-2"></i>Calculated subnet allocation</h6><div class="row g-2">${c.calculated_subnets.map(subnet => `<div class="col-md-6"><div class="subnet-preview-item"><span class="badge bg-${subnet.type === 'private' ? 'primary' : subnet.type === 'public' ? 'success' : 'info'}">${subnet.type}</span><code>${subnet.cidr}</code><small>${subnet.zone}</small></div></div>`).join('')}</div></div>`;
    }

    collectForm() {
      const form = document.getElementById('config-form');
      const data = Object.fromEntries(new FormData(form).entries());
      data.availability_zones = new FormData(form).getAll('availability_zones');
      data.enable_private_link = document.getElementById('enable_private_link').checked;
      data.new_catalog = document.getElementById('new_catalog')?.checked ?? this.config.new_catalog ?? true;
      data.new_cluster = document.getElementById('new_cluster')?.checked ?? this.config.new_cluster ?? false;
      return { ...this.config, ...data };
    }

    bindConfigurationForm() {
      const form = document.getElementById('config-form');
      const rerenderNames = ['enable_private_link', 'network_mode', 'network_configuration', 'metastore_mode', 'region'];
      rerenderNames.forEach(name => document.querySelector(`[name="${name}"]`)?.addEventListener('change', event => {
        const previousRegion = this.config.region;
        this.config = this.collectForm();
        if (name === 'region' && previousRegion !== this.config.region) this.config.availability_zones = [`${this.config.region}a`, `${this.config.region}b`];
        if (name === 'enable_private_link') {
          this.config.enable_private_link = event.target.checked;
          this.config.network_configuration ||= 'standard';
          this.config.network_mode ||= 'managed';
        }
        this.saveConfig(); this.renderConfiguration();
      }));
      ['vpc_cidr_range', 'subnet_prefix'].forEach(name => document.querySelector(`[name="${name}"]`)?.addEventListener('input', () => this.refreshPreview()));
      document.querySelectorAll('[name="availability_zones"]').forEach(field => field.addEventListener('change', () => this.refreshPreview()));
      form.addEventListener('submit', event => {
        event.preventDefault();
        const result = PlatformConfiguration.validate(this.collectForm());
        form.querySelectorAll('.is-invalid').forEach(field => field.classList.remove('is-invalid'));
        if (!result.valid) {
          result.errors.forEach(error => {
            const field = form.querySelector(`[name="${error.field}"]`);
            if (field) { field.classList.add('is-invalid'); const feedback = field.parentElement.querySelector('.invalid-feedback'); if (feedback) feedback.textContent = error.message; }
          });
          this.flash(result.errors[0].message);
          form.querySelector('.is-invalid')?.focus();
          return;
        }
        this.config = result.config; this.saveConfig(); window.location.hash = '/summary';
      });
    }

    refreshPreview() {
      const normalized = PlatformConfiguration.normalize(this.collectForm());
      const preview = document.getElementById('network-preview');
      if (preview) preview.innerHTML = this.networkPreview(normalized);
    }

    renderSummary() {
      const result = PlatformConfiguration.validate(this.config);
      if (!result.valid) { window.location.hash = '/configure'; return; }
      const c = result.config;
      this.updateProgress(3);
      const topology = c.enable_private_link ? c.network_configuration : c.network_mode;
      this.render(`<div class="container my-5"><div class="row"><div class="col-lg-9 mx-auto">
        <div class="text-center mb-5"><i class="bi bi-clipboard-check text-success" style="font-size:4rem"></i><h1 class="text-gradient mt-3">Review Configuration</h1><p class="lead">The selected Terraform source and generated values are ready to package.</p></div>
        ${this.card('bg-primary text-white', 'bi-list-check', 'Deployment Summary', `<div class="summary-grid">${this.summaryItem('Project', c.project_prefix)}${this.summaryItem('Region', c.region)}${this.summaryItem('PrivateLink', c.enable_private_link ? 'Enabled' : 'Disabled')}${this.summaryItem('Network path', topology)}${this.summaryItem('Pricing tier', c.pricing_tier)}${this.summaryItem('Metastore', c.metastore_mode === 'existing' ? 'Existing' : c.metastore_name)}</div>`)}
        ${this.card('bg-success text-white', 'bi-box-seam', 'Download Contents', `<ul class="mb-0"><li>Unmodified upstream <code>README.md</code> and <code>tf/*.tf</code></li><li>Generated <code>tf/terraform.tfvars</code></li><li>Databricks <code>LICENSE.md</code> and <code>NOTICE.md</code></li><li><code>SOURCE_MANIFEST.json</code> with the exact upstream commit</li></ul>`)}
        <div class="alert alert-warning"><i class="bi bi-exclamation-triangle me-2"></i>Review the Terraform plan before applying. Network registrations and VPC endpoint registrations are difficult to change after workspace creation.</div>
        <div class="d-flex justify-content-between"><a href="#/configure" class="btn btn-outline-secondary btn-lg"><i class="bi bi-arrow-left me-2"></i>Edit</a><button id="generate-project" class="btn btn-primary btn-lg"><i class="bi bi-download me-2"></i>Generate Terraform ZIP</button></div>
      </div></div></div>`);
      document.getElementById('generate-project').addEventListener('click', () => this.generateAndDownload());
    }

    summaryItem(label, value) { return `<div class="summary-item"><span>${label}</span><strong>${escapeHtml(value)}</strong></div>`; }

    async generateAndDownload() {
      this.showLoading(true);
      try {
        const generator = new TerraformGenerator();
        this.download = await generator.generateProject(this.config);
        this.triggerDownload();
        window.location.hash = '/download';
      } catch (error) {
        this.flash(`Could not generate the project: ${error.message}`);
      } finally {
        this.showLoading(false);
      }
    }

    triggerDownload() {
      if (!this.download) return;
      const url = URL.createObjectURL(this.download.blob);
      const anchor = document.createElement('a'); anchor.href = url; anchor.download = this.download.filename; anchor.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }

    renderDownload() {
      const c = PlatformConfiguration.normalize(this.config);
      this.updateProgress(3);
      this.render(`<div class="container my-5"><div class="row"><div class="col-lg-8 mx-auto text-center">
        <div class="success-checkmark mb-4"><i class="bi bi-check-circle-fill text-success" style="font-size:5rem"></i></div><h1 class="text-gradient">Terraform Project Ready</h1>
        <p class="lead mb-4">${this.download ? `<strong>${escapeHtml(this.download.filename)}</strong> was generated from Technical Services commit <code>${escapeHtml(this.download.sourceCommit.slice(0, 12))}</code>.` : 'Generate the ZIP again to download this saved configuration.'}</p>
        <div class="card mb-4 text-start"><div class="card-body"><h5>Next steps</h5><ol class="mb-0"><li>Extract the ZIP.</li><li>Open the extracted <code>tf/</code> directory.</li><li>Configure AWS credentials and Databricks OAuth environment variables described in the upstream README.</li><li>Run <code>terraform init</code>, <code>terraform plan</code>, then <code>terraform apply</code>.</li></ol></div></div>
        <div class="d-flex gap-3 justify-content-center"><button id="download-again" class="btn btn-primary btn-lg"><i class="bi bi-download me-2"></i>${this.download ? 'Download Again' : 'Generate ZIP'}</button><a href="#/select-provider" class="btn btn-outline-secondary btn-lg">Create Another</a></div>
      </div></div></div>`);
      document.getElementById('download-again').addEventListener('click', () => this.download ? this.triggerDownload() : this.generateAndDownload());
    }

    showLoading(show) { document.getElementById('loading-overlay').classList.toggle('d-none', !show); }

    reset() {
      localStorage.removeItem(STORAGE_KEY); this.config = this.loadConfig(); this.download = null; window.location.hash = '/';
    }

    async loadVersion() {
      try {
        const response = await fetch('./version.json', { cache: 'no-store' });
        if (!response.ok) return;
        const version = await response.json();
        document.getElementById('deploy-version').textContent = `App ${String(version.appCommit).slice(0, 7)} · Terraform ${String(version.terraformCommit).slice(0, 7)}`;
      } catch { /* Local source mode has no generated version file. */ }
    }

    registerServiceWorker() {
      if ('serviceWorker' in navigator && location.protocol !== 'file:') {
        navigator.serviceWorker.register('./sw.js').catch(error => console.warn('Service worker registration failed', error));
      }
    }
  }

  window.addEventListener('DOMContentLoaded', () => { window.app = new App(); });
})();
