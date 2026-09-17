# One Click Databricks Deployer - PWA

Progressive Web App (PWA) for generating Terraform configurations for Databricks across multiple clouds (AWS, Azure, GCP).

## 🚀 Features

- ✅ **100% Offline** - Works without a server after first access
- ✅ **Installable** - Can be installed as an app in Chrome
- ✅ **Multi-Cloud** - Supports AWS, Azure, and GCP
- ✅ **ZIP Generation** - Generates complete Terraform projects
- ✅ **Automatic Calculations** - Automatically calculates subnets and network configurations

## 📦 Installation

### Option 1: GitHub Pages (Recommended)

1. **Fork or clone this repository**

2. **Enable GitHub Pages**:
   - Go to Settings → Pages
   - Source: "Deploy from a branch"
   - Branch: `main` (or `gh-pages`)
   - Folder: `/ (root)` or `/pwa/deploy`

3. **Access your app**:
   - `https://your-username.github.io/oneclick-databricks-deployer/pwa/deploy/`
   - Or if you configured `/pwa/deploy` as root: `https://your-username.github.io/`

### Option 2: Local Server

```bash
# Navigate to the deploy folder
cd pwa/deploy

# Use a simple HTTP server (Python)
python3 -m http.server 8000

# Or use Node.js
npx http-server -p 8000

# Access http://localhost:8000
```

**Important**: For the PWA to work completely, you need HTTPS (or localhost). GitHub Pages provides HTTPS automatically.

## 🔧 How to Install as an App

### On Chrome Desktop:

1. Access the app in your browser
2. Look for the install icon in the address bar (or menu ⋮)
3. Click "Install" or "Install app"
4. The app will be installed and appear as a native application

### On Chrome Mobile:

1. Access the app in your mobile browser
2. Menu → "Add to Home Screen"
3. The app will be installed

## 📁 Project Structure

```
pwa/
├── deploy/                # Deployment artifacts (production)
│   ├── index.html         # Main page (SPA)
│   ├── manifest.json      # PWA manifest
│   ├── sw.js              # Service Worker (offline cache)
│   ├── css/
│   │   └── main.css       # Main styles
│   ├── js/
│   │   ├── app.js         # Main application (SPA routing)
│   │   ├── network-calculator.js  # Network calculations
│   │   ├── terraform-generator.js # Terraform code generation
│   │   ├── validators.js  # Form validation
│   │   └── utils.js       # Utility functions
│   └── icons/             # PWA icons
├── docs/                  # Documentation
│   ├── README.md          # Main documentation
│   ├── PWA-INSTALL-GUIDE.md  # Installation guide
│   └── icons/
│       └── README.md      # Icons documentation
└── tests/                 # Tests
    └── test-install.html  # Installation test page
```

## 🎨 Creating Icons

To create the necessary icons, you can use:

1. **PWA Asset Generator**: https://github.com/onderceylan/pwa-asset-generator
2. **RealFaviconGenerator**: https://realfavicongenerator.net/
3. **Favicon.io**: https://favicon.io/

Create icons in the following sizes:
- 72x72
- 96x96
- 128x128
- 144x144
- 152x152
- 192x192
- 384x384
- 512x512

Save them in the `icons/` folder with the names:
- `icon-72x72.png`
- `icon-96x96.png`
- etc.

## 🔄 Updating the Service Worker

When making code changes, update the `CACHE_NAME` in `sw.js`:

```javascript
const CACHE_NAME = 'databricks-deployer-v2'; // Increment the version
```

This forces users to download the new version.

## 📝 Usage

1. **Select Provider**: Choose AWS, Azure, or GCP
2. **Configure**: Fill out the form with your settings
3. **Review**: Review the configuration summary
4. **Download**: Generate and download the Terraform project as ZIP

## 🛠️ Development

### Code Structure

- **SPA Router**: Uses hash routing (`#/route`) for navigation
- **LocalStorage**: Temporarily stores configuration
- **JSZip**: Generates ZIP files in the browser
- **Service Worker**: Caches resources for offline operation

### Adding New Providers

1. Add templates in `terraform-generator.js`
2. Add validations in `validators.js`
3. Add options in the selection form

## 🐛 Troubleshooting

### Service Worker doesn't register
- Check if you're using HTTPS (or localhost)
- Open DevTools → Application → Service Workers
- Check console for errors

### App doesn't install
- Check if `manifest.json` is correct
- Check if icons exist
- Check if you're using HTTPS

### Cache doesn't update
- Increment `CACHE_NAME` in `sw.js`
- Clear browser cache (DevTools → Application → Clear storage)

## 📄 License

This project is part of the One Click Databricks Deployer.

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the project
2. Create a branch for your feature
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📚 Resources

- [PWA Documentation](https://web.dev/progressive-web-apps/)
- [Service Workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Web App Manifest](https://developer.mozilla.org/en-US/docs/Web/Manifest)
- [JSZip Documentation](https://stuk.github.io/jszip/)

## ⚠️ Important Notes

- This PWA works **100% client-side** - no server required
- All calculations and code generation happen in the browser
- Data is stored only locally (LocalStorage)
- ZIP is generated using JSZip in the browser

## 🎯 Next Steps

- [ ] Add more complete Terraform templates
- [ ] Improve form validation
- [ ] Add Terraform code preview before downloading
- [ ] Theme support (dark mode)
- [ ] Internationalization (i18n)

---

**Developed with ❤️ to simplify Databricks deployments**

