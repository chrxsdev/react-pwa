# Workbox PWA Setup for React + Vite

Step-by-step guide to integrate Workbox for Progressive Web App (PWA) functionality in a React + Vite application.

## Prerequisites

- Node.js (v14 or higher)
- A React + Vite project

---

## Installation

### Step 1: Install Required Packages

```bash
npm install -D vite-plugin-pwa workbox-window
```

---

## Configuration

### Step 2: Update vite.config.js

Import and configure the VitePWA plugin:

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: {
        enabled: true
      }
    })
  ]
})
```

**Basic Options:**
- `registerType: 'autoUpdate'` - Automatically updates the service worker
- `devOptions.enabled: true` - Enable PWA in development mode for testing

---

### Step 3: Create manifest.json

Create `public/manifest.json`:

```json
{
  "name": "Calendar App",
  "short_name": "Calendar",
  "description": "A modern calendar application for managing your events",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#1976d2",
  "orientation": "portrait-primary",
  "icons": [
    {
      "src": "/vite.svg",
      "sizes": "512x512",
      "type": "image/svg+xml",
      "purpose": "any maskable"
    }
  ]
}
```

---

### Step 4: Update index.html

Add PWA meta tags:

```html
<head>
  <!-- PWA Meta Tags -->
  <meta name="theme-color" content="#1976d2" />
  <meta name="description" content="A modern calendar application for managing your events" />
  <link rel="manifest" href="/manifest.json" />
  <link rel="apple-touch-icon" href="/vite.svg" />
</head>
```

---

### Step 5: Register Service Worker

Update `src/main.jsx` to register the service worker:

```javascript
import { registerSW } from 'virtual:pwa-register'

const updateSW = registerSW({
  onNeedRefresh() {
    if (confirm('New content available. Reload to update?')) {
      updateSW(true)
    }
  },
  onOfflineReady() {
    console.log('App ready to work offline')
  },
})
```

---

## Verification

### Build and Test

```bash
npm run build
npm run preview
```

### Verify in DevTools

1. Open DevTools → **Application** tab
2. Check **Service Workers** - should show active service worker
3. Check **Manifest** - should display your PWA manifest
4. Check **Cache Storage** - should show cached assets

---

## Additional Resources

- [Vite PWA Plugin Docs](https://vite-pwa-org.netlify.app/)
- [Workbox Documentation](https://developers.google.com/web/tools/workbox)
