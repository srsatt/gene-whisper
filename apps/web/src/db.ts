import Dexie, { type Table } from "dexie";

export interface Document {
	id?: number;
	title: string;
	chunks: string[];
	vectors: number[][];
	createdAt: Date;
}

export interface Message {
	id?: number;
	role: "system" | "user" | "assistant";
	content: Array<{ type: string; text: string }>;
	createdAt: Date;
}

export interface KeyValue {
	key: string;
	value: unknown;
}

export class LocalChatDB extends Dexie {
	documents!: Table<Document>;
	messages!: Table<Message>;
	kv!: Table<KeyValue>;

	constructor() {
		super("LocalChatDB");
		this.version(1).stores({
			documents: "++id, title, createdAt",
			messages: "++id, createdAt",
			kv: "key",
		});
	}
}

export const db = new LocalChatDB();
