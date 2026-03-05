<script>
	import { fade, fly } from 'svelte/transition';

	let { images, year } = $props();

	let lightboxIndex = $state(null);

	function openLightbox(index) {
		lightboxIndex = index;
	}

	function closeLightbox() {
		lightboxIndex = null;
	}

	function prevImage() {
		if (lightboxIndex > 0) {
			lightboxIndex--;
		} else {
			lightboxIndex = images.length - 1;
		}
	}

	function nextImage() {
		if (lightboxIndex < images.length - 1) {
			lightboxIndex++;
		} else {
			lightboxIndex = 0;
		}
	}

	function handleKeydown(e) {
		if (lightboxIndex === null) return;
		if (e.key === 'Escape') closeLightbox();
		if (e.key === 'ArrowLeft') prevImage();
		if (e.key === 'ArrowRight') nextImage();
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="py-2">
	<div
		class="flex gap-4 overflow-x-auto pb-3 scroll-snap-x"
		style="scroll-snap-type: x mandatory; -webkit-overflow-scrolling: touch;"
	>
		{#each images as image, i}
			<button
				class="flex-shrink-0 w-[200px] md:w-[250px] rounded-lg overflow-hidden bg-parchment-dark/60 shadow-sm hover:shadow-md transition-shadow duration-200 cursor-pointer text-left border border-sepia-light/20"
				style="scroll-snap-align: start; animation: cardFadeIn 0.4s ease-out {i * 100}ms both;"
				onclick={() => openLightbox(i)}
			>
				<div class="w-full aspect-[4/3] overflow-hidden bg-parchment-dark">
					<img
						src={image.url}
						alt={image.description || `Image ${i + 1}`}
						loading="lazy"
						class="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
					/>
				</div>
				<div class="p-3">
					<p class="font-body text-sm text-ink/80 line-clamp-2 leading-snug">
						{image.description || 'Sans description'}
					</p>
				</div>
			</button>
		{/each}
	</div>
</div>

{#if lightboxIndex !== null}
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="fixed inset-0 z-50 flex items-center justify-center"
		transition:fade={{ duration: 200 }}
		onkeydown={handleKeydown}
	>
		<!-- Backdrop -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			class="absolute inset-0 bg-black/85"
			onclick={closeLightbox}
		></div>

		<!-- Content -->
		<div class="relative z-10 flex flex-col items-center max-w-[90vw] max-h-[90vh] px-4">
			<!-- Close button -->
			<button
				class="absolute -top-2 -right-2 md:top-0 md:right-0 w-10 h-10 flex items-center justify-center text-parchment/80 hover:text-parchment transition-colors text-2xl z-20 cursor-pointer"
				onclick={closeLightbox}
				aria-label="Fermer"
			>
				&times;
			</button>

			<!-- Image counter -->
			{#if images.length > 1}
				<p class="font-body text-sm text-sepia-light mb-2 tabular-nums">
					{lightboxIndex + 1} / {images.length}
				</p>
			{/if}

			<!-- Image -->
			<img
				src={images[lightboxIndex].url}
				alt={images[lightboxIndex].description || ''}
				class="max-w-[90vw] max-h-[70vh] object-contain rounded shadow-2xl"
			/>

			<!-- Description -->
			<div class="mt-4 text-center max-w-2xl">
				<p class="font-body text-parchment/90 text-sm md:text-base leading-relaxed">
					{images[lightboxIndex].description || 'Sans description'}
				</p>
				<a
					href="https://museris.lausanne.ch/SGCM/Consultation.aspx?id={images[lightboxIndex].id}&Source=search_result.aspx"
					target="_blank"
					rel="noopener noreferrer"
					class="inline-block mt-3 text-gold hover:text-gold/80 text-sm font-body underline underline-offset-4 transition-colors"
				>
					Plus d'informations
				</a>
			</div>

			<!-- Navigation arrows -->
			{#if images.length > 1}
				<button
					class="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 md:-translate-x-6 w-10 h-10 flex items-center justify-center text-parchment/70 hover:text-parchment bg-black/30 hover:bg-black/50 rounded-full transition-all cursor-pointer"
					onclick={prevImage}
					aria-label="Image precedente"
				>
					<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
					</svg>
				</button>
				<button
					class="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 md:translate-x-6 w-10 h-10 flex items-center justify-center text-parchment/70 hover:text-parchment bg-black/30 hover:bg-black/50 rounded-full transition-all cursor-pointer"
					onclick={nextImage}
					aria-label="Image suivante"
				>
					<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
					</svg>
				</button>
			{/if}
		</div>
	</div>
{/if}

<style>
	@keyframes cardFadeIn {
		from {
			opacity: 0;
			transform: translateY(12px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
</style>
