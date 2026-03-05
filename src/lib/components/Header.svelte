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

<header class="bg-parchment/95 backdrop-blur-sm border-b border-parchment-dark/60 px-3 py-2 md:px-5 md:py-2.5 font-body relative z-30">
	<div class="flex items-center gap-3 md:gap-5">
		<h1 class="font-display text-ink text-sm md:text-base tracking-tight whitespace-nowrap leading-none">
			MHL
		</h1>

		<div class="w-px h-4 bg-sepia-light/30"></div>

		<div class="flex-1 flex items-center gap-2.5 max-w-md">
			<span class="font-display text-sepia text-xs tabular-nums leading-none">{localMin}</span>

			<div class="range-slider relative h-5 flex-1 flex items-center">
				<div class="absolute inset-x-0 h-0.5 rounded-full bg-parchment-dark/80"></div>
				<div
					class="absolute h-0.5 rounded-full bg-sepia"
					style="left: {rangePercent.min}%; right: {100 - rangePercent.max}%;"
				></div>
				<input
					type="range"
					min={YEAR_MIN}
					max={YEAR_MAX}
					value={localMin}
					oninput={handleMinInput}
					class="range-thumb absolute inset-0 w-full pointer-events-none appearance-none bg-transparent"
					aria-label="Année de début"
				/>
				<input
					type="range"
					min={YEAR_MIN}
					max={YEAR_MAX}
					value={localMax}
					oninput={handleMaxInput}
					class="range-thumb absolute inset-0 w-full pointer-events-none appearance-none bg-transparent"
					aria-label="Année de fin"
				/>
			</div>

			<span class="font-display text-sepia text-xs tabular-nums leading-none">{localMax}</span>
		</div>
	</div>
</header>

<style>
	.range-thumb::-webkit-slider-runnable-track {
		-webkit-appearance: none;
		appearance: none;
		height: 2px;
		background: transparent;
	}

	.range-thumb::-moz-range-track {
		appearance: none;
		height: 2px;
		background: transparent;
	}

	.range-thumb::-webkit-slider-thumb {
		-webkit-appearance: none;
		appearance: none;
		pointer-events: auto;
		width: 14px;
		height: 14px;
		border-radius: 50%;
		background: var(--color-sepia);
		border: 2px solid var(--color-parchment);
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
		cursor: pointer;
		margin-top: -6px;
		transition: transform 0.15s ease, box-shadow 0.15s ease;
	}

	.range-thumb::-moz-range-thumb {
		appearance: none;
		pointer-events: auto;
		width: 14px;
		height: 14px;
		border-radius: 50%;
		background: var(--color-sepia);
		border: 2px solid var(--color-parchment);
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
		cursor: pointer;
		transition: transform 0.15s ease, box-shadow 0.15s ease;
	}

	.range-thumb::-webkit-slider-thumb:hover,
	.range-thumb::-webkit-slider-thumb:active {
		transform: scale(1.2);
		background: var(--color-ink);
	}

	.range-thumb::-moz-range-thumb:hover,
	.range-thumb::-moz-range-thumb:active {
		transform: scale(1.2);
		background: var(--color-ink);
	}
</style>
