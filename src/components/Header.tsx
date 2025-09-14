import { useEffect, useState } from 'react'
import clsx from 'clsx'

export function Header() {
  const [online, setOnline] = useState<boolean>(navigator.onLine)
  const [gpu, setGpu] = useState<boolean>(false)
  useEffect(() => {
    const on = () => setOnline(true)
    const off = () => setOnline(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    setGpu('gpu' in navigator)
    return () => {
      window.removeEventListener('online', on)
      window.removeEventListener('offline', off)
    }
  }, [])
  return (
    <div className="w-full border-b bg-background/60 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto max-w-6xl flex items-center justify-between px-4 py-2">
        <div className="font-semibold">Generic LLM RAG</div>
        <div className="flex gap-2 text-sm">
          <span className={clsx('rounded px-2 py-0.5', online ? 'bg-green-600/20 text-green-700' : 'bg-yellow-600/20 text-yellow-800')}>
            {online ? 'Online' : 'Offline'}
          </span>
          <span className={clsx('rounded px-2 py-0.5', gpu ? 'bg-indigo-600/20 text-indigo-700' : 'bg-slate-500/20 text-slate-700')}>
            {gpu ? 'GPU' : 'CPU'}
          </span>
        </div>
      </div>
    </div>
  )
}


