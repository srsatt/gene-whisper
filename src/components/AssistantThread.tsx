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
import { webLLM } from '@built-in-ai/web-llm'
import { streamText } from 'ai'

const WebLLMAdapter: ChatModelAdapter = {
  async *run({ messages, abortSignal }) {
    try {
      const result = await streamText({
        model: webLLM('Llama-3.2-1B-Instruct-q4f16_1-MLC'),
        messages: messages.map(msg => ({
          role: msg.role,
          content: msg.content.map(part => part.type === 'text' ? part.text : '').join('')
        })),
        abortSignal,
      })

      // Stream the response chunk by chunk
      let fullText = ''
      for await (const chunk of result.textStream) {
        fullText += chunk
        yield {
          content: [
            {
              type: "text" as const,
              text: fullText,
            },
          ],
        }
      }
    } catch (error) {
      console.error('WebLLM Error:', error)
      // Fallback response
      yield {
        content: [
          {
            type: "text" as const,
            text: "Sorry, I encountered an error. Please try again.",
          },
        ],
      }
    }
  },
}

export function AssistantThread() {
  const runtime = useLocalRuntime(WebLLMAdapter)

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <div className="h-[600px] max-w-4xl mx-auto">
        <ThreadPrimitive.Root className="flex flex-col h-full bg-white border border-gray-200 rounded-lg shadow-sm">
          <ThreadPrimitive.Viewport className="flex-1 overflow-y-auto p-4 space-y-4">
            <ThreadPrimitive.Messages
              components={{
                UserMessage: () => (
                  <MessagePrimitive.Root className="flex justify-end">
                    <div className="max-w-sm bg-blue-600 text-white px-4 py-2 rounded-2xl rounded-br-md">
                      <MessagePrimitive.Parts />
                    </div>
                  </MessagePrimitive.Root>
                ),
                AssistantMessage: () => (
                  <MessagePrimitive.Root className="flex justify-start">
                    <div className="max-w-sm bg-gray-100 text-gray-900 px-4 py-2 rounded-2xl rounded-bl-md">
                      <MessagePrimitive.Parts />
                      <MessagePrimitive.If running>
                        <div className="flex items-center mt-2 text-gray-500">
                          <div className="animate-pulse flex space-x-1">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                          </div>
                        </div>
                      </MessagePrimitive.If>
                    </div>
                  </MessagePrimitive.Root>
                ),
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
                <button className="h-10 w-10 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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


