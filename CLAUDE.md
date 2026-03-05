# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Interactive map displaying historical images from the Musée Historique Lausanne (MHL) on a Leaflet map. Users can explore geolocalized historical images of Lausanne and filter them by year range. Deployed as a static site on GitHub Pages.

Live site: https://tgieruc.github.io/Musee-Historique-Lausanne-Carte/

## Development

No build step — this is a vanilla HTML/CSS/JS project. Open `index.html` directly in a browser or use any local server (e.g., `python3 -m http.server`).

Deployment is automatic via GitHub Actions (`.github/workflows/static.yml`) on push to `main`.

## Architecture

- **`index.html`** — Single-page app entry point. Loads all dependencies via `<script>` and `<link>` tags (no bundler).
- **`js/map.js`** — Core application logic: initializes Leaflet map centered on Lausanne, creates marker clusters, manages the year range slider (noUiSlider), and handles the image overlay popup.
- **`js/data.js`** — Contains the entire dataset as a global `json` array. Each entry has `title`, `latitude`, `longitude`, and a `years` array containing year-grouped `images` (each with `id`, `url`, `description`). Images are hosted on the MHL Museris server.
- **`css/map.css`** — App styles including the overlay modal and responsive layout.

### Third-party libraries (vendored in repo)

- **Leaflet** (v1.7.1) — loaded from unpkg CDN
- **Leaflet.markercluster** — vendored in `dist/` (MarkerCluster CSS + JS)
- **Leaflet.locatecontrol** — loaded from unpkg CDN (geolocation button)
- **noUiSlider** + **wNumb** — vendored in `js/` (year range slider)

### Key data flow

1. `js/data.js` defines the global `json` array (loaded before `map.js`)
2. `map.js` iterates over `json` to create clustered Leaflet markers filtered by the current year range
3. Clicking a marker opens an overlay showing images for that location, with a year dropdown to switch between available years
4. The noUiSlider `update` event triggers `update_map()` which clears and re-creates all markers

## Language

The UI is in French (labels, links, descriptions). Image descriptions come from the museum's French-language database.
