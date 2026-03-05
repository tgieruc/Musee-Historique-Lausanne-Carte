<script>
	import { minYear, maxYear } from '$lib/stores/map.js';

	const YEAR_MIN = 1808;
	const YEAR_MAX = 2009;

	let localMin = $state($minYear);
	let localMax = $state($maxYear);

	function handleMinInput(e) {
		const val = parseInt(e.target.value);
		if (val <= localMax - 1) {
			localMin = val;
			minYear.set(val);
		} else {
			localMin = localMax - 1;
			minYear.set(localMax - 1);
			e.target.value = localMin;
		}
	}

	function handleMaxInput(e) {
		const val = parseInt(e.target.value);
		if (val >= localMin + 1) {
			localMax = val;
			maxYear.set(val);
		} else {
			localMax = localMin + 1;
			maxYear.set(localMin + 1);
			e.target.value = localMax;
		}
	}

	let rangePercent = $derived({
		min: ((localMin - YEAR_MIN) / (YEAR_MAX - YEAR_MIN)) * 100,
		max: ((localMax - YEAR_MIN) / (YEAR_MAX - YEAR_MIN)) * 100
	});
</script>

<header class="bg-parchment border-b border-parchment-dark px-4 py-3 md:px-6 md:py-4 font-body">
	<div class="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center gap-3 md:gap-8">
		<!-- Title -->
		<h1 class="font-display text-ink text-xl md:text-2xl tracking-tight whitespace-nowrap">
			Musee Historique de Lausanne
		</h1>

		<!-- Slider section -->
		<div class="flex-1 flex flex-col gap-1 max-w-xl">
			<!-- Year display -->
			<div class="flex items-baseline justify-center gap-2">
				<span class="font-display text-sepia text-lg md:text-xl tabular-nums">{localMin}</span>
				<span class="text-sepia-light text-sm tracking-widest">&mdash;</span>
				<span class="font-display text-sepia text-lg md:text-xl tabular-nums">{localMax}</span>
			</div>

			<!-- Dual range slider -->
			<div class="range-slider relative h-8 flex items-center">
				<!-- Track background -->
				<div class="absolute inset-x-0 h-1 rounded-full bg-parchment-dark"></div>
				<!-- Active track -->
				<div
					class="absolute h-1 rounded-full bg-gold"
					style="left: {rangePercent.min}%; right: {100 - rangePercent.max}%;"
				></div>
				<!-- Min input -->
				<input
					type="range"
					min={YEAR_MIN}
					max={YEAR_MAX}
					value={localMin}
					oninput={handleMinInput}
					class="range-thumb absolute inset-0 w-full pointer-events-none appearance-none bg-transparent"
					aria-label="Start year"
				/>
				<!-- Max input -->
				<input
					type="range"
					min={YEAR_MIN}
					max={YEAR_MAX}
					value={localMax}
					oninput={handleMaxInput}
					class="range-thumb absolute inset-0 w-full pointer-events-none appearance-none bg-transparent"
					aria-label="End year"
				/>
			</div>
		</div>
	</div>
</header>

<style>
	/* Remove default track styling and make thumbs interactive */
	.range-thumb::-webkit-slider-runnable-track {
		-webkit-appearance: none;
		appearance: none;
		height: 4px;
		background: transparent;
	}

	.range-thumb::-moz-range-track {
		appearance: none;
		height: 4px;
		background: transparent;
	}

	.range-thumb::-webkit-slider-thumb {
		-webkit-appearance: none;
		appearance: none;
		pointer-events: auto;
		width: 20px;
		height: 20px;
		border-radius: 50%;
		background: var(--color-gold);
		border: 2px solid var(--color-parchment);
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
		cursor: pointer;
		margin-top: -8px;
		transition: transform 0.15s ease, box-shadow 0.15s ease;
	}

	.range-thumb::-moz-range-thumb {
		appearance: none;
		pointer-events: auto;
		width: 20px;
		height: 20px;
		border-radius: 50%;
		background: var(--color-gold);
		border: 2px solid var(--color-parchment);
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
		cursor: pointer;
		transition: transform 0.15s ease, box-shadow 0.15s ease;
	}

	.range-thumb::-webkit-slider-thumb:hover {
		transform: scale(1.15);
		box-shadow: 0 2px 6px rgba(0, 0, 0, 0.25);
		background: var(--color-sepia);
	}

	.range-thumb::-moz-range-thumb:hover {
		transform: scale(1.15);
		box-shadow: 0 2px 6px rgba(0, 0, 0, 0.25);
		background: var(--color-sepia);
	}

	.range-thumb::-webkit-slider-thumb:active {
		transform: scale(1.2);
		background: var(--color-sepia);
	}

	.range-thumb::-moz-range-thumb:active {
		transform: scale(1.2);
		background: var(--color-sepia);
	}
</style>
