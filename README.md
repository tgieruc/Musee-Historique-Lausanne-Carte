# Musee Historique Lausanne - Interactive Map

[![Map](https://img.shields.io/badge/View-Map-green.svg)](https://theogieruc.dev/mhl-carte/)

## Overview

Interactive map displaying 15,766 historical photos from the [Musee Historique Lausanne](https://www.lausanne.ch/vie-pratique/culture/musees/mhl) (MHL) across 1,099 geolocalized locations in Lausanne, spanning 1808-2009.

**Live at [theogieruc.dev/mhl-carte](https://theogieruc.dev/mhl-carte/)**

## Stack

- **SvelteKit** with static adapter
- **MapLibre GL** with CARTO Dark Matter basemap
- **Tailwind CSS v4**
- PWA with offline support

## Features

- Interactive map with clustered markers
- Year range filter (1808-2009)
- Image gallery with lightbox and keyboard navigation
- Links back to the museum's [Museris database](https://museris.lausanne.ch/)
- Responsive drawer (side panel on desktop, bottom sheet on mobile)

## Development

```bash
npm install
npm run dev
```

The app is deployed as a static subfolder of [theogieruc.dev](https://theogieruc.dev).

## Acknowledgements

Built on the foundations of the [Ceinture Pichard](https://github.com/tgieruc/La-Ceinture-Pichard) project from the [Digital Urban History](https://www.epfl.ch/schools/cdh/fr/enseignement/cours-unil-epfl-2020-2021/histoire-urbaine-a-lere-du-numerique-lausanne-time-machine/) course at EPFL/UNIL. Thanks to the [Historical Museum of Lausanne](https://www.lausanne.ch/vie-pratique/culture/musees/mhl) for the data.
