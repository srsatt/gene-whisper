import { useState } from 'react'
import { loadChat, loadEmbedder } from '../models'

export function AssetsPage() {
  const [status, setStatus] = useState<string>('')

  const preload = async () => {
    setStatus('Loading chat model...')
    await loadChat()
    setStatus('Loading embedder...')
    await loadEmbedder()
    setStatus('All models loaded and cached.')
  }

  const clearCaches = async () => {
    // Transformers.js caches in IndexedDB; clearing via origin storage is simplest
    await caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
    setStatus('HTTP caches cleared. To fully clear model cache, clear site data in browser settings.')
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-4 grid gap-3">
      <div className="flex gap-2">
        <button className="px-3 py-2 rounded bg-indigo-600 text-white" onClick={preload}>
          Preload models
        </button>
        <button className="px-3 py-2 rounded bg-slate-600 text-white" onClick={clearCaches}>
          Clear caches
        </button>
      </div>
      {status && <div className="text-sm opacity-80">{status}</div>}
    </div>
  )
}


