<script>
	import { onMount, tick } from 'svelte';
	import maplibregl from 'maplibre-gl';
	import 'maplibre-gl/dist/maplibre-gl.css';
	import { base } from '$app/paths';
	import { minYear, maxYear, selectedLocation, selectionRequest } from '$lib/stores/map.js';
	import { matchingLocations, featureCollection, locationLabel, searchLocations, yearsLabel } from '$lib/archive.js';
	let mapContainer;
	let map = $state.raw(null);
	let data = $state.raw([]);
	let archiveState = $state('loading');
	let mapState = $state('loading');
	let listOpen = $state(false);
	let query = $state('');
	let searchInput;
	let limit = $state(30);
	let geolocationError = $state(false);
	let controller;
	let disposed = false;
	let mapTimer;
	let sharedPhotoHandled = false;
	let sharedPhotoError = $state(false);
	let sharedLocation = $state.raw(null);
	function openSharedPhoto() {
		if (sharedPhotoHandled) return;
		sharedPhotoHandled = true;
		const id = new URL(window.location.href).searchParams.get('image');
		if (id === null) return;
		for (const location of data) {
			for (const year of location.years) {
				const image = year.images.find((image) => String(image.id) === id);
				if (!image) continue;
				resetDates();
				selectionRequest.set({ location, year: year.year, image: image.id, open: true, opener: searchInput });
				selectedLocation.set(location);
				sharedLocation = location;
				return;
			}
		}
		sharedPhotoError = true;
	}
	$effect(() => {
		if (!sharedLocation || !map || mapState !== 'ready') return;
		map.jumpTo({ center: [sharedLocation.longitude, sharedLocation.latitude], zoom: 16 });
		sharedLocation = null;
	});
	let results = $derived(matchingLocations(data, $minYear, $maxYear));
	let searched = $derived(searchLocations(results, query));

	async function loadArchive() {
		controller?.abort();
		const request = new AbortController();
		controller = request;
		archiveState = 'loading';
		const timer = setTimeout(() => request.abort(), 15000);
		try {
			const response = await fetch(`${base}/data.json`, { signal: request.signal });
			if (!response.ok) throw new Error('Archive response failed');
			const json = await response.json();
			if (
				!Array.isArray(json) ||
				!json.every(
					(l) =>
						Number.isFinite(l.latitude) &&
						Number.isFinite(l.longitude) &&
						Array.isArray(l.years) &&
						l.years.every((y) => (typeof y.year === 'string' || typeof y.year === 'number') && Array.isArray(y.images))
				)
			)
				throw new Error('Invalid archive');
			if (disposed || controller !== request) return;
			data = json;
			archiveState = 'ready';
			openSharedPhoto();
		} catch {
			if (!disposed && controller === request) archiveState = 'error';
		} finally {
			clearTimeout(timer);
		}
	}
	function createMap() {
		clearTimeout(mapTimer);
		map?.remove();
		map = null;
		mapState = 'loading';
		try {
			const m = new maplibregl.Map({
				container: mapContainer,
				style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
				center: [6.6322734, 46.522935],
				zoom: 14,
				attributionControl: false,
				locale: {
					'NavigationControl.ZoomIn': 'Zoom avant',
					'NavigationControl.ZoomOut': 'Zoom arrière',
					'GeolocateControl.FindMyLocation': 'Me localiser',
					'GeolocateControl.LocationNotAvailable': 'Localisation indisponible',
					'GeolocateControl.TrackLocation': 'Suivre ma position'
				}
			});
			map = m;
			m.on('style.load', () => {
				if (map !== m) return;
				clearTimeout(mapTimer);
				mapState = 'ready';
			});
			m.on('error', () => {
				if (map === m) {
					clearTimeout(mapTimer);
					mapState = 'error';
				}
			});
			mapTimer = setTimeout(() => {
				if (map === m && mapState === 'loading') mapState = 'error';
			}, 15000);
			m.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right');
			m.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right');
			const geolocate = new maplibregl.GeolocateControl({
				positionOptions: { enableHighAccuracy: true },
				trackUserLocation: true
			});
			geolocate.on('error', () => (geolocationError = true));
			geolocate.on('geolocate', () => (geolocationError = false));
			m.addControl(geolocate, 'bottom-right');
		} catch {
			mapState = 'error';
		}
	}
	onMount(() => {
		loadArchive();
		createMap();
		return () => {
			disposed = true;
			controller?.abort();
			clearTimeout(mapTimer);
			map?.remove();
		};
	});
	function installLayers(m, geojson) {
		m.addSource('locations', { type: 'geojson', data: geojson, cluster: true, clusterMaxZoom: 16, clusterRadius: 45 });
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
			} catch {
				/* Cluster may have been removed by a filter change. */
			}
		});

		// Click marker -> open drawer (use hit target for easier tapping)
		for (const layer of ['unclustered-point', 'unclustered-hit']) {
			m.on('click', layer, (e) => {
				const feature = e.features[0];
				const idx = feature.properties.index;
				const loc = data[idx];
				if (loc) {
					m.getCanvas().focus();
					selectionRequest.set({ location: loc, opener: m.getCanvas() });
					selectedLocation.set(loc);
				}
			});
		}

		m.on('click', (e) => {
			if (!m.queryRenderedFeatures(e.point, { layers: ['clusters', 'unclustered-point', 'unclustered-hit'] }).length)
				selectedLocation.set(null);
		});

		// Cursor
		for (const layer of ['clusters', 'unclustered-point', 'unclustered-hit']) {
			m.on('mouseenter', layer, () => {
				m.getCanvas().style.cursor = 'pointer';
			});
			m.on('mouseleave', layer, () => {
				m.getCanvas().style.cursor = '';
			});
		}
		m.addSource('selection', { type: 'geojson', data: featureCollection([]) });
		m.addLayer({
			id: 'selected-location',
			type: 'circle',
			source: 'selection',
			paint: {
				'circle-radius': 12,
				'circle-color': '#ffffff',
				'circle-opacity': 0.3,
				'circle-stroke-color': '#000000',
				'circle-stroke-width': 3
			}
		});
	}
	$effect(() => {
		const geojson = featureCollection(searched);
		if (!map || mapState !== 'ready' || archiveState !== 'ready') return;
		const source = map.getSource('locations');
		if (source) source.setData(geojson);
		else installLayers(map, geojson);
	});
	$effect(() => {
		const location = $selectedLocation;
		if (map && mapState === 'ready' && archiveState === 'ready') {
			map.getSource('selection')?.setData(featureCollection(results.filter((r) => r.location === location)));
		}
	});
	function resetDates() {
		minYear.set(1808);
		maxYear.set(2009);
	}
	function select(result) {
		listOpen = false;
		selectionRequest.set({
			location: result.location,
			year: result.matchYear ?? null,
			image: result.matchImage,
			opener: searchInput
		});
		selectedLocation.set(result.location);
		if (map && mapState === 'ready' && query.trim()) {
			const width = mapContainer.clientWidth;
			map.easeTo({
				center: [result.location.longitude, result.location.latitude],
				zoom: Math.max(map.getZoom(), 16),
				offset: width >= 768 ? [-Math.min(width * 0.18, 230), 0] : [0, -mapContainer.clientHeight * 0.2],
				duration: matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 500
			});
		}
	}
	function cancelSearch() {
		searchInput?.focus({ preventScroll: true });
		query = '';
		limit = 30;
		listOpen = false;
	}
</script>

<div bind:this={mapContainer} class="absolute inset-0 w-full h-full"></div>
<div class="archive-tools">
	{#if sharedPhotoError}<div class="notice" role="status">
			Cette photo est introuvable. Vous pouvez explorer les autres photographies. <button
				type="button"
				onclick={() => (sharedPhotoError = false)}>Masquer</button
			>
		</div>{/if}
	<form
		class="search"
		role="search"
		onsubmit={(e) => {
			e.preventDefault();
			listOpen = true;
		}}
	>
		<input
			bind:this={searchInput}
			type="search"
			disabled={archiveState !== 'ready'}
			aria-label="Rechercher dans les descriptions"
			placeholder="Rechercher un lieu…"
			bind:value={query}
			aria-controls={listOpen && query.trim() ? 'archive-results' : undefined}
			onclick={() => (listOpen = true)}
			oninput={() => {
				listOpen = true;
				limit = 30;
			}}
			onkeydown={async (e) => {
				if (e.key === 'Escape') {
					e.preventDefault();
					cancelSearch();
				}
				if (e.key === 'ArrowDown' && query.trim()) {
					e.preventDefault();
					listOpen = true;
					await tick();
					document.querySelector('#archive-results li button')?.focus();
				}
			}}
		/>
		{#if query}<button type="button" aria-label="Annuler la recherche" onclick={cancelSearch}>×</button>{/if}
	</form>
	{#if archiveState === 'loading'}<p class="notice" role="status">Chargement de l’archive…</p>{/if}
	{#if archiveState === 'error'}<div class="notice" role="status">
			Archive indisponible. <button type="button" onclick={loadArchive}>Réessayer l’archive</button>
		</div>{/if}
	{#if archiveState === 'ready' && !results.length}<div class="notice" role="status">
			Aucun document pour cette période. <button type="button" onclick={resetDates}>Réinitialiser les dates</button>
		</div>{/if}
	{#if mapState === 'loading'}<p class="notice" role="status">Chargement de la carte…</p>{/if}
	{#if mapState === 'error'}<div class="notice" role="status">
			Carte indisponible. Les photographies restent accessibles par la recherche. <button
				type="button"
				onclick={createMap}>Réessayer la carte</button
			>
		</div>{/if}
	{#if geolocationError}<div class="notice" role="status">
			Position indisponible. Vérifiez l’autorisation de localisation du navigateur. <button
				type="button"
				onclick={() => (geolocationError = false)}>Masquer</button
			>
		</div>{/if}
	{#if listOpen && query.trim() && archiveState === 'ready'}
		<section id="archive-results" class="results" aria-label="Liste des lieux">
			<h2 role="status" aria-live="polite">
				{searched.length} lieu{searched.length !== 1 ? 'x' : ''} trouvé{searched.length !== 1 ? 's' : ''}
			</h2>
			{#if !searched.length}<p>Aucun résultat dans les descriptions pour cette période.</p>
				{#if $minYear !== 1808 || $maxYear !== 2009}<button type="button" onclick={resetDates}
						>Chercher sur toutes les années</button
					>{:else}<p>Essayez un autre mot ou un nom de lieu.</p>{/if}{/if}
			<ul>
				{#each searched.slice(0, limit) as result (result.index)}<li>
						<button type="button" onclick={() => select(result)} aria-pressed={$selectedLocation === result.location}
							><span>{result.caption || locationLabel(result.location)}</span><small
								>{yearsLabel(result.years)} · {result.count} image{result.count !== 1 ? 's' : ''}</small
							></button
						>
					</li>{/each}
			</ul>
			{#if searched.length > limit}<button type="button" class="more" onclick={() => (limit += 30)}
					>Afficher plus de lieux</button
				>{/if}
		</section>
	{/if}
</div>

<style>
	.archive-tools {
		position: absolute;
		left: 12px;
		top: 12px;
		z-index: 3;
		max-width: min(340px, calc(100% - 24px));
		max-height: calc(100% - 24px);
		display: flex;
		flex-direction: column;
		gap: 8px;
		pointer-events: none;
	}
	.search,
	.notice,
	.results {
		background: #fff;
		color: #000;
		border: 1px solid #e4e4e4;
		border-radius: 16px;
		padding: 10px 12px;
		font-size: 0.8rem;
		pointer-events: auto;
	}
	.search {
		display: flex;
		align-items: center;
		padding: 0 8px 0 12px;
		flex: none;
		width: 300px;
		max-width: 100%;
	}
	.search input {
		width: 100%;
		min-width: 0;
		height: 44px;
		background: transparent;
		color: #000;
		font: inherit;
		font-size: 16px;
	}
	.search input::-webkit-search-cancel-button {
		-webkit-appearance: none;
		display: none;
	}
	.search button {
		flex: none;
		width: 44px;
		min-height: 44px;
		font-size: 22px;
		text-decoration: none;
	}
	li span {
		display: -webkit-box;
		-webkit-line-clamp: 3;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
	.notice {
		flex-shrink: 0;
	}
	button {
		cursor: pointer;
		min-height: 36px;
		text-decoration: underline;
		text-underline-offset: 3px;
	}

	.results {
		overflow: auto;
		min-height: 0;
	}
	h2 {
		font-weight: 700;
		margin-bottom: 8px;
	}
	.hint {
		color: #626262;
		font-size: 0.75rem;
		margin-bottom: 8px;
	}
	ul {
		list-style: none;
	}
	li {
		border-top: 1px solid #eee;
	}
	li button {
		width: 100%;
		text-align: left;
		padding: 12px 0;
		text-decoration: none;
	}
	li button[aria-pressed='true'] {
		font-weight: 800;
	}
	small {
		display: block;
		color: #626262;
		margin-top: 4px;
	}
	.more {
		width: 100%;
	}

	:global(.maplibregl-ctrl-group) {
		border-radius: 14px;
		overflow: hidden;
		box-shadow: 0 2px 10px #0000000a;
		border: 1px solid #e4e4e4;
		background: #fff;
	}
	:global(.maplibregl-ctrl-group button) {
		width: 40px;
		height: 40px;
		background-color: #fff;
	}
	:global(.maplibregl-ctrl-group button:hover) {
		background-color: #f6f6f6;
	}
	:global(.maplibregl-ctrl-attrib) {
		font-size: 11px;
		font-family: 'Nunito Sans', sans-serif;
		background: #ffffffed;
		color: #626262;
	}
	:global(.maplibregl-ctrl-attrib a) {
		color: #626262;
	}
</style>
