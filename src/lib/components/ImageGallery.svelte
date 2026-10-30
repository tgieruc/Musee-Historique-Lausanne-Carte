<script>
	import { fade } from 'svelte/transition';

	let { images } = $props();

	let lightboxIndex = $state(null);

	function fixUrl(url) {
		if (url && url.startsWith('http://')) {
			return url.replace('http://', 'https://');
		}
		return url;
	}

	function openLightbox(index) {
		lightboxIndex = index;
	}

	function closeLightbox() {
		lightboxIndex = null;
	}

	function prevImage() {
		lightboxIndex = lightboxIndex > 0 ? lightboxIndex - 1 : images.length - 1;
	}

	function nextImage() {
		lightboxIndex = lightboxIndex < images.length - 1 ? lightboxIndex + 1 : 0;
	}

	function handleKeydown(e) {
		if (lightboxIndex === null) return;
		if (e.key === 'Escape') closeLightbox();
		if (e.key === 'ArrowLeft') prevImage();
		if (e.key === 'ArrowRight') nextImage();
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="flex flex-col gap-3">
	{#each images as image, i (image.id)}
		<button
			class="group rounded-2xl w-full overflow-hidden bg-surface-soft border border-line hover:border-ink/50 transition-all duration-200 cursor-pointer text-left"
			onclick={() => openLightbox(i)}
		>
			<div class="w-full overflow-hidden bg-surface relative">
				<img
					src={fixUrl(image.url)}
					alt={image.description || `Image ${i + 1}`}
					loading="lazy"
					class="w-full h-auto object-contain transition-transform duration-500"
				/>
			</div>
			{#if image.description}
				<div class="px-3 py-2.5 border-t border-line">
					<p class="font-sans text-xs text-muted line-clamp-2 leading-relaxed">
						{image.description}
					</p>
				</div>
			{/if}
		</button>
	{/each}
</div>

<!-- Lightbox -->
{#if lightboxIndex !== null}
	<div class="fixed inset-0 z-50 flex items-center justify-center p-4" transition:fade={{ duration: 150 }}>
		<button
			type="button"
			aria-label="Fermer la visionneuse"
			class="absolute inset-0 bg-white/95 backdrop-blur-sm"
			onclick={closeLightbox}
		></button>

		<div class="relative z-10 flex flex-col items-center w-full max-w-4xl">
			<!-- Top bar: counter + close -->
			<div class="w-full flex items-center justify-between mb-3 px-1">
				{#if images.length > 1}
					<span class="font-sans text-xs text-muted tabular-nums">{lightboxIndex + 1} / {images.length}</span>
				{:else}
					<span></span>
				{/if}
				<button
					class="w-10 h-10 rounded-full bg-surface-soft flex items-center justify-center text-muted hover:text-ink transition-colors cursor-pointer"
					onclick={closeLightbox}
					aria-label="Fermer"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="w-5 h-5"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						stroke-width="2"
					>
						<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
			</div>

			<!-- Image -->
			<div class="relative w-full flex items-center justify-center">
				{#if images.length > 1}
					<button
						class="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full flex items-center justify-center text-muted hover:text-ink border border-line hover:border-ink/50 bg-surface/80 transition-all cursor-pointer -ml-2"
						onclick={prevImage}
						aria-label="Image precedente"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="w-5 h-5"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							stroke-width="2"
						>
							<path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
						</svg>
					</button>
				{/if}

				<img
					src={fixUrl(images[lightboxIndex].url)}
					alt={images[lightboxIndex].description || ''}
					class="max-w-full max-h-[70vh] object-contain border border-line"
				/>

				{#if images.length > 1}
					<button
						class="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full flex items-center justify-center text-muted hover:text-ink border border-line hover:border-ink/50 bg-surface/80 transition-all cursor-pointer -mr-2"
						onclick={nextImage}
						aria-label="Image suivante"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="w-5 h-5"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							stroke-width="2"
						>
							<path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
						</svg>
					</button>
				{/if}
			</div>

			<!-- Description -->
			<div class="mt-3 text-center max-w-xl px-2">
				<p class="font-sans text-muted text-xs md:text-sm leading-relaxed">
					{images[lightboxIndex].description || ''}
				</p>
				<a
					href="https://museris.lausanne.ch/SGCM/Consultation.aspx?id={images[lightboxIndex]
						.id}&Source=search_result.aspx"
					target="_blank"
					rel="noopener noreferrer"
					class="inline-block mt-2 text-ink hover:text-ink text-xs font-sans underline underline-offset-4 decoration-ink/40 transition-colors"
				>
					Plus d'informations →
				</a>
			</div>
		</div>
	</div>
{/if}
