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

	let selectedYearData = $derived(
		filteredYears.find((y) => y.year === selectedYear) || null
	);

	let selectedYearImages = $derived(
		selectedYearData ? selectedYearData.images : []
	);

	// Auto-select first year when filtered years change
	$effect(() => {
		if (filteredYears.length > 0) {
			selectedYear = filteredYears[0].year;
		} else {
			selectedYear = null;
		}
	});

	// Detect mobile/desktop
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

<!-- Overlay backdrop -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class="absolute inset-0 bg-black/30 z-10"
	transition:fade={{ duration: 200 }}
	onclick={close}
></div>

<!-- Drawer panel -->
{#if isMobile}
	<!-- Mobile: bottom drawer -->
	<div
		class="absolute bottom-0 left-0 right-0 z-20 bg-parchment rounded-t-2xl shadow-2xl border-t border-sepia-light/30"
		style="height: 60vh;"
		transition:fly={{ y: 300, duration: 300 }}
	>
		<!-- Drag handle -->
		<div class="flex justify-center pt-3 pb-1">
			<div class="w-10 h-1 rounded-full bg-sepia-light/40"></div>
		</div>

		<div class="px-5 pb-5 overflow-y-auto" style="height: calc(100% - 2rem);">
			<!-- Close button -->
			<div class="flex justify-end mb-1">
				<button
					class="w-8 h-8 flex items-center justify-center text-ink/50 hover:text-ink transition-colors cursor-pointer"
					onclick={close}
					aria-label="Fermer"
				>
					<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
			</div>

			<!-- Title -->
			<h2 class="font-display text-xl text-ink mb-4">
				Lieu #{location?.title}
			</h2>

			<!-- Year pills -->
			{#if filteredYears.length > 0}
				<div class="flex flex-wrap gap-2 mb-4">
					{#each filteredYears as yearData}
						<button
							class="px-3 py-1.5 rounded-full text-sm font-body transition-all duration-200 cursor-pointer {yearData.year === selectedYear
								? 'bg-sepia text-white shadow-sm'
								: 'bg-parchment-dark text-ink/70 hover:bg-sepia-light/30'}"
							onclick={() => (selectedYear = yearData.year)}
						>
							{yearData.year}
						</button>
					{/each}
				</div>
			{:else}
				<p class="font-body text-sm text-ink/50 italic mb-4">
					Aucune image pour la periode selectionnee.
				</p>
			{/if}

			<!-- Image gallery -->
			{#if selectedYearImages.length > 0 && selectedYear}
				<ImageGallery images={selectedYearImages} year={selectedYear} />
			{/if}
		</div>
	</div>
{:else}
	<!-- Desktop: side panel from right -->
	<div
		class="absolute top-0 right-0 bottom-0 z-20 w-[400px] bg-parchment shadow-2xl border-l border-sepia-light/30"
		transition:fly={{ x: 400, duration: 300 }}
	>
		<div class="p-6 overflow-y-auto h-full">
			<!-- Close button -->
			<div class="flex justify-end mb-2">
				<button
					class="w-8 h-8 flex items-center justify-center text-ink/50 hover:text-ink transition-colors cursor-pointer"
					onclick={close}
					aria-label="Fermer"
				>
					<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
			</div>

			<!-- Title -->
			<h2 class="font-display text-2xl text-ink mb-5">
				Lieu #{location?.title}
			</h2>

			<!-- Year pills -->
			{#if filteredYears.length > 0}
				<div class="flex flex-wrap gap-2 mb-5">
					{#each filteredYears as yearData}
						<button
							class="px-3.5 py-1.5 rounded-full text-sm font-body transition-all duration-200 cursor-pointer {yearData.year === selectedYear
								? 'bg-sepia text-white shadow-sm'
								: 'bg-parchment-dark text-ink/70 hover:bg-sepia-light/30'}"
							onclick={() => (selectedYear = yearData.year)}
						>
							{yearData.year}
						</button>
					{/each}
				</div>
			{:else}
				<p class="font-body text-sm text-ink/50 italic mb-5">
					Aucune image pour la periode selectionnee.
				</p>
			{/if}

			<!-- Image gallery -->
			{#if selectedYearImages.length > 0 && selectedYear}
				<ImageGallery images={selectedYearImages} year={selectedYear} />
			{/if}
		</div>
	</div>
{/if}
