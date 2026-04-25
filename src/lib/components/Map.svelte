<script>
	import { onMount } from 'svelte';
	import maplibregl from 'maplibre-gl';
	import 'maplibre-gl/dist/maplibre-gl.css';
	import { base } from '$app/paths';
	import { minYear, maxYear, selectedLocation } from '$lib/stores/map.js';
	import { get } from 'svelte/store';

	const STYLES = {
		light: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
		dark: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'
	};

	const COLORS = {
		light: {
			cluster: '#9AA3F1',
			clusterStroke: '#7A85ED',
			clusterText: '#242421',
			point: '#242421',
			pointStroke: '#FFFFFF',
			pointGlow: '#9AA3F1'
		},
		dark: {
			cluster: '#00FFFF',
			clusterStroke: '#00FFFF',
			clusterText: '#00FFFF',
			point: '#FFBF00',
			pointStroke: '#000000',
			pointGlow: '#FFBF00'
		}
	};

	function currentTheme() {
		if (typeof document === 'undefined') return 'light';
		return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
	}

	let mapContainer = $state(null);
	let map = $state(null);
	let allData = { current: [] };
	let activeTheme = currentTheme();

	function buildGeoJSON(data, min, max) {
		const features = [];
		for (let i = 0; i < data.length; i++) {
			const loc = data[i];
			if (!loc.years || loc.years.length === 0) continue;
			const hasYear = loc.years.some((y) => {
				const yr = parseInt(y.year);
				return yr >= min && yr <= max;
			});
			if (!hasYear) continue;
			features.push({
				type: 'Feature',
				geometry: {
					type: 'Point',
					coordinates: [loc.longitude, loc.latitude]
				},
				properties: { index: i }
			});
		}
		return { type: 'FeatureCollection', features };
	}

	function addAppLayers(m, theme) {
		const c = COLORS[theme];
		const min = get(minYear);
		const max = get(maxYear);

		m.addSource('locations', {
			type: 'geojson',
			data: buildGeoJSON(allData.current, min, max),
			cluster: true,
			clusterMaxZoom: 16,
			clusterRadius: 45
		});

		m.addLayer({
			id: 'clusters',
			type: 'circle',
			source: 'locations',
			filter: ['has', 'point_count'],
			paint: {
				'circle-color': c.cluster,
				'circle-radius': ['interpolate', ['linear'], ['get', 'point_count'], 2, 16, 50, 24, 200, 32],
				'circle-opacity': 0.25,
				'circle-stroke-width': 1,
				'circle-stroke-color': c.clusterStroke
			}
		});

		m.addLayer({
			id: 'cluster-count',
			type: 'symbol',
			source: 'locations',
			filter: ['has', 'point_count'],
			layout: {
				'text-field': '{point_count_abbreviated}',
				'text-size': 11,
				'text-font': ['Noto Sans Regular']
			},
			paint: { 'text-color': c.clusterText }
		});

		m.addLayer({
			id: 'unclustered-point',
			type: 'circle',
			source: 'locations',
			filter: ['!', ['has', 'point_count']],
			paint: {
				'circle-color': c.point,
				'circle-radius': 5,
				'circle-stroke-width': 1,
				'circle-stroke-color': c.pointStroke,
				'circle-opacity': 0.9
			}
		});

		m.addLayer({
			id: 'unclustered-glow',
			type: 'circle',
			source: 'locations',
			filter: ['!', ['has', 'point_count']],
			paint: {
				'circle-color': c.pointGlow,
				'circle-radius': 12,
				'circle-opacity': 0.15,
				'circle-blur': 1
			}
		});

		m.addLayer({
			id: 'unclustered-hit',
			type: 'circle',
			source: 'locations',
			filter: ['!', ['has', 'point_count']],
			paint: {
				'circle-color': '#000000',
				'circle-radius': 22,
				'circle-opacity': 0
			}
		});
	}

	function wireInteractions(m) {
		m.on('click', 'clusters', async (e) => {
			const features = m.queryRenderedFeatures(e.point, { layers: ['clusters'] });
			if (!features.length) return;
			const clusterId = features[0].properties.cluster_id;
			try {
				const zoom = await m.getSource('locations').getClusterExpansionZoom(clusterId);
				m.easeTo({
					center: features[0].geometry.coordinates,
					zoom: zoom,
					duration: 500
				});
			} catch {
				/* cluster may have been removed */
			}
		});

		for (const layer of ['unclustered-point', 'unclustered-hit']) {
			m.on('click', layer, (e) => {
				const feature = e.features[0];
				const idx = feature.properties.index;
				const loc = allData.current[idx];
				if (loc) selectedLocation.set(loc);
			});
		}

		for (const layer of ['clusters', 'unclustered-point', 'unclustered-hit']) {
			m.on('mouseenter', layer, () => {
				m.getCanvas().style.cursor = 'pointer';
			});
			m.on('mouseleave', layer, () => {
				m.getCanvas().style.cursor = '';
			});
		}
	}

	onMount(() => {
		const m = new maplibregl.Map({
			container: mapContainer,
			style: STYLES[activeTheme],
			center: [6.6322734, 46.522935],
			zoom: 14,
			attributionControl: false
		});

		m.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right');
		m.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right');
		m.addControl(
			new maplibregl.GeolocateControl({
				positionOptions: { enableHighAccuracy: true },
				trackUserLocation: true
			}),
			'bottom-right'
		);

		m.on('load', async () => {
			const res = await fetch(`${base}/data.json`);
			allData.current = await res.json();
			addAppLayers(m, activeTheme);
			wireInteractions(m);
		});

		map = m;

		function applyTheme(theme) {
			if (theme === activeTheme) return;
			activeTheme = theme;
			if (!allData.current.length) {
				m.setStyle(STYLES[theme]);
				return;
			}
			m.once('style.load', () => {
				addAppLayers(m, theme);
				wireInteractions(m);
			});
			m.setStyle(STYLES[theme]);
		}

		const onStorage = (e) => {
			if (e.key === 'theme' && (e.newValue === 'light' || e.newValue === 'dark')) {
				applyTheme(e.newValue);
			}
		};
		window.addEventListener('storage', onStorage);

		const observer = new MutationObserver(() => {
			applyTheme(currentTheme());
		});
		observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

		return () => {
			window.removeEventListener('storage', onStorage);
			observer.disconnect();
			m.remove();
		};
	});

	$effect(() => {
		const min = $minYear;
		const max = $maxYear;
		if (map && allData.current.length) {
			const source = map.getSource('locations');
			if (source) {
				source.setData(buildGeoJSON(allData.current, min, max));
			}
		}
	});
</script>

<div bind:this={mapContainer} class="absolute inset-0 w-full h-full"></div>

<style>
	:global(.maplibregl-ctrl-group) {
		border-radius: 0 !important;
		border: 1px solid var(--color-terminal-border) !important;
		background: var(--color-terminal-bg-light) !important;
	}
	:global(.maplibregl-ctrl-group button) {
		width: 32px !important;
		height: 32px !important;
		background-color: var(--color-terminal-bg-light) !important;
		border-bottom-color: var(--color-terminal-border) !important;
	}
	:global(.maplibregl-ctrl-group button:hover) {
		background-color: var(--color-terminal-bg) !important;
	}
	:global([data-theme='dark'] .maplibregl-ctrl-group) {
		box-shadow: 0 0 8px rgba(0, 255, 255, 0.15) !important;
	}
	:global([data-theme='dark'] .maplibregl-ctrl-group button .maplibregl-ctrl-icon) {
		filter: invert(1) !important;
	}
	:global(.maplibregl-ctrl-attrib) {
		font-size: 10px !important;
		font-family: var(--font-mono) !important;
		background: var(--color-terminal-bg-light) !important;
		color: var(--color-text-dim) !important;
		backdrop-filter: blur(4px) !important;
	}
	:global(.maplibregl-ctrl-attrib a) {
		color: var(--color-text-dim) !important;
	}
</style>
