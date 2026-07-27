const ADJECTIVES = [
	"Swift",
	"Calm",
	"Bright",
	"Quiet",
	"Bold",
	"Gentle",
	"Quick",
	"Sunny",
] as const;

const ANIMALS = [
	"Fox",
	"Otter",
	"Falcon",
	"Panda",
	"Wolf",
	"Heron",
	"Lynx",
	"Sparrow",
] as const;

function hashToIndex(value: string, base: number): number {
	let hash = 0;
	for (const char of value) {
		hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
	}
	return hash % base;
}

export function generateGuestName(deviceId: string): string {
	const adjective = ADJECTIVES[hashToIndex(deviceId, ADJECTIVES.length)];
	const animal = ANIMALS[hashToIndex(`${deviceId}-animal`, ANIMALS.length)];
	return `${adjective} ${animal}`;
}
