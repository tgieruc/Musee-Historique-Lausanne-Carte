import adapter from '@sveltejs/adapter-static';

export default {
	kit: {
		adapter: adapter({
			pages: 'build',
			assets: 'build',
			fallback: undefined,
			precompress: false
		}),
		paths: {
			base: '/mhl-carte',
			relative: false
		},
		prerender: {
			handleHttpError: ({ path }) => {
				// External links outside base path (e.g. "/" for parent site nav)
				if (!path.startsWith('/mhl-carte')) return;
				throw new Error(`404: ${path}`);
			}
		}
	}
};
