<script>
	import { onMount } from 'svelte';
	import maplibregl from 'maplibre-gl';
	import 'maplibre-gl/dist/maplibre-gl.css';
	import { base } from '$app/paths';
	import { minYear, maxYear, selectedLocation } from '$lib/stores/map.js';
	import { get } from 'svelte/store';

	let mapContainer = $state(null);
	let map = $state(null);
	let allData = { current: [] };

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

	onMount(() => {
		const m = new maplibregl.Map({
			container: mapContainer,
			style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
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
			const data = await res.json();
			allData.current = data;

			const min = get(minYear);
			const max = get(maxYear);

			m.addSource('locations', {
				type: 'geojson',
				data: buildGeoJSON(data, min, max),
				cluster: true,
				clusterMaxZoom: 16,
				clusterRadius: 45
			});

			// Cluster circles
			m.addLayer({
				id: 'clusters',
				type: 'circle',
				source: 'locations',
				filter: ['has', 'point_count'],
				paint: {
					'circle-color': '#00FFFF',
					'circle-radius': ['interpolate', ['linear'], ['get', 'point_count'], 2, 16, 50, 24, 200, 32],
					'circle-opacity': 0.25,
					'circle-stroke-width': 1,
					'circle-stroke-color': '#00FFFF'
				}
			});

			// Cluster count text
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
				paint: {
					'text-color': '#00FFFF'
				}
			});

			// Individual markers
			m.addLayer({
				id: 'unclustered-point',
				type: 'circle',
				source: 'locations',
				filter: ['!', ['has', 'point_count']],
				paint: {
					'circle-color': '#FFBF00',
					'circle-radius': 5,
					'circle-stroke-width': 1,
					'circle-stroke-color': '#000000',
					'circle-opacity': 0.9
				}
			});

			// Glow layer for individual markers
			m.addLayer({
				id: 'unclustered-glow',
				type: 'circle',
				source: 'locations',
				filter: ['!', ['has', 'point_count']],
				paint: {
					'circle-color': '#FFBF00',
					'circle-radius': 12,
					'circle-opacity': 0.15,
					'circle-blur': 1
				}
			});

			// Invisible hit target for easier tapping on mobile
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

			// Click cluster -> zoom
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

			// Click marker -> open drawer (use hit target for easier tapping)
			for (const layer of ['unclustered-point', 'unclustered-hit']) {
				m.on('click', layer, (e) => {
					const feature = e.features[0];
					const idx = feature.properties.index;
					const loc = allData.current[idx];
					if (loc) {
						selectedLocation.set(loc);
					}
				});
			}

			// Cursor
			for (const layer of ['clusters', 'unclustered-point', 'unclustered-hit']) {
				m.on('mouseenter', layer, () => {
					m.getCanvas().style.cursor = 'pointer';
				});
				m.on('mouseleave', layer, () => {
					m.getCanvas().style.cursor = '';
				});
			}
		});

		map = m;
		return () => m.remove();
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
		box-shadow: 0 0 8px rgba(0, 255, 255, 0.15) !important;
		border: 1px solid #333 !important;
		background: #0a0a0a !important;
	}
	:global(.maplibregl-ctrl-group button) {
		width: 32px !important;
		height: 32px !important;
		background-color: #0a0a0a !important;
		border-bottom-color: #333 !important;
	}
	:global(.maplibregl-ctrl-group button:hover) {
		background-color: #1a1a1a !important;
	}
	:global(.maplibregl-ctrl-group button .maplibregl-ctrl-icon) {
		filter: invert(1) !important;
	}
	:global(.maplibregl-ctrl-attrib) {
		font-size: 10px !important;
		font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace !important;
		background: rgba(0, 0, 0, 0.8) !important;
		color: #8a8a8a !important;
		backdrop-filter: blur(4px) !important;
	}
	:global(.maplibregl-ctrl-attrib a) {
		color: #8a8a8a !important;
	}
</style>
