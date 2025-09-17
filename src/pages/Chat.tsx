import { AssistantThreadWithTools } from '../components/AssistantThreadWithTools'

export function ChatPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">AI Chat with Tools</h1>
          <p className="text-gray-600">Development chat page with tool support. Try: "log to console hello world"</p>
        </div>
        <AssistantThreadWithTools />
      </div>
    </div>
  )
}


