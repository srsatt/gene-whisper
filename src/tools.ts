import { addDocument as addDocImpl, ragSearch as ragImpl } from './rag'
import { loadChat } from './models'

export const addDocument = async ({ title, text }: { title: string; text: string }) => {
  return addDocImpl(title, text)
}

export const ragSearch = async ({ query }: { query: string }) => {
  const results = await ragImpl(query)
  return results
}

export const summarize = async ({ text }: { text: string }) => {
  const { chat } = await loadChat()
  const prompt = `Summarize the following text in 3-5 bullet points.\n\n${text}`
  const out = await chat(prompt, { max_new_tokens: 256, temperature: 0.3 })
  return String(out)
}


