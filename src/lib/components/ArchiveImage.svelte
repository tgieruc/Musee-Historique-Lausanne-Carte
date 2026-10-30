<script>
	import { tick } from 'svelte';
	let frame;
	let { image, alt = '', loading = 'lazy', onopen = null, label = 'Agrandir l’image' } = $props();
	let failed = $state(false);
	let pending = $state(true);
	let attempt = $state(0);
	let url = $derived.by(() => {
		const original = image.url?.replace(/^http:/, 'https:').replaceAll('&amp;', '&');
		if (!attempt || !original) return original;
		const retryURL = new URL(original);
		retryURL.searchParams.set('_retry', String(attempt));
		return retryURL.href;
	});
	function watchImage(node) {
		let timer;
		const stop = () => clearTimeout(timer);
		const observer = new IntersectionObserver((entries) => {
			if (entries.some((e) => e.isIntersecting)) {
				observer.disconnect();
				if (!node.complete) timer = setTimeout(fail, 20000);
			}
		});
		observer.observe(node);
		node.addEventListener('load', stop);
		node.addEventListener('error', stop);
		return {
			destroy() {
				stop();
				observer.disconnect();
				node.removeEventListener('load', stop);
				node.removeEventListener('error', stop);
			}
		};
	}
	async function fail() {
		const restore = frame?.contains(document.activeElement);
		pending = false;
		failed = true;
		await tick();
		if (restore) frame?.querySelector('button')?.focus({ preventScroll: true });
	}
	async function retry() {
		attempt++;
		pending = true;
		failed = false;
		await tick();
		(frame.querySelector('button') || frame).focus({ preventScroll: true });
	}
</script>

<div bind:this={frame} tabindex="-1" class="image-frame" aria-busy={pending && !failed}>
	{#if pending && !failed}<p class="loading" role="status">Chargement de l’image…</p>{/if}
	{#if failed}
		<div class="failure" role="status">
			<p>Image indisponible.</p>
			<button type="button" onclick={retry}>Réessayer l’image</button>
		</div>
	{:else}
		{#key attempt}{#if onopen}<button type="button" class="image-button" aria-label={label} onclick={onopen}
					><img use:watchImage src={url} {alt} {loading} onload={() => (pending = false)} onerror={fail} /></button
				>{:else}<img
					use:watchImage
					src={url}
					{alt}
					{loading}
					onload={() => (pending = false)}
					onerror={fail}
				/>{/if}{/key}
	{/if}
</div>

<style>
	.image-button {
		display: block;
		width: 100%;
		margin: 0;
		padding: 0;
	}
	.loading {
		position: absolute;
		inset: 0;
		display: grid;
		place-items: center;
		color: #626262;
		font-size: 0.8rem;
		pointer-events: none;
	}
	.image-frame {
		position: relative;
		min-height: 150px;
		background: #f6f6f6;
		display: grid;
		place-items: center;
	}
	img {
		width: 100%;
		height: auto;
		max-height: 65dvh;
		object-fit: contain;
	}
	.failure {
		padding: 32px 16px;
		text-align: center;
		font-size: 0.9rem;
	}
	button {
		margin-top: 10px;
		text-decoration: underline;
		text-underline-offset: 3px;
		min-height: 44px;
		cursor: pointer;
	}
</style>
