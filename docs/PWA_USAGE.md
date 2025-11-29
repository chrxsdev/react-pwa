# PWA Usage Guide

Basic instructions for running and testing your PWA.

---

## Running the PWA

### Development Mode

```bash
npm run dev
```

Open `http://127.0.0.1:5173/` in your browser. The service worker will work in dev mode, but with limited caching.

### Production Mode

```bash
npm run build
npm run preview
```

Open `http://127.0.0.1:4173/` in your browser. This is the full PWA experience.

---

## Checking if it's Working

### 1. Open DevTools (F12)

Go to **Application** tab and check:

- **Service Workers** → Should show `sw.js` as activated (green status)
- **Manifest** → Should display "Calendar App" info
- **Cache Storage** → Should see `workbox-precache-v2` with cached files

### 2. Test Offline

1. Go to **Network** tab in DevTools
2. Select **"Offline"** from throttling dropdown
3. Reload the page
4. ✅ App should still work

### 3. Test Installation

- Look for install icon (⊕) in Chrome address bar
- Click to install the PWA
- App opens in standalone window

---

## After Making Changes

### Update and Test

```bash
npm run build
npm run preview
```

### Clear Service Worker (if needed)

If changes don't appear:

1. DevTools → **Application** → **Service Workers**
2. Click **Unregister** on the old service worker
3. Click **Clear storage** → **Clear site data**
4. Reload the page

### Quick Reset

```bash
# Stop preview server (Ctrl+C)
npm run build
npm run preview
```

Then hard reload in browser: `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)

---

## Tips

- Always test in **production mode** (`npm run preview`) for full PWA features
- Use **Incognito/Private mode** for clean testing
- Check **Console** tab for service worker messages
