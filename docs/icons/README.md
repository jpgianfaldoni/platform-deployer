# PWA Icons

This folder should contain the Progressive Web App icons.

## Required Sizes

Create PNG icons in the following sizes:

- `icon-72x72.png` - 72x72 pixels
- `icon-96x96.png` - 96x96 pixels  
- `icon-128x128.png` - 128x128 pixels
- `icon-144x144.png` - 144x144 pixels
- `icon-152x152.png` - 152x152 pixels
- `icon-192x192.png` - 192x192 pixels (minimum recommended)
- `icon-384x384.png` - 384x384 pixels
- `icon-512x512.png` - 512x512 pixels (recommended for splash screen)

## How to Create Icons

### Option 1: PWA Asset Generator (Recommended)

```bash
# Install the generator
npm install -g pwa-asset-generator

# Generate icons from an image
pwa-asset-generator logo.png icons/ --icon-only
```

### Option 2: Online Tools

1. **RealFaviconGenerator**: https://realfavicongenerator.net/
   - Upload your image
   - Configure for PWA
   - Download generated icons

2. **Favicon.io**: https://favicon.io/
   - Generate icons from text or image
   - Download in multiple sizes

3. **PWA Builder**: https://www.pwabuilder.com/imageGenerator
   - Generate all sizes automatically

### Option 3: Create Manually

Use any image editor (Photoshop, GIMP, Figma, etc.):

1. Create a square image (512x512 recommended)
2. Resize to each required size
3. Export as PNG
4. Save with the names specified above

## Design Guidelines

- **Format**: PNG with transparency
- **Shape**: Square (1:1)
- **Content**: Should be visible at small sizes
- **Background**: Transparent or solid (avoid complex gradients)
- **Content size**: Leave ~10% padding on edges

## Testing

After adding icons:

1. Open the app in your browser
2. Check console for missing icon errors
3. Test PWA installation
4. Verify icons appear correctly

## Note

If you don't have icons yet, the PWA will still work, but:
- The install prompt may not appear
- Default browser icons will be used
- User experience will be reduced
