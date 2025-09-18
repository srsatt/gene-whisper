import { useEffect, useState } from 'react'
import { db, type DocumentRecord } from '../db'
import { addDocument } from '../rag'

export function LibraryPage() {
  const [title, setTitle] = useState('')
  const [text, setText] = useState('')
  const [docs, setDocs] = useState<DocumentRecord[]>([])

  useEffect(() => {
    ;(async () => {
      const all = await db.documents.toArray()
      setDocs(all)
    })()
  }, [])

  const add = async () => {
    if (!title || !text) return
    await addDocument(title, text)
    setTitle('')
    setText('')
    setDocs(await db.documents.toArray())
  }

  const remove = async (id: string) => {
    await db.documents.delete(id)
    setDocs(await db.documents.toArray())
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-4 grid gap-4">
      <div className="grid gap-2">
        <input className="border rounded px-3 py-2" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
        <textarea className="border rounded px-3 py-2 h-40" placeholder="Paste .txt or .md text..." value={text} onChange={(e) => setText(e.target.value)} />
        <button className="px-3 py-2 bg-green-600 text-white rounded w-fit" onClick={add}>
          Add document
        </button>
      </div>
      <div className="grid gap-2">
        <div className="text-sm font-medium">Documents</div>
        {docs.map((d) => (
          <div key={d.id} className="flex items-center justify-between border rounded p-2 text-sm">
            <div>
              <div className="font-medium">{d.title}</div>
              <div className="opacity-70">{d.chunks.length} chunks</div>
            </div>
            <button className="px-2 py-1 bg-red-600 text-white rounded" onClick={() => remove(d.id)}>
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}


