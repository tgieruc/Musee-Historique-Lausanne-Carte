import { defineConfig } from '@playwright/test';
export default defineConfig({
	testDir: './tests',
	fullyParallel: true,
	workers: 2,
	use: { baseURL: 'http://127.0.0.1:4178', channel: 'chrome', serviceWorkers: 'block', trace: 'retain-on-failure' },
	webServer: {
		command: 'npm run dev -- --host 127.0.0.1 --port 4178',
		url: 'http://127.0.0.1:4178/mhl-carte/',
		reuseExistingServer: !process.env.CI
	}
});
