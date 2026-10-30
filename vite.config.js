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
				theme_color: '#ffffff',
				background_color: '#ffffff',
				display: 'standalone',
				scope: '/mhl-carte/',
				start_url: '/mhl-carte/',
				icons: [
					{
						src: 'icon-192.png',
						sizes: '192x192',
						type: 'image/png',
						purpose: 'any'
					},
					{ src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' }
				]
			},
			workbox: {
				globPatterns: ['**/*.{js,mjs,css,html,json,svg,png,ttf}'],
				maximumFileSizeToCacheInBytes: 6 * 1024 * 1024
			}
		})
	]
});
