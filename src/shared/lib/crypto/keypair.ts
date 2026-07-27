import { type IDBPDatabase, openDB } from "idb";
import {
	arrayBufferToBase64,
	base64ToArrayBuffer,
} from "@/shared/lib/crypto/encoding";

const DB_NAME = "peerchat-keys";
const DB_VERSION = 1;
const STORE_NAME = "device-keypair";
const RECORD_ID = "self";

const ECDH_PARAMS = { name: "ECDH", namedCurve: "P-256" } as const;

export type DeviceKeyPair = {
	publicKey: CryptoKey;
	privateKey: CryptoKey;
};

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDb(): Promise<IDBPDatabase> {
	if (!dbPromise) {
		dbPromise = openDB(DB_NAME, DB_VERSION, {
			upgrade(db) {
				db.createObjectStore(STORE_NAME);
			},
		});
	}
	return dbPromise;
}

/**
 * Loads the device's ECDH keypair from IndexedDB, generating one on first
 * use. The private key never leaves the device and is never sent over the
 * network — only the exported public key is shared with peers.
 */
export async function getOrCreateDeviceKeyPair(): Promise<DeviceKeyPair> {
	const db = await getDb();
	const existing = (await db.get(STORE_NAME, RECORD_ID)) as
		| DeviceKeyPair
		| undefined;

	if (existing) {
		return existing;
	}

	const keyPair = (await crypto.subtle.generateKey(ECDH_PARAMS, true, [
		"deriveKey",
		"deriveBits",
	])) as CryptoKeyPair;

	const record: DeviceKeyPair = {
		publicKey: keyPair.publicKey,
		privateKey: keyPair.privateKey,
	};

	await db.put(STORE_NAME, record, RECORD_ID);
	return record;
}

export async function exportPublicKeyBase64(
	publicKey: CryptoKey,
): Promise<string> {
	const raw = await crypto.subtle.exportKey("raw", publicKey);
	return arrayBufferToBase64(raw);
}

export function importPeerPublicKey(base64: string): Promise<CryptoKey> {
	const raw = base64ToArrayBuffer(base64);
	return crypto.subtle.importKey("raw", raw, ECDH_PARAMS, true, []);
}
