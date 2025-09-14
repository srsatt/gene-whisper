import { pipeline, env, type TextGenerationPipeline, type FeatureExtractionPipeline } from '@xenova/transformers'

export type ChatModelId =
  | 'google/medgemma-4b-it'
  | 'onnx-community/Qwen2.5-0.5B-Instruct'

export type EmbedModelId =
  | 'onnx-community/embeddinggemma-300m-ONNX'
  | 'Xenova/bge-small-en-v1.5'
  | 'google/embedding-gemma-2b'

export type RuntimeInfo = {
  backend: 'webgpu' | 'wasm'
}

// Optional: read HF token from localStorage for gated models
const hfToken = typeof localStorage !== 'undefined' ? localStorage.getItem('hf_token') ?? undefined : undefined
if (hfToken) (env as any).HF_TOKEN = hfToken

// Configure wasm paths to CDN to ensure correct MIME type
env.backends.onnx.wasm.wasmPaths = 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2/dist/'

// Allow local model loading (e.g. /public/models/...)
env.allowLocalModels = true

const resolveDevice = async (): Promise<RuntimeInfo> => {
  const hasWebGPU = typeof navigator !== 'undefined' && 'gpu' in navigator
  return { backend: hasWebGPU ? 'webgpu' : 'wasm' }
}

export const loadChat = async (preferred: ChatModelId = 'google/medgemma-4b-it') => {
  const { backend } = await resolveDevice()
  try {
    const chat = (await pipeline('text-generation', preferred)) as TextGenerationPipeline
    return { chat, modelId: preferred, backend }
  } catch {
    const fallback: ChatModelId = 'onnx-community/Qwen2.5-0.5B-Instruct'
    const chat = (await pipeline('text-generation', fallback)) as TextGenerationPipeline
    return { chat, modelId: fallback, backend }
  }
}

export const loadEmbedder = async (
  preferred: EmbedModelId = 'onnx-community/embeddinggemma-300m-ONNX',
) => {
  const { backend } = await resolveDevice()
  let modelId: EmbedModelId = preferred
  let extractor: FeatureExtractionPipeline
  try {
    extractor = (await pipeline('feature-extraction', preferred)) as FeatureExtractionPipeline
  } catch {
    modelId = 'Xenova/bge-small-en-v1.5'
    extractor = (await pipeline('feature-extraction', modelId)) as FeatureExtractionPipeline
  }
  const embed = async (texts: string[]): Promise<number[][]> => {
    const embeddings = await extractor(texts, { pooling: 'mean', normalize: true })
    const data = embeddings.tolist() as number[][]
    return data
  }
  return { embed, modelId, backend }
}


