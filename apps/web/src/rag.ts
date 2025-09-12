import { type Document, db } from "./db";
import { getEmbeddingPipeline } from "./models";

const CHUNK_SIZE = 1200;
const CHUNK_OVERLAP = 200;

export function chunkText(text: string): string[] {
	const chunks: string[] = [];
	for (let i = 0; i < text.length; i += CHUNK_SIZE - CHUNK_OVERLAP) {
		chunks.push(text.substring(i, i + CHUNK_SIZE));
	}
	return chunks;
}

export async function embed(texts: string[]): Promise<number[][]> {
	const embedder = await getEmbeddingPipeline();
	if (!embedder) return [];
	const result = await (embedder as any)._call(texts);
	return result.map((d: Float32Array) => Array.from(d));
}

function cosineSimilarity(vecA: number[], vecB: number[]): number {
	let dotProduct = 0;
	let normA = 0;
	let normB = 0;
	for (let i = 0; i < vecA.length; i++) {
		dotProduct += vecA[i] * vecB[i];
		normA += vecA[i] * vecA[i];
		normB += vecB[i] * vecB[i];
	}
	return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

export async function search(
	query: string,
	k = 5,
): Promise<{ document: Document; chunk: string; score: number }[]> {
	const queryVector = (await embed([query]))[0];
	const documents = await db.documents.toArray();
	const results: { document: Document; chunk: string; score: number }[] = [];

	for (const doc of documents) {
		for (let i = 0; i < doc.chunks.length; i++) {
			const chunk = doc.chunks[i];
			const vector = doc.vectors[i];
			const score = cosineSimilarity(queryVector, vector);
			results.push({ document: doc, chunk, score });
		}
	}

	return results.sort((a, b) => b.score - a.score).slice(0, k);
}
