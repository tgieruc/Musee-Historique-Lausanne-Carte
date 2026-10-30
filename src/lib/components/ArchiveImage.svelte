<script>
	let { image, alt = '', loading = 'lazy', onopen = null, label = 'Agrandir l’image' } = $props();
	let failed = $state(false);
	let pending = $state(true);
	let attempt = $state(0);
	let url = $derived(image.url?.replace(/^http:/, 'https:').replaceAll('&amp;', '&'));
</script>

<div class="image-frame" aria-busy={pending && !failed}>
	{#if pending && !failed}<p class="loading" role="status">Chargement de l’image…</p>{/if}
	{#if failed}
		<div class="failure" role="status">
			<p>Image indisponible.</p>
			<button
				type="button"
				onclick={() => {
					attempt++;
					pending = true;
					failed = false;
				}}>Réessayer l’image</button
			>
		</div>
	{:else}
		{#key attempt}{#if onopen}<button type="button" class="image-button" aria-label={label} onclick={onopen}
					><img
						src={url}
						{alt}
						{loading}
						onload={() => (pending = false)}
						onerror={() => {
							pending = false;
							failed = true;
						}}
					/></button
				>{:else}<img
					src={url}
					{alt}
					{loading}
					onload={() => (pending = false)}
					onerror={() => {
						pending = false;
						failed = true;
					}}
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
