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
			{ year: '1959', images: [image(3, 'La Cathédrale de Lausanne, vue de la Cité.'), image(4)] },
			{ year: 'Unknown', images: [image(6)] }
		]
	},
	{
		title: 1,
		latitude: 46.56,
		longitude: 6.75,
		years: [{ year: '2000', images: [image(5, 'Vue de la cathédrale depuis les environs.')] }]
	}
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
	await expect(page.getByRole('searchbox')).toBeEnabled();
	await page.getByRole('searchbox').focus();
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
	await expect(page.getByRole('searchbox')).toBeEnabled();
	await page.getByRole('searchbox').focus();
	await expect(page.locator('#archive-results li button').first()).toBeVisible();
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

test('search ignores accents, finds offscreen places, respects dates, and opens matching year', async ({ page }) => {
	await setup(page);
	await expect(page.getByText('Voir la liste', { exact: true })).toHaveCount(0);
	await expect(page.locator('.summary')).toHaveCount(0);
	const search = page.getByRole('searchbox');
	await search.fill('CATHEDRALE');
	await expect(page.locator('#archive-results li')).toHaveCount(2);
	const end = page.getByRole('spinbutton', { name: 'Année de fin' });
	await end.fill('1959');
	await end.press('Tab');
	await expect(page.locator('#archive-results li')).toHaveCount(1);
	await search.focus();
	await search.press('ArrowDown');
	await page.keyboard.press('Enter');
	await expect(page.getByRole('button', { name: '1959 (2)', exact: true })).toHaveAttribute('aria-pressed', 'true');
	await page.getByRole('button', { name: 'Fermer les photographies', exact: true }).click();
	await end.fill('1956');
	await end.press('Tab');
	await expect(page.getByText('Aucun résultat dans les descriptions pour cette période.')).toBeVisible();
	await page.getByRole('button', { name: 'Chercher sur toutes les années' }).click();
	await expect(page.locator('#archive-results li')).toHaveCount(2);
	await search.fill('not-a-real-caption');
	await expect(page.locator('#archive-results li')).toHaveCount(0);
	await search.fill('');
	await search.press('Escape');
	await expect(page.locator('#archive-results')).toHaveCount(0);
});

test('cancel search clears the filter, closes results, and allows reopening', async ({ page }) => {
	await page.setViewportSize({ width: 320, height: 568 });
	await setup(page);
	const search = page.getByRole('searchbox');
	await search.fill('cathedrale');
	await expect(page.locator('#archive-results li')).toHaveCount(2);
	await page.getByRole('button', { name: 'Annuler la recherche' }).click();
	await expect(search).toHaveValue('');
	await expect(page.locator('#archive-results')).toHaveCount(0);
	await expect(search).toBeFocused();
	await search.click();
	await expect(page.locator('#archive-results')).toBeVisible();
	await search.fill('cathedrale');
	await search.press('Escape');
	await expect(search).toHaveValue('');
	await expect(page.locator('#archive-results')).toHaveCount(0);
	await search.press('ArrowDown');
	await expect(page.locator('#archive-results li button').first()).toBeFocused();
});

test('blank map click closes photos while dragging preserves selection', async ({ page }) => {
	await setup(page);
	await openFirst(page);
	const canvas = page.locator('.maplibregl-canvas');
	const box = await canvas.boundingBox();
	await page.mouse.move(box.x + 430, box.y + 300);
	await page.mouse.down();
	await page.mouse.move(box.x + 470, box.y + 340, { steps: 8 });
	await page.mouse.up();
	await expect(page.getByRole('dialog')).toHaveCount(1);
	await canvas.click({ position: { x: 450, y: 400 } });
	await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('viewer stays above drawer across responsive changes; Escape closes only viewer', async ({ page }) => {
	await setup(page);
	await openFirst(page);
	await page.getByRole('button', { name: 'Agrandir l’image 1' }).click();
	for (const width of [390, 1200, 390]) {
		await page.setViewportSize({ width, height: 844 });
		const close = page.getByRole('button', { name: 'Fermer la visionneuse' });
		await expect(close).toBeFocused();
		expect(
			await close.evaluate((el) => {
				const r = el.getBoundingClientRect();
				return el.contains(document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2));
			})
		).toBe(true);
	}
	await page.keyboard.press('Escape');
	await expect(page.getByRole('dialog')).toHaveCount(1);
	await expect(page.getByRole('button', { name: 'Agrandir l’image 1' })).toBeFocused();
	await page.keyboard.press('Escape');
	await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('closing a changed selection restores focus to latest result', async ({ page }) => {
	await setup(page);
	await page.getByRole('searchbox').fill('cathedrale');
	const results = page.locator('#archive-results li button');
	await results.nth(0).click();
	await results.nth(1).click();
	await page.getByRole('button', { name: 'Fermer les photographies' }).click();
	await expect(results.nth(1)).toBeFocused();
});

test('search scrolls to matching photo, including when same place and year stay selected', async ({ page }) => {
	await setup(page);
	await page.route('**/data.json', (r) =>
		r.fulfill({
			json: [
				{
					...archive[0],
					years: [{ year: '1959', images: [image(1, 'Alpha'), image(2, 'Beta'), image(3, 'Unique cible')] }]
				}
			]
		})
	);
	await page.reload();
	const search = page.getByRole('searchbox');
	await search.fill('Alpha');
	await page.locator('#archive-results li button').click();
	await search.fill('Unique cible');
	await page.locator('#archive-results li button').click();
	await expect.poll(() => page.locator('.content').evaluate((el) => el.scrollTop)).toBeGreaterThan(0);
	await expect(page.getByRole('button', { name: 'Agrandir l’image 3' })).toBeInViewport();
});

test('undated photos searchable without date filter; punctuation and empty recovery are honest', async ({ page }) => {
	await setup(page);
	await page.route('**/data.json', (r) =>
		r.fulfill({ json: [{ ...archive[0], years: [{ year: 'Unknown', images: [image(6, 'Zèbre')] }] }] })
	);
	await page.reload();
	const search = page.getByRole('searchbox');
	await search.fill('zebre');
	await page.locator('#archive-results li button').click();
	await expect(page.getByRole('button', { name: 'Date inconnue (1)' })).toHaveAttribute('aria-pressed', 'true');
	await page.getByRole('button', { name: 'Fermer les photographies' }).click();
	const start = page.getByRole('spinbutton', { name: 'Année de début' });
	await start.fill('1809');
	await start.press('Tab');
	await expect(page.locator('#archive-results li')).toHaveCount(0);
	await page.getByRole('button', { name: 'Chercher sur toutes les années' }).click();
	await expect(page.locator('#archive-results li')).toHaveCount(1);
	await search.fill('!!!');
	await expect(page.locator('#archive-results li')).toHaveCount(0);
	await expect(page.getByRole('button', { name: 'Chercher sur toutes les années' })).toHaveCount(0);
});

test('visible stalled image times out and retry keeps focus', async ({ page }) => {
	await setup(page);
	await page.route('https://images.example.test/**', () => {});
	await page.clock.install();
	await openFirst(page);
	await expect(page.getByText('Chargement de l’image…')).toBeVisible();
	await page.waitForTimeout(1000);
	await page.clock.fastForward(21000);
	const retry = page.getByRole('button', { name: 'Réessayer l’image' });
	await expect(retry).toBeVisible();
	await page.route('https://images.example.test/**', (r) => r.fulfill({ body: png, contentType: 'image/png' }));
	await retry.click();
	const photo = page.getByRole('button', { name: 'Agrandir l’image 1' });
	await expect(photo).toBeFocused();
	await expect(page.getByText('Chargement de l’image…')).toHaveCount(0);
});

test('photo links open exact image on fresh load and reload, without reopening after close', async ({ page }) => {
	await setup(page);
	await page.goto('/mhl-carte/?image=4');
	await expect(page.getByRole('dialog', { name: 'Image 2 sur 2', exact: true })).toBeVisible();
	await page.reload();
	await expect(page.getByRole('dialog', { name: 'Image 2 sur 2', exact: true })).toBeVisible();
	await page.keyboard.press('Escape');
	await expect(page.locator('dialog.viewer')).toHaveCount(0);
	await page.getByRole('button', { name: '1903 (1)', exact: true }).click();
	await page.getByRole('button', { name: '1959 (2)', exact: true }).click();
	await expect(page.locator('dialog.viewer')).toHaveCount(0);
});

test('copy shares only active image; clipboard denial offers selectable link', async ({ page, context }) => {
	await context.grantPermissions(['clipboard-read', 'clipboard-write']);
	await setup(page);
	await page.goto('/mhl-carte/?image=3');
	const viewer = page.locator('dialog.viewer');
	await viewer.getByRole('button', { name: 'Suivante' }).click();
	await viewer.getByRole('button', { name: 'Copier le lien' }).click();
	const link = await page.evaluate(() => navigator.clipboard.readText());
	expect(link).toBe('http://127.0.0.1:4178/mhl-carte/?image=4');
	await expect(viewer.getByText('Lien copié', { exact: true })).toBeVisible();
	await page.evaluate(() => {
		navigator.clipboard.writeText = async () => {
			throw new Error('Denied');
		};
	});
	await viewer.getByRole('button', { name: 'Copier le lien' }).click();
	await expect(viewer.getByRole('textbox', { name: 'Lien de la photo' })).toHaveValue(link);
	await expect(viewer.getByRole('textbox', { name: 'Lien de la photo' })).toBeFocused();
});

test('shared photo survives archive retry, works without basemap, and handles unknown IDs', async ({ page }) => {
	const failures = await setup(page, { dataFailure: true, mapFailure: true });
	await page.goto('/mhl-carte/?image=6');
	await expect(page.getByRole('button', { name: 'Réessayer l’archive' })).toBeVisible();
	failures.data = false;
	await page.getByRole('button', { name: 'Réessayer l’archive' }).click();
	await expect(page.getByRole('dialog', { name: 'Image 1 sur 1', exact: true })).toBeVisible();
	await page.keyboard.press('Escape');
	await expect(page.getByRole('button', { name: 'Date inconnue (1)' })).toHaveAttribute('aria-pressed', 'true');
	await page.goto('/mhl-carte/?image=does-not-exist');
	await expect(page.getByText('Cette photo est introuvable.', { exact: false })).toBeVisible();
	await expect(page.getByRole('searchbox')).toBeEnabled();
	await expect(page.locator('dialog')).toHaveCount(0);
});
