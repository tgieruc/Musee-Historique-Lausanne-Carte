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
			style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
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
					'circle-color': '#000000',
					'circle-radius': ['interpolate', ['linear'], ['get', 'point_count'], 2, 13, 50, 21, 200, 28],
					'circle-opacity': 1,
					'circle-stroke-width': 3,
					'circle-stroke-color': '#FFFFFF'
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
					'text-color': '#FFFFFF'
				}
			});

			// Individual markers
			m.addLayer({
				id: 'unclustered-point',
				type: 'circle',
				source: 'locations',
				filter: ['!', ['has', 'point_count']],
				paint: {
					'circle-color': '#000000',
					'circle-radius': 6,
					'circle-stroke-width': 3,
					'circle-stroke-color': '#FFFFFF',
					'circle-opacity': 0.9
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
				} catch (_) {}
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
  :global(.maplibregl-ctrl-group) { border-radius: 14px; overflow: hidden; box-shadow: 0 2px 10px #0000000a; border: 1px solid #e4e4e4; background: #fff; }
  :global(.maplibregl-ctrl-group button) { width: 40px; height: 40px; background-color: #fff; }
  :global(.maplibregl-ctrl-group button:hover) { background-color: #f6f6f6; }
  :global(.maplibregl-ctrl-attrib) { font-size: 11px; font-family: 'Nunito Sans', sans-serif; background: #ffffffed; color: #626262; }
  :global(.maplibregl-ctrl-attrib a) { color: #626262; }
</style>
