<script>
	import Header from '$lib/components/Header.svelte';
	import Map from '$lib/components/Map.svelte';
	import Drawer from '$lib/components/Drawer.svelte';
	import { selectedLocation } from '$lib/stores/map.js';
</script>

<div class="h-screen flex flex-col bg-terminal-bg">
	<Header />
	<div class="flex-1 relative overflow-hidden">
		<Map />
		{#if $selectedLocation}
			<Drawer />
		{/if}
	</div>
</div>
