# PWA Installation and Testing Guide

## 📱 About PWA (Progressive Web App)

**One Click Databricks Deployer** is a Progressive Web App that can be installed on your device as a native application. This provides:

- ✅ **Offline Access**: Use the app even without an internet connection
- ✅ **Native Experience**: Icon on home screen and dedicated window
- ✅ **Improved Performance**: Faster loading with intelligent caching
- ✅ **Notifications**: Receive important updates (future)

## 🔍 Installation Status Verification

### Automatic Detection

The application automatically detects if it's installed by checking:

1. **Display Mode**: If it's running in `standalone` mode
2. **iOS Standalone**: For Apple devices
3. **Android App Referrer**: For Android devices
4. **LocalStorage Flag**: Persistent installation flag

### Visual Indicators

#### When NOT installed:
- 🔵 **"Install App" button** appears in the top bar
- 🔵 **Installation banner** may appear at the top of the page
- 🔵 "Offline Ready" badge may appear when Service Worker is active

#### When IS installed:
- ✅ **"App Installed" badge** appears in the top bar
- ✅ Install button is hidden
- ✅ Installation banner is not displayed

## 🧪 How to Test

### 1. Status Test (Debug Page)

Access: `http://localhost:PORT/pwa/tests/test-install.html`

This page shows:
- Current installation status
- Environment information (display mode, user agent, etc.)
- Service Worker status
- Real-time console log
- Buttons to clear cache and update status

### 2. Installation Test

#### Desktop (Chrome/Edge):

1. Open the application in your browser
2. Look for the install icon in the address bar (➕ or ⬇️)
3. Or click the "Install App" button in the top bar
4. Confirm installation
5. The app will open in a dedicated window
6. Verify that the "App Installed" badge appears

#### Mobile (Android):

1. Open the application in Chrome
2. Tap the menu (⋮) and select "Add to Home Screen"
3. Or tap the "Install" button in the banner/navbar
4. Confirm installation
5. The icon will appear on the home screen
6. Open the app and verify the "App Installed" badge

#### Mobile (iOS):

1. Open the application in Safari
2. Tap the Share button (□↑)
3. Scroll and select "Add to Home Screen"
4. Confirm and name the app
5. The icon will appear on the home screen
6. Open the app and verify the "App Installed" badge

### 3. Offline Functionality Test

1. Install the application
2. Open the installed app
3. Disable internet connection (airplane mode)
4. The app should continue working
5. An "Offline Mode" indicator should appear
6. All basic functionality should work

## 🛠️ Development and Debug

### Console Logs

The application logs detailed information to the browser console:

```javascript
=== PWA Status Check ===
Display mode: standalone
User agent: Mozilla/5.0...
Is installed: true
✓ Running as installed PWA
```

### Manual Verification via Console

```javascript
// Check if installed
window.matchMedia('(display-mode: standalone)').matches

// Check Service Worker
navigator.serviceWorker.getRegistration()

// Check installation flag
localStorage.getItem('pwa-installed')
```

### Clear Installation State

To test installation again:

1. Use the test page: `tests/test-install.html`
2. Click "Clear Cache"
3. Or manually:
   - Open DevTools → Application
   - Clear Storage → Clear site data
   - Uninstall the app if installed

## 📋 Feature Checklist

- [x] Automatic installation detection
- [x] Install button in navbar
- [x] Installation banner (dismissible)
- [x] "App Installed" status badge
- [x] Service Worker for offline cache
- [x] Manifest.json configured
- [x] Icons for all resolutions
- [x] Support for iOS, Android, and Desktop
- [x] Manual instructions for platforms without API
- [x] Test and debug page
- [x] Detailed console logs

## 🔧 Troubleshooting

### Install button doesn't appear

**Possible causes:**
1. App is already installed
2. Service Worker is not registered
3. Browser doesn't support PWA
4. Site is not on HTTPS (except localhost)

**Solution:**
- Check console for logs
- Use the `test-install.html` page
- Clear cache and reload

### "App Installed" badge doesn't appear

**Possible causes:**
1. App was not detected as installed
2. LocalStorage was not set

**Solution:**
- Check `window.matchMedia('(display-mode: standalone)').matches`
- Force installation via `localStorage.setItem('pwa-installed', 'true')`

### App doesn't work offline

**Possible causes:**
1. Service Worker is not active
2. Resources were not cached

**Solution:**
- Check DevTools → Application → Service Workers
- Check Cache Storage
- Force Service Worker update

## 📱 Compatibility

| Platform | Browser | Installation | Offline |
|----------|---------|--------------|---------|
| Android | Chrome | ✅ Automatic | ✅ |
| Android | Firefox | ✅ Automatic | ✅ |
| Android | Edge | ✅ Automatic | ✅ |
| iOS | Safari | ⚠️ Manual | ✅ |
| Desktop | Chrome | ✅ Automatic | ✅ |
| Desktop | Edge | ✅ Automatic | ✅ |
| Desktop | Firefox | ⚠️ Limited | ✅ |

**Legend:**
- ✅ = Full support
- ⚠️ = Partial or manual support
- ❌ = Not supported

## 🎯 Next Steps

1. Test on different devices
2. Verify installation experience
3. Test offline functionality
4. Validate icons at all resolutions
5. Test on different browsers

## 📞 Support

If you encounter problems:
1. Check console logs
2. Use the test page `tests/test-install.html`
3. Clear cache and try again
4. Check browser compatibility
