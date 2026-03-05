# MHL PWA Redesign — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Rewrite the MHL interactive map as a SvelteKit PWA with MapLibre GL and an editorial/archival UI.

**Architecture:** Single-page SvelteKit app (static adapter). MapLibre GL renders the map with clustered markers from a JSON dataset. A reactive Svelte store manages year range, selected marker, and drawer state. Bottom drawer (mobile) / side panel (desktop) shows images. PWA manifest + service worker for installability.

**Tech Stack:** SvelteKit 2, Svelte 5, Tailwind CSS v4, MapLibre GL JS, vite-plugin-pwa

**Design doc:** `docs/plans/2026-03-05-pwa-redesign-design.md`

---

### Task 1: Scaffold SvelteKit project

**Files:**
- Create: `package.json`, `svelte.config.js`, `vite.config.js`, `tailwind.config.js`, `src/app.html`, `src/app.css`, `src/routes/+layout.svelte`, `src/routes/+page.svelte`

**Step 1: Initialize SvelteKit**

```bash
cd /Users/tgieruc/Documents/Musee-Historique-Lausanne-Carte
npx sv create mhl-app --template minimal --types none
```

Pick: no TypeScript, no additional options. This creates a `mhl-app/` subdirectory.

**Step 2: Move scaffolded files to root**

Move the contents of `mhl-app/` to the project root (overwriting nothing critical — old files like `index.html`, `js/`, `css/`, `dist/` stay for reference). Delete empty `mhl-app/`.

**Step 3: Install dependencies**

```bash
npm install
npm install -D tailwindcss @tailwindcss/vite maplibre-gl @maptiler/sdk vite-plugin-pwa
```

**Step 4: Configure Tailwind**

In `vite.config.js`, add the Tailwind Vite plugin:

```js
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [sveltekit(), tailwindcss()]
});
```

In `src/app.css`:

```css
@import 'tailwindcss';
```

**Step 5: Configure static adapter**

```bash
npm install -D @sveltejs/adapter-static
```

In `svelte.config.js`:

```js
import adapter from '@sveltejs/adapter-static';

export default {
  kit: {
    adapter: adapter({
      pages: 'build',
      assets: 'build',
      fallback: undefined,
      precompress: false
    }),
    paths: {
      base: '/Musee-Historique-Lausanne-Carte'
    }
  }
};
```

Note: `paths.base` is needed for GitHub Pages subdirectory deployment.

**Step 6: Add prerender to layout**

Create `src/routes/+layout.js`:

```js
export const prerender = true;
```

**Step 7: Verify dev server runs**

```bash
npm run dev
```

Confirm the default page loads at `http://localhost:5173`.

**Step 8: Commit**

```bash
git add -A
git commit -m "feat: scaffold SvelteKit project with Tailwind and static adapter"
```

---

### Task 2: Convert data.js to data.json

**Files:**
- Create: `static/data.json`
- Read: `js/data.js` (reference, do not modify)

**Step 1: Write conversion script**

Create `scripts/convert-data.js`:

```js
import { readFileSync, writeFileSync } from 'fs';

const raw = readFileSync('js/data.js', 'utf8');
// data.js starts with "var json = " and contains JS (single-quote escapes)
// eval it in a sandboxed way
const jsonArray = eval(raw.replace('var json =', '(') + ')');
writeFileSync('static/data.json', JSON.stringify(jsonArray));
console.log(`Converted ${jsonArray.length} entries to static/data.json`);
```

**Step 2: Run conversion**

```bash
node scripts/convert-data.js
```

Expected: `Converted 1099 entries to static/data.json`

**Step 3: Verify JSON is valid**

```bash
node -e "const d=require('./static/data.json'); console.log('Valid JSON, entries:', d.length)"
```

**Step 4: Commit**

```bash
git add static/data.json scripts/convert-data.js
git commit -m "feat: convert data.js to proper JSON"
```

---

### Task 3: Create Svelte stores

**Files:**
- Create: `src/lib/stores/map.js`

**Step 1: Create the store file**

```js
import { writable, derived } from 'svelte/store';

// Year range filter
export const minYear = writable(1808);
export const maxYear = writable(2009);

// Selected marker (null = nothing selected)
// Shape: { title, latitude, longitude, years: [...] }
export const selectedLocation = writable(null);

// Drawer open state
export const drawerOpen = derived(selectedLocation, ($loc) => $loc !== null);
```

**Step 2: Commit**

```bash
git add src/lib/stores/map.js
git commit -m "feat: add reactive stores for map state"
```

---

### Task 4: Build the Header component with year slider

**Files:**
- Create: `src/lib/components/Header.svelte`

**Step 1: Create Header with integrated range slider**

Use native HTML `<input type="range">` styled with Tailwind — no external slider library needed. Two range inputs overlaid for a dual-handle slider.

The header should contain:
- App title "Musee Historique de Lausanne" in serif display font
- Dual-handle year range slider showing `minYear — maxYear`
- Styled with the editorial/archival palette (parchment bg, ink text, sepia accents)

Import Google Fonts (DM Serif Display + Source Serif 4) in `src/app.html` `<head>`.

**Step 2: Wire up to stores**

The slider inputs bind to `$minYear` and `$maxYear` from the store.

**Step 3: Mount in +page.svelte temporarily to verify visually**

```bash
npm run dev
```

Check header renders with correct fonts, colors, and working slider.

**Step 4: Commit**

```bash
git add src/lib/components/Header.svelte src/app.html src/routes/+page.svelte
git commit -m "feat: add Header component with year range slider"
```

---

### Task 5: Build the MapLibre map component

**Files:**
- Create: `src/lib/components/Map.svelte`

**Step 1: Create Map.svelte**

- Initialize MapLibre GL map centered on Lausanne `[6.6322734, 46.522935]`, zoom 13
- Use a warm/muted map style. Use MapTiler's "Dataviz" or "Pastel" style, or OpenFreeMap's Positron style. Set a style URL. If using MapTiler, add key via env var `VITE_MAPTILER_KEY` (or use a free open style).
- Add NavigationControl (zoom buttons, bottom-right)
- Add GeolocateControl (top-right)
- Load `data.json` as a GeoJSON source (transform at load time from the array format to GeoJSON FeatureCollection)
- Add a clustered circle layer for markers:
  - Cluster circles: sepia-toned (`#8B7355`), with cluster count labels
  - Individual markers: small sepia circles with a subtle border
- On cluster click: zoom into cluster
- On marker click: read the feature properties, find the full location data, set `selectedLocation` store
- Subscribe to `minYear` / `maxYear` stores: filter the GeoJSON source to only include locations that have images within the selected year range

**Step 2: Mount in +page.svelte**

The map should fill the remaining viewport below the header.

**Step 3: Verify**

```bash
npm run dev
```

Map loads, markers appear, clicking a marker updates the store (check via console.log).

**Step 4: Commit**

```bash
git add src/lib/components/Map.svelte src/routes/+page.svelte
git commit -m "feat: add MapLibre map with clustered markers and year filtering"
```

---

### Task 6: Build the Drawer component

**Files:**
- Create: `src/lib/components/Drawer.svelte`

**Step 1: Create Drawer.svelte**

- Reactive to `$selectedLocation` store
- **Mobile** (below `md` breakpoint): bottom drawer that slides up from bottom, taking ~60% of viewport height. Draggable handle at top to dismiss.
- **Desktop** (`md`+): side panel sliding in from right, ~400px wide.
- Content:
  - Location title (serif display font)
  - Year pills: horizontal row of clickable pills for each year that has images (within the current min/max range). First year auto-selected.
  - Image gallery area (placeholder for now — just show image count)
- Close button (x) and click-outside-to-close
- Svelte transitions: `fly` from bottom (mobile) or right (desktop)

**Step 2: Mount in +page.svelte**

```svelte
{#if $selectedLocation}
  <Drawer />
{/if}
```

**Step 3: Verify**

Click a marker -> drawer opens with location title and year pills. Click outside -> closes.

**Step 4: Commit**

```bash
git add src/lib/components/Drawer.svelte src/routes/+page.svelte
git commit -m "feat: add responsive drawer component with year pills"
```

---

### Task 7: Build the ImageGallery component

**Files:**
- Create: `src/lib/components/ImageGallery.svelte`

**Step 1: Create ImageGallery.svelte**

Props: `images` (array of `{ id, url, description }`), `year` (string)

- Horizontal scrollable row of image cards (CSS `overflow-x: auto`, snap scrolling)
- Each card: image thumbnail, description text below (truncated to 2 lines)
- Staggered fade-in animation on mount
- On card click: open full-screen lightbox

**Step 2: Create lightbox behavior**

When an image is clicked:
- Full-screen overlay with dark semi-transparent background
- Large image centered
- Description text below image
- "Plus d'informations" link to `https://museris.lausanne.ch/SGCM/Consultation.aspx?id={id}&Source=search_result.aspx`
- Close on click-outside, Escape key, or X button
- Left/right arrows (or swipe) to navigate between images

**Step 3: Integrate into Drawer**

Replace the placeholder in Drawer.svelte with `<ImageGallery>`, passing the images for the currently selected year pill.

**Step 4: Verify end-to-end flow**

Click marker -> drawer opens -> year pills work -> images scroll -> click image -> lightbox opens -> navigation works -> close works.

**Step 5: Commit**

```bash
git add src/lib/components/ImageGallery.svelte src/lib/components/Drawer.svelte
git commit -m "feat: add image gallery with lightbox in drawer"
```

---

### Task 8: Apply editorial/archival styling

**Files:**
- Modify: `src/app.css`, `src/app.html`, all components

**Step 1: Set up design tokens in app.css**

```css
@import 'tailwindcss';

@theme {
  --color-parchment: #f5f0e8;
  --color-parchment-dark: #e8dfd2;
  --color-ink: #1a1a1a;
  --color-sepia: #8B7355;
  --color-sepia-light: #b09a7a;
  --color-gold: #c5a55a;
  --font-display: 'DM Serif Display', serif;
  --font-body: 'Source Serif 4', serif;
}
```

**Step 2: Add paper grain texture**

Create a subtle CSS noise/grain overlay on the body or main container using a CSS pseudo-element with a repeating SVG noise pattern or a tiny noise PNG.

**Step 3: Style each component**

Go through each component and ensure:
- Header: parchment background, ink text, gold accent on slider handles
- Map: warm-tinted style (adjust map style if needed)
- Drawer: parchment background, serif typography, sepia accents on year pills
- Image cards: subtle shadow, slightly warm border
- Lightbox: dark overlay with parchment-colored content area

**Step 4: Ensure responsive design**

Test on mobile viewport (375px) and desktop (1440px). Drawer behavior switches correctly.

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: apply editorial/archival design system"
```

---

### Task 9: Configure PWA

**Files:**
- Modify: `vite.config.js`
- Create: `static/favicon.svg` (or .png), `static/apple-touch-icon.png`

**Step 1: Configure vite-plugin-pwa in vite.config.js**

```js
import { SvelteKitPWA } from '@vite-pwa/sveltekit';

// Add to plugins array:
SvelteKitPWA({
  registerType: 'autoUpdate',
  manifest: {
    name: 'Musee Historique de Lausanne - Carte',
    short_name: 'MHL Carte',
    description: 'Carte interactive des images historiques de Lausanne',
    theme_color: '#f5f0e8',
    background_color: '#f5f0e8',
    display: 'standalone',
    scope: '/Musee-Historique-Lausanne-Carte/',
    start_url: '/Musee-Historique-Lausanne-Carte/',
    icons: [
      { src: 'favicon.svg', sizes: 'any', type: 'image/svg+xml' }
    ]
  },
  workbox: {
    globPatterns: ['**/*.{js,css,html,json,svg,png}']
  }
})
```

Note: Use `@vite-pwa/sveltekit` instead of `vite-plugin-pwa` for SvelteKit integration.

**Step 2: Create a simple favicon**

An SVG icon that fits the archival theme (e.g., a simple map pin or museum icon in sepia tones).

**Step 3: Verify PWA**

```bash
npm run build
npm run preview
```

Open in Chrome, check DevTools > Application > Manifest. Confirm it shows as installable.

**Step 4: Commit**

```bash
git add -A
git commit -m "feat: configure PWA with manifest and service worker"
```

---

### Task 10: Update GitHub Actions deployment

**Files:**
- Modify: `.github/workflows/static.yml`

**Step 1: Update workflow to build SvelteKit**

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: ["main"]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      - name: Install dependencies
        run: npm ci
      - name: Build
        run: npm run build
      - name: Setup Pages
        uses: actions/configure-pages@v5
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: 'build'
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

**Step 2: Commit**

```bash
git add .github/workflows/static.yml
git commit -m "feat: update GitHub Actions to build SvelteKit before deploying"
```

---

### Task 11: Clean up old files

**Files:**
- Delete: `index.html`, `js/`, `css/`, `dist/`, `scripts/`

**Step 1: Remove old vanilla files**

```bash
rm index.html
rm -rf js/ css/ dist/ scripts/
```

These are all superseded by the SvelteKit app. The data lives in `static/data.json` now.

**Step 2: Update .gitignore**

Ensure `node_modules/`, `build/`, `.svelte-kit/` are in `.gitignore` (the SvelteKit scaffold should have created this).

**Step 3: Final build + verify**

```bash
npm run build
npm run preview
```

Full end-to-end check: map loads, markers cluster, slider filters, drawer opens, images display, lightbox works, PWA installable.

**Step 4: Commit**

```bash
git add -A
git commit -m "chore: remove old vanilla HTML/JS/CSS files"
```

---

## Summary

| Task | What | Key files |
|------|------|-----------|
| 1 | Scaffold SvelteKit + Tailwind + static adapter | project config |
| 2 | Convert data.js → data.json | `static/data.json` |
| 3 | Svelte stores | `src/lib/stores/map.js` |
| 4 | Header + year slider | `Header.svelte` |
| 5 | MapLibre map + markers + clustering | `Map.svelte` |
| 6 | Bottom drawer / side panel | `Drawer.svelte` |
| 7 | Image gallery + lightbox | `ImageGallery.svelte` |
| 8 | Editorial/archival styling pass | all components |
| 9 | PWA config | `vite.config.js`, manifest |
| 10 | GitHub Actions update | `.github/workflows/static.yml` |
| 11 | Clean up old files | delete `index.html`, `js/`, `css/`, `dist/` |
