import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { ChatPage } from './pages/Chat.tsx'
import { registerSW } from 'virtual:pwa-register'

const rootElement = document.getElementById('root')
if (!rootElement) throw new Error('Root element not found')

createRoot(rootElement).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        {process.env.NODE_ENV === 'development' && <Route path="/chat" element={<ChatPage />} />}
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)

registerSW({ immediate: true })
