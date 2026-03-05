<script>
	import { onMount, onDestroy } from 'svelte';
	import maplibregl from 'maplibre-gl';
	import 'maplibre-gl/dist/maplibre-gl.css';
	import { base } from '$app/paths';
	import { minYear, maxYear, selectedLocation } from '$lib/stores/map.js';
	import { get } from 'svelte/store';

	let mapContainer = $state(null);
	let map = $state(null);
	let allData = $state([]);

	function buildGeoJSON(data, min, max) {
		const features = data
			.map((loc, index) => ({ loc, index }))
			.filter(({ loc }) => loc.years && loc.years.length > 0)
			.filter(({ loc }) =>
				loc.years.some((y) => {
					const yr = parseInt(y.year);
					return yr >= min && yr <= max;
				})
			)
			.map(({ loc, index }) => ({
				type: 'Feature',
				geometry: {
					type: 'Point',
					coordinates: [loc.longitude, loc.latitude]
				},
				properties: {
					index: index
				}
			}));

		return {
			type: 'FeatureCollection',
			features
		};
	}

	function updateSource() {
		if (!map || !allData.length) return;
		const source = map.getSource('locations');
		if (!source) return;
		const min = get(minYear);
		const max = get(maxYear);
		source.setData(buildGeoJSON(allData, min, max));
	}

	onMount(() => {
		const m = new maplibregl.Map({
			container: mapContainer,
			style: 'https://tiles.openfreemap.org/styles/positron',
			center: [6.6322734, 46.522935],
			zoom: 13
		});

		m.addControl(new maplibregl.NavigationControl(), 'bottom-right');
		m.addControl(new maplibregl.GeolocateControl(), 'top-right');

		m.on('load', async () => {
			const res = await fetch(`${base}/data.json`);
			const data = await res.json();
			allData = data;

			const min = get(minYear);
			const max = get(maxYear);

			m.addSource('locations', {
				type: 'geojson',
				data: buildGeoJSON(data, min, max),
				cluster: true,
				clusterMaxZoom: 14,
				clusterRadius: 50
			});

			m.addLayer({
				id: 'clusters',
				type: 'circle',
				source: 'locations',
				filter: ['has', 'point_count'],
				paint: {
					'circle-color': '#8B7355',
					'circle-radius': ['interpolate', ['linear'], ['get', 'point_count'], 2, 15, 100, 25],
					'circle-opacity': 0.85
				}
			});

			m.addLayer({
				id: 'cluster-count',
				type: 'symbol',
				source: 'locations',
				filter: ['has', 'point_count'],
				layout: {
					'text-field': '{point_count_abbreviated}',
					'text-size': 12
				},
				paint: {
					'text-color': '#ffffff'
				}
			});

			m.addLayer({
				id: 'unclustered-point',
				type: 'circle',
				source: 'locations',
				filter: ['!', ['has', 'point_count']],
				paint: {
					'circle-color': '#8B7355',
					'circle-radius': 8,
					'circle-stroke-width': 2,
					'circle-stroke-color': '#ffffff'
				}
			});

			// Click on cluster to zoom
			m.on('click', 'clusters', (e) => {
				const features = m.queryRenderedFeatures(e.point, { layers: ['clusters'] });
				const clusterId = features[0].properties.cluster_id;
				m.getSource('locations').getClusterExpansionZoom(clusterId, (err, zoom) => {
					if (err) return;
					m.easeTo({
						center: features[0].geometry.coordinates,
						zoom: zoom
					});
				});
			});

			// Click on individual marker
			m.on('click', 'unclustered-point', (e) => {
				const feature = e.features[0];
				const idx = feature.properties.index;
				const loc = allData[idx];
				if (loc) {
					selectedLocation.set(loc);
				}
			});

			// Cursor pointer on hover
			m.on('mouseenter', 'clusters', () => {
				m.getCanvas().style.cursor = 'pointer';
			});
			m.on('mouseleave', 'clusters', () => {
				m.getCanvas().style.cursor = '';
			});
			m.on('mouseenter', 'unclustered-point', () => {
				m.getCanvas().style.cursor = 'pointer';
			});
			m.on('mouseleave', 'unclustered-point', () => {
				m.getCanvas().style.cursor = '';
			});
		});

		map = m;

		return () => {
			m.remove();
		};
	});

	// React to year filter changes
	$effect(() => {
		const min = $minYear;
		const max = $maxYear;
		if (map && allData.length) {
			const source = map.getSource('locations');
			if (source) {
				source.setData(buildGeoJSON(allData, min, max));
			}
		}
	});
</script>

<div bind:this={mapContainer} class="absolute inset-0"></div>
