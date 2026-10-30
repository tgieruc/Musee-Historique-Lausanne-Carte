<script>
	import { base } from '$app/paths';
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

<header class="map-header">
  <div class="navigation">
    <a href="/" class="brand"><img src={`${base}/raccoon.png`} alt="" width="28" height="28" />Theo Gieruc</a>
    <nav aria-label="Navigation principale"><a href="/">Blog</a><a href="/mhl-carte/" aria-current="page">Map</a></nav>
  </div>
  <div class="map-tools">
    <h1>Lausanne, au fil du temps</h1>
    <div class="year-filter" role="group" aria-label="Période des photographies">
      <span>{localMin}</span>
      <div class="range-slider">
        <div class="track"></div>
        <div class="track selected" style="left: {rangePercent.min}%; right: {100 - rangePercent.max}%;"></div>
        <input type="range" min={YEAR_MIN} max={YEAR_MAX} value={localMin} oninput={handleMinInput} aria-label="Année de début" />
        <input type="range" min={YEAR_MIN} max={YEAR_MAX} value={localMax} oninput={handleMaxInput} aria-label="Année de fin" />
      </div>
      <span>{localMax}</span>
    </div>
  </div>
</header>

<style>
.map-header { background: #fff; border-bottom: 1px solid #e4e4e4; position: relative; z-index: 5; }
.navigation { display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding: 1.15rem 1.5rem; }
.brand { display: inline-flex; align-items: center; gap: .65rem; color: #000; font-weight: 800; font-size: 1.1rem; letter-spacing: -.03em; text-decoration: none; }
.brand img { width: 28px; height: 28px; }
nav { display: flex; gap: .3rem; }
nav a { padding: .45rem .9rem; border-radius: 999px; font-size: .85rem; color: #626262; text-decoration: none; }
nav a[aria-current] { background: #000; color: #fff; }
.map-tools { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: .75rem 2rem; padding: .8rem 1.5rem; border-top: 1px solid #eee; }
h1 { font-weight: 800; font-size: 1rem; }
.year-filter { display: flex; align-items: center; gap: .8rem; width: 290px; font-size: .8rem; font-variant-numeric: tabular-nums; }
.range-slider { position: relative; flex: 1; height: 36px; display: flex; align-items: center; }
.track { position: absolute; left: 0; right: 0; height: 3px; background: #e4e4e4; border-radius: 999px; }
.selected { background: #000; }
input { position: absolute; inset: 0; width: 100%; appearance: none; pointer-events: none; background: transparent; }
input::-webkit-slider-runnable-track { height: 3px; background: transparent; }
input::-moz-range-track { height: 3px; background: transparent; }
input::-webkit-slider-thumb { appearance: none; pointer-events: auto; width: 20px; height: 20px; margin-top: -8.5px; border-radius: 50%; background: #000; border: 3px solid #fff; box-shadow: 0 0 0 1px #ddd; cursor: grab; }
input::-moz-range-thumb { pointer-events: auto; width: 14px; height: 14px; border-radius: 50%; background: #000; border: 3px solid #fff; box-shadow: 0 0 0 1px #ddd; cursor: grab; }
@media(max-width: 600px) { .navigation { padding: .9rem 1.1rem; } .map-tools { padding: .65rem 1.1rem; gap: .25rem; } .year-filter { width: 100%; } .brand { font-size: 1rem; } }
</style>
