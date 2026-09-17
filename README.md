# One Click Databricks Deployer - PWA

A Progressive Web App (PWA) that assembles deployable Databricks Terraform projects for AWS, Azure, and Google Cloud Platform. The `.tf` files are fetched from the configured upstream repository during each build; the app generates only the matching `terraform.tfvars` and deployment guide.

## 🎯 About the Project

**One Click Databricks Deployer** is a client-side Progressive Web Application designed to eliminate the complexity of manually writing Terraform code for Databricks workspace deployments. Instead of spending hours researching cloud provider documentation and writing infrastructure-as-code from scratch, users can generate complete, production-ready Terraform projects in minutes through an intuitive web interface.

### Key Benefits

- 🚀 **Time Savings**: Reduce deployment preparation time from hours to minutes
- 🎯 **Zero Terraform Knowledge Required**: Visual forms replace complex code writing
- ☁️ **Multi-Cloud Support**: Single interface for AWS, Azure, and GCP with provider-specific optimizations
- 🔒 **Production-Ready Output**: Generated code follows enterprise best practices with built-in security and networking configurations
- 📦 **Complete Projects**: Generates full Terraform projects with modules, documentation, and deployment instructions
- 🧮 **Intelligent Automation**: Automatic network calculations, subnet allocations, and CIDR management
- 🔐 **Enterprise Security**: Built-in support for private connectivity (PrivateLink, Private Service Connect), IAM roles, and network isolation
- 💾 **100% Client-Side**: All processing happens in your browser - no data leaves your machine

### What It Does

The application guides users through a simple three-step process:

1. **Select Cloud Provider**: Choose AWS, Azure, or GCP
2. **Configure Settings**: Fill out a guided form with project details, regions, pricing tiers, and network preferences
3. **Download Project**: Generate and download a complete Terraform project as a ZIP file containing:
   - All Terraform configuration files (`main.tf`, `variables.tf`, `terraform.tfvars`, etc.)
   - Reusable modules for networking, Databricks workspace, and security
   - Comprehensive README with deployment instructions
   - Provider-specific optimizations and best practices

### Technical Features

- **Smart Network Calculator**: Automatically calculates optimal subnet allocations, CIDR blocks, and network configurations based on your requirements
- **Real-time Validation**: Form validation with immediate feedback to prevent configuration errors
- **Offline Capability**: Works completely offline after first access thanks to Service Worker caching
- **Installable PWA**: Can be installed as a native app on desktop and mobile devices
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **Cross-Browser Support**: Tested on Chrome, Firefox, Safari, and Edge

### Use Cases

- **Data Engineers**: Quickly spin up Databricks workspaces without deep Terraform expertise
- **DevOps Teams**: Standardize Databricks deployments across teams and environments
- **Cloud Architects**: Generate reference implementations following best practices
- **Learning Tool**: Understand Terraform patterns for Databricks infrastructure
- **Rapid Prototyping**: Quickly generate infrastructure code for proof-of-concepts

## 📁 Project Structure

This project is organized into three main folders:

### 🚀 `deploy/` - Application Source

Contains all files necessary to deploy the PWA to production:

- `index.html` - Main application page
- `manifest.json` - PWA manifest
- `sw.js` - Service Worker for offline caching
- `css/` - CSS styles
- `js/` - JavaScript application scripts
- `icons/` - PWA icons in multiple sizes

Run `npm run build` to produce `dist/`, the deployable artifact. The build resolves the configured upstream `main` ref to an exact commit, vendors the AWS, Azure, and GCP Terraform files, and records file hashes and source metadata.

### 📚 `docs/` - Documentation

Contains all project documentation:

- `README.md` - Main PWA documentation
- `PWA-INSTALL-GUIDE.md` - Detailed installation and testing guide
- `icons/README.md` - Documentation on creating icons

### 🧪 `tests/` - Tests

Contains test and debug files:

- `e2e/` - End-to-end tests with Playwright
  - `basic.spec.js` - Basic application tests (loading, navigation, main elements)
  - `pwa.spec.js` - PWA-specific tests (service worker, manifest, installation)
- `test-install.html` - Test page to verify PWA installation status

## 🛠️ Technologies & Architecture

### Frontend Stack

- **Vanilla JavaScript**: No framework dependencies - pure, lightweight, and fast
- **Bootstrap 5**: Modern, responsive UI components
- **Bootstrap Icons**: Comprehensive icon library
- **JSZip**: Client-side ZIP file generation
- **Service Worker API**: Offline functionality and resource caching
- **Web App Manifest**: PWA installation and native app experience
- **LocalStorage API**: Client-side configuration persistence

### Core Components

- **SPA Router**: Hash-based routing (`#/route`) for single-page application navigation
- **Network Calculator**: Intelligent CIDR calculations and subnet allocation algorithms
- **Terraform Generator**: Template-based code generation with provider-specific logic
- **Form Validators**: Real-time validation with comprehensive error handling
- **Utility Functions**: Date formatting, number formatting, storage management

### Architecture Highlights

- **100% Client-Side**: No backend server required - all processing happens in the browser
- **Modular Design**: Separated concerns with dedicated modules for calculations, validation, and generation
- **Offline-First**: Service Worker caches all resources for complete offline functionality
- **Progressive Enhancement**: Works as a regular website, enhanced as a PWA when installed
- **Cross-Platform**: Compatible with desktop and mobile browsers

### Generated Terraform Structure

AWS downloads contain the selected upstream Terraform root, the generated tfvars, source notices, and deployment instructions:

```
project-name-aws-terraform/
├── *.tf                    # Unchanged upstream source files
├── .terraform.lock.hcl     # Unchanged upstream provider lock
├── terraform.tfvars        # Values generated from the UI
├── UPSTREAM_LICENSE.md
├── UPSTREAM_NOTICE.md
└── README.md               # Deployment and source instructions
```

Azure and GCP downloads follow the same model: unchanged files from the selected upstream example plus a generated `terraform.tfvars` and README. The GCP flow uses only the `gcp-byovpc-standalone` source.

## 🚀 Quick Start

### For Development

```bash
# Install dependencies (first time)
npm install

# Build once, watch deploy/ changes, and refresh the browser automatically
npm run dev

# Or run a production-like build without watching for changes
npm start

# Access http://localhost:8000
```

### For Testing

```bash
# Install dependencies (first time)
npm install

# Run tests
npm test

# Run tests with graphical interface
npm run test:ui

# Run tests in debug mode
npm run test:debug

# Run tests with visible browser
npm run test:headed

# Run tests with code coverage
npm run test:coverage
```

### For Deployment

Deployment is done automatically via GitHub Actions when a release/tag is created in the repository.

**Manual Deployment:** run `npm run build`, then publish the generated `dist/` directory. The build intentionally fails if the upstream source cannot be resolved or fetched.

**Automatic Deployment via GitHub Actions:**
- Deployment is triggered automatically when a release or tag is created
- Tests are executed before deployment to ensure everything is working
- Deployment is done to the `gh-pages` branch and available at `https://databricks-solutions.github.io/oneclick-deployer/`

## 📖 Complete Documentation

See the `docs/` folder for detailed documentation:

- [Main README](docs/README.md) - Complete PWA documentation
- [Installation Guide](docs/PWA-INSTALL-GUIDE.md) - How to install and test the PWA
- [Icons Documentation](docs/icons/README.md) - How to create PWA icons

## ✨ Key Features

### Cloud Provider Support

#### AWS (Amazon Web Services)
- Complete VPC management with subnets and security groups
- Single, per-availability-zone, or no-NAT deployment options
- AWS PrivateLink support (Enterprise tier)
- Cross-account IAM role-based access control
- Support for Premium and Enterprise pricing tiers
- Multi-AZ deployment with automatic subnet distribution

#### Azure (Microsoft Azure)
- Virtual Network (VNet) and Resource Group management
- Azure Private Link support (Premium tier)
- Managed Identity integration with Azure AD
- Support for Standard and Premium pricing tiers
- Region-specific availability zone configuration

#### GCP (Google Cloud Platform)
- VPC and subnet network management
- Private Service Connect support (Premium tier)
- Service Account and IAM integration
- Support for Standard and Premium pricing tiers
- Host and pods subnet configuration for GKE

### Network Intelligence

- **Automatic CIDR Calculation**: Validates and calculates optimal network ranges
- **Subnet Allocation**: Intelligently distributes subnets across availability zones
- **Network Utilization Tracking**: Real-time visualization of IP address usage
- **Overlap Detection**: Prevents subnet conflicts and validates configurations
- **Provider-Specific Logic**: Adapts network configurations to cloud provider requirements

### Security Features

- **Private Connectivity Options**: 
  - AWS PrivateLink (Enterprise tier)
  - Azure Private Link (Premium tier)
  - GCP Private Service Connect (Premium tier)
- **Network Isolation**: Separate private and public subnets
- **IAM Integration**: Proper role and identity management
- **Security Best Practices**: Follows cloud provider security guidelines

### User Experience

- **Progressive Web App**: Installable on desktop and mobile devices
- **Offline Functionality**: Works without internet connection after first load
- **Real-time Validation**: Immediate feedback on form inputs
- **Visual Progress Indicator**: Track progress through the configuration process
- **Responsive Design**: Optimized for all screen sizes
- **Accessibility**: ARIA labels and semantic HTML for screen readers

## 🧪 Testing

### End-to-End Tests with Playwright

The project uses Playwright for automated testing. Tests are executed automatically on each PR and push to the main branch.

**Run tests locally:**

```bash
# Install dependencies (first time)
npm install

# Run all tests
npm test

# Run tests with interactive graphical interface
npm run test:ui

# Run tests in debug mode (pauses at breakpoints)
npm run test:debug

# Run tests with visible browser
npm run test:headed
```

**Test types:**

- **Basic Tests** (`tests/e2e/basic.spec.js`): Verify page loading, main elements, navigation, and responsiveness
- **PWA Tests** (`tests/e2e/pwa.spec.js`): Verify PWA-specific functionality such as service worker, manifest, icons, and offline resources

**Tests run on multiple browsers:**
- Chromium (Chrome/Edge)
- Firefox
- WebKit (Safari)
- Mobile Chrome
- Mobile Safari

### Code Coverage

The project includes code coverage tests to ensure JavaScript code is being tested adequately.

**Run tests with coverage:**

```bash
npm run test:coverage
```

This will:
1. Run tests with coverage collection enabled
2. Generate coverage reports in `coverage/`:
   - `coverage/index.html` - Visual HTML report
   - `coverage/coverage-summary.json` - JSON summary
   - `coverage/lcov.info` - LCOV format (compatible with Codecov, Coveralls, etc.)

**View coverage report:**

Open `coverage/index.html` in your browser to view the visual coverage report.

**Coverage in CI/CD:**

Coverage reports are automatically generated in GitHub Actions and made available as downloadable artifacts.

### Manual PWA Installation Test

To test PWA installation manually:

1. Open `tests/test-install.html` in your browser
2. Follow the instructions on the page to verify installation status

## 🔄 CI/CD

The project uses GitHub Actions for test and deployment automation:

### Test Workflow (`.github/workflows/test.yml`)
- **Trigger**: Runs on each push and pull request to `main` or `master` branches
- **Actions**:
  - Installs Node.js dependencies
  - Installs Playwright browsers
  - Runs automated tests
  - Uploads reports and videos on failure

### Deployment Workflow (`.github/workflows/deploy.yml`)
- **Trigger**: Runs when a release or tag is created
- **Actions**:
  - Runs tests before deployment (ensures quality)
  - Automatically deploys the `deploy/` folder to GitHub Pages
  - Available at `https://databricks-solutions.github.io/oneclick-deployer/`

## 📋 Requirements & Compatibility

### Browser Requirements

- **Minimum**: Modern browsers with ES6+ support
- **Recommended**: Latest versions of Chrome, Firefox, Safari, or Edge
- **Mobile**: iOS Safari 11.3+, Chrome Android 67+, Firefox Android 68+

### PWA Installation Requirements

- **Desktop**: Chrome/Edge 67+, Firefox 60+ (limited), Safari 11.3+ (manual)
- **Mobile**: Chrome Android 67+, Firefox Android 68+, Safari iOS 11.3+ (manual)
- **HTTPS**: Required for PWA features (except localhost)

### Cloud Provider Prerequisites

#### AWS
- AWS account with appropriate permissions
- AWS CLI configured or IAM credentials
- Terraform installed (v1.0+)

#### Azure
- Azure subscription with contributor access
- Azure CLI configured or service principal
- Terraform installed (v1.0+)

#### GCP
- GCP project with billing enabled
- gcloud CLI configured or service account key
- Terraform installed (v1.0+)

### Development Requirements

- **Node.js**: v16+ (for running tests)
- **npm**: v7+ (for installing dependencies)
- **Python 3**: Optional, for local HTTP server
- **Git**: For cloning and version control

## 📝 Important Notes

- **Deployment**: Use only files from the `deploy/` folder for production
- **Documentation**: Keep documentation updated in the `docs/` folder
- **Tests**: Run tests before committing (`npm test`)
- **CI/CD**: Tests run automatically on PRs and pushes
- **Privacy**: All data processing happens client-side - no data is sent to external servers
- **Updates**: Service Worker cache version must be incremented for updates to propagate

## 🤝 Contributing

We welcome contributions! When contributing to the project:

1. **Maintain Structure**: Keep organization in three folders (deploy, docs, tests)
2. **Add Tests**: Include tests for new features in `tests/`
3. **Update Documentation**: Keep documentation in `docs/` current
4. **Production Ready**: Ensure files in `deploy/` are production-ready
5. **Follow Standards**: Maintain code quality and follow existing patterns
6. **Test Locally**: Run tests before submitting PRs

### Contribution Areas

- 🐛 **Bug Fixes**: Report and fix issues
- ✨ **New Features**: Add functionality or improve existing features
- 📚 **Documentation**: Improve guides and documentation
- 🧪 **Tests**: Add test coverage for edge cases
- 🎨 **UI/UX**: Enhance user interface and experience
- 🌐 **Internationalization**: Add support for additional languages

## 🗺️ Roadmap

### Planned Features

- [ ] Additional Terraform templates and modules
- [ ] Terraform code preview before download
- [ ] Dark mode theme support
- [ ] Internationalization (i18n) for multiple languages
- [ ] Export/import configuration functionality
- [ ] Configuration templates library
- [ ] Advanced networking options
- [ ] Cost estimation calculator
- [ ] Integration with Terraform Cloud/Enterprise
- [ ] CLI tool version

### Known Limitations

- Currently supports AWS, Azure, and GCP only
- Requires manual Terraform execution after download
- Network calculations are optimized but may need manual adjustment for complex scenarios
- Some advanced Databricks features may require manual Terraform modifications

## 📞 Support & Resources

- **Documentation**: See `docs/` folder for detailed guides
- **Issues**: Report bugs and request features via GitHub Issues
- **Discussions**: Join discussions about features and improvements
- **Examples**: Check generated Terraform projects for usage examples

## 📄 License

This project is part of the One Click Databricks Deployer ecosystem.

---

**Developed with ❤️ to simplify Databricks deployments**

*Making infrastructure-as-code accessible to everyone, one click at a time.*
