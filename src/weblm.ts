// WebLLM wrapper for MedGemma-4B-IT model converted to MLC format
import { CreateMLCEngine, type MLCEngineInterface, type InitProgressReport, modelVersion } from '@mlc-ai/web-llm'

let enginePromise: Promise<MLCEngineInterface> | null = null

// Reset engine promise to force reinitialization
export function resetWebLlmEngine() {
  enginePromise = null
}

// Call reset to use the new configuration
resetWebLlmEngine()

// Intercept all fetch requests to debug WebLLM
const originalFetch = window.fetch
window.fetch = function(...args) {
  const url = args[0]?.toString() || ''
  if (url.includes('medgemma') || url.includes('MLC')) {
    console.log('🔍 WebLLM fetch intercepted:', url)
  }
  return originalFetch.apply(this, args).then(response => {
    if (url.includes('medgemma') || url.includes('MLC')) {
      console.log('📥 WebLLM fetch response:', url, response.status, response.headers.get('content-type'))
      if (!response.ok) {
        response.clone().text().then(text => {
          console.log('❌ WebLLM fetch error response:', url, text.substring(0, 300))
        })
      }
    }
    return response
  }).catch(error => {
    if (url.includes('medgemma') || url.includes('MLC')) {
      console.error('💥 WebLLM fetch failed:', url, error)
    }
    throw error
  })
}

export type WebLlmConfig = {
  // Local model path for the converted MedGemma model
  modelBaseUrl?: string
  modelId?: string
  modelLibUrl?: string
}

// Default to local model path for the II-Medical-8B model
const DEFAULT_LOCAL_BASE = '/II-Medical-8B-q4f16_1-MLC/'

export function getWebLlmEngine(config?: WebLlmConfig) {
  if (!enginePromise) {
    enginePromise = createCustomModelEngine(config)
  }
  return enginePromise
}

async function createCustomModelEngine(config?: WebLlmConfig) {
  // Custom model configuration
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173'
  const modelPath = config?.modelBaseUrl ?? DEFAULT_LOCAL_BASE
  const modelUrl = modelPath.startsWith('http') ? modelPath : `${baseUrl}${modelPath.startsWith('/') ? modelPath : '/' + modelPath}`
  let modelId = config?.modelId ?? 'II-Medical-8B-q4f16_1-MLC'
  
  // Use our converted II-Medical-8B model with proper Qwen3-8B WASM
  const modelBaseUrl = `${baseUrl}/II-Medical-8B-q4f16_1-MLC/`
  const appConfig = {
    model_list: [
      {
        model: modelBaseUrl,
        model_id: modelId,
        // Use v0_2_48 compatible Qwen3-8B WASM (perfect match!)
        model_lib: `${baseUrl}/wasm/Qwen3-8B-q4f16_1-ctx4k_cs1k-webgpu.wasm`,
        vram_required_MB: 5000,
        low_resource_required: false,
        buffer_size_required_bytes: 4294967296,
        required_features: ["shader-f16"]
      }
    ]
  }
  
  console.log('WebLLM Medical Model Config:', { 
    baseUrl, 
    modelPath,
    modelUrl, 
    modelId, 
    modelUrl_final: appConfig.model_list[0].model,
    medicalModelUrl: appConfig.model_list[0].model,
    qwen3_8B_WasmUrl_v0_2_48: appConfig.model_list[0].model_lib,
    webllmModelVersion: modelVersion,
    appConfig 
  })
  
  // Test file accessibility for our medical model
  console.log('Testing medical model file accessibility:')
  const filesToTest = [
    'mlc-chat-config.json',
    'tokenizer.json',
    'tokenizer_config.json',
    'ndarray-cache.json'
  ]
  
  for (const filename of filesToTest) {
    try {
      const response = await fetch(`${baseUrl}/II-Medical-8B-q4f16_1-MLC/${filename}`)
      console.log(`${filename} status:`, response.status, response.headers.get('content-type'))
      if (!response.ok) {
        const text = await response.text()
        console.log(`${filename} error response:`, text.substring(0, 200))
      }
    } catch (e) {
      console.error(`${filename} fetch error:`, e)
    }
  }
  
  // Create engine with custom config and proper initialization
  try {
    console.log('🚀 Starting MLC Engine initialization...')
    console.log(`📋 WebLLM model version: ${modelVersion}`)
    console.log(`🎯 Target model ID: ${modelId}`)
    
    // Using Qwen3 WASM from v0_2_80 with our converted II-Medical-8B model!
    
    const initProgressCallback = (report: InitProgressReport) => {
      console.log(`📊 Init progress: ${report.text} (${report.progress?.toFixed(2) || 0}%)`)
    }
    
    const engine = await CreateMLCEngine(modelId, { 
      appConfig,
      initProgressCallback
    })
    
    console.log('✅ MLC Engine successfully created!')
    return engine
  } catch (error) {
    console.error('❌ Failed to create MLC Engine with custom config:', error)
    
    // Log more details about the error
    if (error instanceof Error) {
      console.error('Error name:', error.name)
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
      
      // Specific guidance for WASM import errors
      if (error.message?.includes('TVMFFIEnvSetStream') || error.message?.includes('function import requires a callable')) {
        console.error('🔧 SOLUTION: Your MedGemma model WASM was compiled with a different MLC version.')
        console.error(`   Current WebLLM (v0.2.79) expects model version: ${modelVersion}`)
        console.error('   You need to recompile your model with the matching MLC toolchain version.')
      }
    }
    
    throw error
  }
}

export async function generateWebLlm(prompt: string, streamCb?: (chunk: string) => void): Promise<string> {
  const engine = await getWebLlmEngine()
  const messages = [
    { role: 'system' as const, content: 'You are an expert medical AI assistant trained on comprehensive medical datasets. Provide detailed, evidence-based medical information with step-by-step reasoning. Include differential diagnoses when appropriate, explain mechanisms of action for treatments, and discuss contraindications. Always emphasize that your responses are for educational purposes only and cannot replace professional medical advice, diagnosis, or treatment. Encourage users to consult healthcare professionals for medical concerns. Please reason step-by-step and provide thorough medical explanations.' },
    { role: 'user' as const, content: prompt },
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


