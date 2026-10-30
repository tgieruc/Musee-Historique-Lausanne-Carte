export function matchingLocations(data, min, max) {
	return data.flatMap((location, index) => {
		const years = location.years.filter((y) => +y.year >= min && +y.year <= max);
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
