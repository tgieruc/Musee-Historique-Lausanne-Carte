# Musee Historique Lausanne - Interactive Map

[![Map](https://img.shields.io/badge/View-Map-green.svg)](https://theogieruc.dev/mhl-carte/)

## Overview

Interactive map displaying 15,766 historical photos from the [Musee Historique Lausanne](https://www.lausanne.ch/vie-pratique/culture/musees/mhl) (MHL) across 1,099 geolocalized locations in Lausanne, spanning 1808-2009.

**Live at [theogieruc.dev/mhl-carte](https://theogieruc.dev/mhl-carte/)**

## Stack

- **SvelteKit** with static adapter
- **MapLibre GL** with CARTO Positron basemap
- **Tailwind CSS v4**
- PWA with offline support

## Features

- Interactive map with clustered markers
- Inclusive year filter (1808-2009), including a single exact year
- Compact caption search, insensitive to accents and case, filtered by selected years
- Keyboard-accessible results across the archive; empty search browses visible map locations
- Search results open the matching photo year and bring the selected marker into view
- Loading, empty, and retry states for the archive, map, and images
- Image gallery with lightbox and keyboard navigation
- Links back to the museum's [Museris database](https://museris.lausanne.ch/)
- Nonmodal desktop inspector and accessible modal mobile sheet
- Focus restoration and topmost-only Escape dismissal

## Development

```bash
npm install
npm run dev
```

## Checks

```bash
npm run check
npm run test:ux
npm run build
```

The UX suite uses Playwright with installed Google Chrome. It starts its own local server on port 4178 and uses deterministic archive/map fixtures, including simulated request failures. Tests cover keyboard focus, nested Escape, year preservation, exact-year filters, empty results, retry actions, and 320×568 / 844×390 layouts. Real archive imagery and basemap rendering still need a visual smoke check before release; physical-device and screen-reader testing are separate checks.

The app is deployed as a static subfolder of [theogieruc.dev](https://theogieruc.dev).

## Acknowledgements

Built on the foundations of the [Ceinture Pichard](https://github.com/tgieruc/La-Ceinture-Pichard) project from the [Digital Urban History](https://www.epfl.ch/schools/cdh/fr/enseignement/cours-unil-epfl-2020-2021/histoire-urbaine-a-lere-du-numerique-lausanne-time-machine/) course at EPFL/UNIL. Thanks to the [Historical Museum of Lausanne](https://www.lausanne.ch/vie-pratique/culture/musees/mhl) for the data.
