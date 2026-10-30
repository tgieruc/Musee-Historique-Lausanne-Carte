<script>
	import Header from '$lib/components/Header.svelte';
	import Map from '$lib/components/Map.svelte';
	import Drawer from '$lib/components/Drawer.svelte';
	let mapHeight = $state(0);
	import { selectedLocation } from '$lib/stores/map.js';
</script>

<div class="h-dvh flex flex-col bg-surface">
	<Header />
	<div
		class="flex-1 min-h-0 relative overflow-hidden"
		bind:clientHeight={mapHeight}
		style={`--map-height: ${mapHeight}px`}
	>
		<Map />
		{#if $selectedLocation}
			<Drawer />
		{/if}
	</div>
</div>
