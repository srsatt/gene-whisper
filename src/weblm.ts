// Minimal WebLLM wrapper for Phi-3.5-mini-instruct-q4f32_1-MLC-1k
import { CreateMLCEngine } from '@mlc-ai/web-llm'

let enginePromise: Promise<any> | null = null

export type WebLlmConfig = {
  // If you downloaded the model to public/models/..., set a local base URL like
  // '/models/Phi-3.5-mini-instruct-q4f32_1-MLC-1k/'. Otherwise we default to HF.
  modelBaseUrl?: string
}

const DEFAULT_REMOTE_BASE =
  'https://huggingface.co/mlc-ai/Phi-3.5-mini-instruct-q4f32_1-MLC-1k/resolve/main/'

export function getWebLlmEngine(config?: WebLlmConfig) {
  if (!enginePromise) {
    const model_url = (config?.modelBaseUrl ?? DEFAULT_REMOTE_BASE).replace(/\/$/, '/')
    enginePromise = (CreateMLCEngine({
      model_url,
      model_lib_url: model_url,
    } as any) as unknown) as Promise<any>
  }
  return enginePromise
}

export async function generateWebLlm(prompt: string, streamCb?: (chunk: string) => void): Promise<string> {
  const engine: any = await getWebLlmEngine()
  const messages = [
    { role: 'system', content: 'You are a helpful assistant.' },
    { role: 'user', content: prompt },
  ]
  let output = ''
  const result = await engine.chat.completions.create({
    messages,
    stream: true,
    temperature: 0.3,
    max_tokens: 512,
  })
  for await (const chunk of result) {
    const delta = chunk?.choices?.[0]?.delta?.content ?? ''
    if (delta) {
      output += delta
      streamCb?.(delta)
    }
  }
  return output
}


