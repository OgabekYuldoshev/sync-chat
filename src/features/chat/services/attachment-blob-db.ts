import { type IDBPDatabase, openDB } from "idb";

const DB_NAME = "peerchat-attachment-blobs";
const DB_VERSION = 1;
const STORE_NAME = "blobs";

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

/** Large attachments are stored as real Blobs (not base64) to avoid the ~33% size inflation and memory bloat of embedding them in message JSON. */
export async function saveAttachmentBlob(
	blobId: string,
	blob: Blob,
): Promise<void> {
	const db = await getDb();
	await db.put(STORE_NAME, blob, blobId);
}

export async function getAttachmentBlob(
	blobId: string,
): Promise<Blob | undefined> {
	const db = await getDb();
	return db.get(STORE_NAME, blobId);
}
