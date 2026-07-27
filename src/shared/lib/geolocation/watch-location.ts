export type GeoPoint = {
	lat: number;
	lng: number;
};

const WATCH_OPTIONS: PositionOptions = {
	enableHighAccuracy: false,
	maximumAge: 60_000,
	timeout: 10_000,
};

/**
 * Watches the browser's geolocation and reports updates. No-ops (and never
 * calls `onUpdate`) if the user denies the permission or the browser lacks
 * geolocation support — callers should keep working with `distanceMeters`
 * simply staying `null` in that case.
 */
export function watchLocation(onUpdate: (point: GeoPoint) => void): () => void {
	if (!("geolocation" in navigator)) {
		return () => {};
	}

	const watchId = navigator.geolocation.watchPosition(
		(position) => {
			onUpdate({
				lat: position.coords.latitude,
				lng: position.coords.longitude,
			});
		},
		() => {
			// Permission denied or unavailable — presence-only nearby still works.
		},
		WATCH_OPTIONS,
	);

	return () => navigator.geolocation.clearWatch(watchId);
}
