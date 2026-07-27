import { getOrCreateDeviceKeyPair } from "@/shared/lib/crypto/keypair";

const sessionKeyCache = new Map<string, CryptoKey>();

/**
 * Derives (and caches) the AES-GCM session key shared with a peer via ECDH.
 * Both sides compute the same key locally from their own private key and the
 * other's public key — the key itself is never transmitted.
 */
export async function getSessionKey(
	peerId: string,
	peerPublicKey: CryptoKey,
): Promise<CryptoKey> {
	const cached = sessionKeyCache.get(peerId);
	if (cached) {
		return cached;
	}

	const { privateKey } = await getOrCreateDeviceKeyPair();

	const sessionKey = await crypto.subtle.deriveKey(
		{ name: "ECDH", public: peerPublicKey },
		privateKey,
		{ name: "AES-GCM", length: 256 },
		false,
		["encrypt", "decrypt"],
	);

	sessionKeyCache.set(peerId, sessionKey);
	return sessionKey;
}
