<script>
	import { fly, fade } from 'svelte/transition';
	import { selectedLocation, minYear, maxYear } from '$lib/stores/map.js';
	import ImageGallery from './ImageGallery.svelte';

	let isMobile = $state(false);
	let selectedYear = $state(null);

	let location = $derived($selectedLocation);

	let filteredYears = $derived(
		location
			? location.years
					.filter((y) => {
						const yr = parseInt(y.year);
						return yr >= $minYear && yr <= $maxYear;
					})
					.sort((a, b) => parseInt(a.year) - parseInt(b.year))
			: []
	);

	let selectedYearData = $derived(filteredYears.find((y) => y.year === selectedYear) || null);
	let selectedYearImages = $derived(selectedYearData ? selectedYearData.images : []);
	let totalImages = $derived(filteredYears.reduce((sum, y) => sum + y.images.length, 0));

	$effect(() => {
		if (filteredYears.length > 0) {
			selectedYear = filteredYears[0].year;
		} else {
			selectedYear = null;
		}
	});

	$effect(() => {
		function checkMobile() {
			isMobile = window.innerWidth < 768;
		}
		checkMobile();
		window.addEventListener('resize', checkMobile);
		return () => window.removeEventListener('resize', checkMobile);
	});

	function close() {
		selectedLocation.set(null);
	}

	function handleKeydown(e) {
		if (e.key === 'Escape') close();
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<!-- Backdrop -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="absolute inset-0 bg-black/50 z-10" transition:fade={{ duration: 200 }} onclick={close}></div>

<!-- Panel -->
<div
	class="absolute z-20 bg-terminal-bg border-terminal-border shadow-[0_0_20px_rgba(0,255,255,0.08)]
		{isMobile
		? 'bottom-0 left-0 right-0 border-t'
		: 'top-0 right-0 bottom-0 w-[480px] border-l'}"
	style={isMobile ? 'height: 80vh;' : ''}
	transition:fly={isMobile ? { y: 300, duration: 250 } : { x: 480, duration: 250 }}
>
	<!-- Mobile drag handle -->
	{#if isMobile}
		<div class="flex justify-center pt-2.5 pb-1">
			<div class="w-8 h-px bg-text-dim/40"></div>
		</div>
	{/if}

	<div class="px-4 pb-4 overflow-y-auto {isMobile ? 'pt-1' : 'pt-4'}" style="height: {isMobile ? 'calc(100% - 1.5rem)' : '100%'};">
		<!-- Header row -->
		<div class="flex items-start justify-between mb-3">
			<div>
				<p class="text-xs text-text-dim uppercase tracking-widest font-mono">{totalImages} image{totalImages !== 1 ? 's' : ''}</p>
				{#if filteredYears.length === 1}
					<h2 class="text-2xl text-accent-gold font-mono font-semibold leading-tight">{filteredYears[0].year}</h2>
				{:else if filteredYears.length > 1}
					<h2 class="text-2xl text-accent-gold font-mono font-semibold leading-tight">
						{filteredYears[0].year}--{filteredYears[filteredYears.length - 1].year}
					</h2>
				{:else}
					<h2 class="text-2xl text-accent-gold font-mono font-semibold leading-tight">--</h2>
				{/if}
			</div>
			<button
				class="mt-1 w-7 h-7 flex items-center justify-center text-text-dim hover:text-accent-cyan transition-all cursor-pointer"
				onclick={close}
				aria-label="Fermer"
			>
				<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
					<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
				</svg>
			</button>
		</div>

		<!-- Year pills -->
		{#if filteredYears.length > 1}
			<div class="flex flex-wrap gap-1.5 mb-4">
				{#each filteredYears as yearData}
					<button
						class="px-2.5 py-1 text-xs font-mono transition-all duration-150 cursor-pointer border
							{yearData.year === selectedYear
							? 'bg-accent-cyan/15 text-accent-cyan border-accent-cyan/50'
							: 'bg-transparent text-text-dim border-terminal-border hover:text-text-gold hover:border-text-gold/50'}"
						onclick={() => (selectedYear = yearData.year)}
					>
						{yearData.year}
						<span class="text-[10px] opacity-60">({yearData.images.length})</span>
					</button>
				{/each}
			</div>
		{/if}

		{#if filteredYears.length === 0}
			<p class="text-sm text-text-dim italic font-mono">
				Aucune image pour cette periode.
			</p>
		{/if}

		<!-- Gallery -->
		{#if selectedYearImages.length > 0 && selectedYear}
			{#key selectedYear}
				<ImageGallery images={selectedYearImages} year={selectedYear} />
			{/key}
		{/if}
	</div>
</div>
