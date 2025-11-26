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
      <section class="hero-section bg-primary text-white">
        <div class="container">
          <div class="row align-items-center min-vh-50">
            <div class="col-lg-6">
              <h1 class="display-4 fw-bold mb-4">
                Deploy Databricks Infrastructure in Minutes
              </h1>
              <p class="lead mb-4">
                One-Click Deployer simplifies Databricks infrastructure deployment across AWS, Azure, and GCP. 
                Transform complex Terraform configurations into a simple, guided experience. Generate production-ready 
                infrastructure code with intelligent automation and best practices built-in.
              </p>
              <div class="d-flex gap-3 flex-wrap mb-4">
                <a href="#/select-provider" class="btn btn-light btn-lg px-4" data-navigate>
                  <i class="bi bi-rocket-takeoff me-2" aria-hidden="true"></i>
                  Get Started
                </a>
                <button class="btn btn-outline-light btn-lg px-4" id="hero-install-btn" style="display: none;">
                  <i class="bi bi-download me-2" aria-hidden="true"></i>
                  Install App
                </button>
              </div>
              
              <!-- Quick Stats -->
              <div class="row mt-4">
                <div class="col-4">
                  <div class="text-center">
                    <div class="h3 fw-bold mb-1">3</div>
                    <div class="small opacity-75">Cloud Providers</div>
                  </div>
                </div>
                <div class="col-4">
                  <div class="text-center">
                    <div class="h3 fw-bold mb-1">90%</div>
                    <div class="small opacity-75">Time Saved</div>
                  </div>
                </div>
                <div class="col-4">
                  <div class="text-center">
                    <div class="h3 fw-bold mb-1">100%</div>
                    <div class="small opacity-75">Best Practices</div>
                  </div>
                </div>
              </div>
            </div>
            <div class="col-lg-6">
              <div class="hero-illustration-wrapper">
                <div class="hero-illustration" aria-hidden="true">
                  <div class="hero-laptop">
                    <div class="hero-laptop-screen">
                      <div class="hero-screen-header">
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                      <div class="hero-screen-body">
                        <span class="hero-code-line shell">% terraform init</span>
                        <span class="hero-code-line keyword">% terraform apply</span>
                        <span class="hero-code-line accent">Deploying Databricks Workspace... Done</span>
                        <span class="hero-code-line blank"></span>
                        <span class="hero-code-line blank"></span>
                        <span class="hero-code-line blank"></span>
                      </div>
                    </div>
                    <div class="hero-laptop-base"></div>
                  </div>
                  <div class="hero-hand">
                    <div class="hero-hand-arm"></div>
                    <div class="hero-hand-palm"></div>
                    <div class="hero-hand-thumb"></div>
                    <div class="hero-hand-finger pointer"></div>
                    <div class="hero-hand-finger support"></div>
                  </div>
                </div>
                <p class="hero-illustration-caption text-white-50 small mb-0">
                  Visualize the experience: your Terraform project appears on a virtual laptop while an animated hand highlights the generated code—everything built for you automatically.
                </p>
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
          
          <div class="row g-4">
            <div class="col-md-6 col-lg-4">
              <div class="card border-0 shadow-sm h-100">
                <div class="card-body p-4 text-center">
                  <div class="feature-icon bg-primary bg-opacity-10 rounded-circle p-3 mb-3 d-inline-flex">
                    <i class="bi bi-lightning-charge-fill text-primary h2 mb-0"></i>
                  </div>
                  <h5 class="fw-bold">Zero Terraform Knowledge Required</h5>
                  <p class="text-muted mb-0">
                    Visual forms replace complex code writing. Anyone can deploy 
                    enterprise-grade infrastructure without deep technical expertise.
                  </p>
                </div>
              </div>
            </div>
            
            <div class="col-md-6 col-lg-4">
              <div class="card border-0 shadow-sm h-100">
                <div class="card-body p-4 text-center">
                  <div class="feature-icon bg-success bg-opacity-10 rounded-circle p-3 mb-3 d-inline-flex">
                    <i class="bi bi-shield-check text-success h2 mb-0" aria-hidden="true"></i>
                  </div>
                  <h5 class="fw-bold">Production-Ready Output</h5>
                  <p class="text-muted mb-0">
                    Generated code follows enterprise best practices with built-in 
                    security, networking, and compliance configurations.
                  </p>
                </div>
              </div>
            </div>
            
            <div class="col-md-6 col-lg-4">
              <div class="card border-0 shadow-sm h-100">
                <div class="card-body p-4 text-center">
                  <div class="feature-icon bg-info bg-opacity-10 rounded-circle p-3 mb-3 d-inline-flex">
                    <i class="bi bi-clouds-fill text-info h2 mb-0"></i>
                  </div>
                  <h5 class="fw-bold">Multi-Cloud Native</h5>
                  <p class="text-muted mb-0">
                    Single interface for AWS, Azure, and GCP. Deploy consistently 
                    across all major cloud providers with provider-specific optimizations.
                  </p>
                </div>
              </div>
            </div>
            
            <div class="col-md-6 col-lg-4">
              <div class="card border-0 shadow-sm h-100">
                <div class="card-body p-4 text-center">
                  <div class="feature-icon bg-warning bg-opacity-10 rounded-circle p-3 mb-3 d-inline-flex">
                    <i class="bi bi-clock-fill text-warning h2 mb-0"></i>
                  </div>
                  <h5 class="fw-bold">Minutes, Not Hours</h5>
                  <p class="text-muted mb-0">
                    Reduce deployment preparation time from hours to minutes. 
                    Focus on your data projects, not infrastructure complexity.
                  </p>
                </div>
              </div>
            </div>
            
            <div class="col-md-6 col-lg-4">
              <div class="card border-0 shadow-sm h-100">
                <div class="card-body p-4 text-center">
                  <div class="feature-icon bg-danger bg-opacity-10 rounded-circle p-3 mb-3 d-inline-flex">
                    <i class="bi bi-gear-fill text-danger h2 mb-0"></i>
                  </div>
                  <h5 class="fw-bold">Intelligent Automation</h5>
                  <p class="text-muted mb-0">
                    Smart defaults, automatic network calculations, and real-time 
                    validation prevent configuration errors before they happen.
                  </p>
                </div>
              </div>
            </div>
            
            <div class="col-md-6 col-lg-4">
              <div class="card border-0 shadow-sm h-100">
                <div class="card-body p-4 text-center">
                  <div class="feature-icon bg-secondary bg-opacity-10 rounded-circle p-3 mb-3 d-inline-flex">
                    <i class="bi bi-arrow-repeat text-secondary h2 mb-0"></i>
                  </div>
                  <h5 class="fw-bold">Keep Evolving</h5>
                  <p class="text-muted mb-0">
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
      <section class="py-5 bg-light">
        <div class="container">
          <div class="row">
            <div class="col-lg-8 mx-auto text-center mb-5">
              <h2 class="h1 fw-bold mb-3">How It Works</h2>
              <p class="lead text-muted">
                Three simple steps to production-ready Databricks infrastructure.
              </p>
            </div>
          </div>
          
          <div class="row g-4">
            <div class="col-md-4">
              <div class="text-center">
                <div class="step-number bg-primary text-white rounded-circle d-inline-flex align-items-center justify-content-center mb-3">
                  <span class="h3 fw-bold mb-0">1</span>
                </div>
                <h5 class="fw-bold">Choose Your Cloud</h5>
                <p class="text-muted">
                  Select your preferred cloud provider from AWS, Azure, or Google Cloud Platform.
                </p>
              </div>
            </div>
            
            <div class="col-md-4">
              <div class="text-center">
                <div class="step-number bg-primary text-white rounded-circle d-inline-flex align-items-center justify-content-center mb-3">
                  <span class="h3 fw-bold mb-0">2</span>
                </div>
                <h5 class="fw-bold">Configure Settings</h5>
                <p class="text-muted">
                  Fill out the guided form with your preferences. Network settings are calculated automatically.
                </p>
              </div>
            </div>
            
            <div class="col-md-4">
              <div class="text-center">
                <div class="step-number bg-primary text-white rounded-circle d-inline-flex align-items-center justify-content-center mb-3">
                  <span class="h3 fw-bold mb-0">3</span>
                </div>
                <h5 class="fw-bold">Deploy & Go</h5>
                <p class="text-muted">
                  Download your complete Terraform project and deploy with standard Terraform commands.
                </p>
              </div>
            </div>
          </div>
          
          <div class="text-center mt-5">
            <a href="#/select-provider" class="btn btn-primary btn-lg px-5" data-navigate>
              Start Building Now
              <i class="bi bi-arrow-right ms-2"></i>
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
      <div class="container my-5">
        <div class="row">
          <div class="col-lg-10 mx-auto">
            <div class="text-center mb-5">
              <h1 class="display-5 fw-bold text-primary mb-3">Choose Your Cloud Provider</h1>
              <p class="lead text-muted">
                Select the cloud provider where you want to deploy your Databricks workspace.
                Each provider has unique features and capabilities optimized for different use cases.
              </p>
            </div>

            <div class="row g-4 mb-5">
              <div class="col-lg-4">
                <div class="provider-option card border-2 h-100 cursor-pointer" data-provider="aws">
                  <div class="card-body p-4 text-center position-relative">
                    <div class="selection-indicator position-absolute top-0 end-0 m-2" style="display: none;">
                      <i class="bi bi-check-circle-fill text-success h4 mb-0"></i>
                    </div>
                    <div class="provider-logo mb-3">
                      <i class="bi bi-amazon text-warning" style="font-size: 4rem;"></i>
                    </div>
                    <h4 class="fw-bold text-dark mb-3">Amazon Web Services</h4>
                    <ul class="list-unstyled text-start mb-4">
                      <li class="mb-2">
                        <i class="bi bi-check-circle text-success me-2"></i>
                        <strong>VPC & Networking:</strong> Complete VPC management with subnets and security groups
                      </li>
                      <li class="mb-2">
                        <i class="bi bi-check-circle text-success me-2"></i>
                        <strong>PrivateLink:</strong> Secure private connectivity (Enterprise tier)
                      </li>
                      <li class="mb-2">
                        <i class="bi bi-check-circle text-success me-2"></i>
                        <strong>Cross-Account:</strong> IAM role-based access control
                      </li>
                      <li class="mb-2">
                        <i class="bi bi-check-circle text-success me-2"></i>
                        <strong>Pricing Tiers:</strong> Standard, Premium, Enterprise
                      </li>
                    </ul>
                    <div class="prerequisites bg-light rounded p-3 text-start">
                      <h6 class="fw-bold mb-2">Prerequisites:</h6>
                      <ul class="small text-muted mb-0">
                        <li>AWS account with appropriate permissions</li>
                        <li>AWS CLI configured or IAM credentials</li>
                        <li>Terraform installed (v1.0+)</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              <div class="col-lg-4">
                <div class="provider-option card border-2 h-100 cursor-pointer" data-provider="azure">
                  <div class="card-body p-4 text-center position-relative">
                    <div class="selection-indicator position-absolute top-0 end-0 m-2" style="display: none;">
                      <i class="bi bi-check-circle-fill text-success h4 mb-0"></i>
                    </div>
                    <div class="provider-logo mb-3">
                      <i class="bi bi-microsoft text-info" style="font-size: 4rem;"></i>
                    </div>
                    <h4 class="fw-bold text-dark mb-3">Microsoft Azure</h4>
                    <ul class="list-unstyled text-start mb-4">
                      <li class="mb-2">
                        <i class="bi bi-check-circle text-success me-2"></i>
                        <strong>VNet & Resources:</strong> Virtual networks and resource group management
                      </li>
                      <li class="mb-2">
                        <i class="bi bi-check-circle text-success me-2"></i>
                        <strong>Private Link:</strong> Secure private endpoints (Premium tier)
                      </li>
                      <li class="mb-2">
                        <i class="bi bi-check-circle text-success me-2"></i>
                        <strong>Managed Identity:</strong> Azure AD integration and access control
                      </li>
                      <li class="mb-2">
                        <i class="bi bi-check-circle text-success me-2"></i>
                        <strong>Pricing Tiers:</strong> Standard, Premium
                      </li>
                    </ul>
                    <div class="prerequisites bg-light rounded p-3 text-start">
                      <h6 class="fw-bold mb-2">Prerequisites:</h6>
                      <ul class="small text-muted mb-0">
                        <li>Azure subscription with contributor access</li>
                        <li>Azure CLI configured or service principal</li>
                        <li>Terraform installed (v1.0+)</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              <div class="col-lg-4">
                <div class="provider-option card border-2 h-100 cursor-pointer" data-provider="gcp">
                  <div class="card-body p-4 text-center position-relative">
                    <div class="selection-indicator position-absolute top-0 end-0 m-2" style="display: none;">
                      <i class="bi bi-check-circle-fill text-success h4 mb-0"></i>
                    </div>
                    <div class="provider-logo mb-3">
                      <i class="bi bi-google text-success" style="font-size: 4rem;"></i>
                    </div>
                    <h4 class="fw-bold text-dark mb-3">Google Cloud Platform</h4>
                    <ul class="list-unstyled text-start mb-4">
                      <li class="mb-2">
                        <i class="bi bi-check-circle text-success me-2"></i>
                        <strong>VPC & Subnets:</strong> Host and pods subnet management for GKE
                      </li>
                      <li class="mb-2">
                        <i class="bi bi-check-circle text-success me-2"></i>
                        <strong>Private Service Connect:</strong> Secure private connectivity (Premium tier)
                      </li>
                      <li class="mb-2">
                        <i class="bi bi-check-circle text-success me-2"></i>
                        <strong>Service Accounts:</strong> IAM and service account integration
                      </li>
                      <li class="mb-2">
                        <i class="bi bi-check-circle text-success me-2"></i>
                        <strong>Pricing Tiers:</strong> Standard, Premium
                      </li>
                    </ul>
                    <div class="prerequisites bg-light rounded p-3 text-start">
                      <h6 class="fw-bold mb-2">Prerequisites:</h6>
                      <ul class="small text-muted mb-0">
                        <li>GCP project with billing enabled</li>
                        <li>gcloud CLI configured or service account key</li>
                        <li>Terraform installed (v1.0+)</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="card mb-5">
              <div class="card-header bg-light">
                <h5 class="card-title mb-0">
                  <i class="bi bi-table me-2"></i>
                  Feature Comparison
                </h5>
              </div>
              <div class="card-body p-0">
                <div class="table-responsive">
                  <table class="table table-hover mb-0">
                    <thead class="table-light">
                      <tr>
                        <th>Feature</th>
                        <th class="text-center">
                          <i class="bi bi-amazon text-warning me-1"></i>
                          AWS
                        </th>
                        <th class="text-center">
                          <i class="bi bi-microsoft text-info me-1"></i>
                          Azure
                        </th>
                        <th class="text-center">
                          <i class="bi bi-google text-success me-1"></i>
                          GCP
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td><strong>Network Configuration</strong></td>
                        <td class="text-center"><i class="bi bi-check-circle-fill text-success"></i></td>
                        <td class="text-center"><i class="bi bi-check-circle-fill text-success"></i></td>
                        <td class="text-center"><i class="bi bi-check-circle-fill text-success"></i></td>
                      </tr>
                      <tr>
                        <td><strong>Private Connectivity</strong></td>
                        <td class="text-center">
                          <span class="badge bg-warning text-dark">Enterprise</span>
                        </td>
                        <td class="text-center">
                          <span class="badge bg-info">Premium</span>
                        </td>
                        <td class="text-center">
                          <span class="badge bg-success">Premium</span>
                        </td>
                      </tr>
                      <tr>
                        <td><strong>Multi-AZ Support</strong></td>
                        <td class="text-center"><i class="bi bi-check-circle-fill text-success"></i></td>
                        <td class="text-center"><i class="bi bi-check-circle-fill text-success"></i></td>
                        <td class="text-center"><i class="bi bi-check-circle-fill text-success"></i></td>
                      </tr>
                      <tr>
                        <td><strong>Cross-Account/Subscription</strong></td>
                        <td class="text-center"><i class="bi bi-check-circle-fill text-success"></i></td>
                        <td class="text-center"><i class="bi bi-check-circle-fill text-success"></i></td>
                        <td class="text-center"><i class="bi bi-check-circle-fill text-success"></i></td>
                      </tr>
                      <tr>
                        <td><strong>Managed Identity</strong></td>
                        <td class="text-center">IAM Roles</td>
                        <td class="text-center"><i class="bi bi-check-circle-fill text-success"></i></td>
                        <td class="text-center">Service Accounts</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div class="d-flex justify-content-between align-items-center">
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
          opt.querySelector('.selection-indicator').style.display = 'none';
        });
        option.classList.add('selected');
        option.querySelector('.selection-indicator').style.display = 'block';
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
    
    // If not found and it's availability_zones, mark the container
    if (!field && fieldName === 'availability_zones') {
      const azContainer = document.getElementById('az-container');
      if (azContainer) {
        azContainer.setAttribute('data-invalid', 'true');
        azContainer.setAttribute('data-error', errorMessage);
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
                             value="${this.currentConfig.project_prefix || ''}" required>
                      <div class="form-text">Prefix for all resource names (2-20 characters, alphanumeric and hyphens only)</div>
                    </div>
                    <div class="col-md-6">
                      <label class="form-label fw-semibold">
                        Region
                        <span class="text-danger">*</span>
                      </label>
                      <input type="text" class="form-control" name="region" 
                             value="${this.currentConfig.region || ''}" required>
                      <div class="form-text">Cloud provider region for resource deployment</div>
                    </div>
                    <div class="col-md-6">
                      <label class="form-label fw-semibold">
                        Databricks Pricing Tier
                        <span class="text-danger">*</span>
                      </label>
                      <select class="form-select" name="pricing_tier" required>
                        <option value="">Select pricing tier</option>
                        ${this.currentProvider === 'aws' ? 
                          '<option value="STANDARD">Standard</option><option value="PREMIUM">Premium</option><option value="ENTERPRISE">Enterprise</option>' :
                          '<option value="STANDARD">Standard</option><option value="PREMIUM">Premium</option>'
                        }
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
                               value="${this.currentConfig.resource_group_name || ''}" required>
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
                               value="${this.currentConfig.project_id || ''}" required>
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
                               value="${this.currentConfig.existing_vpc_name || ''}">
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
                           value="${this.currentConfig.vpc_cidr || '10.0.0.0/22'}" required>
                    <div class="form-text">${vpcDesc}</div>
                  </div>
                  <div class="mb-3">
                    <label class="form-label fw-semibold">
                      Availability Zones
                      <span class="text-danger">*</span>
                    </label>
                    <div id="az-container"></div>
                    <button type="button" class="btn btn-sm btn-outline-primary mt-2" id="add-az">
                      <i class="bi bi-plus"></i> Add Availability Zone
                    </button>
                    <div class="form-text">Select availability zones for subnet distribution</div>
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
    
    // Initialize availability zones
    const azContainer = document.getElementById('az-container');
    if (azContainer) {
      const defaultZones = this.currentConfig.availability_zones || [];
      if (defaultZones.length === 0) {
        // Add default zones based on provider and region
        const region = this.currentConfig.region || '';
        let zones = [];
        if (this.currentProvider === 'aws' && region) {
          zones = [`${region}a`, `${region}b`];
        } else if (this.currentProvider === 'azure') {
          zones = ['1', '2'];
        } else if (this.currentProvider === 'gcp' && region) {
          zones = [`${region}-a`, `${region}-b`];
        } else {
          zones = ['zone-1'];
        }
        
        zones.forEach((zone, idx) => {
          const zoneDiv = document.createElement('div');
          zoneDiv.className = 'row mb-2 az-row';
          zoneDiv.innerHTML = `
            <div class="col-md-6">
              <input type="text" class="form-control" name="availability_zones" 
                     value="${zone}" placeholder="Availability Zone" required>
            </div>
            <div class="col-md-6 d-flex align-items-center">
              <button type="button" class="btn btn-sm btn-outline-danger remove-az-btn">
                <i class="bi bi-trash"></i> Remove
              </button>
            </div>
          `;
          azContainer.appendChild(zoneDiv);
        });
      } else {
        defaultZones.forEach(zone => {
          const zoneDiv = document.createElement('div');
          zoneDiv.className = 'row mb-2 az-row';
          zoneDiv.innerHTML = `
            <div class="col-md-6">
              <input type="text" class="form-control" name="availability_zones" 
                     value="${zone}" placeholder="Availability Zone" required>
            </div>
            <div class="col-md-6 d-flex align-items-center">
              <button type="button" class="btn btn-sm btn-outline-danger remove-az-btn">
                <i class="bi bi-trash"></i> Remove
              </button>
            </div>
          `;
          azContainer.appendChild(zoneDiv);
        });
      }
    }
    
    // Add zone button - will be updated after calculateSubnets is defined
    let azCounter = document.querySelectorAll('.az-row').length;
    const addZoneBtn = document.getElementById('add-az');
    if (addZoneBtn) {
      // Store reference to add zone handler
      this.addZoneHandler = () => {
        const zoneDiv = document.createElement('div');
        zoneDiv.className = 'row mb-2 az-row';
        zoneDiv.innerHTML = `
          <div class="col-md-6">
            <input type="text" class="form-control" name="availability_zones" 
                   placeholder="Availability Zone" required>
          </div>
          <div class="col-md-6 d-flex align-items-center">
            <button type="button" class="btn btn-sm btn-outline-danger remove-az-btn">
              <i class="bi bi-trash"></i> Remove
            </button>
          </div>
        `;
        azContainer.appendChild(zoneDiv);
        azCounter++;
      };
      addZoneBtn.addEventListener('click', this.addZoneHandler);
    }
    
    // Remove zone buttons - will be updated after calculateSubnets is defined
    document.querySelectorAll('.remove-az-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        const row = this.closest('.az-row');
        if (document.querySelectorAll('.az-row').length > 1) {
          row.remove();
        } else {
          alert('At least one availability zone is required.');
        }
      });
    });
    
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
    const privateLinkCheckbox = document.getElementById('enable_private_link');
    const pricingTierSelect = document.querySelector('select[name="pricing_tier"]');
    const privateLinkWarning = document.getElementById('private-link-warning');
    
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
    
    // Real-time subnet calculation
    const vpcCidrInput = document.querySelector('input[name="vpc_cidr"]');
    
    const calculateSubnets = Utils.debounce(() => {
      const vpcCidr = vpcCidrInput?.value;
      const pricingTier = pricingTierSelect?.value;
      const enablePrivateLink = privateLinkCheckbox?.checked || false;
      const zones = Array.from(document.querySelectorAll('#az-container input'))
        .map(input => input.value.trim())
        .filter(v => v);
      
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
                <div class="card-body p-3">
                  <h6 class="card-title">Network Utilization Summary</h6>
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
    
    vpcCidrInput?.addEventListener('input', calculateSubnets);
    pricingTierSelect?.addEventListener('change', () => {
      checkPrivateLinkRequirements();
      calculateSubnets();
    });
    privateLinkCheckbox?.addEventListener('change', () => {
      checkPrivateLinkRequirements();
      calculateSubnets();
    });
    
    // Add input listeners to availability zone inputs for recalculation
    document.querySelectorAll('#az-container input[name="availability_zones"]').forEach(input => {
      input.addEventListener('input', calculateSubnets);
    });
    
    // Update add zone button to add listener to new inputs and trigger recalculation
    if (addZoneBtn && this.addZoneHandler) {
      // Remove old handler and add new one
      addZoneBtn.removeEventListener('click', this.addZoneHandler);
      addZoneBtn.addEventListener('click', () => {
        this.addZoneHandler();
        // Wait for DOM to update, then add listener to new input and recalculate
        setTimeout(() => {
          const newInputs = document.querySelectorAll('#az-container input[name="availability_zones"]');
          newInputs.forEach(input => {
            // Check if listener already added
            if (!input.hasAttribute('data-has-listener')) {
              input.addEventListener('input', calculateSubnets);
              input.setAttribute('data-has-listener', 'true');
            }
          });
          calculateSubnets();
        }, 100);
      });
    }
    
    // Update remove zone buttons to trigger recalculation
    document.querySelectorAll('.remove-az-btn').forEach(btn => {
      const originalHandler = btn.onclick;
      btn.addEventListener('click', function() {
        const row = this.closest('.az-row');
        if (document.querySelectorAll('.az-row').length > 1) {
          row.remove();
          setTimeout(() => {
            calculateSubnets();
          }, 100);
        } else {
          alert('At least one availability zone is required.');
        }
      });
    });
    
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
      
      // Get availability zones
      const zones = Array.from(document.querySelectorAll('#az-container input'))
        .map(input => input.value.trim())
        .filter(v => v);
      
      if (zones.length === 0) {
        // Mark availability zones container as invalid
        const azContainer = document.getElementById('az-container');
        if (azContainer) {
          azContainer.setAttribute('data-invalid', 'true');
          azContainer.setAttribute('data-error', 'At least one availability zone is required.');
        }
        Utils.showFlashMessage('At least one availability zone is required.', 'error');
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
            // Mark availability zones container
            const azContainer = document.getElementById('az-container');
            if (azContainer) {
              azContainer.setAttribute('data-invalid', 'true');
              azContainer.setAttribute('data-error', validation.errors[fieldName]);
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
          
          // Get availability zones
          const zones = Array.from(document.querySelectorAll('#az-container input'))
            .map(input => input.value.trim())
            .filter(v => v);
          config.availability_zones = zones;
          
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

