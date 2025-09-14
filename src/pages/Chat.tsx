import { useState } from 'react'
import { ragSearch, summarize, addDocument } from '../tools'

export function ChatPage() {
  const [query, setQuery] = useState('')
  const [answer, setAnswer] = useState<string>('')
  const [ctx, setCtx] = useState<Array<{ score: number; text: string; docId: string; title: string }>>([])

  const ask = async () => {
    const snippets = await ragSearch({ query })
    setCtx(snippets)
    const context = snippets.map((s) => `- (${s.score.toFixed(2)}) ${s.title}: ${s.text}`).join('\n')
    const text = `Use the context below to answer the question.\n\nContext:\n${context}\n\nQuestion: ${query}`
    const sum = await summarize({ text })
    setAnswer(sum)
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-4 grid gap-4">
      <div className="flex gap-2">
        <input className="flex-1 border rounded px-3 py-2" placeholder="Ask a question..." value={query} onChange={(e) => setQuery(e.target.value)} />
        <button className="px-3 py-2 bg-blue-600 text-white rounded" onClick={ask}>
          Ask
        </button>
      </div>
      {ctx.length > 0 && (
        <div className="grid gap-2">
          <div className="text-sm font-medium">Retrieved snippets</div>
          <div className="grid gap-2">
            {ctx.map((c, i) => (
              <div key={i} className="rounded border p-2 text-sm">
                <div className="opacity-70">{c.title} · score {c.score.toFixed(2)}</div>
                <div>{c.text}</div>
              </div>
            ))}
          </div>
        </div>
      )}
      {answer && (
        <div className="grid gap-2">
          <div className="text-sm font-medium">Answer</div>
          <pre className="whitespace-pre-wrap rounded border p-3 bg-slate-50 text-sm">{answer}</pre>
        </div>
      )}
    </div>
  )
}


