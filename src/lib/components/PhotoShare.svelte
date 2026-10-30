<script>
	import { tick } from 'svelte';
	import { base } from '$app/paths';
	let { image } = $props();
	let status = $state('');
	let fallback = $state('');
	let field = $state();
	async function copy() {
		const url = new URL(`${base}/`, window.location.origin);
		url.searchParams.set('image', String(image.id));
		try {
			await navigator.clipboard.writeText(url.href);
			status = 'Lien copié';
			fallback = '';
		} catch {
			fallback = url.href;
			status = 'Copiez ce lien :';
			await tick();
			field?.focus();
			field?.select();
		}
	}
</script>

<div class="share">
	<button type="button" onclick={copy}>Copier le lien</button>
	<span role="status">{status}</span>
	{#if fallback}<input bind:this={field} aria-label="Lien de la photo" readonly value={fallback} />{/if}
</div>

<style>
	.share {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 8px;
		font-size: 0.8rem;
	}
	button {
		min-height: 44px;
		cursor: pointer;
		text-decoration: underline;
		text-underline-offset: 3px;
	}
	span {
		color: #626262;
	}
	input {
		width: 100%;
		min-width: 0;
		padding: 8px;
		border: 1px solid #e4e4e4;
		border-radius: 8px;
	}
</style>
