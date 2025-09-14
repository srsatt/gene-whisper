import { db, type DocumentRecord } from './db'
import { loadEmbedder } from './models'

export const chunkText = (text: string, chunkSize = 1200, overlap = 200): string[] => {
  const chunks: string[] = []
  let i = 0
  while (i < text.length) {
    const end = Math.min(i + chunkSize, text.length)
    const slice = text.slice(i, end)
    chunks.push(slice)
    if (end === text.length) break
    i = end - overlap
    if (i < 0) i = 0
  }
  return chunks
}

export const addDocument = async (title: string, text: string) => {
  const id = crypto.randomUUID()
  const chunks = chunkText(text)
  const { embed } = await loadEmbedder()
  const vectors = await embed(chunks)
  const doc: DocumentRecord = {
    id,
    title,
    chunks,
    vectors,
    createdAt: Date.now(),
  }
  await db.documents.put(doc)
  return { id, title, chunks: chunks.length, dims: vectors[0]?.length ?? 0 }
}

const cosineSim = (a: number[], b: number[]): number => {
  let dot = 0
  let na = 0
  let nb = 0
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]
    na += a[i] * a[i]
    nb += b[i] * b[i]
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb)
  return denom === 0 ? 0 : dot / denom
}

export const ragSearch = async (query: string, k = 6) => {
  const { embed } = await loadEmbedder()
  const [q] = await embed([query])
  const docs = await db.documents.toArray()
  const scored: Array<{ score: number; text: string; docId: string; title: string }> = []
  for (const d of docs) {
    for (let i = 0; i < d.vectors.length; i++) {
      const score = cosineSim(q, d.vectors[i]!)
      scored.push({ score, text: d.chunks[i]!, docId: d.id, title: d.title })
    }
  }
  scored.sort((x, y) => y.score - x.score)
  return scored.slice(0, k)
}


