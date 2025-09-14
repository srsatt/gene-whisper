import Dexie, { type Table } from 'dexie'

export type DocumentRecord = {
  id: string
  title: string
  chunks: string[]
  vectors: number[][]
  createdAt: number
}

export type MessageRecord = {
  id: string
  role: 'system' | 'user' | 'assistant'
  content: string
  createdAt: number
}

export type KvRecord = {
  key: string
  value: unknown
}

class AppDatabase extends Dexie {
  documents!: Table<DocumentRecord, string>
  messages!: Table<MessageRecord, string>
  kv!: Table<KvRecord, string>

  constructor() {
    super('generic-llm-rag-db')
    this.version(1).stores({
      documents: 'id, title, createdAt',
      messages: 'id, role, createdAt',
      kv: 'key',
    })
  }
}

export const db = new AppDatabase()


