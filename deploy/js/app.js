/**
 * Main Application - SPA Router and Application Logic
 */

class App {
  constructor() {
    this.currentConfig = Utils.getStorage('config') || {};
    this.currentProvider = Utils.getStorage('provider') || null;
    this.currentStep = Utils.getStorage('step') || 0;
    
    this.routes = {
      '/': this.renderHome.bind(this),
      '/select-provider': this.renderProviderSelection.bind(this),
      '/configure': this.renderConfiguration.bind(this),
      '/summary': this.renderSummary.bind(this),
      '/download': this.renderDownload.bind(this),
      '/reset': this.handleReset.bind(this)
    };
    
    this.init();
  }

  /**
   * Get official regions list for a cloud provider organized by geographic groups
   * Returns array of group objects with name and regions array
   * Only includes regions officially supported by Databricks
   */
  getRegions(provider) {
    const regions = {
      aws: [
        {
          group: 'United States',
          regions: [
            { code: 'us-east-1', name: 'US East (N. Virginia)' },
            { code: 'us-east-2', name: 'US East (Ohio)' },
            { code: 'us-west-1', name: 'US West (N. California)' },
            { code: 'us-west-2', name: 'US West (Oregon)' }
          ]
        },
        {
          group: 'Canada',
          regions: [
            { code: 'ca-central-1', name: 'Canada (Central)' }
          ]
        },
        {
          group: 'Europe',
          regions: [
            { code: 'eu-central-1', name: 'Europe (Frankfurt)' },
            { code: 'eu-west-1', name: 'Europe (Ireland)' },
            { code: 'eu-west-2', name: 'Europe (London)' },
            { code: 'eu-west-3', name: 'Europe (Paris)' }
          ]
        },
        {
          group: 'Asia Pacific',
          regions: [
            { code: 'ap-northeast-1', name: 'Asia Pacific (Tokyo)' },
            { code: 'ap-northeast-2', name: 'Asia Pacific (Seoul)' },
            { code: 'ap-south-1', name: 'Asia Pacific (Mumbai)' },
            { code: 'ap-southeast-1', name: 'Asia Pacific (Singapore)' },
            { code: 'ap-southeast-2', name: 'Asia Pacific (Sydney)' },
            { code: 'ap-southeast-3', name: 'Asia Pacific (Jakarta)' }
          ]
        },
        {
          group: 'South America',
          regions: [
            { code: 'sa-east-1', name: 'South America (São Paulo)' }
          ]
        }
      ],
      azure: [
        {
          group: 'United States',
          regions: [
            { code: 'centralus', name: 'Central US' },
            { code: 'eastus', name: 'East US' },
            { code: 'eastus2', name: 'East US 2' },
            { code: 'northcentralus', name: 'North Central US' },
            { code: 'southcentralus', name: 'South Central US' },
            { code: 'westus', name: 'West US' },
            { code: 'westus2', name: 'West US 2' },
            { code: 'westus3', name: 'West US 3' }
          ]
        },
        {
          group: 'Canada',
          regions: [
            { code: 'canadacentral', name: 'Canada Central' },
            { code: 'canadaeast', name: 'Canada East' }
          ]
        },
        {
          group: 'Europe',
          regions: [
            { code: 'francecentral', name: 'France Central' },
            { code: 'germanywestcentral', name: 'Germany West Central' },
            { code: 'northeurope', name: 'North Europe' },
            { code: 'norwayeast', name: 'Norway East' },
            { code: 'norwaywest', name: 'Norway West' },
            { code: 'switzerlandnorth', name: 'Switzerland North' },
            { code: 'switzerlandwest', name: 'Switzerland West' },
            { code: 'uksouth', name: 'UK South' },
            { code: 'ukwest', name: 'UK West' },
            { code: 'westeurope', name: 'West Europe' }
          ]
        },
        {
          group: 'Asia Pacific',
          regions: [
            { code: 'australiaeast', name: 'Australia East' },
            { code: 'australiasoutheast', name: 'Australia Southeast' },
            { code: 'centralindia', name: 'India Central' },
            { code: 'eastasia', name: 'East Asia' },
            { code: 'japaneast', name: 'Japan East' },
            { code: 'japanwest', name: 'Japan West' },
            { code: 'koreacentral', name: 'Korea Central' },
            { code: 'koreasouth', name: 'Korea South' },
            { code: 'southindia', name: 'India South' },
            { code: 'southeastasia', name: 'Southeast Asia' }
          ]
        },
        {
          group: 'Middle East & Africa',
          regions: [
            { code: 'southafricanorth', name: 'South Africa North' },
            { code: 'southafricawest', name: 'South Africa West' },
            { code: 'uaenorth', name: 'UAE North' }
          ]
        },
        {
          group: 'South America',
          regions: [
            { code: 'brazilsouth', name: 'Brazil South' }
          ]
        }
      ],
      gcp: [
        {
          group: 'United States',
          regions: [
            { code: 'us-central1', name: 'US Central (Iowa)' },
            { code: 'us-east1', name: 'US East (South Carolina)' },
            { code: 'us-east4', name: 'US East (Northern Virginia)' },
            { code: 'us-west1', name: 'US West (Oregon)' },
            { code: 'us-west4', name: 'US West (Las Vegas)' }
          ]
        },
        {
          group: 'Canada',
          regions: [
            { code: 'northamerica-northeast1', name: 'North America Northeast (Montréal)' }
          ]
        },
        {
          group: 'Europe',
          regions: [
            { code: 'europe-west1', name: 'Europe West (Belgium)' },
            { code: 'europe-west2', name: 'Europe West (London)' },
            { code: 'europe-west3', name: 'Europe West (Frankfurt)' }
          ]
        },
        {
          group: 'Asia Pacific',
          regions: [
            { code: 'asia-northeast1', name: 'Asia Northeast (Tokyo)' },
            { code: 'asia-south1', name: 'Asia South (Mumbai)' },
            { code: 'asia-southeast1', name: 'Asia Southeast (Singapore)' }
          ]
        },
        {
          group: 'Australia',
          regions: [
            { code: 'australia-southeast1', name: 'Australia Southeast (Sydney)' }
          ]
        },
        {
          group: 'South America',
          regions: [
            { code: 'southamerica-east1', name: 'South America East (São Paulo)' }
          ]
        }
      ]
    };

    return regions[provider?.toLowerCase()] || [];
  }

  /**
   * Render region select options with optgroups
   * First region is selected by default if no selectedRegion is provided
   */
  renderRegionOptions(provider, selectedRegion) {
    const groups = this.getRegions(provider);
    let html = '';
    let isFirst = true;
    
    groups.forEach(group => {
      html += `<optgroup label="${group.group}">`;
      group.regions.forEach(region => {
        // Select first region by default if no selectedRegion provided
        const isSelected = selectedRegion ? selectedRegion === region.code : isFirst;
        const selected = isSelected ? 'selected' : '';
        html += `<option value="${region.code}" ${selected}>${region.name} (${region.code})</option>`;
        isFirst = false;
      });
      html += '</optgroup>';
    });
    
    return html;
  }

  /**
   * Render pricing tier options for a provider
   * @param {string} provider - Cloud provider (aws, azure, gcp)
   * @param {string} selectedTier - Currently selected tier
   * @returns {string} HTML options for the pricing tier select
   */
  renderPricingTierOptions(provider, selectedTier) {
    const tiers = provider === 'aws' 
      ? [
          { value: 'STANDARD', label: 'Standard' },
          { value: 'PREMIUM', label: 'Premium' },
          { value: 'ENTERPRISE', label: 'Enterprise' }
        ]
      : [
          { value: 'STANDARD', label: 'Standard' },
          { value: 'PREMIUM', label: 'Premium' }
        ];
    
    // Default to the last tier if no selectedTier is provided
    const defaultTier = tiers[tiers.length - 1].value;
    const effectiveSelection = selectedTier || defaultTier;
    
    return tiers.map(tier => {
      const selected = tier.value === effectiveSelection ? 'selected' : '';
      return `<option value="${tier.value}" ${selected}>${tier.label}</option>`;
    }).join('');
  }

  /**
   * Get availability zone limits for a provider
   */
  getAvailabilityZoneLimits(provider) {
    const limits = {
      aws: { min: 2, max: 6 },
      azure: { min: 1, max: 3 },
      gcp: { min: 2, max: 6 }
    };
    return limits[provider?.toLowerCase()] || { min: 1, max: 3 };
  }

  /**
   * Generate availability zone options based on provider and region
   */
  getAvailabilityZoneOptions(provider, region) {
    if (!provider || !region) {
      return [];
    }

    const zones = [];
    
    if (provider === 'aws') {
      // AWS zones: typically a, b, c, d, e, f
      const zoneLetters = ['a', 'b', 'c', 'd', 'e', 'f'];
      zoneLetters.forEach(letter => {
        zones.push({
          value: `${region}${letter}`,
          label: `${region}${letter}`
        });
      });
    } else if (provider === 'azure') {
      // Azure zones: numeric 1, 2, 3
      [1, 2, 3].forEach(num => {
        zones.push({
          value: String(num),
          label: `Zone ${num}`
        });
      });
    } else if (provider === 'gcp') {
      // GCP zones: typically a, b, c, d, e, f
      const zoneLetters = ['a', 'b', 'c', 'd', 'e', 'f'];
      zoneLetters.forEach(letter => {
        zones.push({
          value: `${region}-${letter}`,
          label: `${region}-${letter}`
        });
      });
    }
    
    return zones;
  }

  /**
   * Get currently selected availability zones
   */
  getSelectedAvailabilityZones() {
    const azSelect = document.getElementById('availability-zones-select');
    if (!azSelect) return [];
    
    // Check if Choices.js is initialized
    if (azSelect.choices) {
      return azSelect.choices.getValue(true) || [];
    }
    
    // Fallback: get from select options
    return Array.from(azSelect.selectedOptions)
      .map(option => option.value)
      .filter(value => value);
  }

  /**
   * Render availability zone select options, excluding already selected zones
   */
  renderAvailabilityZoneOptions(provider, region, selectedZone, excludeSelected = true) {
    const zones = this.getAvailabilityZoneOptions(provider, region);
    let html = '<option value="">Select availability zone</option>';
    
    // Get currently selected zones to exclude (if excludeSelected is true)
    let selectedZones = [];
    if (excludeSelected) {
      selectedZones = this.getSelectedAvailabilityZones();
    }
    
    zones.forEach(zone => {
      // Skip if zone is already selected (unless it's the current select's value)
      if (excludeSelected && selectedZones.includes(zone.value) && zone.value !== selectedZone) {
        return;
      }
      
      const selected = selectedZone === zone.value ? 'selected' : '';
      html += `<option value="${zone.value}" ${selected}>${zone.label}</option>`;
    });
    
    return html;
  }

  init() {
    // Setup navigation
    this.setupNavigation();
    
    // Handle hash routing
    window.addEventListener('hashchange', () => this.handleRoute());
    window.addEventListener('load', () => this.handleRoute());
    
    // Update progress
    if (this.currentStep > 0) {
      Utils.updateProgress(this.currentStep);
    }
    
    // Update navbar based on provider selection
    this.updateNavbar();
    
    // Check and show install prompt on navigation
    this.checkInstallPrompt();
  }

  updateNavbar() {
    const changeProviderNav = document.getElementById('change-provider-nav');
    if (changeProviderNav) {
      if (this.currentProvider) {
        changeProviderNav.style.display = 'block';
      } else {
        changeProviderNav.style.display = 'none';
      }
    }
  }

  checkInstallPrompt() {
    // Show install banner after user interacts with the app
    // This provides better UX than showing immediately
    setTimeout(() => {
      if (window.deferredPrompt && !localStorage.getItem('pwa-install-dismissed')) {
        const banner = document.getElementById('install-banner');
        if (banner && banner.style.display === 'none') {
          banner.style.display = 'block';
        }
      }
    }, 3000); // Show after 3 seconds of interaction
  }

  setupNavigation() {
    // Handle all navigation links
    document.querySelectorAll('[data-navigate]').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const href = link.getAttribute('href');
        if (href) {
          window.location.hash = href.replace('#', '');
        }
      });
    });
  }

  handleRoute() {
    const hash = window.location.hash.slice(1) || '/';
    const route = hash.split('?')[0];
    const handler = this.routes[route] || this.routes['/'];
    
    if (handler) {
      handler();
    }
    
    // Check install prompt after route change
    this.checkInstallPrompt();
  }

  // Route Handlers
  renderHome() {
    const content = `
      <!-- Hero Section -->
      <section class="hero-section">
        <div class="container">
          <div class="row align-items-center min-vh-50">
            <div class="col-lg-6">
              <h1 class="hero-title">
                Deploy Databricks Infrastructure in Minutes
              </h1>
              <p class="hero-subtitle">
                One-Click Deployer simplifies Databricks infrastructure deployment across AWS, Azure, and GCP. 
                Transform complex Terraform configurations into a simple, guided experience with intelligent automation.
              </p>
              <div class="hero-cta">
                <a href="#/select-provider" class="btn btn-primary btn-lg" data-navigate>
                  <i class="bi bi-rocket-takeoff me-2" aria-hidden="true"></i>
                  Get Started
                </a>
                <button class="btn btn-outline-primary btn-lg" id="hero-install-btn" style="display: none;">
                  <i class="bi bi-download me-2" aria-hidden="true"></i>
                  Install App
                </button>
              </div>
              
              <!-- Quick Stats -->
              <div class="row mt-5 g-3 stagger-children">
                <div class="col-4">
                  <div class="glass p-3 rounded-3 text-center">
                    <div class="h2 fw-bold mb-1 text-gradient">3</div>
                    <div class="text-sm text-muted">Cloud Providers</div>
                  </div>
                </div>
                <div class="col-4">
                  <div class="glass p-3 rounded-3 text-center">
                    <div class="h2 fw-bold mb-1 text-gradient">90%</div>
                    <div class="text-sm text-muted">Time Saved</div>
                  </div>
                </div>
                <div class="col-4">
                  <div class="glass p-3 rounded-3 text-center">
                    <div class="h2 fw-bold mb-1 text-gradient">100%</div>
                    <div class="text-sm text-muted">Best Practices</div>
                  </div>
                </div>
              </div>
            </div>
            <div class="col-lg-6">
              <div class="hero-illustration animate-fade-up" style="animation-delay: 0.3s;">
                <div class="hero-terminal">
                  <div class="hero-terminal-header">
                    <span class="hero-terminal-dot red"></span>
                    <span class="hero-terminal-dot yellow"></span>
                    <span class="hero-terminal-dot green"></span>
                  </div>
                  <div class="hero-terminal-body">
                    <div class="hero-code-line"><span class="prompt">$</span> <span class="command">terraform init</span></div>
                    <div class="hero-code-line"><span class="output">Initializing provider plugins...</span></div>
                    <div class="hero-code-line"><span class="success">✓ Provider configured successfully</span></div>
                    <div class="hero-code-line mt-2"><span class="prompt">$</span> <span class="command">terraform apply</span></div>
                    <div class="hero-code-line"><span class="output">Creating Databricks workspace...</span></div>
                    <div class="hero-code-line"><span class="success">✓ Apply complete\! Resources: 12 added</span></div>
                  </div>
                </div>
                <!-- Floating provider badges -->
                <div class="hero-float-element aws d-none d-lg-flex align-items-center gap-2">
                  <i class="bi bi-cloud text-warning"></i>
                  <span class="text-sm">AWS</span>
                </div>
                <div class="hero-float-element azure d-none d-lg-flex align-items-center gap-2">
                  <i class="bi bi-cloud text-info"></i>
                  <span class="text-sm">Azure</span>
                </div>
                <div class="hero-float-element gcp d-none d-lg-flex align-items-center gap-2">
                  <i class="bi bi-cloud text-primary-accent"></i>
                  <span class="text-sm">GCP</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- What We Do Section -->
      <section class="what-we-do-section">
        <div class="container">
          <div class="row">
            <div class="col-lg-10 mx-auto text-center mb-5">
              <h2 class="h1 fw-bold mb-3">What We Do</h2>
              <p class="lead text-muted mb-5">
                One-Click Deployer is a Progressive Web App (PWA) that generates production-ready Terraform configurations 
                for Databricks workspaces across multiple cloud providers. We eliminate the complexity of infrastructure 
                as code by providing an intuitive, visual interface that handles all the technical details for you.
              </p>
            </div>
          </div>
          
          <div class="row g-4">
            <div class="col-md-6 col-lg-4">
              <div class="what-we-do-card">
                <div class="icon-wrapper">
                  <i class="bi bi-code-slash" aria-hidden="true"></i>
                </div>
                <h4 class="fw-bold mb-3">Generate Terraform Code</h4>
                <p class="text-muted mb-0">
                  Automatically generate complete Terraform projects with all necessary files, modules, and configurations. 
                  No manual coding required—just fill out a simple form.
                </p>
              </div>
            </div>
            
            <div class="col-md-6 col-lg-4">
              <div class="what-we-do-card">
                <div class="icon-wrapper">
                  <i class="bi bi-calculator" aria-hidden="true"></i>
                </div>
                <h4 class="fw-bold mb-3">Smart Network Calculations</h4>
                <p class="text-muted mb-0">
                  Our intelligent calculator automatically determines optimal subnet allocations, CIDR blocks, and network 
                  configurations based on your requirements and cloud provider best practices.
                </p>
              </div>
            </div>
            
            <div class="col-md-6 col-lg-4">
              <div class="what-we-do-card">
                <div class="icon-wrapper">
                  <i class="bi bi-shield-check" aria-hidden="true"></i>
                </div>
                <h4 class="fw-bold mb-3">Enterprise Security</h4>
                <p class="text-muted mb-0">
                  Built-in security configurations including private connectivity options (PrivateLink, Private Service Connect), 
                  IAM roles, and network isolation following cloud provider security best practices.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Why Install Locally Section - HIGHLIGHTED -->
      <section class="py-5">
        <div class="container">
          <div class="install-section">
            <div class="install-icon">
              <i class="bi bi-phone" aria-hidden="true"></i>
            </div>
            <div class="text-center mb-5">
              <h2 class="h1 fw-bold mb-3">Why Install One-Click Deployer Locally?</h2>
              <p class="lead text-muted mb-4">
                Install this Progressive Web App on your device for the best experience. Get instant access, 
                work offline, and enjoy native app performance—all while keeping your data private and secure.
              </p>
            </div>
            
            <div class="row g-4 mb-5">
              <div class="col-md-6 col-lg-4">
                <div class="install-benefit-card">
                  <div class="benefit-icon">
                    <i class="bi bi-wifi-off" aria-hidden="true"></i>
                  </div>
                  <h5 class="fw-bold">Complete Offline Access</h5>
                  <p>
                    Use the app even without an internet connection. All functionality works offline, so you can generate 
                    Terraform configurations anywhere, anytime.
                  </p>
                </div>
              </div>
              
              <div class="col-md-6 col-lg-4">
                <div class="install-benefit-card">
                  <div class="benefit-icon">
                    <i class="bi bi-lightning-charge" aria-hidden="true"></i>
                  </div>
                  <h5 class="fw-bold">Faster Performance</h5>
                  <p>
                    Installed apps load instantly and run smoother than web versions. Experience native app performance 
                    with faster response times and seamless interactions.
                  </p>
                </div>
              </div>
              
              <div class="col-md-6 col-lg-4">
                <div class="install-benefit-card">
                  <div class="benefit-icon">
                    <i class="bi bi-app" aria-hidden="true"></i>
                  </div>
                  <h5 class="fw-bold">Native App Experience</h5>
                  <p>
                    Access the app directly from your home screen with a dedicated icon. Enjoy a full-screen experience 
                    without browser chrome, just like a native application.
                  </p>
                </div>
              </div>
              
              <div class="col-md-6 col-lg-4">
                <div class="install-benefit-card">
                  <div class="benefit-icon">
                    <i class="bi bi-shield-lock" aria-hidden="true"></i>
                  </div>
                  <h5 class="fw-bold">Enhanced Privacy & Security</h5>
                  <p>
                    All processing happens locally on your device. Your configurations and data never leave your machine, 
                    ensuring complete privacy and security.
                  </p>
                </div>
              </div>
              
              <div class="col-md-6 col-lg-4">
                <div class="install-benefit-card">
                  <div class="benefit-icon">
                    <i class="bi bi-arrow-repeat" aria-hidden="true"></i>
                  </div>
                  <h5 class="fw-bold">Automatic Updates</h5>
                  <p>
                    The app automatically updates in the background, ensuring you always have the latest features and 
                    improvements without manual intervention.
                  </p>
                </div>
              </div>
              
              <div class="col-md-6 col-lg-4">
                <div class="install-benefit-card">
                  <div class="benefit-icon">
                    <i class="bi bi-speedometer2" aria-hidden="true"></i>
                  </div>
                  <h5 class="fw-bold">Quick Access</h5>
                  <p>
                    Launch the app instantly from your home screen or app drawer. No need to remember URLs or bookmark 
                    pages—just tap and go.
                  </p>
                </div>
              </div>
            </div>
            
            <div class="install-cta">
              <button class="btn btn-primary btn-install-large" id="install-btn-hero">
                <i class="bi bi-download me-2" aria-hidden="true"></i>
                Install One-Click Deployer Now
              </button>
              <p class="text-muted small mt-3 mb-0">
                <i class="bi bi-info-circle me-1" aria-hidden="true"></i>
                Installation is free and takes less than a minute. Works on desktop and mobile devices.
              </p>
            </div>
          </div>
        </div>
      </section>

      <!-- Features Section -->
      <section class="py-5">
        <div class="container">
          <div class="row">
            <div class="col-lg-8 mx-auto text-center mb-5">
              <h2 class="h1 fw-bold mb-3">Why Choose One-Click Deployer?</h2>
              <p class="lead text-muted">
                Eliminate the complexity barrier in Databricks infrastructure deployment 
                with our intuitive, production-ready solution.
              </p>
            </div>
          </div>
          
          <div class="row g-4 stagger-children">
            <div class="col-md-6 col-lg-4">
              <div class="card h-100">
                <div class="card-body p-4 text-center">
                  <div class="feature-icon icon-cyan">
                    <i class="bi bi-lightning-charge-fill" aria-hidden="true"></i>
                  </div>
                  <h5 class="fw-bold">Zero Terraform Knowledge Required</h5>
                  <p class="mb-0">
                    Visual forms replace complex code writing. Anyone can deploy 
                    enterprise-grade infrastructure without deep technical expertise.
                  </p>
                </div>
              </div>
            </div>
            
            <div class="col-md-6 col-lg-4">
              <div class="card h-100">
                <div class="card-body p-4 text-center">
                  <div class="feature-icon icon-green">
                    <i class="bi bi-shield-check" aria-hidden="true"></i>
                  </div>
                  <h5 class="fw-bold">Production-Ready Output</h5>
                  <p class="mb-0">
                    Generated code follows enterprise best practices with built-in 
                    security, networking, and compliance configurations.
                  </p>
                </div>
              </div>
            </div>
            
            <div class="col-md-6 col-lg-4">
              <div class="card h-100">
                <div class="card-body p-4 text-center">
                  <div class="feature-icon icon-blue">
                    <i class="bi bi-clouds-fill" aria-hidden="true"></i>
                  </div>
                  <h5 class="fw-bold">Multi-Cloud Native</h5>
                  <p class="mb-0">
                    Single interface for AWS, Azure, and GCP. Deploy consistently 
                    across all major cloud providers with provider-specific optimizations.
                  </p>
                </div>
              </div>
            </div>
            
            <div class="col-md-6 col-lg-4">
              <div class="card h-100">
                <div class="card-body p-4 text-center">
                  <div class="feature-icon icon-amber">
                    <i class="bi bi-clock-fill" aria-hidden="true"></i>
                  </div>
                  <h5 class="fw-bold">Minutes, Not Hours</h5>
                  <p class="mb-0">
                    Reduce deployment preparation time from hours to minutes. 
                    Focus on your data projects, not infrastructure complexity.
                  </p>
                </div>
              </div>
            </div>
            
            <div class="col-md-6 col-lg-4">
              <div class="card h-100">
                <div class="card-body p-4 text-center">
                  <div class="feature-icon icon-rose">
                    <i class="bi bi-gear-fill" aria-hidden="true"></i>
                  </div>
                  <h5 class="fw-bold">Intelligent Automation</h5>
                  <p class="mb-0">
                    Smart defaults, automatic network calculations, and real-time 
                    validation prevent configuration errors before they happen.
                  </p>
                </div>
              </div>
            </div>
            
            <div class="col-md-6 col-lg-4">
              <div class="card h-100">
                <div class="card-body p-4 text-center">
                  <div class="feature-icon icon-purple">
                    <i class="bi bi-arrow-repeat" aria-hidden="true"></i>
                  </div>
                  <h5 class="fw-bold">Keep Evolving</h5>
                  <p class="mb-0">
                    Start with our generated code and continue evolving your 
                    infrastructure by adding custom Terraform modules and resources.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- How It Works Section -->
      <section class="py-5 bg-surface">
        <div class="container">
          <div class="row">
            <div class="col-lg-8 mx-auto text-center mb-5">
              <h2 class="h1 fw-bold mb-3">How It Works</h2>
              <p class="lead text-muted">
                Three simple steps to production-ready Databricks infrastructure.
              </p>
            </div>
          </div>
          
          <div class="row g-4 stagger-children">
            <div class="col-md-4">
              <div class="text-center">
                <div class="d-flex align-items-center justify-content-center gap-3 mb-3">
                  <div class="step-number">1</div>
                  <h5 class="fw-bold mb-0">Choose Your Cloud</h5>
                </div>
                <p>
                  Select your preferred cloud provider from AWS, Azure, or Google Cloud Platform.
                </p>
              </div>
            </div>
            
            <div class="col-md-4">
              <div class="text-center">
                <div class="d-flex align-items-center justify-content-center gap-3 mb-3">
                  <div class="step-number">2</div>
                  <h5 class="fw-bold mb-0">Configure Settings</h5>
                </div>
                <p>
                  Fill out the guided form with your preferences. Network settings are calculated automatically.
                </p>
              </div>
            </div>
            
            <div class="col-md-4">
              <div class="text-center">
                <div class="d-flex align-items-center justify-content-center gap-3 mb-3">
                  <div class="step-number">3</div>
                  <h5 class="fw-bold mb-0">Deploy & Go</h5>
                </div>
                <p>
                  Download your complete Terraform project and deploy with standard Terraform commands.
                </p>
              </div>
            </div>
          </div>
          
          <div class="text-center mt-5">
            <a href="#/select-provider" class="btn btn-primary btn-lg" data-navigate>
              Start Building Now
              <i class="bi bi-arrow-right ms-2" aria-hidden="true"></i>
            </a>
          </div>
        </div>
      </section>

      <!-- Supported Providers Preview -->
      <section class="py-5">
        <div class="container">
          <div class="row">
            <div class="col-lg-8 mx-auto text-center mb-5">
              <h2 class="h1 fw-bold mb-3">Supported Cloud Providers</h2>
              <p class="lead text-muted">
                Deploy Databricks workspaces on any major cloud platform with provider-specific optimizations.
              </p>
            </div>
          </div>
          
          <div class="row g-4">
            <div class="col-md-4">
              <div class="card border-0 shadow-sm provider-card h-100">
                <div class="card-body p-4 text-center">
                  <div class="provider-logo mb-3">
                    <i class="bi bi-amazon text-warning" style="font-size: 3rem;"></i>
                  </div>
                  <h5 class="fw-bold">Amazon Web Services</h5>
                  <ul class="list-unstyled text-muted small">
                    <li><i class="bi bi-check text-success me-1"></i> VPC & Subnet Management</li>
                    <li><i class="bi bi-check text-success me-1"></i> PrivateLink Integration</li>
                    <li><i class="bi bi-check text-success me-1"></i> Cross-Account IAM Roles</li>
                    <li><i class="bi bi-check text-success me-1"></i> Enterprise Security</li>
                  </ul>
                </div>
              </div>
            </div>
            
            <div class="col-md-4">
              <div class="card border-0 shadow-sm provider-card h-100">
                <div class="card-body p-4 text-center">
                  <div class="provider-logo mb-3">
                    <i class="bi bi-microsoft text-info" style="font-size: 3rem;"></i>
                  </div>
                  <h5 class="fw-bold">Microsoft Azure</h5>
                  <ul class="list-unstyled text-muted small">
                    <li><i class="bi bi-check text-success me-1"></i> VNet & Resource Groups</li>
                    <li><i class="bi bi-check text-success me-1"></i> Private Link Support</li>
                    <li><i class="bi bi-check text-success me-1"></i> Managed Identity</li>
                    <li><i class="bi bi-check text-success me-1"></i> Premium Features</li>
                  </ul>
                </div>
              </div>
            </div>
            
            <div class="col-md-4">
              <div class="card border-0 shadow-sm provider-card h-100">
                <div class="card-body p-4 text-center">
                  <div class="provider-logo mb-3">
                    <i class="bi bi-google text-success" style="font-size: 3rem;"></i>
                  </div>
                  <h5 class="fw-bold">Google Cloud Platform</h5>
                  <ul class="list-unstyled text-muted small">
                    <li><i class="bi bi-check text-success me-1"></i> VPC & Subnet Networks</li>
                    <li><i class="bi bi-check text-success me-1"></i> Private Service Connect</li>
                    <li><i class="bi bi-check text-success me-1"></i> Service Account Integration</li>
                    <li><i class="bi bi-check text-success me-1"></i> Private Google Access</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- CTA Section -->
      <section class="py-5 bg-primary text-white">
        <div class="container">
          <div class="row">
            <div class="col-lg-8 mx-auto text-center">
              <h2 class="h1 fw-bold mb-3">Ready to Simplify Your Databricks Deployment?</h2>
              <p class="lead mb-4">
                Join developers and data engineers who have streamlined their infrastructure deployment process. 
                Generate production-ready Terraform code in minutes, not hours.
              </p>
              <div class="d-flex gap-3 justify-content-center flex-wrap">
                <a href="#/select-provider" class="btn btn-light btn-lg px-5" data-navigate>
                  <i class="bi bi-play-circle me-2" aria-hidden="true"></i>
                  Start Your Deployment
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    `;
    
    this.render(content);
    Utils.updateProgress(0);
    
    // Setup install button in hero section
    const heroInstallBtn = document.getElementById('hero-install-btn');
    const installBtnHero = document.getElementById('install-btn-hero');
    
    const installPWAHandler = async () => {
      if (typeof window.installPWA === 'function') {
        await window.installPWA();
      } else {
        // Fallback if function not yet available
        console.warn('Install PWA function not available yet');
      }
    };
    
    if (heroInstallBtn) {
      heroInstallBtn.addEventListener('click', installPWAHandler);
      
      // Show button if install is available (check after a delay to ensure deferredPrompt is set)
      setTimeout(() => {
        if (window.deferredPrompt) {
          heroInstallBtn.style.display = 'inline-block';
        }
      }, 1000);
    }
    
    if (installBtnHero) {
      installBtnHero.addEventListener('click', installPWAHandler);
    }
  }

  renderProviderSelection() {
    const content = `
      <div class="container my-5 animate-fade-up">
        <div class="row">
          <div class="col-lg-10 mx-auto">
            <div class="text-center mb-5">
              <h1 class="text-gradient mb-3">Choose Your Cloud Provider</h1>
              <p class="lead">
                Select the cloud provider where you want to deploy your Databricks workspace.
                Each provider has unique features and capabilities optimized for different use cases.
              </p>
            </div>

            <div class="row g-4 mb-5 stagger-children">
              <div class="col-lg-4">
                <div class="provider-option" data-provider="aws">
                  <div class="provider-card aws h-100">
                    <div class="selection-indicator">
                      <i class="bi bi-check-lg"></i>
                    </div>
                    <div class="provider-logo">
                      <i class="bi bi-cloud-fill"></i>
                    </div>
                    <h4>Amazon Web Services</h4>
                    <p>Complete VPC management with subnets, security groups, and PrivateLink support.</p>
                    <ul class="list-unstyled text-start mb-4 text-sm">
                      <li class="mb-2 d-flex align-items-start">
                        <i class="bi bi-check2 text-success me-2 mt-1"></i>
                        <span>VPC & Networking with security groups</span>
                      </li>
                      <li class="mb-2 d-flex align-items-start">
                        <i class="bi bi-check2 text-success me-2 mt-1"></i>
                        <span>PrivateLink (Enterprise tier)</span>
                      </li>
                      <li class="mb-2 d-flex align-items-start">
                        <i class="bi bi-check2 text-success me-2 mt-1"></i>
                        <span>Cross-Account IAM roles</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <div class="col-lg-4">
                <div class="provider-option" data-provider="azure">
                  <div class="provider-card azure h-100">
                    <div class="selection-indicator">
                      <i class="bi bi-check-lg"></i>
                    </div>
                    <div class="provider-logo">
                      <i class="bi bi-microsoft"></i>
                    </div>
                    <h4>Microsoft Azure</h4>
                    <p>Virtual networks, resource groups, and Private Link with Azure AD integration.</p>
                    <ul class="list-unstyled text-start mb-4 text-sm">
                      <li class="mb-2 d-flex align-items-start">
                        <i class="bi bi-check2 text-success me-2 mt-1"></i>
                        <span>VNet & Resource Groups</span>
                      </li>
                      <li class="mb-2 d-flex align-items-start">
                        <i class="bi bi-check2 text-success me-2 mt-1"></i>
                        <span>Private Link (Premium tier)</span>
                      </li>
                      <li class="mb-2 d-flex align-items-start">
                        <i class="bi bi-check2 text-success me-2 mt-1"></i>
                        <span>Managed Identity & Azure AD</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <div class="col-lg-4">
                <div class="provider-option" data-provider="gcp">
                  <div class="provider-card gcp h-100">
                    <div class="selection-indicator">
                      <i class="bi bi-check-lg"></i>
                    </div>
                    <div class="provider-logo">
                      <i class="bi bi-google"></i>
                    </div>
                    <h4>Google Cloud Platform</h4>
                    <p>VPC with host/pods subnets for GKE and Private Service Connect support.</p>
                    <ul class="list-unstyled text-start mb-4 text-sm">
                      <li class="mb-2 d-flex align-items-start">
                        <i class="bi bi-check2 text-success me-2 mt-1"></i>
                        <span>VPC & GKE Subnet management</span>
                      </li>
                      <li class="mb-2 d-flex align-items-start">
                        <i class="bi bi-check2 text-success me-2 mt-1"></i>
                        <span>Private Service Connect (Premium)</span>
                      </li>
                      <li class="mb-2 d-flex align-items-start">
                        <i class="bi bi-check2 text-success me-2 mt-1"></i>
                        <span>Service Accounts & IAM</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div class="d-flex justify-content-between align-items-center mt-4">
              <a href="#/" class="btn btn-outline-secondary" data-navigate>
                <i class="bi bi-arrow-left me-2"></i>
                Back to Home
              </a>
              <button type="button" class="btn btn-primary btn-lg px-4" id="continue-btn" disabled>
                Continue with Selected Provider
                <i class="bi bi-arrow-right ms-2"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
    
    this.render(content);
    Utils.updateProgress(1);
    
    // Setup provider selection
    let selectedProvider = null;
    document.querySelectorAll('.provider-option').forEach(option => {
      option.addEventListener('click', () => {
        document.querySelectorAll('.provider-option').forEach(opt => {
          opt.classList.remove('selected');
        });
        option.classList.add('selected');
        selectedProvider = option.dataset.provider;
        document.getElementById('continue-btn').disabled = false;
      });
    });
    
    document.getElementById('continue-btn').addEventListener('click', () => {
      if (selectedProvider) {
        this.currentProvider = selectedProvider;
        Utils.setStorage('provider', selectedProvider);
        Utils.setStorage('step', 1);
        this.updateNavbar();
        window.location.hash = '/configure';
      } else {
        alert('Please select a cloud provider before continuing.');
      }
    });
  }

  /**
   * Clear validation state from a field
   */
  clearFieldValidation(fieldName) {
    const field = document.querySelector(`input[name="${fieldName}"], select[name="${fieldName}"]`);
    if (field) {
      field.removeAttribute('data-invalid');
      field.removeAttribute('data-error');
      field.classList.remove('is-invalid');
      field.setCustomValidity('');
    }
  }

  /**
   * Mark a field as invalid with error message
   */
  markFieldAsInvalid(fieldName, errorMessage) {
    // Try to find input, select, or checkbox
    let field = document.querySelector(`input[name="${fieldName}"], select[name="${fieldName}"]`);
    
    // If not found and it's availability_zones, mark the select
    if (!field && fieldName === 'availability_zones') {
      const azSelect = document.getElementById('availability-zones-select');
      if (azSelect) {
        azSelect.setAttribute('data-invalid', 'true');
        azSelect.setAttribute('data-error', errorMessage);
        // Also mark the Choices.js container
        const choicesContainer = azSelect.closest('.choices');
        if (choicesContainer) {
          choicesContainer.classList.add('is-invalid');
        }
      }
      return;
    }
    
    if (field) {
      field.setAttribute('data-invalid', 'true');
      field.setAttribute('data-error', errorMessage);
      
      // For checkboxes, mark the parent label/container instead
      if (field.type === 'checkbox') {
        const label = field.closest('.form-check') || field.parentElement;
        if (label) {
          label.classList.add('is-invalid');
        }
      } else {
        field.classList.add('is-invalid');
        if (field.setCustomValidity) {
          field.setCustomValidity(errorMessage);
        }
      }
    }
  }

  /**
   * Clear all field validations
   */
  clearAllFieldValidations() {
    const form = document.getElementById('config-form');
    if (!form) return;
    
    const fields = form.querySelectorAll('input, select');
    fields.forEach(field => {
      field.removeAttribute('data-invalid');
      field.removeAttribute('data-error');
      field.classList.remove('is-invalid');
      field.setCustomValidity('');
    });
  }

  renderConfiguration() {
    if (!this.currentProvider) {
      window.location.hash = '/select-provider';
      return;
    }
    
    const providerIcon = this.currentProvider === 'aws' ? 
      '<i class="bi bi-amazon text-warning me-2" style="font-size: 2rem;"></i>' :
      this.currentProvider === 'azure' ?
      '<i class="bi bi-microsoft text-info me-2" style="font-size: 2rem;"></i>' :
      '<i class="bi bi-google text-success me-2" style="font-size: 2rem;"></i>';
    
    const providerName = Utils.getProviderName(this.currentProvider);
    const vpcLabel = this.currentProvider === 'azure' ? 'VNet CIDR Block' : 'VPC CIDR Block';
    const vpcDesc = this.currentProvider === 'azure' ? 
      'CIDR block for the VNet (between /8 and /24)' :
      'CIDR block for the VPC (between /8 and /24)';
    
    // Load configuration form based on provider
    const content = `
      <div class="container my-5">
        <div class="row">
          <div class="col-xl-8 mx-auto">
            <div class="text-center mb-5">
              <div class="provider-badge mb-3">
                ${providerIcon}
                <span class="h2 fw-bold text-capitalize">${this.currentProvider} Configuration</span>
              </div>
              <p class="lead text-muted">
                Configure your Databricks deployment settings for ${this.currentProvider.toUpperCase()}. 
                All network calculations are handled automatically based on your selections.
              </p>
            </div>
            
            <form id="config-form" novalidate>
              <div class="card mb-4">
                <div class="card-header bg-primary text-white">
                  <h5 class="card-title mb-0">
                    <i class="bi bi-gear-fill me-2"></i>
                    Basic Configuration
                  </h5>
                </div>
                <div class="card-body">
                  <div class="row g-3">
                    <div class="col-md-6">
                      <label class="form-label fw-semibold">
                        Project Prefix
                        <span class="text-danger">*</span>
                      </label>
                      <input type="text" class="form-control" name="project_prefix" 
                             value="${this.currentConfig.project_prefix || ''}" 
                             placeholder="e.g., my-databricks-project" required>
                      <div class="form-text">Prefix for all resource names (2-20 characters, alphanumeric and hyphens only)</div>
                    </div>
                    <div class="col-md-6">
                      <label class="form-label fw-semibold">
                        Region
                        <span class="text-danger">*</span>
                      </label>
                      <select class="form-select" name="region" required>
                        ${this.renderRegionOptions(this.currentProvider, this.currentConfig.region)}
                      </select>
                      <div class="form-text">Cloud provider region for resource deployment</div>
                    </div>
                    <div class="col-md-6">
                      <label class="form-label fw-semibold">
                        Databricks Pricing Tier
                        <span class="text-danger">*</span>
                      </label>
                      <select class="form-select" name="pricing_tier" required>
                        ${this.renderPricingTierOptions(this.currentProvider, this.currentConfig.pricing_tier)}
                      </select>
                      <div class="form-text">Databricks workspace pricing tier (affects available features)</div>
                    </div>
                    ${this.currentProvider === 'azure' ? `
                      <div class="col-md-6">
                        <label class="form-label fw-semibold">
                          Resource Group Name
                          <span class="text-danger">*</span>
                        </label>
                        <input type="text" class="form-control" name="resource_group_name" 
                               value="${this.currentConfig.resource_group_name || ''}" 
                               placeholder="e.g., rg-databricks-prod" required>
                        <div class="form-text">Azure Resource Group name for all resources</div>
                      </div>
                    ` : ''}
                    ${this.currentProvider === 'gcp' ? `
                      <div class="col-md-6">
                        <label class="form-label fw-semibold">
                          GCP Project ID
                          <span class="text-danger">*</span>
                        </label>
                        <input type="text" class="form-control" name="project_id" 
                               value="${this.currentConfig.project_id || ''}" 
                               placeholder="e.g., my-gcp-project-123" required>
                        <div class="form-text">Google Cloud Project ID for resource deployment</div>
                      </div>
                    ` : ''}
                  </div>
                </div>
              </div>
              
              <div class="card mb-4">
                <div class="card-header bg-success text-white">
                  <h5 class="card-title mb-0">
                    <i class="bi bi-diagram-3-fill me-2"></i>
                    Network Configuration
                  </h5>
                </div>
                <div class="card-body">
                  <div class="mb-3">
                    <div class="form-check form-switch">
                      <input class="form-check-input" type="checkbox" id="create_new_vpc" name="create_new_vpc" checked>
                      <label class="form-check-label fw-semibold" for="create_new_vpc">
                        ${this.currentProvider === 'azure' ? 'Create New VNet' : 'Create New VPC'}
                      </label>
                    </div>
                    <div class="form-text">${this.currentProvider === 'azure' ? 
                      'Create a new Virtual Network or use an existing one' : 
                      'Create a new VPC or use an existing one'}</div>
                  </div>
                  <div class="collapse mb-3" id="existing-vpc-section" style="display: none;">
                    <div class="row">
                      <div class="col-md-6">
                        <label class="form-label fw-semibold">
                          ${this.currentProvider === 'azure' ? 'Existing VNet Name' : 'Existing VPC Name'}
                          <span class="text-danger">*</span>
                        </label>
                        <input type="text" class="form-control" name="existing_vpc_name" 
                               value="${this.currentConfig.existing_vpc_name || ''}"
                               placeholder="${this.currentProvider === 'azure' ? 'e.g., my-existing-vnet' : 'e.g., vpc-0123456789abcdef0'}">
                        <div class="form-text">${this.currentProvider === 'azure' ? 
                          'Name of existing VNet to use' : 
                          'Name of existing VPC to use'}</div>
                      </div>
                    </div>
                  </div>
                  <div class="mb-3">
                    <label class="form-label fw-semibold">
                      ${vpcLabel}
                      <span class="text-danger">*</span>
                    </label>
                    <input type="text" class="form-control" name="vpc_cidr" 
                           value="${this.currentConfig.vpc_cidr || '10.0.0.0/22'}" 
                           placeholder="e.g., 10.0.0.0/22" required>
                    <div class="form-text">${vpcDesc}</div>
                  </div>
                  <div class="mb-3">
                    <label class="form-label fw-semibold" for="availability-zones-select">
                      Availability Zones
                      <span class="text-danger">*</span>
                    </label>
                    <select id="availability-zones-select" class="form-select" name="availability_zones" multiple required>
                      <option value="" disabled>Select availability zones</option>
                    </select>
                    <div class="form-text">Type to search and select availability zones. Selected zones will appear as tags.</div>
                  </div>
                  <div id="subnets-preview" class="mt-4" style="display: none;">
                    <h6 class="fw-bold text-primary mb-3">
                      <i class="bi bi-calculator me-2"></i>
                      Calculated Subnet Allocation
                    </h6>
                    <div id="subnets-container"></div>
                    <div id="network-summary" class="mt-3"></div>
                  </div>
                </div>
              </div>
              
              <div class="card mb-4">
                <div class="card-header bg-warning text-dark">
                  <h5 class="card-title mb-0">
                    <i class="bi bi-shield-check me-2"></i>
                    Security Configuration
                  </h5>
                </div>
                <div class="card-body">
                  <div class="form-check form-switch">
                    <input class="form-check-input" type="checkbox" id="enable_private_link" name="enable_private_link">
                    <label class="form-check-label fw-semibold" for="enable_private_link">
                      ${this.currentProvider === 'azure' ? 'Enable Private Link' : 
                        this.currentProvider === 'gcp' ? 'Enable Private Service Connect' : 
                        'Enable AWS PrivateLink'}
                    </label>
                  </div>
                  <div class="form-text">${this.currentProvider === 'aws' ? 
                    'Enable AWS PrivateLink (requires Enterprise tier)' :
                    this.currentProvider === 'azure' ?
                    'Enable Azure Private Link (requires Premium tier)' :
                    'Enable Private Service Connect (requires Premium tier)'}</div>
                  <div id="private-link-warning" class="alert alert-info mt-2" style="display: none;">
                    <i class="bi bi-info-circle me-2"></i>
                    <strong>Note:</strong> Private connectivity requires 
                    ${this.currentProvider === 'aws' ? 'Enterprise' : 'Premium'} 
                    pricing tier.
                  </div>
                </div>
              </div>
              
              <div class="d-flex justify-content-between">
                <a href="#/select-provider" class="btn btn-outline-secondary btn-lg" data-navigate>
                  <i class="bi bi-arrow-left me-2"></i>
                  Back to Provider Selection
                </a>
                <button type="submit" class="btn btn-primary btn-lg px-4" id="submit-btn">
                  Review Configuration
                  <i class="bi bi-arrow-right ms-2"></i>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `;
    
    this.render(content);
    Utils.updateProgress(2);
    
    // Real-time subnet calculation function (defined early so it can be used in availability zone handlers)
    const vpcCidrInput = document.querySelector('input[name="vpc_cidr"]');
    const pricingTierSelect = document.querySelector('select[name="pricing_tier"]');
    const privateLinkCheckbox = document.getElementById('enable_private_link');
    const privateLinkWarning = document.getElementById('private-link-warning');
    
    const calculateSubnets = Utils.debounce(() => {
      const vpcCidr = vpcCidrInput?.value;
      const pricingTier = pricingTierSelect?.value;
      const enablePrivateLink = privateLinkCheckbox?.checked || false;
      const zones = this.getSelectedAvailabilityZones();
      
      if (!vpcCidr || zones.length === 0 || !pricingTier) {
        const preview = document.getElementById('subnets-preview');
        if (preview) {
          preview.style.display = 'none';
        }
        return;
      }
      
      try {
        const networkCalc = new NetworkCalculator(this.currentProvider);
        const subnets = networkCalc.allocateSubnets(vpcCidr, zones, pricingTier, enablePrivateLink);
        const summary = networkCalc.calculateNetworkSummary(vpcCidr, subnets);
        
        // Display subnets
        const container = document.getElementById('subnets-container');
        const preview = document.getElementById('subnets-preview');
        if (container && preview) {
          preview.style.display = 'block';
          container.innerHTML = '<div class="row g-3">' + subnets.map(subnet => `
            <div class="col-md-6">
              <div class="card subnet-card h-100">
                <div class="card-body p-3">
                  <div class="d-flex justify-content-between align-items-start mb-2">
                    <h6 class="card-title mb-0">${subnet.name}</h6>
                    <span class="badge bg-${subnet.subnet_type === 'private' ? 'primary' : subnet.subnet_type === 'public' ? 'success' : 'warning'} subnet-type">${subnet.subnet_type}</span>
                  </div>
                  <div class="text-muted small">
                    <div><strong>CIDR:</strong> ${subnet.cidr}</div>
                    <div><strong>Size:</strong> /${subnet.size}</div>
                    <div><strong>Zone:</strong> ${subnet.availability_zone}</div>
                  </div>
                </div>
              </div>
            </div>
          `).join('') + '</div>';
          
          // Display summary
          const summaryContainer = document.getElementById('network-summary');
          if (summaryContainer && summary && !summary.error) {
            summaryContainer.innerHTML = `
              <div class="card">
                <div class="card-body">
                  <h6 class="card-title mb-3">Network Utilization Summary</h6>
                  <div class="row text-center">
                    <div class="col-3">
                      <div class="h6 text-primary mb-1">${Utils.formatNumber(summary.total_ips)}</div>
                      <div class="small text-muted">Total IPs</div>
                    </div>
                    <div class="col-3">
                      <div class="h6 text-success mb-1">${Utils.formatNumber(summary.used_ips)}</div>
                      <div class="small text-muted">Used IPs</div>
                    </div>
                    <div class="col-3">
                      <div class="h6 text-warning mb-1">${Utils.formatNumber(summary.available_ips)}</div>
                      <div class="small text-muted">Available IPs</div>
                    </div>
                    <div class="col-3">
                      <div class="h6 text-info mb-1">${summary.utilization_percent}%</div>
                      <div class="small text-muted">Utilization</div>
                    </div>
                  </div>
                </div>
              </div>
            `;
          }
        }
      } catch (err) {
        console.error('Error calculating subnets:', err);
      }
    }, 500);
    
    // Store calculateSubnets for use in handlers
    this.calculateSubnets = calculateSubnets;
    
    // Initialize availability zones - using Choices.js
    const azSelect = document.getElementById('availability-zones-select');
    const regionSelect = document.querySelector('select[name="region"]');
    // Get current region from config, or from select if not in config (since select now defaults to first item)
    let currentRegion = this.currentConfig.region || (regionSelect ? regionSelect.value : '');
    let choicesInstance = null;
    let pendingInitTimeout = null; // Track pending initialization timeout
    
    // Function to update availability zone options
    // forceRecreate = true when region changes to ensure dropdown is fully refreshed
    const updateAvailabilityZoneOptions = (forceRecreate = false) => {
      if (!azSelect) return;
      
      // ALWAYS destroy existing Choices.js instance first - this is critical for region changes
      // Destroy all possible references to Choices.js
      const destroyChoicesCompletely = () => {
        // Destroy the local instance
        if (choicesInstance) {
          try {
            choicesInstance.clearStore();
            choicesInstance.setValue([]);
            choicesInstance.destroy();
          } catch (e) {
            console.warn('Error destroying local choicesInstance:', e);
          }
          choicesInstance = null;
        }
        
        // Destroy the instance stored on the select element
        if (azSelect.choicesInstance) {
          try {
            azSelect.choicesInstance.clearStore();
            azSelect.choicesInstance.setValue([]);
            azSelect.choicesInstance.destroy();
          } catch (e) {
            console.warn('Error destroying azSelect.choicesInstance:', e);
          }
          azSelect.choicesInstance = null;
        }
        
        // Remove Choices.js wrapper from DOM if it exists
        const wrapper = azSelect.closest('.choices');
        if (wrapper && wrapper !== azSelect) {
          const parent = wrapper.parentElement;
          if (parent) {
            // Move select out of wrapper before removing
            parent.insertBefore(azSelect, wrapper);
            wrapper.remove();
          }
        }
        
        // Also check for any orphaned Choices wrappers
        const allWrappers = document.querySelectorAll('.choices:has(#availability-zones-select)');
        allWrappers.forEach(w => {
          if (w !== azSelect && w.contains(azSelect)) {
            const p = w.parentElement;
            if (p) {
              p.insertBefore(azSelect, w);
              w.remove();
            }
          }
        });
      };
      
      // Always destroy first when forceRecreate is true (region change)
      if (forceRecreate) {
        destroyChoicesCompletely();
      }
      
      const zones = this.getAvailabilityZoneOptions(this.currentProvider, currentRegion);
      
      // Safety check: ensure zones is an array
      if (!zones || !Array.isArray(zones) || zones.length === 0) {
        console.warn(`No availability zones found for provider ${this.currentProvider} and region ${currentRegion}`);
        destroyChoicesCompletely();
        azSelect.innerHTML = '<option value="" disabled>No availability zones available</option>';
        return;
      }
      
      // Always destroy existing Choices.js before recreating
      destroyChoicesCompletely();
      
      // NOW: Clear existing options and add new ones
      azSelect.innerHTML = '<option value="" disabled>Select availability zones</option>';
      
      // Add zone options
      zones.forEach(zone => {
        const option = document.createElement('option');
        option.value = zone.value;
        option.textContent = zone.label;
        azSelect.appendChild(option);
      });
      
      // Verify all options were added
      const optionCount = azSelect.options.length - 1; // -1 for placeholder
      if (optionCount !== zones.length) {
        console.error(`Failed to add all options: expected ${zones.length}, found ${optionCount}. Re-adding...`);
        zones.forEach(zone => {
          if (!Array.from(azSelect.options).some(opt => opt.value === zone.value)) {
            const option = document.createElement('option');
            option.value = zone.value;
            option.textContent = zone.label;
            azSelect.appendChild(option);
          }
        });
      }
      
      // Cancel any pending initialization timeout
      if (pendingInitTimeout) {
        clearTimeout(pendingInitTimeout);
        pendingInitTimeout = null;
      }
      
      // Store the region for this initialization to detect stale callbacks
      const initRegion = currentRegion;
      const initZones = [...zones]; // Copy zones array to avoid closure issues
      
      // Wait for DOM to be updated before initializing Choices.js
      // Use a small timeout to ensure DOM is fully updated
      pendingInitTimeout = setTimeout(() => {
        pendingInitTimeout = null;
        
        // CRITICAL: Check if region has changed since we started
        // If so, abort this initialization - a newer one will be triggered
        if (currentRegion !== initRegion) {
          console.log(`Region changed from ${initRegion} to ${currentRegion}, aborting stale initialization`);
          return;
        }
        
        // Initialize Choices.js (wait for it to be available)
        const initChoices = () => {
          // Re-check region hasn't changed
          if (currentRegion !== initRegion) {
            console.log(`Region changed during init, aborting`);
            return;
          }
          
          if (typeof Choices === 'undefined') {
            // Wait a bit and try again
            setTimeout(initChoices, 100);
            return;
          }
          
          // CRITICAL: Verify select element still exists and is in the DOM
          if (!azSelect || !azSelect.parentElement) {
            console.error('Select element not found or removed from DOM');
            return;
          }
          
          // Double-check that all options are still in the select before initializing Choices.js
          const currentOptions = Array.from(azSelect.options).filter(opt => opt.value && opt.value !== '');
          const currentOptionValues = currentOptions.map(opt => opt.value);
          const expectedZoneValues = initZones.map(z => z.value);
          
          // Check if all expected options are present
          const missingOptions = expectedZoneValues.filter(val => !currentOptionValues.includes(val));
          
          if (currentOptions.length !== initZones.length || missingOptions.length > 0) {
            
            // Clear and re-add all options
            azSelect.innerHTML = '<option value="" disabled>Select availability zones</option>';
            initZones.forEach(zone => {
              const option = document.createElement('option');
              option.value = zone.value;
              option.textContent = zone.label;
              azSelect.appendChild(option);
            });
            
            // Verify again after re-adding
            const verifyOptions = Array.from(azSelect.options).filter(opt => opt.value && opt.value !== '');
            if (verifyOptions.length !== initZones.length) {
              console.error(`Failed to add all options after retry. Expected ${initZones.length}, got ${verifyOptions.length}`);
              return;
            }
            
            // Try again after re-adding with a small delay
            setTimeout(() => {
              initChoices();
            }, 50);
            return;
          }
        
        // Now Choices.js is available
        const limits = this.getAvailabilityZoneLimits(this.currentProvider);
        const defaultZones = this.currentConfig.availability_zones || [];
        
        // Set default zones if available
        // IMPORTANT: Only use defaultZones if they actually belong to the current region
        let initialValues = [];
        
        // First, filter defaultZones to only include zones that exist in current region's options
        const validDefaultZones = defaultZones.filter(z => initZones.some(az => az.value === z));
        
        // Only use stored zones if they're valid for current region AND region hasn't changed
        // If region changed, defaultZones will be empty (cleared in region change handler)
        if (validDefaultZones.length > 0 && currentRegion === (this.currentConfig.region || '')) {
          initialValues = validDefaultZones;
        } else if (currentRegion) {
          // Set default zones based on provider and region (respecting minimum)
          let defaultZoneValues = [];
          if (this.currentProvider === 'aws') {
            defaultZoneValues = [`${currentRegion}a`, `${currentRegion}b`];
          } else if (this.currentProvider === 'azure') {
            defaultZoneValues = ['1', '2'];
          } else if (this.currentProvider === 'gcp') {
            defaultZoneValues = [`${currentRegion}-a`, `${currentRegion}-b`];
          }
          
          // Ensure we have at least the minimum
          while (defaultZoneValues.length < limits.min) {
            if (this.currentProvider === 'aws' && currentRegion) {
              defaultZoneValues.push(`${currentRegion}${String.fromCharCode(97 + defaultZoneValues.length)}`);
            } else if (this.currentProvider === 'azure') {
              defaultZoneValues.push(String(defaultZoneValues.length + 1));
            } else if (this.currentProvider === 'gcp' && currentRegion) {
              defaultZoneValues.push(`${currentRegion}-${String.fromCharCode(97 + defaultZoneValues.length)}`);
            } else {
              break;
            }
          }
          
          // Filter to only include zones that exist in available options
          initialValues = defaultZoneValues.filter(z => initZones.some(az => az.value === z));
        }
        
        // CRITICAL: Final verification before initializing Choices.js
        // Ensure select element exists and is in DOM
        if (!azSelect || !azSelect.parentElement) {
          console.error('Cannot initialize Choices.js: select element not in DOM');
          return;
        }
        
        // Verify all options are present before initializing
        const finalOptions = Array.from(azSelect.options).filter(opt => opt.value && opt.value !== '');
        const finalOptionValues = finalOptions.map(opt => opt.value);
        const expectedValues = initZones.map(z => z.value);
        
        // Check if we have the correct number of options
        if (finalOptions.length !== initZones.length) {
          console.error(`Cannot initialize Choices.js: Expected ${initZones.length} options, but found ${finalOptions.length} in select`);
          
          // Try one more time to fix it
          azSelect.innerHTML = '<option value="" disabled>Select availability zones</option>';
          initZones.forEach(zone => {
            const option = document.createElement('option');
            option.value = zone.value;
            option.textContent = zone.label;
            azSelect.appendChild(option);
          });
          
          // Wait a bit and retry
          setTimeout(() => {
            if (currentRegion !== initRegion) return; // Abort if region changed
            const retryOptions = Array.from(azSelect.options).filter(opt => opt.value && opt.value !== '');
            if (retryOptions.length === initZones.length) {
              initChoices();
            }
          }, 100);
          return;
        }
        
        // Double-check: ensure no old zone values are present
        const validZoneValues = initZones.map(z => z.value);
        const invalidOptions = finalOptionValues.filter(val => !validZoneValues.includes(val));
        if (invalidOptions.length > 0) {
          console.warn(`Found invalid options in select: ${invalidOptions.join(', ')}. Removing...`);
          invalidOptions.forEach(invalidVal => {
            const invalidOption = azSelect.querySelector(`option[value="${invalidVal}"]`);
            if (invalidOption) {
              invalidOption.remove();
            }
          });
          // Re-check after removal
          const updatedOptions = Array.from(azSelect.options).filter(opt => opt.value && opt.value !== '');
          const missingValues = expectedValues.filter(val => !updatedOptions.some(opt => opt.value === val));
          if (missingValues.length > 0) {
            missingValues.forEach(val => {
              const zone = initZones.find(z => z.value === val);
              if (zone) {
                const option = document.createElement('option');
                option.value = zone.value;
                option.textContent = zone.label;
                azSelect.appendChild(option);
              }
            });
          }
        }
        
        // Final check before initializing
        const preInitOptions = Array.from(azSelect.options).filter(opt => opt.value && opt.value !== '');
        if (preInitOptions.length !== initZones.length) {
          // Re-add options immediately
          azSelect.innerHTML = '<option value="" disabled>Select availability zones</option>';
          initZones.forEach(zone => {
            const option = document.createElement('option');
            option.value = zone.value;
            option.textContent = zone.label;
            azSelect.appendChild(option);
          });
          // Wait a bit and retry
          setTimeout(() => {
            if (currentRegion !== initRegion) return;
            initChoices();
          }, 100);
          return;
        }
        
        try {
          
          // Store options data before Choices.js potentially modifies the select
          // All options start as unselected - we'll use setValue() after initialization
          const optionsData = Array.from(azSelect.options)
            .filter(opt => opt.value && opt.value !== '')
            .map(opt => ({
              value: opt.value,
              label: opt.textContent,
              selected: false,
              disabled: false
            }));
          
          // Create Choices.js with proper configuration
          try {
            choicesInstance = new Choices(azSelect, {
              removeItemButton: true,
              searchEnabled: true,
              searchChoices: true,
              searchFields: ['label', 'value'],
              placeholder: true,
              placeholderValue: 'Type to search availability zones...',
              searchPlaceholderValue: 'Type to search...',
              maxItemText: (maxItemCount) => {
                return `Maximum ${limits.max} availability zone(s) allowed`;
              },
              addItemText: (value) => {
                return `Press Enter to add <b>"${value}"</b>`;
              },
              maxItemCount: limits.max,
              duplicateItemsAllowed: false,
              shouldSort: false,
              allowHTML: true,
              // CRITICAL: This ensures selected items are NOT shown in dropdown
              renderSelectedChoices: 'auto',
              classNames: {
                containerOuter: 'choices form-select',
                containerInner: 'choices__inner',
                input: 'choices__input',
                inputCloned: 'choices__input--cloned',
                list: 'choices__list',
                listItems: 'choices__list--multiple',
                listSingle: 'choices__list--single',
                listDropdown: 'choices__list--dropdown',
                item: 'choices__item',
                itemSelectable: 'choices__item--selectable',
                itemDisabled: 'choices__item--disabled',
                itemChoice: 'choices__item--choice',
                placeholder: 'choices__placeholder',
                group: 'choices__group',
                groupHeading: 'choices__heading',
                button: 'choices__button',
                activeState: 'is-active',
                focusState: 'is-focused',
                openState: 'is-open',
                disabledState: 'is-disabled',
                highlightedState: 'is-highlighted',
                selectedState: 'is-selected',
                flippedState: 'is-flipped',
                loadingState: 'is-loading',
                noResults: 'has-no-results',
                noChoices: 'has-no-choices'
              }
            });
            
            // Always use setChoices to ensure options are set correctly
            if (optionsData.length > 0) {
              try {
                // Use setChoices to set options with correct selected state
                // The 4th param (true) replaces existing choices
                choicesInstance.setChoices(optionsData, 'value', 'label', true);
                
                // Wait a bit and verify choices were loaded
                setTimeout(() => {
                  const checkChoices2 = choicesInstance._store ? choicesInstance._store.choices : [];
                  
                  // Count unique choices (selected items might be duplicated)
                  const uniqueChoices = new Set(checkChoices2.map(c => c.value || c.id));
                  const finalChoicesCount = uniqueChoices.size;
                  
                  if (finalChoicesCount === initZones.length) {
                    setupChoicesComplete();
                  } else {
                    // Last resort: Try to manually add choices to the store
                    if (choicesInstance._store) {
                      try {
                        choicesInstance._store.choices = optionsData.map(opt => ({
                          id: opt.value,
                          value: opt.value,
                          label: opt.label,
                          customProperties: {},
                          active: false,
                          disabled: opt.disabled || false,
                          highlighted: false,
                          placeholder: false,
                          selected: opt.selected || false // Preserve selected state
                        }));
                        
                        // Trigger a render
                        if (typeof choicesInstance._render === 'function') {
                          choicesInstance._render();
                        }
                        
                        setTimeout(() => {
                          setupChoicesComplete();
                        }, 100);
                      } catch (manualError) {
                        setupChoicesComplete(); // Continue anyway
                      }
                    } else {
                      setupChoicesComplete(); // Continue anyway
                    }
                  }
                }, 200);
              } catch (setChoicesError) {
                setupChoicesComplete(); // Try to continue anyway
              }
            } else {
              setupChoicesComplete(); // Try to continue anyway
            }
          } catch (initError) {
            choicesInstance = null;
          }
          
          // Function to complete setup after Choices.js is initialized
          const setupChoicesComplete = () => {
            if (!choicesInstance) return;
            
            // Check if region changed during initialization - abort if so
            if (currentRegion !== initRegion) {
              console.log('Region changed during setup, aborting setupChoicesComplete');
              return;
            }
            
            // Set initial values - filter to only include valid zones for current region
            const finalOptionValues = initZones.map(z => z.value);
            const validInitialValues = initialValues.filter(val => finalOptionValues.includes(val));
            
            // Always set the initial values using setValue with proper format
            if (validInitialValues.length > 0) {
              // Convert to Choices.js item format
              const itemsToSet = validInitialValues.map(val => {
                const zone = initZones.find(z => z.value === val);
                return {
                  value: val,
                  label: zone ? zone.label : val
                };
              });
              choicesInstance.setValue(itemsToSet);
            }
            
            // Store choices instance for later use
            azSelect.choicesInstance = choicesInstance;
            
            // Add event listeners for validation and subnet recalculation
            const appInstance = this;
            
            // Listen to Choices.js events (only add once)
            if (!azSelect.hasChoicesListeners) {
              azSelect.addEventListener('change', function() {
                if (!choicesInstance) return;
                const selectedValues = choicesInstance.getValue(true) || [];
                const limits = appInstance.getAvailabilityZoneLimits(appInstance.currentProvider);
                
                // Validate minimum
                if (selectedValues.length < limits.min) {
                  Utils.showFlashMessage(
                    `At least ${limits.min} availability zone(s) required for ${appInstance.currentProvider.toUpperCase()}.`, 
                    'warning'
                  );
                }
                
                // Trigger subnet recalculation
                if (typeof calculateSubnets === 'function') {
                  calculateSubnets();
                }
              });
              
              // Use Choices.js event system
              const container = azSelect.closest('.choices') || document.querySelector('.choices');
              if (container) {
                // Helper function to sync dropdown visibility with selected items
                const syncDropdownVisibility = () => {
                  if (!choicesInstance) return;
                  const selectedValues = choicesInstance.getValue(true) || [];
                  const dropdown = container.querySelector('.choices__list--dropdown');
                  if (dropdown) {
                    // Hide selected items from dropdown
                    const dropdownItems = dropdown.querySelectorAll('.choices__item--choice');
                    dropdownItems.forEach(item => {
                      const itemValue = item.getAttribute('data-value');
                      if (selectedValues.includes(itemValue)) {
                        item.style.display = 'none';
                      } else {
                        item.style.display = '';
                      }
                    });
                  }
                };
                
                container.addEventListener('addItem', function() {
                  if (typeof calculateSubnets === 'function') {
                    calculateSubnets();
                  }
                  // Sync visibility after item added
                  setTimeout(syncDropdownVisibility, 10);
                });
                
                container.addEventListener('removeItem', function() {
                  if (typeof calculateSubnets === 'function') {
                    calculateSubnets();
                  }
                  // Sync visibility after item removed
                  setTimeout(syncDropdownVisibility, 10);
                });
                
                // Also sync when dropdown is shown
                container.addEventListener('showDropdown', syncDropdownVisibility);
                
                // Ensure dropdown appears above all sections when opened
                // Use MutationObserver to detect when dropdown opens
                const observer = new MutationObserver(function(mutations) {
                  mutations.forEach(function(mutation) {
                    if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                      const target = mutation.target;
                      if (target.classList.contains('is-open')) {
                        // Dropdown is now open - ensure it can overflow all sections
                        const dropdown = container.querySelector('.choices__list--dropdown');
                        if (dropdown) {
                          // Force high z-index and ensure visibility
                          dropdown.style.zIndex = '99999';
                          dropdown.style.position = 'absolute';
                          
                          // Ensure all parent containers allow overflow
                          let parent = dropdown.parentElement;
                          while (parent && parent !== document.body) {
                            const computedStyle = window.getComputedStyle(parent);
                            if (computedStyle.overflow === 'hidden' || computedStyle.overflow === 'auto' || computedStyle.overflow === 'scroll') {
                              parent.style.setProperty('overflow', 'visible', 'important');
                            }
                            parent = parent.parentElement;
                          }
                          
                          // Also check all ancestors up to body
                          let ancestor = container.parentElement;
                          while (ancestor && ancestor !== document.body) {
                            const ancestorStyle = window.getComputedStyle(ancestor);
                            if (ancestorStyle.overflow === 'hidden' || ancestorStyle.overflow === 'auto' || ancestorStyle.overflow === 'scroll') {
                              ancestor.style.setProperty('overflow', 'visible', 'important');
                            }
                            ancestor = ancestor.parentElement;
                          }
                        }
                      }
                    }
                  });
                });
                
                // Observe the container for class changes
                observer.observe(container, {
                  attributes: true,
                  attributeFilter: ['class']
                });
              }
              
              azSelect.hasChoicesListeners = true;
            }
            
          };
        } catch (initError) {
          choicesInstance = null;
          return;
        }
        };
        
        initChoices();
      });
    };
    
    // Initialize availability zone select
    if (azSelect) {
      updateAvailabilityZoneOptions();
      
      // Update when region changes
      if (regionSelect) {
        const appInstance = this;
        regionSelect.addEventListener('change', function() {
          const newRegion = this.value;
          if (newRegion) {
            currentRegion = newRegion;
            
            // Clear selections when region changes (zones are region-specific)
            // First, clear the stored config to prevent old zones from being reapplied
            if (appInstance.currentConfig) {
              appInstance.currentConfig.availability_zones = [];
              appInstance.currentConfig.region = newRegion; // Update region in config
              Utils.setStorage('config', appInstance.currentConfig); // Persist the change
            }
            
            // Update availability zone options with forceRecreate = true
            // This ensures the dropdown is completely refreshed with new region's AZs
            updateAvailabilityZoneOptions(true);
            
            // Trigger subnet recalculation if available
            setTimeout(() => {
              if (typeof appInstance.calculateSubnets === 'function') {
                appInstance.calculateSubnets();
              }
            }, 150);
          }
        });
      }
    }
    
    // Setup create_new_vpc toggle
    const createNewVpcCheckbox = document.getElementById('create_new_vpc');
    const existingVpcSection = document.getElementById('existing-vpc-section');
    if (createNewVpcCheckbox && existingVpcSection) {
      createNewVpcCheckbox.addEventListener('change', function() {
        if (this.checked) {
          existingVpcSection.style.display = 'none';
        } else {
          existingVpcSection.style.display = 'block';
        }
      });
    }
    
    // Setup private link validation
    const checkPrivateLinkRequirements = () => {
      const tier = pricingTierSelect?.value;
      const privateLinkEnabled = privateLinkCheckbox?.checked || false;
      const requiredTier = this.currentProvider === 'aws' ? 'ENTERPRISE' : 'PREMIUM';
      
      if (privateLinkEnabled && tier !== requiredTier && privateLinkWarning) {
        privateLinkWarning.style.display = 'block';
      } else if (privateLinkWarning) {
        privateLinkWarning.style.display = 'none';
      }
    };
    
    privateLinkCheckbox?.addEventListener('change', checkPrivateLinkRequirements);
    pricingTierSelect?.addEventListener('change', checkPrivateLinkRequirements);
    
    // Real-time subnet calculation event listeners
    // Note: calculateSubnets is already defined earlier in the function
    vpcCidrInput?.addEventListener('input', calculateSubnets);
    pricingTierSelect?.addEventListener('change', () => {
      checkPrivateLinkRequirements();
      calculateSubnets();
    });
    privateLinkCheckbox?.addEventListener('change', () => {
      checkPrivateLinkRequirements();
      calculateSubnets();
    });
    
    // Note: Change listeners for availability zone selects are added above in the initialization section
    // Note: Remove button handlers are added above in the addAvailabilityZoneRow function
    
    // Trigger initial calculations
    if (this.currentConfig.vpc_cidr && this.currentConfig.availability_zones) {
      setTimeout(calculateSubnets, 500);
    }
    
    // Setup form submission
    document.getElementById('config-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const config = Object.fromEntries(formData);
      config.provider = this.currentProvider;
      config.create_new_vpc = document.getElementById('create_new_vpc')?.checked !== false;
      config.enable_private_link = document.getElementById('enable_private_link')?.checked || false;
      
      // Clear all previous field validations
      this.clearAllFieldValidations();
      
      // Get availability zones from multiple select
      const zones = this.getSelectedAvailabilityZones();
      
      // Validate availability zones
      const limits = this.getAvailabilityZoneLimits(this.currentProvider);
      
      if (zones.length === 0) {
        const azSelect = document.getElementById('availability-zones-select');
        if (azSelect) {
          azSelect.setAttribute('data-invalid', 'true');
          azSelect.setAttribute('data-error', `At least ${limits.min} availability zone(s) required for ${this.currentProvider.toUpperCase()}.`);
          const choicesContainer = azSelect.closest('.choices');
          if (choicesContainer) {
            choicesContainer.classList.add('is-invalid');
          }
        }
        Utils.showFlashMessage(`At least ${limits.min} availability zone(s) required for ${this.currentProvider.toUpperCase()}.`, 'error');
        return;
      }
      
      // Check minimum
      if (zones.length < limits.min) {
        const azSelect = document.getElementById('availability-zones-select');
        if (azSelect) {
          azSelect.setAttribute('data-invalid', 'true');
          azSelect.setAttribute('data-error', `At least ${limits.min} availability zone(s) required for ${this.currentProvider.toUpperCase()}.`);
          const choicesContainer = azSelect.closest('.choices');
          if (choicesContainer) {
            choicesContainer.classList.add('is-invalid');
          }
        }
        Utils.showFlashMessage(`At least ${limits.min} availability zone(s) required for ${this.currentProvider.toUpperCase()}.`, 'error');
        return;
      }
      
      // Check maximum
      if (zones.length > limits.max) {
        const azSelect = document.getElementById('availability-zones-select');
        if (azSelect) {
          azSelect.setAttribute('data-invalid', 'true');
          azSelect.setAttribute('data-error', `Maximum ${limits.max} availability zone(s) allowed for ${this.currentProvider.toUpperCase()}.`);
          const choicesContainer = azSelect.closest('.choices');
          if (choicesContainer) {
            choicesContainer.classList.add('is-invalid');
          }
        }
        Utils.showFlashMessage(`Maximum ${limits.max} availability zone(s) allowed for ${this.currentProvider.toUpperCase()}.`, 'error');
        return;
      }
      
      // Check for duplicates (shouldn't happen with multiple select, but check anyway)
      const uniqueZones = [...new Set(zones)];
      if (uniqueZones.length !== zones.length) {
        const azSelect = document.getElementById('availability-zones-select');
        if (azSelect) {
          azSelect.setAttribute('data-invalid', 'true');
          azSelect.setAttribute('data-error', 'Duplicate availability zones are not allowed.');
        }
        Utils.showFlashMessage('Duplicate availability zones are not allowed.', 'error');
        return;
      }
      
      // Validate zone values are valid for provider and region
      const validZones = this.getAvailabilityZoneOptions(this.currentProvider, config.region).map(z => z.value);
      const invalidZones = zones.filter(z => !validZones.includes(z));
      if (invalidZones.length > 0) {
        const azSelect = document.getElementById('availability-zones-select');
        if (azSelect) {
          azSelect.setAttribute('data-invalid', 'true');
          azSelect.setAttribute('data-error', `Invalid availability zones: ${invalidZones.join(', ')}`);
          const choicesContainer = azSelect.closest('.choices');
          if (choicesContainer) {
            choicesContainer.classList.add('is-invalid');
          }
        }
        Utils.showFlashMessage(`Invalid availability zones: ${invalidZones.join(', ')}`, 'error');
        return;
      }
      
      config.availability_zones = zones;
      
      // Calculate subnets
      const networkCalc = new NetworkCalculator(this.currentProvider);
      try {
        if (config.vpc_cidr && zones.length > 0) {
          const subnets = networkCalc.allocateSubnets(
            config.vpc_cidr,
            zones,
            config.pricing_tier,
            config.enable_private_link
          );
          
          // Validate subnet allocation
          const validation = networkCalc.validateSubnetAllocation(config.vpc_cidr, subnets);
          if (!validation.valid) {
            // Mark VPC CIDR field as invalid
            this.markFieldAsInvalid('vpc_cidr', 'Network configuration error: ' + validation.message);
            Utils.showFlashMessage('Network configuration error: ' + validation.message, 'error');
            return;
          }
          
          config.calculated_subnets = subnets;
        }
      } catch (err) {
        // Mark VPC CIDR field as invalid
        this.markFieldAsInvalid('vpc_cidr', 'Error calculating subnets: ' + err.message);
        Utils.showFlashMessage('Error calculating subnets: ' + err.message, 'error');
        return;
      }
      
      // Check HTML5 validation first for required fields
      const form = e.target;
      if (!form.checkValidity()) {
        // Get invalid HTML5 fields
        const invalidFields = form.querySelectorAll(':invalid');
        invalidFields.forEach(field => {
          if (field.validity.valueMissing) {
            this.markFieldAsInvalid(field.name, field.validationMessage || 'This field is required');
          }
        });
        
        // Don't proceed if HTML5 validation fails
        if (invalidFields.length > 0) {
          return;
        }
      }
      
      // Validate
      const validation = Validators.validateConfiguration(config);
      if (!validation.valid) {
        // Mark each invalid field
        Object.keys(validation.errors).forEach(fieldName => {
          if (fieldName === 'availability_zones') {
            // Mark availability zones select
            const azSelect = document.getElementById('availability-zones-select');
            if (azSelect) {
              azSelect.setAttribute('data-invalid', 'true');
              azSelect.setAttribute('data-error', validation.errors[fieldName]);
              const choicesContainer = azSelect.closest('.choices');
              if (choicesContainer) {
                choicesContainer.classList.add('is-invalid');
              }
            }
          } else {
            this.markFieldAsInvalid(fieldName, validation.errors[fieldName]);
          }
        });
        
        // Also show flash message for user feedback
        const errors = Object.values(validation.errors).join(', ');
        Utils.showFlashMessage('Validation errors: ' + errors, 'error');
        return;
      }
      
      this.currentConfig = config;
      Utils.setStorage('config', config);
      Utils.setStorage('step', 2);
      this.updateNavbar();
      window.location.hash = '/summary';
    });
    
    // Setup real-time validation on blur
    const form = document.getElementById('config-form');
    if (form) {
      const fields = form.querySelectorAll('input[name], select[name]');
      fields.forEach(field => {
        field.addEventListener('blur', () => {
          // Clear previous validation
          this.clearFieldValidation(field.name);
          
          // Get current form values
          const formData = new FormData(form);
          const config = Object.fromEntries(formData);
          config.provider = this.currentProvider;
          config.create_new_vpc = document.getElementById('create_new_vpc')?.checked !== false;
          config.enable_private_link = document.getElementById('enable_private_link')?.checked || false;
          
          // Get availability zones from multiple select
          config.availability_zones = this.getSelectedAvailabilityZones();
          
          // Validate only this field
          const validation = Validators.validateConfiguration(config);
          if (!validation.valid && validation.errors[field.name]) {
            this.markFieldAsInvalid(field.name, validation.errors[field.name]);
          }
        });
        
        // Clear validation on input
        field.addEventListener('input', () => {
          if (field.hasAttribute('data-invalid')) {
            this.clearFieldValidation(field.name);
          }
        });
      });
    }
  }

  renderSummary() {
    if (!this.currentConfig || !this.currentProvider) {
      window.location.hash = '/select-provider';
      return;
    }
    
    const config = this.currentConfig;
    const providerIcon = config.provider === 'aws' ? 
      '<i class="bi bi-amazon text-warning me-2" style="font-size: 2rem;"></i>' :
      config.provider === 'azure' ?
      '<i class="bi bi-microsoft text-info me-2" style="font-size: 2rem;"></i>' :
      '<i class="bi bi-google text-success me-2" style="font-size: 2rem;"></i>';
    
    const providerName = config.provider === 'aws' ? 
      '<i class="bi bi-amazon text-warning me-1"></i> Amazon Web Services' :
      config.provider === 'azure' ?
      '<i class="bi bi-microsoft text-info me-1"></i> Microsoft Azure' :
      '<i class="bi bi-google text-success me-1"></i> Google Cloud Platform';
    
    const pricingBadgeClass = config.pricing_tier === 'ENTERPRISE' ? 'warning' :
      config.pricing_tier === 'PREMIUM' ? 'success' : 'secondary';
    
    const networkSummary = config.calculated_subnets ? 
      (() => {
        try {
          const networkCalc = new NetworkCalculator(config.provider);
          return networkCalc.calculateNetworkSummary(config.vpc_cidr, config.calculated_subnets);
        } catch {
          return null;
        }
      })() : null;
    
    const content = `
      <div class="container my-5">
        <div class="row">
          <div class="col-xl-10 mx-auto">
            <div class="text-center mb-5">
              <div class="provider-badge mb-3">
                ${providerIcon}
                <span class="h2 fw-bold">Configuration Summary</span>
              </div>
              <p class="lead text-muted">
                Review your configuration before generating the Terraform project. 
                All settings can be modified after download if needed.
              </p>
            </div>
            
            <div class="row g-4 mb-5">
              <div class="col-lg-6">
                <div class="card h-100">
                  <div class="card-header bg-primary text-white">
                    <h5 class="card-title mb-0">
                      <i class="bi bi-gear-fill me-2"></i>
                      Basic Configuration
                    </h5>
                  </div>
                  <div class="card-body">
                    <table class="table table-borderless mb-0">
                      <tr>
                        <td class="fw-semibold">Cloud Provider:</td>
                        <td>${providerName}</td>
                      </tr>
                      <tr>
                        <td class="fw-semibold">Project Prefix:</td>
                        <td><code>${config.project_prefix}</code></td>
                      </tr>
                      <tr>
                        <td class="fw-semibold">Region:</td>
                        <td><code>${config.region}</code></td>
                      </tr>
                      <tr>
                        <td class="fw-semibold">Pricing Tier:</td>
                        <td>
                          <span class="badge bg-${pricingBadgeClass}">${config.pricing_tier}</span>
                        </td>
                      </tr>
                      ${config.provider === 'azure' && config.resource_group_name ? `
                        <tr>
                          <td class="fw-semibold">Resource Group:</td>
                          <td><code>${config.resource_group_name}</code></td>
                        </tr>
                      ` : ''}
                      ${config.provider === 'gcp' && config.project_id ? `
                        <tr>
                          <td class="fw-semibold">GCP Project ID:</td>
                          <td><code>${config.project_id}</code></td>
                        </tr>
                      ` : ''}
                    </table>
                  </div>
                </div>
              </div>
              
              <div class="col-lg-6">
                <div class="card h-100">
                  <div class="card-header bg-success text-white">
                    <h5 class="card-title mb-0">
                      <i class="bi bi-diagram-3-fill me-2"></i>
                      Network Configuration
                    </h5>
                  </div>
                  <div class="card-body">
                    <table class="table table-borderless mb-0">
                      <tr>
                        <td class="fw-semibold">${config.provider === 'azure' ? 'VNet Mode:' : 'VPC Mode:'}</td>
                        <td>
                          <span class="badge bg-${config.create_new_vpc ? 'primary' : 'secondary'}">
                            ${config.create_new_vpc ? 'Create New' : 'Use Existing'}
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td class="fw-semibold">${config.provider === 'azure' ? 'VNet CIDR:' : 'VPC CIDR:'}</td>
                        <td><code>${config.vpc_cidr}</code></td>
                      </tr>
                      <tr>
                        <td class="fw-semibold">Availability Zones:</td>
                        <td>
                          ${(config.availability_zones || []).map(az => 
                            `<span class="badge bg-light text-dark me-1">${az}</span>`
                          ).join('')}
                        </td>
                      </tr>
                    </table>
                  </div>
                </div>
              </div>
              
              ${networkSummary && !networkSummary.error ? `
                <div class="col-lg-6">
                  <div class="card h-100">
                    <div class="card-header bg-info text-white">
                      <h5 class="card-title mb-0">
                        <i class="bi bi-calculator me-2"></i>
                        Network Utilization
                      </h5>
                    </div>
                    <div class="card-body">
                      <div class="row text-center mb-3">
                        <div class="col-6">
                          <div class="h4 text-primary mb-1">${Utils.formatNumber(networkSummary.total_ips)}</div>
                          <div class="small text-muted">Total IP Addresses</div>
                        </div>
                        <div class="col-6">
                          <div class="h4 text-success mb-1">${Utils.formatNumber(networkSummary.used_ips)}</div>
                          <div class="small text-muted">Allocated IPs</div>
                        </div>
                      </div>
                      <div class="progress mb-2" style="height: 8px;">
                        <div class="progress-bar bg-success" role="progressbar" 
                             style="width: ${networkSummary.utilization_percent}%"
                             aria-valuenow="${networkSummary.utilization_percent}" 
                             aria-valuemin="0" aria-valuemax="100">
                        </div>
                      </div>
                      <div class="text-center small text-muted">
                        ${networkSummary.utilization_percent}% Network Utilization
                      </div>
                      <div class="text-center small text-success mt-2">
                        ${networkSummary.subnet_count} Subnets Configured
                      </div>
                    </div>
                  </div>
                </div>
              ` : ''}
            </div>
            
            ${config.calculated_subnets && config.calculated_subnets.length > 0 ? `
              <div class="card mb-5">
                <div class="card-header bg-light">
                  <h5 class="card-title mb-0">
                    <i class="bi bi-diagram-2 me-2"></i>
                    Subnet Allocation Details
                  </h5>
                </div>
                <div class="card-body">
                  <div class="row g-3">
                    ${config.calculated_subnets.map(subnet => {
                      const typeColor = subnet.subnet_type === 'private' ? 'primary' :
                        subnet.subnet_type === 'public' ? 'success' :
                        subnet.subnet_type === 'service' ? 'warning' :
                        subnet.subnet_type === 'host' ? 'info' : 'secondary';
                      return `
                        <div class="col-md-6 col-lg-4">
                          <div class="card border-start border-4 border-${typeColor}">
                            <div class="card-body p-3">
                              <div class="d-flex justify-content-between align-items-start mb-2">
                                <h6 class="card-title mb-0 text-capitalize">${subnet.name}</h6>
                                <span class="badge bg-${typeColor} small">${subnet.subnet_type}</span>
                              </div>
                              <div class="text-muted small">
                                <div><strong>CIDR:</strong> <code>${subnet.cidr}</code></div>
                                <div><strong>Size:</strong> /${subnet.size}</div>
                                <div><strong>Zone:</strong> ${subnet.availability_zone}</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      `;
                    }).join('')}
                  </div>
                </div>
              </div>
            ` : ''}
            
            <form id="summary-form">
              <div class="card mb-4">
                <div class="card-body">
                  <div class="form-check mb-3">
                    <input class="form-check-input" type="checkbox" id="confirm" required>
                    <label class="form-check-label fw-semibold" for="confirm">
                      I confirm the configuration is correct
                    </label>
                  </div>
                  <div class="form-check">
                    <input class="form-check-input" type="checkbox" id="include_docs" checked>
                    <label class="form-check-label" for="include_docs">
                      Include deployment documentation
                    </label>
                    <div class="form-text">Include README.md with deployment instructions</div>
                  </div>
                </div>
              </div>
              
              <div class="d-flex justify-content-between">
                <a href="#/configure" class="btn btn-outline-secondary btn-lg" data-navigate>
                  <i class="bi bi-arrow-left me-2"></i>
                  Back to Configuration
                </a>
                <button type="submit" class="btn btn-primary btn-lg px-5" id="generate-btn" disabled>
                  <i class="bi bi-download me-2"></i>
                  Generate & Download Project
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `;
    
    this.render(content);
    Utils.updateProgress(3);
    
    document.getElementById('confirm').addEventListener('change', (e) => {
      document.getElementById('generate-btn').disabled = !e.target.checked;
    });
    
    document.getElementById('summary-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      
      // Update loading message
      const loadingMessage = document.getElementById('loading-message');
      if (loadingMessage) {
        loadingMessage.textContent = 'Generating your Terraform project...';
      }
      
      Utils.showLoading('Generating your Terraform project...');
      
      try {
        // Wait for JSZip to be available
        await Utils.waitForJSZip();
        
        const generator = new TerraformGenerator();
        const zipBlob = await generator.generateProject(this.currentConfig);
        const filename = `${this.currentConfig.project_prefix}-${this.currentProvider}-terraform.zip`;
        
        Utils.downloadFile(zipBlob, filename);
        Utils.setStorage('step', 3);
        Utils.hideLoading();
        window.location.hash = '/download';
      } catch (err) {
        Utils.hideLoading();
        Utils.showFlashMessage('Error generating project: ' + err.message, 'error');
      }
    });
  }

  renderDownload() {
    const config = this.currentConfig;
    const providerIcon = config.provider === 'aws' ? 
      '<i class="bi bi-amazon text-warning me-1"></i> AWS' :
      config.provider === 'azure' ?
      '<i class="bi bi-microsoft text-info me-1"></i> Azure' :
      '<i class="bi bi-google text-success me-1"></i> Google Cloud';
    
    const content = `
      <div class="container my-5">
        <div class="row">
          <div class="col-xl-8 mx-auto">
            <div class="text-center mb-5">
              <div class="success-icon mb-3">
                <i class="bi bi-check-circle-fill text-success" style="font-size: 4rem;"></i>
              </div>
              <h1 class="display-5 fw-bold text-success mb-3">
                Project Generated Successfully!
              </h1>
              <p class="lead text-muted">
                Your Terraform project is ready for download and deployment. 
                The generated code follows best practices and is production-ready.
              </p>
            </div>

            <div class="card mb-4">
              <div class="card-header bg-success text-white">
                <h5 class="card-title mb-0">
                  <i class="bi bi-info-circle me-2"></i>
                  Project Information
                </h5>
              </div>
              <div class="card-body">
                <div class="row">
                  <div class="col-md-6">
                    <table class="table table-borderless mb-0">
                      <tr>
                        <td class="fw-semibold">Cloud Provider:</td>
                        <td>${providerIcon}</td>
                      </tr>
                      <tr>
                        <td class="fw-semibold">Project Prefix:</td>
                        <td><code>${config.project_prefix || 'databricks'}</code></td>
                      </tr>
                      <tr>
                        <td class="fw-semibold">Region:</td>
                        <td><code>${config.region || 'N/A'}</code></td>
                      </tr>
                    </table>
                  </div>
                  <div class="col-md-6">
                    <table class="table table-borderless mb-0">
                      <tr>
                        <td class="fw-semibold">Generated:</td>
                        <td>${Utils.formatDate()}</td>
                      </tr>
                      <tr>
                        <td class="fw-semibold">File Format:</td>
                        <td><span class="badge bg-primary">ZIP Archive</span></td>
                      </tr>
                      <tr>
                        <td class="fw-semibold">Status:</td>
                        <td><span class="badge bg-success">Ready for Download</span></td>
                      </tr>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            <div class="card mb-4">
              <div class="card-header bg-primary text-white">
                <h5 class="card-title mb-0">
                  <i class="bi bi-download me-2"></i>
                  Download Your Project
                </h5>
              </div>
              <div class="card-body text-center">
                <div class="mb-4">
                  <i class="bi bi-file-earmark-zip text-primary" style="font-size: 3rem;"></i>
                </div>
                <h6 class="fw-bold mb-3">
                  ${config.project_prefix || 'databricks'}-${config.provider}-terraform.zip
                </h6>
                <p class="text-muted mb-4">
                  Complete Terraform project with all configuration files, 
                  modules, documentation, and deployment instructions.
                </p>
                <div class="text-muted small">
                  <i class="bi bi-info-circle me-1"></i>
                  The download should have started automatically. If not, refresh the page and try again.
                </div>
              </div>
            </div>

            <div class="card mb-4">
              <div class="card-header bg-info text-white">
                <h5 class="card-title mb-0">
                  <i class="bi bi-list-check me-2"></i>
                  What's Included in Your Project
                </h5>
              </div>
              <div class="card-body">
                <div class="row">
                  <div class="col-md-6">
                    <h6 class="fw-bold text-primary mb-3">Core Files</h6>
                    <ul class="list-unstyled">
                      <li class="mb-2">
                        <i class="bi bi-file-earmark-code text-success me-2"></i>
                        <strong>main.tf</strong> - Main resource definitions
                      </li>
                      <li class="mb-2">
                        <i class="bi bi-file-earmark-text text-info me-2"></i>
                        <strong>variables.tf</strong> - Input variable definitions
                      </li>
                      <li class="mb-2">
                        <i class="bi bi-file-earmark-text text-warning me-2"></i>
                        <strong>terraform.tfvars</strong> - Your configuration values
                      </li>
                      <li class="mb-2">
                        <i class="bi bi-file-earmark-code text-secondary me-2"></i>
                        <strong>outputs.tf</strong> - Output value definitions
                      </li>
                      <li class="mb-2">
                        <i class="bi bi-file-earmark-code text-primary me-2"></i>
                        <strong>provider.tf</strong> - Provider configuration
                      </li>
                      <li class="mb-2">
                        <i class="bi bi-file-earmark-code text-success me-2"></i>
                        <strong>versions.tf</strong> - Version constraints
                      </li>
                    </ul>
                  </div>
                  <div class="col-md-6">
                    <h6 class="fw-bold text-primary mb-3">Documentation & Modules</h6>
                    <ul class="list-unstyled">
                      <li class="mb-2">
                        <i class="bi bi-file-earmark-text text-primary me-2"></i>
                        <strong>README.md</strong> - Complete deployment guide
                      </li>
                      <li class="mb-2">
                        <i class="bi bi-folder text-info me-2"></i>
                        <strong>modules/</strong> - Reusable Terraform modules
                      </li>
                      <li class="mb-2">
                        <i class="bi bi-diagram-3 text-success me-2"></i>
                        <strong>Network module</strong> - VPC/VNet configuration
                      </li>
                      <li class="mb-2">
                        <i class="bi bi-server text-warning me-2"></i>
                        <strong>Databricks module</strong> - Workspace setup
                      </li>
                      <li class="mb-2">
                        <i class="bi bi-shield-check text-danger me-2"></i>
                        <strong>Security module</strong> - Private connectivity
                      </li>
                      <li class="mb-2">
                        <i class="bi bi-file-earmark-text text-secondary me-2"></i>
                        <strong>Examples & docs</strong> - Usage examples
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div class="card mb-4">
              <div class="card-header bg-warning text-dark">
                <h5 class="card-title mb-0">
                  <i class="bi bi-play-circle me-2"></i>
                  Next Steps - Deploy Your Infrastructure
                </h5>
              </div>
              <div class="card-body">
                <div class="step-container">
                  <div class="step-item d-flex mb-4">
                    <div class="step-number bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-3">
                      1
                    </div>
                    <div class="step-content">
                      <h6 class="fw-bold mb-2">Extract and Review</h6>
                      <p class="mb-2">Extract the ZIP file and review the generated configuration files. Check the <code>README.md</code> for detailed instructions.</p>
                      <code class="d-block bg-light p-2 rounded">unzip ${config.project_prefix || 'databricks'}-${config.provider}-terraform.zip</code>
                    </div>
                  </div>

                  <div class="step-item d-flex mb-4">
                    <div class="step-number bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-3">
                      2
                    </div>
                    <div class="step-content">
                      <h6 class="fw-bold mb-2">Configure Credentials</h6>
                      <p class="mb-2">Set up your cloud provider credentials according to the provider-specific instructions in the README.</p>
                      <code class="d-block bg-light p-2 rounded">${config.provider === 'aws' ? 'aws configure' : config.provider === 'azure' ? 'az login' : 'gcloud auth login'}</code>
                    </div>
                  </div>

                  <div class="step-item d-flex mb-4">
                    <div class="step-number bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-3">
                      3
                    </div>
                    <div class="step-content">
                      <h6 class="fw-bold mb-2">Initialize Terraform</h6>
                      <p class="mb-2">Navigate to the project directory and initialize Terraform to download required providers and modules.</p>
                      <code class="d-block bg-light p-2 rounded">terraform init</code>
                    </div>
                  </div>

                  <div class="step-item d-flex mb-4">
                    <div class="step-number bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-3">
                      4
                    </div>
                    <div class="step-content">
                      <h6 class="fw-bold mb-2">Plan Deployment</h6>
                      <p class="mb-2">Review the execution plan to see what resources will be created before applying changes.</p>
                      <code class="d-block bg-light p-2 rounded">terraform plan</code>
                    </div>
                  </div>

                  <div class="step-item d-flex mb-4">
                    <div class="step-number bg-success text-white rounded-circle d-flex align-items-center justify-content-center me-3">
                      5
                    </div>
                    <div class="step-content">
                      <h6 class="fw-bold mb-2">Deploy Infrastructure</h6>
                      <p class="mb-2">Apply the Terraform configuration to create your Databricks infrastructure in the cloud.</p>
                      <code class="d-block bg-light p-2 rounded">terraform apply</code>
                    </div>
                  </div>
                </div>

                <div class="alert alert-info mt-4">
                  <i class="bi bi-lightbulb me-2"></i>
                  <strong>Tip:</strong> The generated project includes comprehensive documentation, 
                  troubleshooting guides, and examples. Check the README.md file for detailed information 
                  about customization and advanced configuration options.
                </div>
              </div>
            </div>

            <div class="text-center">
              <div class="d-flex gap-3 justify-content-center flex-wrap">
                <a href="#/select-provider" class="btn btn-primary btn-lg" data-navigate>
                  <i class="bi bi-plus-circle me-2"></i>
                  Create Another Project
                </a>
                <a href="#/" class="btn btn-outline-secondary btn-lg" data-navigate>
                  <i class="bi bi-house me-2"></i>
                  Back to Home
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
    
    this.render(content);
    Utils.updateProgress(3);
  }

  handleReset() {
    Utils.clearStorage();
    this.currentConfig = {};
    this.currentProvider = null;
    this.currentStep = 0;
    Utils.updateProgress(0);
    this.updateNavbar();
    Utils.showFlashMessage('Session reset. Starting fresh configuration.', 'info');
    window.location.hash = '/';
  }

  render(content) {
    const container = document.getElementById('app-content');
    if (container) {
      container.innerHTML = content;
      // Re-setup navigation for new content
      this.setupNavigation();
    }
  }
}

// Initialize app when DOM is ready
let app;
document.addEventListener('DOMContentLoaded', () => {
  app = new App();
});

