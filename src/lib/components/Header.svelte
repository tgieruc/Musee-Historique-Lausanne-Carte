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

<header
	class="bg-terminal-bg/95 backdrop-blur-sm border-b border-terminal-border px-3 py-2 md:px-5 md:py-2.5 font-mono relative z-30"
>
	<div class="flex items-center gap-3 md:gap-5">
		<a
			href="/"
			class="text-accent-gold text-sm md:text-base tracking-[0.05em] uppercase font-semibold whitespace-nowrap leading-none hover:text-accent-gold no-underline"
		>
			Theo Gieruc
		</a>

		<nav class="flex items-center gap-3 md:gap-6">
			<a
				href="/"
				class="text-text-dim text-xs md:text-sm uppercase tracking-[0.08em] hover:text-accent-cyan no-underline">Blog</a
			>
			<a href="/mhl-carte/" class="text-accent-cyan text-xs md:text-sm uppercase tracking-[0.08em] no-underline">Map</a>
			<a
				href="https://github.com/tgieruc"
				class="text-text-dim text-xs md:text-sm uppercase tracking-[0.08em] hover:text-accent-cyan no-underline"
				>GitHub</a
			>
		</nav>

		<div class="w-px h-4 bg-terminal-border hidden md:block"></div>

		<div class="flex-1 flex items-center gap-2.5 max-w-xs">
			<span class="text-accent-orange text-xs tabular-nums leading-none tracking-wide">{localMin}</span>

			<div class="range-slider relative h-5 flex-1 flex items-center">
				<div class="absolute inset-x-0 h-px rounded-full bg-terminal-border"></div>
				<div
					class="absolute h-px rounded-full bg-accent-cyan"
					style="left: {rangePercent.min}%; right: {100 - rangePercent.max}%;"
				></div>
				<input
					type="range"
					min={YEAR_MIN}
					max={YEAR_MAX}
					value={localMin}
					oninput={handleMinInput}
					class="range-thumb absolute inset-0 w-full pointer-events-none appearance-none bg-transparent"
					aria-label="Annee de debut"
				/>
				<input
					type="range"
					min={YEAR_MIN}
					max={YEAR_MAX}
					value={localMax}
					oninput={handleMaxInput}
					class="range-thumb absolute inset-0 w-full pointer-events-none appearance-none bg-transparent"
					aria-label="Annee de fin"
				/>
			</div>

			<span class="text-accent-orange text-xs tabular-nums leading-none tracking-wide">{localMax}</span>
		</div>
	</div>
</header>

<style>
	.range-thumb::-webkit-slider-runnable-track {
		-webkit-appearance: none;
		appearance: none;
		height: 1px;
		background: transparent;
	}

	.range-thumb::-moz-range-track {
		appearance: none;
		height: 1px;
		background: transparent;
	}

	.range-thumb::-webkit-slider-thumb {
		-webkit-appearance: none;
		appearance: none;
		pointer-events: auto;
		width: 12px;
		height: 12px;
		border-radius: 0;
		background: var(--color-accent-cyan);
		border: 1px solid var(--color-terminal-bg);
		box-shadow: 0 0 6px rgba(0, 255, 255, 0.4);
		cursor: pointer;
		margin-top: -5px;
		transition:
			box-shadow 0.15s ease,
			background 0.15s ease;
	}

	.range-thumb::-moz-range-thumb {
		appearance: none;
		pointer-events: auto;
		width: 12px;
		height: 12px;
		border-radius: 0;
		background: var(--color-accent-cyan);
		border: 1px solid var(--color-terminal-bg);
		box-shadow: 0 0 6px rgba(0, 255, 255, 0.4);
		cursor: pointer;
		transition:
			box-shadow 0.15s ease,
			background 0.15s ease;
	}

	.range-thumb::-webkit-slider-thumb:hover,
	.range-thumb::-webkit-slider-thumb:active {
		background: var(--color-text-bright);
		box-shadow: 0 0 10px rgba(0, 255, 255, 0.7);
	}

	.range-thumb::-moz-range-thumb:hover,
	.range-thumb::-moz-range-thumb:active {
		background: var(--color-text-bright);
		box-shadow: 0 0 10px rgba(0, 255, 255, 0.7);
	}
</style>
