import { useState } from 'react'

const tabs = ['Chat', 'Library', 'Assets', 'Settings'] as const
type Tab = (typeof tabs)[number]

export function Tabs({ onChange }: { onChange: (t: Tab) => void }) {
  const [active, setActive] = useState<Tab>('Chat')
  return (
    <div className="mx-auto max-w-6xl px-4">
      <div className="flex gap-2 border-b">
        {tabs.map((t) => (
          <button
            key={t}
            className={`px-3 py-2 text-sm ${active === t ? 'border-b-2 border-blue-600 font-medium' : 'text-slate-600'}`}
            onClick={() => {
              setActive(t)
              onChange(t)
            }}
          >
            {t}
          </button>
        ))}
      </div>
    </div>
  )
}


