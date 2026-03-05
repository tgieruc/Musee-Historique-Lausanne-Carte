<script>
	import Header from '$lib/components/Header.svelte';
	import Map from '$lib/components/Map.svelte';
</script>

<div class="h-screen flex flex-col bg-parchment">
	<Header />
	<div class="flex-1 relative">
		<Map />
	</div>
</div>
