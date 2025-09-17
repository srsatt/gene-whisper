"use client"

import {
  ThreadPrimitive,
  ComposerPrimitive,
  MessagePrimitive,
  AssistantRuntimeProvider,
  useLocalRuntime,
  type ChatModelAdapter,
} from "@assistant-ui/react"
import "@assistant-ui/styles/index.css"
import { type CoreMessage, streamText } from "ai"
import { z } from "zod"
import { useMemo } from "react"
import { CustomWebLLM } from "../llm/custom-web-llm"

// Define tools using AI SDK format
const consoleLogTool = {
  description: "Logs a message to the browser console",
  inputSchema: z.object({
    message: z.string().describe("The message to log to the console"),
  }),
  execute: async ({ message }: { message: string }) => {
    console.log("🎯 TOOL EXECUTED - AI Assistant Log:", message)
    return `Logged to console: ${message}`
  },
}

// Define message components outside of the main component
const UserMessage = () => (
  <MessagePrimitive.Root className="flex justify-end">
    <div className="max-w-sm rounded-2xl rounded-br-md bg-blue-600 px-4 py-2 text-white">
      <MessagePrimitive.Parts />
    </div>
  </MessagePrimitive.Root>
)

const AssistantMessage = () => (
  <MessagePrimitive.Root className="flex justify-start">
    <div className="max-w-sm rounded-2xl rounded-bl-md bg-gray-100 px-4 py-2 text-gray-900">
      <MessagePrimitive.Parts />
    </div>
  </MessagePrimitive.Root>
)

export function AssistantThreadWithTools() {
  const model = useMemo(() => new CustomWebLLM(), [])

  const SdkToolAdapter: ChatModelAdapter = useMemo(
    () => ({
      async *run({ messages, abortSignal }) {
        try {
          const formattedMessages = messages.map((msg) => ({
            role: msg.role,
            content: msg.content
              .map((part) => (part.type === "text" ? part.text : ""))
              .join(""),
          })) as CoreMessage[]

          console.log("🔍 Debug - Formatted messages:", formattedMessages)
          console.log("🔍 Debug - Available tools:", { console_log: consoleLogTool })

          const result = streamText({
            model,
            messages: formattedMessages,
            tools: {
              console_log: consoleLogTool,
            },
            system:
              `You are a helpful AI assistant, inside local chat app with genetic data integrations.
              Your main goal is to help the user explore their genetic data and answer their questions.
              To help the user navigate in the app, you can use tools, that are available to you.
              `,
            abortSignal,
          })

          let rawText = ""
          let thinkingContent = ""
          let answerContent = ""
          let answerStarted = false
          let toolExecuting = false

          yield {
            content: [{ type: "text", text: "Initializing..." }],
            status: { type: "running" },
          }

          for await (const part of result.fullStream) {
            if (abortSignal?.aborted) break

            // Keep console clean; only log part types
            console.log("🔍 Debug - Stream part:", part.type)

            switch (part.type) {
              case "text-delta": {
                rawText += part.text
                // Parse <think>...</think> and <Answer> tags
                const thinkStart = rawText.indexOf("<think>")
                const thinkEnd = rawText.indexOf("</think>")
                if (thinkStart !== -1 && thinkEnd !== -1 && thinkEnd > thinkStart) {
                  const inner = rawText.slice(thinkStart + 7, thinkEnd)
                  thinkingContent = inner.trim()
                }
                const answerTagStart = rawText.indexOf("<Answer>")
                if (answerTagStart !== -1) {
                  answerStarted = true
                }
                // Build answer text by stripping tags and any think block
                let cleaned = rawText
                  .replace(/<think>[\s\S]*?<\/think>/g, "")
                  .replace(/<Answer>/g, "")
                  .replace(/<\/Answer>/g, "")
                // Hide tool JSON in the visible text (even if partial)
                const toolJsonStart = cleaned.indexOf('{"tool"')
                if (toolJsonStart !== -1) {
                  cleaned = cleaned.slice(0, toolJsonStart)
                }
                answerContent = cleaned.trim()
                break
              }

              case "tool-call": {
                // Do not print JSON input in console
                console.log("🔧 Debug - Tool call detected:", part.toolName)
                // Show a small placeholder while executing
                toolExecuting = true
                break
              }

              case "tool-result": {
                // Keep console clean; do not log JSON tool results
                break
              }
            }

            const content = [] as Array<{ type: "text" | "reasoning"; text: string }>
            // Show reasoning bubble with trimmed/shrunk content when answer starts
            if (thinkingContent) {
              const shrunk = answerStarted
                ? (thinkingContent.length > 120 ? thinkingContent.slice(0, 120) + "…" : thinkingContent)
                : thinkingContent
              content.push({ type: "reasoning", text: shrunk })
            }
            if (answerContent) {
              content.push({ type: "text", text: answerContent })
            } else if (toolExecuting) {
              content.push({ type: "text", text: "Executing tool…" })
            }

            yield { content, status: { type: "running" } }
          }

          const finalContent = [] as Array<{ type: "text" | "reasoning"; text: string }>
          if (thinkingContent) {
            const shrunk = (answerStarted && thinkingContent.length > 120)
              ? thinkingContent.slice(0, 120) + "…"
              : thinkingContent
            finalContent.push({ type: "reasoning", text: shrunk })
          }
          if (answerContent) {
            finalContent.push({ type: "text", text: answerContent })
          } else if (toolExecuting) {
            finalContent.push({ type: "text", text: "Executing tool…" })
          }

          yield {
            content: finalContent,
            status: { type: "complete", reason: "stop" },
          }
        } catch (error) {
          console.error("Custom LLM Error:", error)
          const errorMessage =
            error instanceof Error ? error.message : "An unknown error occurred"
          yield {
            content: [
              {
                type: "text" as const,
                text: `Error: ${errorMessage}`,
              },
            ],
          }
        }
      },
    }),
    [model],
  )

  const runtime = useLocalRuntime(SdkToolAdapter)

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <div className="mx-auto h-[600px] max-w-4xl">
        <ThreadPrimitive.Root className="flex h-full flex-col rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="rounded-t-lg border-b border-gray-200 bg-gray-50 p-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Medical AI Assistant with Tools
            </h2>
            <p className="text-sm text-gray-600">
              Powered by II-Medical-8B - Try: "log to console 123"
            </p>
          </div>
          <ThreadPrimitive.Viewport className="flex-1 space-y-4 overflow-y-auto p-4">
            <ThreadPrimitive.Messages
              components={{
                UserMessage,
                AssistantMessage,
              }}
            />
          </ThreadPrimitive.Viewport>
          <div className="border-t border-gray-200 p-4">
            <ComposerPrimitive.Root className="flex items-end gap-3">
              <ComposerPrimitive.Input
                placeholder={"Write a message..."}
                className="min-h-[40px] flex-1 resize-none rounded-full border border-gray-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <ComposerPrimitive.Send asChild>
                <button
                  type="button"
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <title>Send message</title>
                    <path d="m5 12 7-7 7 7M12 5v14" />
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