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
<div class="absolute inset-0 bg-black/20 z-10" transition:fade={{ duration: 200 }} onclick={close}></div>

<!-- Panel -->
<div
	class="absolute z-20 bg-parchment shadow-2xl
		{isMobile
		? 'bottom-0 left-0 right-0 rounded-t-xl border-t border-sepia-light/20'
		: 'top-0 right-0 bottom-0 w-[480px] border-l border-sepia-light/20'}"
	style={isMobile ? 'height: 55vh;' : ''}
	transition:fly={isMobile ? { y: 300, duration: 250 } : { x: 480, duration: 250 }}
>
	<!-- Mobile drag handle -->
	{#if isMobile}
		<div class="flex justify-center pt-2.5 pb-1">
			<div class="w-8 h-0.5 rounded-full bg-sepia-light/40"></div>
		</div>
	{/if}

	<div class="px-4 pb-4 overflow-y-auto {isMobile ? 'pt-1' : 'pt-4'}" style="height: {isMobile ? 'calc(100% - 1.5rem)' : '100%'};">
		<!-- Header row -->
		<div class="flex items-start justify-between mb-3">
			<div>
				<p class="font-body text-xs text-sepia uppercase tracking-widest">{totalImages} image{totalImages !== 1 ? 's' : ''}</p>
				{#if filteredYears.length === 1}
					<h2 class="font-display text-2xl text-ink leading-tight">{filteredYears[0].year}</h2>
				{:else if filteredYears.length > 1}
					<h2 class="font-display text-2xl text-ink leading-tight">
						{filteredYears[0].year}–{filteredYears[filteredYears.length - 1].year}
					</h2>
				{:else}
					<h2 class="font-display text-2xl text-ink leading-tight">—</h2>
				{/if}
			</div>
			<button
				class="mt-1 w-7 h-7 flex items-center justify-center rounded-full text-ink/40 hover:text-ink hover:bg-parchment-dark/50 transition-all cursor-pointer"
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
						class="px-2.5 py-1 rounded-full text-xs font-body transition-all duration-150 cursor-pointer
							{yearData.year === selectedYear
							? 'bg-ink text-parchment'
							: 'bg-parchment-dark/70 text-ink/60 hover:text-ink hover:bg-parchment-dark'}"
						onclick={() => (selectedYear = yearData.year)}
					>
						{yearData.year}
						<span class="text-[10px] opacity-60">({yearData.images.length})</span>
					</button>
				{/each}
			</div>
		{/if}

		{#if filteredYears.length === 0}
			<p class="font-body text-sm text-ink/40 italic">
				Aucune image pour cette période.
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
