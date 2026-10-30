<script>
	import { base } from '$app/paths';
	import { minYear, maxYear } from '$lib/stores/map.js';

	const YEAR_MIN = 1808;
	const YEAR_MAX = 2009;

	let localMin = $derived($minYear);
	let localMax = $derived($maxYear);
	function changeYear(event, lower) {
		const value = Number(event.target.value);
		if (!Number.isInteger(value) || event.target.value === '') {
			event.target.value = lower ? localMin : localMax;
			return;
		}
		const year = Math.max(YEAR_MIN, Math.min(YEAR_MAX, value));
		if (lower) minYear.set(Math.min(year, localMax));
		else maxYear.set(Math.max(year, localMin));
		event.target.value = lower ? $minYear : $maxYear;
	}
</script>

<header class="map-header">
	<div class="navigation">
		<a href="/" class="brand"><img src={`${base}/raccoon.png`} alt="" width="28" height="28" />Theo Gieruc</a>
		<nav aria-label="Navigation principale">
			<a href="/">Blog</a><a href="/mhl-carte/" aria-current="page">Carte</a>
		</nav>
	</div>
	<div class="map-tools">
		<h1>Lausanne, au fil du temps</h1>
		<div class="year-filter" role="group" aria-label="Période des photographies">
			<label
				>De <input
					type="number"
					aria-label="Année de début"
					min={YEAR_MIN}
					max={localMax}
					value={localMin}
					onchange={(e) => changeYear(e, true)}
				/></label
			>
			<label
				>à <input
					type="number"
					aria-label="Année de fin"
					min={localMin}
					max={YEAR_MAX}
					value={localMax}
					onchange={(e) => changeYear(e, false)}
				/></label
			>
			<button
				type="button"
				onclick={() => {
					minYear.set(YEAR_MIN);
					maxYear.set(YEAR_MAX);
				}}>Tout</button
			>
		</div>
	</div>
</header>

<style>
	.map-header {
		background: #fff;
		border-bottom: 1px solid #e4e4e4;
		position: relative;
		z-index: 5;
	}
	.navigation {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		padding: 1.15rem 1.5rem;
	}
	.brand {
		display: inline-flex;
		align-items: center;
		gap: 0.65rem;
		color: #000;
		font-weight: 800;
		font-size: 1.1rem;
		letter-spacing: -0.03em;
		text-decoration: none;
	}
	.brand img {
		width: 28px;
		height: 28px;
	}
	nav {
		display: flex;
		gap: 0.3rem;
	}
	nav a {
		padding: 0.45rem 0.9rem;
		border-radius: 999px;
		font-size: 0.85rem;
		color: #626262;
		text-decoration: none;
	}
	nav a[aria-current] {
		background: #000;
		color: #fff;
	}
	.map-tools {
		display: flex;
		flex-wrap: wrap;
		justify-content: space-between;
		align-items: center;
		gap: 0.75rem 2rem;
		padding: 0.8rem 1.5rem;
		border-top: 1px solid #eee;
	}
	h1 {
		font-weight: 800;
		font-size: 1rem;
	}
	.year-filter {
		display: flex;
		align-items: center;
		gap: 10px;
		font-size: 0.8rem;
		flex-wrap: wrap;
	}
	label {
		display: flex;
		align-items: center;
		gap: 6px;
	}
	input {
		width: 80px;
		border: 1px solid #e4e4e4;
		border-radius: 10px;
		padding: 8px;
		min-height: 44px;
		font-size: 16px;
		background: #fff;
		color: #000;
	}
	.year-filter button {
		min-height: 44px;
		padding: 8px 10px;
		border-radius: 999px;
		background: #f6f6f6;
		cursor: pointer;
	}
	@media (max-width: 600px) {
		.navigation {
			padding: 0.9rem 1.1rem;
		}
		.map-tools {
			padding: 0.65rem 1.1rem;
			gap: 0.25rem;
		}
		.year-filter {
			width: 100%;
		}
		.brand {
			font-size: 1rem;
		}
	}
</style>
