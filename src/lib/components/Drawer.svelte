<script>
	import { onMount, untrack } from 'svelte';
	import { selectedLocation, selectionRequest, minYear, maxYear } from '$lib/stores/map.js';
	import { dialog } from '$lib/actions/dialog.js';
	import { yearMatches, yearLabel } from '$lib/archive.js';
	import ImageGallery from './ImageGallery.svelte';

	let isMobile = $state(false);
	let selectedYear = $state(null);
	let previousLocation;
	let previousRequest;
	let panel;
	let backdropStart = false;
	let location = $derived($selectedLocation);
	let filteredYears = $derived(
		location?.years.filter((y) => yearMatches(y.year, $minYear, $maxYear)).toSorted((a, b) => +a.year - +b.year) || []
	);
	let images = $derived(filteredYears.find((y) => y.year === selectedYear)?.images || []);
	let totalImages = $derived(filteredYears.reduce((sum, y) => sum + y.images.length, 0));
	$effect(() => {
		const current = untrack(() => selectedYear);
		const request = $selectionRequest;
		if (
			request !== previousRequest &&
			request?.location === location &&
			filteredYears.some((y) => y.year === request.year)
		) {
			selectedYear = request.year;
			previousLocation = location;
			panel?.querySelector('[data-close]')?.focus();
		} else if (location !== previousLocation) {
			selectedYear = filteredYears[0]?.year ?? null;
			previousLocation = location;
			panel?.querySelector('[data-close]')?.focus();
		} else if (!filteredYears.some((y) => y.year === current)) {
			selectedYear =
				filteredYears.toSorted((a, b) => Math.abs(+a.year - +current) - Math.abs(+b.year - +current))[0]?.year ?? null;
		}
		previousRequest = request;
	});
	onMount(() => {
		const query = matchMedia('(max-width: 767px)');
		isMobile = query.matches;
		const change = () => (isMobile = query.matches);
		query.addEventListener('change', change);
		return () => query.removeEventListener('change', change);
	});
	function close() {
		selectedLocation.set(null);
	}
	function cancel(event) {
		if (event.target !== panel) return;
		event.preventDefault();
		close();
	}
</script>

<dialog
	bind:this={panel}
	use:dialog={{ modal: isMobile, opener: $selectionRequest?.opener }}
	class:mobile={isMobile}
	aria-labelledby="photo-heading"
	oncancel={cancel}
	onpointerdown={(e) => {
		const r = panel.getBoundingClientRect();
		backdropStart =
			e.target === panel && (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom);
	}}
	onpointerup={(e) => {
		const r = panel.getBoundingClientRect();
		if (
			backdropStart &&
			e.target === panel &&
			(e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom)
		)
			close();
		backdropStart = false;
	}}
	onkeydown={(e) => {
		if (e.key === 'Escape' && !isMobile && e.target.closest('dialog') === panel) {
			e.preventDefault();
			close();
		}
	}}
>
	<header>
		<div>
			<h2 id="photo-heading">Photographies du lieu</h2>
			<p aria-live="polite">
				{totalImages} image{totalImages !== 1 ? 's' : ''}{selectedYear ? ` · ${yearLabel(selectedYear)}` : ''}
			</p>
		</div>
		<button type="button" data-close onclick={close} aria-label="Fermer les photographies">×</button>
	</header>
	<div class="content">
		{#if filteredYears.length > 0}
			<div class="years" aria-label="Année des photographies">
				{#each filteredYears as year (year.year)}
					<button type="button" aria-pressed={selectedYear === year.year} onclick={() => (selectedYear = year.year)}
						>{yearLabel(year.year)} <span>({year.images.length})</span></button
					>
				{/each}
			</div>
			{#key `${location.longitude},${location.latitude},${selectedYear}`}
				<ImageGallery {images} targetImage={$selectionRequest?.image} />
			{/key}
		{:else}<p role="status">
				Aucune image pour cette période. Élargissez les dates pour retrouver les photographies de ce lieu.
			</p>{/if}
	</div>
</dialog>

<style>
	dialog {
		position: absolute;
		inset: 12px 12px 12px auto;
		margin: 0;
		width: min(460px, calc(100% - 24px));
		max-width: none;
		max-height: none;
		height: calc(100% - 24px);
		padding: 0;
		border: 1px solid #e4e4e4;
		border-radius: 24px;
		background: #fff;
		color: #000;
		z-index: 20;
		box-shadow: 0 6px 30px #0000000a;
	}
	dialog[open] {
		display: flex;
		flex-direction: column;
	}
	dialog.mobile {
		position: fixed;
		inset: auto 0 0;
		width: 100%;
		height: auto;
		max-height: max(120px, calc(var(--map-height, 70dvh) - 12px));
		border-radius: 24px 24px 0 0;
	}
	dialog::backdrop {
		background: #0002;
	}
	header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 12px;
		padding: 16px;
		flex: none;
	}
	h2 {
		font-size: 1.05rem;
		font-weight: 800;
	}
	p {
		font-size: 0.85rem;
		color: #626262;
	}
	header button {
		width: 44px;
		height: 44px;
		flex: none;
		border-radius: 50%;
		background: #f6f6f6;
		font-size: 24px;
		cursor: pointer;
	}
	.content {
		overflow: auto;
		min-height: 0;
		padding: 0 16px max(16px, env(safe-area-inset-bottom));
	}
	.years {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
		margin-bottom: 16px;
	}
	.years button {
		border: 1px solid #e4e4e4;
		border-radius: 999px;
		padding: 8px 12px;
		min-height: 40px;
		font-size: 0.8rem;
		cursor: pointer;
	}
	.years button[aria-pressed='true'] {
		background: #000;
		color: #fff;
		border-color: #000;
	}
	.years span {
		opacity: 0.7;
	}
</style>
