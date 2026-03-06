<script>
	import { fade } from 'svelte/transition';

	let { images, year } = $props();

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
	{#each images as image, i}
		<button
			class="group w-full overflow-hidden bg-terminal-bg-light border border-terminal-border hover:border-accent-gold/50 transition-all duration-200 cursor-pointer text-left"
			style="animation: cardFadeIn 0.3s ease-out {i * 60}ms both;"
			onclick={() => openLightbox(i)}
		>
			<div class="w-full overflow-hidden bg-terminal-bg relative">
				<img
					src={fixUrl(image.url)}
					alt={image.description || `Image ${i + 1}`}
					loading="lazy"
					class="w-full h-auto object-contain transition-transform duration-500 group-hover:scale-[1.02]"
				/>
			</div>
			{#if image.description}
				<div class="px-3 py-2.5 border-t border-terminal-border">
					<p class="font-mono text-xs text-text-dim line-clamp-2 leading-relaxed">
						{image.description}
					</p>
				</div>
			{/if}
		</button>
	{/each}
</div>

<!-- Lightbox -->
{#if lightboxIndex !== null}
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="fixed inset-0 z-50 flex items-center justify-center p-4" transition:fade={{ duration: 150 }}>
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div class="absolute inset-0 bg-black/90 backdrop-blur-sm" onclick={closeLightbox}></div>

		<div class="relative z-10 flex flex-col items-center w-full max-w-4xl">
			<!-- Top bar: counter + close -->
			<div class="w-full flex items-center justify-between mb-3 px-1">
				{#if images.length > 1}
					<span class="font-mono text-xs text-text-dim tabular-nums">{lightboxIndex + 1} / {images.length}</span>
				{:else}
					<span></span>
				{/if}
				<button
					class="w-8 h-8 flex items-center justify-center text-text-dim hover:text-accent-cyan transition-colors cursor-pointer"
					onclick={closeLightbox}
					aria-label="Fermer"
				>
					<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
			</div>

			<!-- Image -->
			<div class="relative w-full flex items-center justify-center">
				{#if images.length > 1}
					<button
						class="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 flex items-center justify-center text-text-dim hover:text-accent-cyan border border-terminal-border hover:border-accent-cyan/50 bg-terminal-bg/80 transition-all cursor-pointer -ml-2"
						onclick={prevImage}
						aria-label="Image precedente"
					>
						<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
							<path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
						</svg>
					</button>
				{/if}

				<img
					src={fixUrl(images[lightboxIndex].url)}
					alt={images[lightboxIndex].description || ''}
					class="max-w-full max-h-[70vh] object-contain border border-terminal-border"
				/>

				{#if images.length > 1}
					<button
						class="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 flex items-center justify-center text-text-dim hover:text-accent-cyan border border-terminal-border hover:border-accent-cyan/50 bg-terminal-bg/80 transition-all cursor-pointer -mr-2"
						onclick={nextImage}
						aria-label="Image suivante"
					>
						<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
							<path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
						</svg>
					</button>
				{/if}
			</div>

			<!-- Description -->
			<div class="mt-3 text-center max-w-xl px-2">
				<p class="font-mono text-text-gold/70 text-xs md:text-sm leading-relaxed">
					{images[lightboxIndex].description || ''}
				</p>
				<a
					href="https://museris.lausanne.ch/SGCM/Consultation.aspx?id={images[lightboxIndex].id}&Source=search_result.aspx"
					target="_blank"
					rel="noopener noreferrer"
					class="inline-block mt-2 text-accent-cyan hover:text-accent-cyan-hover text-xs font-mono underline underline-offset-4 decoration-accent-cyan/40 transition-colors"
				>
					Plus d'informations →
				</a>
			</div>
		</div>
	</div>
{/if}

<style>
	@keyframes cardFadeIn {
		from {
			opacity: 0;
			transform: translateY(8px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
</style>
