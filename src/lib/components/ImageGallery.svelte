<script>
	import { tick } from 'svelte';
	import { dialog } from '$lib/actions/dialog.js';
	import ArchiveImage from './ArchiveImage.svelte';
	let { images, targetImage } = $props();
	let gallery;
	$effect(() => {
		const id = targetImage;
		if (id == null) return;
		tick().then(() => {
			const card = [...(gallery?.querySelectorAll('article') || [])].find((el) => el.dataset.image === String(id));
			const content = gallery?.closest('.content');
			if (card && content) content.scrollTop += card.getBoundingClientRect().top - content.getBoundingClientRect().top;
		});
	});
	let lightboxIndex = $state(null);
	let active = $derived(lightboxIndex === null ? null : images[lightboxIndex]);
	const source = (image) =>
		`https://museris.lausanne.ch/SGCM/Consultation.aspx?id=${image.id}&Source=search_result.aspx`;
	function close() {
		lightboxIndex = null;
	}
	function move(step) {
		lightboxIndex = (lightboxIndex + step + images.length) % images.length;
	}
</script>

<div class="gallery" bind:this={gallery}>
	{#each images as image, i (image.id)}
		<article class="photo-card" data-image={image.id}>
			<ArchiveImage {image} onopen={() => (lightboxIndex = i)} label={`Agrandir l’image ${i + 1}`} />
			<div class="caption">
				{#if image.description}<p>{image.description}</p>{/if}
				<a href={source(image)} target="_blank" rel="noopener noreferrer"
					>Notice du musée <span class="sr-only">(nouvel onglet)</span></a
				>
			</div>
		</article>
	{/each}
</div>
{#if active}
	<dialog
		use:dialog={true}
		class="viewer"
		aria-labelledby="viewer-title"
		oncancel={(e) => {
			e.preventDefault();
			e.stopPropagation();
			close();
		}}
		onkeydown={(e) => {
			if (e.key === 'ArrowLeft') {
				e.preventDefault();
				move(-1);
			}
			if (e.key === 'ArrowRight') {
				e.preventDefault();
				move(1);
			}
		}}
	>
		<header>
			<h2 id="viewer-title" aria-live="polite">Image {lightboxIndex + 1} sur {images.length}</h2>
			<button type="button" data-close onclick={close} aria-label="Fermer la visionneuse">×</button>
		</header>
		<div class="viewer-content">
			{#key active.id}<ArchiveImage
					image={active}
					alt={active.description || 'Photographie historique'}
					loading="eager"
				/>{/key}
			{#if images.length > 1}<nav aria-label="Photographies">
					<button type="button" onclick={() => move(-1)}>Précédente</button><button
						type="button"
						onclick={() => move(1)}>Suivante</button
					>
				</nav>{/if}
			<p>{active.description || ''}</p>
			<a href={source(active)} target="_blank" rel="noopener noreferrer"
				>Notice du musée <span class="sr-only">(nouvel onglet)</span></a
			>
		</div>
	</dialog>
{/if}

<style>
	.gallery {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}
	.photo-card {
		border: 1px solid #e4e4e4;
		border-radius: 16px;
		overflow: hidden;
	}
	.caption {
		padding: 12px;
	}
	p {
		font-size: 0.85rem;
		line-height: 1.6;
		color: #626262;
		margin: 8px 0;
		overflow-wrap: anywhere;
	}
	a {
		font-size: 0.8rem;
		text-decoration: underline;
		text-underline-offset: 3px;
	}
	button {
		cursor: pointer;
		min-height: 44px;
	}
	.viewer {
		position: fixed;
		inset: 16px;
		margin: auto;
		width: min(900px, calc(100% - 32px));
		max-width: none;
		max-height: calc(100dvh - 32px);
		padding: 0;
		border: 1px solid #e4e4e4;
		border-radius: 20px;
		background: #fff;
		color: #000;
	}
	.viewer[open] {
		display: flex;
		flex-direction: column;
	}
	.viewer::backdrop {
		background: #ffffffed;
	}
	header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 12px 16px;
		gap: 12px;
		flex: none;
	}
	h2 {
		font-size: 0.9rem;
		font-weight: 700;
	}
	header button {
		width: 44px;
		height: 44px;
		border-radius: 50%;
		background: #f6f6f6;
		font-size: 24px;
	}
	.viewer-content {
		overflow: auto;
		padding: 0 16px 20px;
		min-height: 0;
	}
	nav {
		display: flex;
		justify-content: space-between;
		margin-top: 8px;
	}
	nav button {
		padding: 6px 12px;
		border: 1px solid #e4e4e4;
		border-radius: 999px;
		font-size: 0.85rem;
	}
</style>
