import { test, expect } from '@playwright/test';
const image = (id, description = 'Lausanne, photographie historique.') => ({
	id,
	url: `https://images.example.test/${id}.png`,
	description
});
const archive = [
	{
		title: 0,
		latitude: 46.523,
		longitude: 6.632,
		years: [
			{ year: '1903', images: [image(1)] },
			{ year: '1956', images: [image(2)] },
			{ year: '1959', images: [image(3), image(4)] },
			{ year: 'Unknown', images: [image(6)] }
		]
	},
	{ title: 1, latitude: 46.528, longitude: 6.645, years: [{ year: '2000', images: [image(5)] }] }
];
const png = Buffer.from(
	'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=',
	'base64'
);
const style = {
	version: 8,
	glyphs: 'https://fonts.example.test/{fontstack}/{range}.pbf',
	sources: {},
	layers: [{ id: 'background', type: 'background', paint: { 'background-color': '#f5f5f5' } }]
};
async function setup(page, { dataFailure = false, mapFailure = false, imageFailure = false } = {}) {
	const failures = { data: dataFailure, map: mapFailure, image: imageFailure };
	await page.route('**/data.json', (r) => (failures.data ? r.abort() : r.fulfill({ json: archive })));
	await page.route('**/style.json', (r) => (failures.map ? r.abort() : r.fulfill({ json: style })));
	await page.route('https://images.example.test/**', (r) =>
		failures.image ? r.abort() : r.fulfill({ body: png, contentType: 'image/png' })
	);
	await page.goto('/mhl-carte/');
	return failures;
}
async function openFirst(page) {
	await page.getByRole('button', { name: 'Voir la liste', exact: true }).click();
	const result = page.locator('#archive-results li button').first();
	await result.focus();
	await page.keyboard.press('Enter');
	await expect(page.getByRole('dialog', { name: 'Photographies du lieu' })).toBeVisible();
	return result;
}
test('keyboard journey, topmost Escape, and focus restoration', async ({ page }) => {
	await setup(page);
	const result = await openFirst(page);
	await expect(page.getByRole('button', { name: 'Fermer les photographies', exact: true })).toBeFocused();
	await page.getByRole('button', { name: '1959 (2)', exact: true }).click();
	const photo = page.getByRole('button', { name: 'Agrandir l’image 1', exact: true });
	await photo.focus();
	await page.keyboard.press('Enter');
	const viewer = page.getByRole('dialog', { name: 'Image 1 sur 2', exact: true });
	await expect(viewer).toBeVisible();
	for (let i = 0; i < 9; i++) {
		await page.keyboard.press('Tab');
		expect(await viewer.evaluate((d) => d.contains(document.activeElement))).toBe(true);
	}
	await page.keyboard.press('Escape');
	await expect(viewer).not.toBeVisible();
	await expect(photo).toBeFocused();
	await expect(page.getByRole('button', { name: '1959 (2)', exact: true })).toHaveAttribute('aria-pressed', 'true');
	await page.keyboard.press('Escape');
	await expect(page.getByRole('dialog')).toHaveCount(0);
	await expect(result).toBeFocused();
});
test('valid year preserved; exact year and empty range supported', async ({ page }) => {
	await setup(page);
	await openFirst(page);
	await page.getByRole('button', { name: '1959 (2)', exact: true }).click();
	const start = page.getByRole('spinbutton', { name: 'Année de début' }),
		end = page.getByRole('spinbutton', { name: 'Année de fin' });
	await start.fill('1809');
	await start.press('Tab');
	await expect(page.getByRole('button', { name: '1959 (2)', exact: true })).toHaveAttribute('aria-pressed', 'true');
	await start.fill('1956');
	await start.press('Tab');
	await end.fill('1956');
	await end.press('Tab');
	await expect(page.getByRole('button', { name: '1956 (1)', exact: true })).toHaveAttribute('aria-pressed', 'true');
	await page.getByRole('button', { name: 'Fermer les photographies', exact: true }).click();
	await start.fill('1814');
	await start.press('Tab');
	await end.fill('1815');
	await end.press('Tab');
	await expect(page.getByText('Aucun document pour cette période.', { exact: false })).toBeVisible();
	await page.getByRole('button', { name: 'Réinitialiser les dates' }).click();
	await expect(start).toHaveValue('1808');
	await expect(end).toHaveValue('2009');
});
for (const viewport of [
	{ width: 320, height: 568 },
	{ width: 844, height: 390 }
])
	test(`sheet and viewer fit ${viewport.width}x${viewport.height}`, async ({ page }) => {
		await page.setViewportSize(viewport);
		await setup(page);
		await openFirst(page);
		const close = page.getByRole('button', { name: 'Fermer les photographies', exact: true });
		const rect = await close.boundingBox();
		expect(rect.y).toBeGreaterThanOrEqual(0);
		expect(rect.y + rect.height).toBeLessThanOrEqual(viewport.height);
		if (viewport.width < 768)
			for (let i = 0; i < 10; i++) {
				await page.keyboard.press('Tab');
				expect(
					await page
						.getByRole('dialog', { name: 'Photographies du lieu' })
						.evaluate((d) => d.contains(document.activeElement))
				).toBe(true);
			}
		await page.getByRole('button', { name: 'Agrandir l’image 1' }).click();
		const viewer = page.getByRole('dialog', { name: 'Image 1 sur 1' });
		await expect(viewer).toBeVisible();
		const b = await page.getByRole('button', { name: 'Fermer la visionneuse' }).boundingBox();
		expect(b.y).toBeGreaterThanOrEqual(0);
		expect(b.y + b.height).toBeLessThanOrEqual(viewport.height);
		expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
	});
test('archive failure retries without reloading page', async ({ page }) => {
	const f = await setup(page, { dataFailure: true });
	await expect(page.getByText('Archive indisponible.', { exact: false })).toBeVisible();
	f.data = false;
	await page.getByRole('button', { name: 'Réessayer l’archive' }).click();
	await expect(page.getByRole('button', { name: 'Voir la liste', exact: true })).toBeVisible();
});
test('basemap failure retains keyboard archive access and retry', async ({ page }) => {
	const f = await setup(page, { mapFailure: true });
	await expect(page.getByText('Carte indisponible.', { exact: false })).toBeVisible();
	await openFirst(page);
	await page.getByRole('button', { name: 'Fermer les photographies', exact: true }).click();
	f.map = false;
	await page.getByRole('button', { name: 'Réessayer la carte' }).click();
	await expect(page.getByText('Carte indisponible.', { exact: false })).not.toBeVisible();
	await expect(page.getByText('Chargement de la carte…')).not.toBeVisible();
});
test('failed image has stable fallback, source, and retry', async ({ page }) => {
	const f = await setup(page, { imageFailure: true });
	await openFirst(page);
	await expect(page.getByText('Image indisponible.', { exact: true })).toBeVisible();
	await expect(page.getByRole('link', { name: /Notice du musée/ })).toBeVisible();
	f.image = false;
	await page.getByRole('button', { name: 'Réessayer l’image' }).click();
	await expect(page.getByText('Image indisponible.', { exact: true })).not.toBeVisible();
	await expect(page.getByRole('button', { name: 'Agrandir l’image 1' }).locator('img')).toBeVisible();
});
