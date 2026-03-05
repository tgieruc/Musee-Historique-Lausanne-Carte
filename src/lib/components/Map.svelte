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
			style: 'https://tiles.openfreemap.org/styles/positron',
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
					'circle-color': '#6b5a45',
					'circle-radius': ['interpolate', ['linear'], ['get', 'point_count'], 2, 16, 50, 24, 200, 32],
					'circle-opacity': 0.9,
					'circle-stroke-width': 2,
					'circle-stroke-color': 'rgba(255,255,255,0.6)'
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
					'text-color': '#ffffff'
				}
			});

			// Individual markers
			m.addLayer({
				id: 'unclustered-point',
				type: 'circle',
				source: 'locations',
				filter: ['!', ['has', 'point_count']],
				paint: {
					'circle-color': '#6b5a45',
					'circle-radius': 7,
					'circle-stroke-width': 2.5,
					'circle-stroke-color': '#ffffff',
					'circle-opacity': 0.95
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
				} catch (_) {}
			});

			// Click marker -> open drawer
			m.on('click', 'unclustered-point', (e) => {
				const feature = e.features[0];
				const idx = feature.properties.index;
				const loc = allData.current[idx];
				if (loc) {
					selectedLocation.set(loc);
				}
			});

			// Cursor
			for (const layer of ['clusters', 'unclustered-point']) {
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
		border-radius: 8px !important;
		box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1) !important;
		border: 1px solid rgba(139, 115, 85, 0.2) !important;
	}
	:global(.maplibregl-ctrl-group button) {
		width: 32px !important;
		height: 32px !important;
	}
	:global(.maplibregl-ctrl-attrib) {
		font-size: 10px !important;
		background: rgba(245, 240, 232, 0.7) !important;
		backdrop-filter: blur(4px) !important;
	}
</style>
