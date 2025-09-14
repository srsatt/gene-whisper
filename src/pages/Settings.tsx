import { useState } from 'react'
import { db } from '../db'

export function SettingsPage() {
  const [chatModel, setChatModel] = useState<string>('google/medgemma-4b-it')
  const [embedModel, setEmbedModel] = useState<string>('google/embedding-gemma-2b')
  const [temperature, setTemperature] = useState<number>(0.3)
  const [maxTokens, setMaxTokens] = useState<number>(512)

  const save = async () => {
    await db.kv.put({ key: 'settings', value: { chatModel, embedModel, temperature, maxTokens } })
    alert('Saved')
  }

  const clearAll = async () => {
    await db.delete()
    location.reload()
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-4 grid gap-4">
      <div className="grid gap-2 max-w-md">
        <label className="text-sm">Chat model</label>
        <input className="border rounded px-3 py-2" value={chatModel} onChange={(e) => setChatModel(e.target.value)} />
        <label className="text-sm">Embedding model</label>
        <input className="border rounded px-3 py-2" value={embedModel} onChange={(e) => setEmbedModel(e.target.value)} />
        <label className="text-sm">Temperature</label>
        <input type="number" step="0.1" className="border rounded px-3 py-2" value={temperature} onChange={(e) => setTemperature(parseFloat(e.target.value))} />
        <label className="text-sm">Max tokens</label>
        <input type="number" className="border rounded px-3 py-2" value={maxTokens} onChange={(e) => setMaxTokens(parseInt(e.target.value))} />
        <div className="flex gap-2">
          <button className="px-3 py-2 bg-blue-600 text-white rounded" onClick={save}>
            Save
          </button>
          <button className="px-3 py-2 bg-red-600 text-white rounded" onClick={clearAll}>
            Clear all data
          </button>
        </div>
      </div>
    </div>
  )
}


