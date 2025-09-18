"use client";

import {
  ThreadPrimitive,
  ComposerPrimitive,
  MessagePrimitive,
  AssistantRuntimeProvider,
  useLocalRuntime,
  type ChatModelAdapter,
} from '@assistant-ui/react'
import '@assistant-ui/styles/index.css'
import { getWebLlmEngine, modelInitProgressEmitter } from '../weblm'
import type { InitProgressReport, MLCEngineInterface } from '@mlc-ai/web-llm'

// Custom hook to track model initialization progress (currently unused but available for future use)
// function useModelInitProgress() {
//   const [progress, setProgress] = useState<InitProgressReport | null>(null)
//   
//   useEffect(() => {
//     const handleProgress = (event: CustomEvent<InitProgressReport>) => {
//       setProgress(event.detail)
//     }
//     
//     modelInitProgressEmitter.addEventListener('progress', handleProgress as EventListener)
//     
//     return () => {
//       modelInitProgressEmitter.removeEventListener('progress', handleProgress as EventListener)
//     }
//   }, [])
//   
//   return progress
// }

const WebLLMAdapter: ChatModelAdapter = {
  async *run({ messages }) {
    try {
      let currentProgressText = "Loading MedGemma model..."
      let lastProgressText = ""
      
      // Set up progress listener for this specific run
      const progressListener = (event: CustomEvent<InitProgressReport>) => {
        const progressText = event.detail.text
        const progressPercent = event.detail.progress?.toFixed(2) || '0.00'
        
        // Format the progress message similar to the user's example
        if (progressText.includes('Fetching param cache')) {
          // Extract cache info from the progress text
          const cacheMatch = progressText.match(/Fetching param cache\[(\d+)\/(\d+)\]: (\d+)MB/)
          if (cacheMatch) {
            const [, current, total, mb] = cacheMatch
            const completedPercent = ((parseInt(current) / parseInt(total)) * 100).toFixed(0)
            const elapsedTime = Math.floor(Date.now() / 1000) % 60 // Simple elapsed time simulation
            currentProgressText = `📊 Init progress: Fetching param cache[${current}/${total}]: ${mb}MB fetched. ${completedPercent}% completed, ${elapsedTime} secs elapsed. It can take a while when we first visit this page to populate the cache. Later refreshes will become faster. (${(parseFloat(progressPercent) / 100).toFixed(2)}%)`
          } else {
            currentProgressText = `📊 ${progressText} ${progressPercent}% completed. It can take a while when we first visit this page to populate the cache. Later refreshes will become faster.`
          }
        } else {
          currentProgressText = `📊 ${progressText} ${progressPercent}% completed`
        }
      }
      
      modelInitProgressEmitter.addEventListener('progress', progressListener as EventListener)
      
      // Show initial loading message
      yield {
        content: [
          {
            type: "text" as const,
            text: currentProgressText,
          },
        ],
      }
      
      // Create engine with progress updates
      const enginePromise = getWebLlmEngine()
      
      // Wait for engine while streaming progress updates
      let engineReady = false
      let engine: MLCEngineInterface | null = null
      
      enginePromise.then((e) => {
        engine = e
        engineReady = true
      }).catch((error) => {
        console.error('Engine initialization failed:', error)
        engineReady = true // Stop the progress loop even on error
      })
      
      // Stream progress updates until engine is ready
      while (!engineReady) {
        await new Promise(resolve => setTimeout(resolve, 300)) // Wait 300ms
        
        // Only yield if progress text has changed
        if (currentProgressText !== lastProgressText) {
          lastProgressText = currentProgressText
          yield {
            content: [
              {
                type: "text" as const,
                text: currentProgressText,
              },
            ],
          }
        }
      }
      
      // Clean up
      modelInitProgressEmitter.removeEventListener('progress', progressListener as EventListener)
      
      // If engine failed to initialize, throw error
      if (!engine) {
        throw new Error('Failed to initialize the MedGemma model')
      }
      
      // Clear loading message and show thinking
      yield {
        content: [
          {
            type: "text" as const,
            text: "Thinking...",
          },
        ],
      }
      
      // Convert messages to the format expected by web-llm
      const formattedMessages = messages.map(msg => ({
        role: msg.role,
        content: msg.content.map(part => part.type === 'text' ? part.text : '').join('')
      }))
      
      // TypeScript assertion since we checked engine is not null above
      const result = await (engine as MLCEngineInterface).chat.completions.create({
        messages: formattedMessages,
        stream: true,
        temperature: 0.3,
        max_tokens: 512,
      })

      // Stream the response chunk by chunk
      let fullText = ''
      let isFirstChunk = true
      for await (const chunk of result) {
        const delta = chunk?.choices?.[0]?.delta?.content ?? ''
        if (delta) {
          if (isFirstChunk) {
            fullText = delta // Replace loading text with first chunk
            isFirstChunk = false
          } else {
            fullText += delta
          }
          yield {
            content: [
              {
                type: "text" as const,
                text: fullText,
              },
            ],
          }
        }
      }
      
      // If no content was generated, show a message
      if (!fullText.trim()) {
        yield {
          content: [
            {
              type: "text" as const,
              text: "I apologize, but I couldn't generate a response. Please try rephrasing your question.",
            },
          ],
        }
      }
    } catch (error) {
      console.error('WebLLM Error:', error)
      
      // More detailed error messages
      let errorMessage = "I encountered an error while processing your request."
      
      if (error instanceof Error) {
        if (error.message.includes('model')) {
          errorMessage = "Failed to load the MedGemma model. Please ensure the model files are properly installed."
        } else if (error.message.includes('WebGPU')) {
          errorMessage = "WebGPU is not available. Please use a compatible browser or enable WebGPU."
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          errorMessage = "Network error occurred. Please check your connection and try again."
        }
      }
      
      yield {
        content: [
          {
            type: "text" as const,
            text: errorMessage,
          },
        ],
      }
    }
  },
}

// Define message components outside of the main component
const UserMessage = () => (
  <MessagePrimitive.Root className="flex justify-end">
    <div className="max-w-sm bg-blue-600 text-white px-4 py-2 rounded-2xl rounded-br-md">
      <MessagePrimitive.Parts />
    </div>
  </MessagePrimitive.Root>
)

const AssistantMessage = () => (
  <MessagePrimitive.Root className="flex justify-start">
    <div className="max-w-sm bg-gray-100 text-gray-900 px-4 py-2 rounded-2xl rounded-bl-md">
      <MessagePrimitive.Parts />
    </div>
  </MessagePrimitive.Root>
)

export function AssistantThread() {
  const runtime = useLocalRuntime(WebLLMAdapter)

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <div className="h-[600px] max-w-4xl mx-auto">
        <ThreadPrimitive.Root className="flex flex-col h-full bg-white border border-gray-200 rounded-lg shadow-sm">
          <ThreadPrimitive.Viewport className="flex-1 overflow-y-auto p-4 space-y-4">
            <ThreadPrimitive.Messages
              components={{
                UserMessage,
                AssistantMessage,
              }}
            />
          </ThreadPrimitive.Viewport>
          <div className="border-t border-gray-200 p-4">
            <ComposerPrimitive.Root className="flex gap-3 items-end">
              <ComposerPrimitive.Input 
                rows={1} 
                placeholder="Write a message..." 
                className="flex-1 min-h-[40px] px-3 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
              <ComposerPrimitive.Send asChild>
                <button type="button" className="h-10 w-10 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <title>Send message</title>
                    <path d="m5 12 7-7 7 7M12 5v14"/>
                  </svg>
                </button>
              </ComposerPrimitive.Send>
            </ComposerPrimitive.Root>
          </div>
        </ThreadPrimitive.Root>
      </div>
    </AssistantRuntimeProvider>
  )
}


