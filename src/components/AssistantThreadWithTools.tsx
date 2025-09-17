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
import { z } from 'zod'
import { getWebLlmEngine } from '../weblm'

// Define tools using AI SDK format
const consoleLogTool = {
  description: 'Logs a message to the browser console',
  inputSchema: z.object({
    message: z.string().describe('The message to log to the console'),
  }),
  execute: async ({ message }: { message: string }) => {
    console.log('AI Assistant Log:', message);
    return `Logged to console: ${message}`;
  },
};

// We'll use your existing getWebLlmEngine function instead of @built-in-ai/web-llm
// This ensures we use the exact same configuration that works in your weblm.ts

const CustomWebLLMAdapter: ChatModelAdapter = {
  async *run({ messages, abortSignal }) {
    try {
      // Show loading message while initializing
      yield {
        content: [
          {
            type: "text" as const,
            text: "Loading II-Medical-8B model...",
          },
        ],
      }

      // Use your existing getWebLlmEngine function
      const engine = await getWebLlmEngine()
      
      // Clear loading message and show thinking
      yield {
        content: [
          {
            type: "text" as const,
            text: "Model loaded. Thinking...",
          },
        ],
      }
      
      // Convert messages to the format expected by web-llm
      const formattedMessages = messages.map(msg => ({
        role: msg.role,
        content: msg.content.map(part => part.type === 'text' ? part.text : '').join('')
      }))

      // Add system message with tool descriptions
      const systemMessage = {
        role: 'system' as const,
        content: `You are an expert medical AI assistant trained on comprehensive medical datasets. Provide detailed, evidence-based medical information with step-by-step reasoning. 

You have access to the following tools:
- console_log: Logs a message to the browser console

When users ask you to log something to the console, respond with a function call in JSON format:
{"tool_name": "console_log", "parameters": {"message": "your message"}}

Always emphasize that your responses are for educational purposes only.`
      }
      
      const messagesWithSystem = [systemMessage, ...formattedMessages]
      
      const result = await engine.chat.completions.create({
        messages: messagesWithSystem,
        stream: true,
        temperature: 0.3,
        max_tokens: 512,
      })

      // Stream the response chunk by chunk
      let fullText = ''
      let isFirstChunk = true
      for await (const chunk of result) {
        if (abortSignal?.aborted) break
        
        const delta = chunk?.choices?.[0]?.delta?.content ?? ''
        if (delta) {
          if (isFirstChunk) {
            fullText = delta // Replace loading text with first chunk
            isFirstChunk = false
          } else {
            fullText += delta
          }

          // Check if the response contains a tool call in JSON format
          const toolCallMatch = fullText.match(/\{"tool_name":\s*"console_log",\s*"parameters":\s*\{[^}]+\}\}/);
          if (toolCallMatch) {
            try {
              const toolCall = JSON.parse(toolCallMatch[0]);
              if (toolCall.tool_name === 'console_log' && toolCall.parameters?.message) {
                const result = await consoleLogTool.execute(toolCall.parameters);
                // Replace the tool call with the result
                fullText = fullText.replace(toolCallMatch[0], `Tool executed: ${result}`);
              }
            } catch (error) {
              console.error('Tool execution error:', error);
            }
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
          errorMessage = "Failed to load the II-Medical-8B model. Please ensure the model files are properly installed."
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

export function AssistantThreadWithTools() {
  const runtime = useLocalRuntime(CustomWebLLMAdapter)

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <div className="h-[600px] max-w-4xl mx-auto">
        <ThreadPrimitive.Root className="flex flex-col h-full bg-white border border-gray-200 rounded-lg shadow-sm">
          <div className="border-b border-gray-200 p-4 bg-gray-50 rounded-t-lg">
            <h2 className="text-lg font-semibold text-gray-900">Medical AI Assistant with Tools</h2>
            <p className="text-sm text-gray-600">Powered by II-Medical-8B - Try: "log to console 123"</p>
          </div>
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
                placeholder="Write a message... (try 'log to console hello world')" 
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