export function formatDistance(meters: number | null): string {
	if (meters === null) {
		return "Distance unknown";
	}
	if (meters < 1000) {
		return `${Math.round(meters)} m away`;
	}
	return `${(meters / 1000).toFixed(1)} km away`;
}
