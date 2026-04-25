<script>
	import '../app.css';
	import { onMount } from 'svelte';

	let { children } = $props();

	onMount(() => {
		function handle(e) {
			if (e.key === 'theme' && (e.newValue === 'light' || e.newValue === 'dark')) {
				document.documentElement.dataset.theme = e.newValue;
			}
		}
		window.addEventListener('storage', handle);
		return () => window.removeEventListener('storage', handle);
	});
</script>

{@render children()}
