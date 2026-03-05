import { writable, derived } from 'svelte/store';

export const minYear = writable(1808);
export const maxYear = writable(2009);

// Shape: { title, latitude, longitude, years: [...] } or null
export const selectedLocation = writable(null);

export const drawerOpen = derived(selectedLocation, ($loc) => $loc !== null);
