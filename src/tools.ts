import { addDocument as addDocImpl, ragSearch as ragImpl } from './rag'
import { generateWebLlm } from './weblm'

export const addDocument = async ({ title, text }: { title: string; text: string }) => {
  return addDocImpl(title, text)
}

export const ragSearch = async ({ query }: { query: string }) => {
  const results = await ragImpl(query)
  return results
}

export const summarize = async ({ text }: { text: string }) => {
  const prompt = `Summarize the following text in 3-5 bullet points.\n\n${text}`
  const out = await generateWebLlm(prompt)
  return out
}


