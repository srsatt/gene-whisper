import { useState } from 'react'
import './App.css'
import { Header } from './components/Header'
import { Tabs } from './components/Tabs'
import { ChatPage } from './pages/Chat'
import { LibraryPage } from './pages/Library'
import { AssetsPage } from './pages/Assets'
import { SettingsPage } from './pages/Settings'

function App() {
  const [tab, setTab] = useState<'Chat' | 'Library' | 'Assets' | 'Settings'>('Chat')

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="mt-2" />
      <Tabs onChange={setTab} />
      <div className="flex-1">
        {tab === 'Chat' && <ChatPage />}
        {tab === 'Library' && <LibraryPage />}
        {tab === 'Assets' && <AssetsPage />}
        {tab === 'Settings' && <SettingsPage />}
      </div>
    </div>
  )
}

export default App
