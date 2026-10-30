# CLAUDE.md

## Project Overview

Interactive map displaying historical images from the Musee Historique Lausanne (MHL). Users explore geolocalized historical images of Lausanne and filter them by year range. UI is in French.

Live site: https://theogieruc.dev/mhl-carte

## Tech Stack

- **SvelteKit** (Svelte 5) with `@sveltejs/adapter-static`
- **MapLibre GL JS** — CARTO Dark Matter basemap, GeoJSON clustering
- **Tailwind CSS v4** — via `@tailwindcss/vite` plugin
- **PWA** — `@vite-pwa/sveltekit` with service worker and manifest
- **Vite 7**

## Development

```bash
npm install
npm run dev      # local dev server
npm run build    # static build to build/
npm run preview  # preview production build
```

## Deployment

This repo is used as a **git submodule** inside the Astro site at `/Users/tgieruc/Documents/theogieruc.dev`. The built output is served as a static subfolder at `/mhl-carte`. Base path is configured in `svelte.config.js`.

## Architecture

### Config

- **`svelte.config.js`** — adapter-static, base path `/mhl-carte`
- **`vite.config.js`** — SvelteKit + Tailwind + PWA plugins
- **`src/app.css`** — Tailwind import + custom theme (terminal aesthetic: black bg, cyan/gold accents, monospace font, CRT scanlines)
- **`src/app.html`** — HTML shell

### Source (`src/`)

- **`src/routes/+page.svelte`** — Single page: Header + Map + conditional Drawer
- **`src/lib/components/Map.svelte`** — MapLibre GL map, GeoJSON source with clustering, marker click handling, year-range filtering
- **`src/lib/components/Header.svelte`** — App header with year range slider
- **`src/lib/components/Drawer.svelte`** — Side drawer showing location details and images
- **`src/lib/components/ImageGallery.svelte`** — Image gallery within the drawer
- **`src/lib/stores/map.js`** — Svelte stores: `minYear`, `maxYear`, `selectedLocation`

### Static assets (`static/`)

- **`static/data.json`** — Full dataset. Each entry has `title`, `latitude`, `longitude`, and a `years` array containing year-grouped `images` (each with `id`, `url`, `description`). Images hosted on MHL Museris server.
- **`static/favicon.svg`**

### Key data flow

1. `Map.svelte` fetches `data.json` on mount
2. Builds a GeoJSON FeatureCollection filtered by current year range from stores
3. MapLibre renders clustered point markers; clicking a marker sets `selectedLocation` store
4. `Drawer.svelte` reacts to the store and displays images for that location
5. `Header.svelte` contains the year range slider that updates `minYear`/`maxYear` stores, triggering map re-filter
