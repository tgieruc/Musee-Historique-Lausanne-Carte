# MHL Interactive Map — PWA Redesign

## Goal

Modernize the MHL interactive map from vanilla HTML/JS into a SvelteKit PWA with dramatically better UI/UX.

## Stack

- **SvelteKit** with static adapter (SSG, deployable to GitHub Pages)
- **Tailwind CSS v4**
- **MapLibre GL** for vector tile rendering (replacing Leaflet)
- **vite-plugin-pwa** for service worker, installability, offline shell

## Aesthetic: Editorial/Archival

- **Typography**: Serif display font (DM Serif Display or Playfair Display) for titles. Clean serif body font (Source Serif 4) for descriptions.
- **Palette**: Warm parchment backgrounds (~`#f5f0e8`), deep ink blacks, sepia accents, muted gold for interactive elements.
- **Textures**: Subtle paper grain/noise overlay, warm-tinted map style.
- **Animations**: Smooth drawer transitions, gentle image fade-ins, staggered reveals in galleries.

## Layout & Interaction

### Map (primary view)

- Full-screen MapLibre GL map with warm-tinted vector style
- Top bar: app title + redesigned year range slider (minimal, serif type for range display)
- Custom archival-style map markers (small sepia-toned circular pins)
- MapLibre's built-in clustering (replaces leaflet.markercluster)
- Geolocation button carried forward

### Bottom drawer (mobile) / Side panel (desktop)

- Opens on marker/cluster tap
- Location title at top
- Year pills/tabs to switch between available years
- Horizontal scrollable image cards within each year
- Tapping an image opens full-screen lightbox with description and Museris link

## PWA

- Installable on phone home screen
- Offline shell (app structure + data cached; map tiles not cached)
- Web app manifest with MHL branding

## Data

- Convert `data.js` global variable to `data.json`, imported at build time
- Same structure: `{ title, latitude, longitude, years: [{ year, images: [{ id, url, description }] }] }`

## Project Structure

```
src/
  lib/
    components/
      Map.svelte            — MapLibre GL map
      Drawer.svelte         — bottom drawer / side panel
      ImageGallery.svelte   — image cards + lightbox
      YearSlider.svelte     — year range slider
      Header.svelte         — top bar
    stores/
      map.js                — selected marker, year range, drawer state
  routes/
    +page.svelte            — main (only) page
    +layout.svelte          — app shell
static/
  data.json                 — museum dataset
```
