export function yearMatches(year, min, max) {
	return (+year >= min && +year <= max) || (year === 'Unknown' && min === 1808 && max === 2009);
}
export const yearLabel = (year) => (year === 'Unknown' ? 'Date inconnue' : year);
export function yearsLabel(years) {
	const dated = years
		.filter((y) => y.year !== 'Unknown')
		.map((y) => +y.year)
		.sort((a, b) => a - b);
	const label = dated.length ? (dated[0] === dated.at(-1) ? `${dated[0]}` : `${dated[0]}–${dated.at(-1)}`) : '';
	return [label, years.some((y) => y.year === 'Unknown') ? 'Date inconnue' : ''].filter(Boolean).join(' · ');
}
export function matchingLocations(data, min, max) {
	return data.flatMap((location, index) => {
		const years = location.years.filter((y) => yearMatches(y.year, min, max));
		return years.length ? [{ location, index, years, count: years.reduce((n, y) => n + y.images.length, 0) }] : [];
	});
}
export function featureCollection(results) {
	return {
		type: 'FeatureCollection',
		features: results.map(({ location, index }) => ({
			type: 'Feature',
			geometry: { type: 'Point', coordinates: [location.longitude, location.latitude] },
			properties: { index }
		}))
	};
}
export function locationLabel(location) {
	const caption = location.years.flatMap((y) => y.images).find((image) => image.description)?.description;
	return caption
		? caption.slice(0, 100) + (caption.length > 100 ? '…' : '')
		: `Lieu ${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`;
}

function normalize(text) {
	return text
		.normalize('NFD')
		.replace(/\p{Diacritic}/gu, '')
		.toLowerCase()
		.replace(/[^\p{L}\p{N}]+/gu, ' ')
		.trim();
}
const captions = new WeakMap();
export function searchLocations(results, query) {
	const phrase = normalize(query);
	if (!phrase) return query.trim() ? [] : results;
	const words = phrase.split(/\s+/);
	return results
		.flatMap((result) => {
			let best = null;
			for (const year of result.years)
				for (const image of year.images) {
					if (!image.description) continue;
					let text = captions.get(image);
					if (text === undefined) {
						text = normalize(image.description);
						captions.set(image, text);
					}
					if (!words.every((word) => text.includes(word))) continue;
					const position = text.indexOf(phrase);
					const score = position < 0 ? 1 : position < 80 ? 3 : 2;
					const offset = Math.max(0, (position < 0 ? text.indexOf(words[0]) : position) - 35);
					const excerpt =
						(offset ? '…' : '') +
						image.description.slice(offset, offset + 190) +
						(offset + 190 < image.description.length ? '…' : '');
					if (!best || score > best.score)
						best = { ...result, caption: excerpt, matchYear: year.year, matchImage: image.id, score };
				}
			return best ? [best] : [];
		})
		.sort((a, b) => b.score - a.score || a.index - b.index);
}
