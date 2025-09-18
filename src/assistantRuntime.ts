import type { AIMessage, UserMessage } from '@assistant-ui/react'
import { generateWebLlm } from './weblm'

export async function runTurn(messages: (UserMessage | AIMessage)[]) {
  const lastUser = [...messages].reverse().find((m) => m.role === 'user') as UserMessage | undefined
  const prompt = typeof lastUser?.content === 'string' ? lastUser.content : ''
  const text = await generateWebLlm(prompt)
  return { role: 'assistant' as const, content: text }
}


