import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { SvelteKitPWA } from '@vite-pwa/sveltekit';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		sveltekit(),
		tailwindcss(),
		SvelteKitPWA({
			registerType: 'autoUpdate',
			manifest: {
				name: 'Musee Historique de Lausanne - Carte',
				short_name: 'MHL Carte',
				description: 'Carte interactive des images historiques de Lausanne',
				theme_color: '#000000',
				background_color: '#000000',
				display: 'standalone',
				scope: '/mhl-carte/',
				start_url: '/mhl-carte/',
				icons: [
					{
						src: 'favicon.svg',
						sizes: 'any',
						type: 'image/svg+xml',
						purpose: 'any'
					}
				]
			},
			workbox: {
				globPatterns: ['**/*.{js,css,html,json,svg,png}'],
				maximumFileSizeToCacheInBytes: 6 * 1024 * 1024
			}
		})
	]
});
