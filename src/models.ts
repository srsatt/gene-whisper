import { pipeline, env, type TextGenerationPipeline, type FeatureExtractionPipeline } from '@xenova/transformers'

export type ChatModelId =
  | 'google/medgemma-4b-it'
  | 'onnx-community/Qwen2.5-0.5B-Instruct'

export type EmbedModelId = 'google/embedding-gemma-2b' | 'Xenova/bge-small-en-v1.5'

export type RuntimeInfo = {
  backend: 'webgpu' | 'wasm'
}

env.allowLocalModels = false
env.backends.onnx.wasm.wasmPaths = undefined

const resolveDevice = async (): Promise<RuntimeInfo> => {
  // Try WebGPU; fallback to WASM
  const hasWebGPU = typeof navigator !== 'undefined' && 'gpu' in navigator
  return { backend: hasWebGPU ? 'webgpu' : 'wasm' }
}

export const loadChat = async (preferred: ChatModelId = 'google/medgemma-4b-it') => {
  const { backend } = await resolveDevice()
  try {
    const chat = (await pipeline('text-generation', preferred, { device: backend === 'webgpu' ? 'webgpu' : 'wasm' })) as TextGenerationPipeline
    return { chat, modelId: preferred, backend }
  } catch {
    const fallback: ChatModelId = 'onnx-community/Qwen2.5-0.5B-Instruct'
    const chat = (await pipeline('text-generation', fallback, { device: backend === 'webgpu' ? 'webgpu' : 'wasm' })) as TextGenerationPipeline
    return { chat, modelId: fallback, backend }
  }
}

export const loadEmbedder = async (preferred: EmbedModelId = 'google/embedding-gemma-2b') => {
  const { backend } = await resolveDevice()
  let modelId: EmbedModelId = preferred
  let extractor: FeatureExtractionPipeline
  try {
    extractor = (await pipeline('feature-extraction', preferred, { device: backend === 'webgpu' ? 'webgpu' : 'wasm' })) as FeatureExtractionPipeline
  } catch {
    modelId = 'Xenova/bge-small-en-v1.5'
    extractor = (await pipeline('feature-extraction', modelId, { device: backend === 'webgpu' ? 'webgpu' : 'wasm' })) as FeatureExtractionPipeline
  }
  const embed = async (texts: string[]): Promise<number[][]> => {
    const embeddings = await extractor(texts, { pooling: 'mean', normalize: true })
    // embeddings.tensor shape: [batch, dims]
    const data = embeddings.tolist() as number[][]
    return data
  }
  return { embed, modelId, backend }
}


