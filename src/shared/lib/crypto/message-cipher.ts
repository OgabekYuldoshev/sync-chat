import {
	arrayBufferToBase64,
	base64ToArrayBuffer,
} from "@/shared/lib/crypto/encoding";
import type { EncryptedEnvelope } from "@/shared/lib/ws/signaling-protocol";

const IV_LENGTH_BYTES = 12;

export async function encryptPayload(
	sessionKey: CryptoKey,
	payload: unknown,
): Promise<EncryptedEnvelope> {
	const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH_BYTES));
	const plaintext = new TextEncoder().encode(JSON.stringify(payload));

	const ciphertextBuffer = await crypto.subtle.encrypt(
		{ name: "AES-GCM", iv },
		sessionKey,
		plaintext,
	);

	return {
		iv: arrayBufferToBase64(iv.buffer),
		ciphertext: arrayBufferToBase64(ciphertextBuffer),
	};
}

export async function decryptPayload<T>(
	sessionKey: CryptoKey,
	envelope: EncryptedEnvelope,
): Promise<T> {
	const iv = new Uint8Array(base64ToArrayBuffer(envelope.iv));
	const ciphertext = base64ToArrayBuffer(envelope.ciphertext);

	const plaintextBuffer = await crypto.subtle.decrypt(
		{ name: "AES-GCM", iv },
		sessionKey,
		ciphertext,
	);

	return JSON.parse(new TextDecoder().decode(plaintextBuffer)) as T;
}
