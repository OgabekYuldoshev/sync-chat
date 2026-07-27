import { type IDBPDatabase, openDB } from "idb";
import type { Message } from "@/features/chat/types/message";

const DB_NAME = "peerchat-messages";
const DB_VERSION = 1;
const STORE_NAME = "messages";
const PEER_INDEX = "peerId";

type StoredMessage = Message & { peerId: string };

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDb(): Promise<IDBPDatabase> {
	if (!dbPromise) {
		dbPromise = openDB(DB_NAME, DB_VERSION, {
			upgrade(db) {
				const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
				store.createIndex(PEER_INDEX, "peerId");
			},
		});
	}
	return dbPromise;
}

export async function saveMessage(
	peerId: string,
	message: Message,
): Promise<void> {
	const db = await getDb();
	const record: StoredMessage = { ...message, peerId };
	await db.put(STORE_NAME, record);
}

export async function getMessagesForPeer(peerId: string): Promise<Message[]> {
	const db = await getDb();
	const records = (await db.getAllFromIndex(
		STORE_NAME,
		PEER_INDEX,
		peerId,
	)) as StoredMessage[];

	return records
		.sort((a, b) => a.createdAt.localeCompare(b.createdAt))
		.map((record) => {
			const { peerId: _peerId, ...message } = record;
			return message;
		});
}
