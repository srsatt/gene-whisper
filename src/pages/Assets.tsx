import { useState } from 'react'
import { loadChat, loadEmbedder } from '../models'

export function AssetsPage() {
  const [status, setStatus] = useState<string>('')

  const preload = async () => {
    try {
      setStatus('Loading MedGemma chat model (web-llm)...')
      await loadChat()
      setStatus('Loading embedder model (transformers.js)...')
      await loadEmbedder()
      setStatus('All models loaded and cached.')
    } catch (error) {
      setStatus(`Error loading models: ${error}`)
      console.error('Model loading error:', error)
    }
  }

  const clearCaches = async () => {
    try {
      // Clear HTTP caches (for both web-llm and transformers.js)
      await caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
      setStatus('HTTP caches cleared. Note: Web-LLM and Transformers.js models are cached in IndexedDB. To fully clear, use browser developer tools > Application > Storage.')
    } catch (error) {
      setStatus(`Error clearing caches: ${error}`)
      console.error('Cache clearing error:', error)
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-4 grid gap-3">
      <div className="flex gap-2">
        <button type="button" className="px-3 py-2 rounded bg-indigo-600 text-white" onClick={preload}>
          Preload models
        </button>
        <button type="button" className="px-3 py-2 rounded bg-slate-600 text-white" onClick={clearCaches}>
          Clear caches
        </button>
      </div>
      {status && <div className="text-sm opacity-80">{status}</div>}
    </div>
  )
}


