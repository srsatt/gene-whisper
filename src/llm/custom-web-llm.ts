import type {
  LanguageModelV2,
  LanguageModelV2CallOptions,
  LanguageModelV2StreamPart,
} from "@ai-sdk/provider"
import { getWebLlmEngine } from "../weblm"
import type { MLCEngineInterface } from "@mlc-ai/web-llm"

export class CustomWebLLM implements LanguageModelV2 {
  readonly specificationVersion = "v2"
  readonly provider = "custom-web-llm"
  readonly modelId = "II-Medical-8B-q4f16_1-MLC"
  readonly supportedUrls = {}
  engine: MLCEngineInterface | null = null

  private async getInitializedEngine(): Promise<MLCEngineInterface> {
    if (this.engine) return this.engine
    this.engine = await getWebLlmEngine()
    return this.engine
  }

  async doStream(
    options: LanguageModelV2CallOptions,
  ): Promise<{ stream: ReadableStream<LanguageModelV2StreamPart> }> {
    const engine = await this.getInitializedEngine()
    const {
      prompt: promptMessages,
      abortSignal,
      tools,
      toolChoice,
      temperature,
      maxOutputTokens,
      stopSequences,
      topP,
      topK,
      presencePenalty,
      frequencyPenalty,
      responseFormat,
      seed,
    } = options

    console.log("🔍 Debug - doStream options:", {
      messagesCount: promptMessages.length,
      hasTools: Array.isArray(tools) && tools.length > 0,
      temperature,
      maxOutputTokens,
      stopSequences,
      topP,
      topK,
      presencePenalty,
      frequencyPenalty,
      responseFormat,
      seed,
    })

    // Split system messages and others, then merge system messages into one at the top
    const systemParts: string[] = []
    const otherMessages: Array<{ role: 'user' | 'assistant' | 'tool'; content: string; tool_call_id?: string }> = []

    for (const msg of promptMessages) {
      if (msg.role === 'system') {
        if (typeof msg.content === 'string') {
          systemParts.push(msg.content)
        }
        continue
      }

      let content: string
      if (typeof msg.content === 'string') {
        content = msg.content
      } else if (Array.isArray(msg.content)) {
        content = msg.content
          .map((part) => (part.type === 'text' ? part.text : JSON.stringify(part)))
          .join('')
      } else {
        content = ''
      }

      if (msg.role === 'tool') {
        otherMessages.push({ role: 'tool', content, tool_call_id: 'tool_call_id' })
      } else if (msg.role === 'user' || msg.role === 'assistant') {
        otherMessages.push({ role: msg.role, content })
      }
    }

    // Convert AI SDK tools (array) to WebLLM tools format
    const webllmTools = Array.isArray(tools)
      ? tools
          .filter((t) => t.type === 'function')
          .map((t) => {
            const fn = t as unknown as { name: string; description?: string; inputSchema?: unknown }
            return {
              type: 'function',
              function: {
                name: fn.name,
                description: fn.description,
                parameters: fn.inputSchema as Record<string, unknown>,
              },
            }
          })
      : undefined

    // Map tool choice
    let webllmToolChoice:
      | undefined
      | "none"
      | "auto"
      | { type: "function"; function: { name: string } } = undefined
    if (toolChoice) {
      switch (toolChoice.type) {
        case 'auto':
          webllmToolChoice = 'auto'
          break
        case 'none':
          webllmToolChoice = 'none'
          break
        case 'required':
          // WebLLM does not support 'required'; map to 'auto'
          webllmToolChoice = 'auto'
          break
        case 'tool':
          webllmToolChoice = {
            type: 'function',
            function: { name: toolChoice.toolName },
          }
          break
      }
    }

    console.log('🔍 Debug - WebLLM tools:', webllmTools)
    console.log('🔍 Debug - Other messages (pre-tools-instruction):', otherMessages)
    console.log('🔍 Debug - Tool choice:', webllmToolChoice)

    // For models without native function calling, inject a system instruction
    // to emit JSON tool calls that the AI SDK can handle client-side.
    if (webllmTools && webllmTools.length > 0) {
      const toolList = webllmTools
        .map((t) => `- ${t.function.name}${t.function.description ? `: ${t.function.description}` : ''}`)
        .join('\n')
      const instruction =
        `You can use tools. When you use a tool, respond with ONLY a JSON object on a single line:\n` +
        `{"tool":"<tool_name>","input":{...}}\n` +
        `Do not add any extra text before or after.\n` +
        `Available tools:\n${toolList}`
      systemParts.unshift(instruction)
    }

    // Build final messages with a single system message first (if any)
    const allMessages: Array<any> = []
    if (systemParts.length > 0) {
      allMessages.push({ role: 'system', content: systemParts.join('\n\n') })
    }
    for (const m of otherMessages) {
      if (m.role === 'tool') {
        allMessages.push({ role: 'tool' as const, content: m.content, tool_call_id: 'tool_call_id' })
      } else {
        allMessages.push({ role: m.role, content: m.content })
      }
    }

    const response = await engine.chat.completions.create({
      messages: allMessages,
      // NOTE: Do not pass tools/tool_choice for models that don't support it (avoids UnsupportedModelIdError)
      stream: true,
      temperature: temperature ?? 0.1,
      max_tokens: maxOutputTokens ?? 512,
      top_p: topP,
      presence_penalty: presencePenalty,
      frequency_penalty: frequencyPenalty,
      stop: stopSequences,
      response_format:
        responseFormat?.type === 'json'
          ? { type: 'json_object', schema: responseFormat.schema ? JSON.stringify(responseFormat.schema) : undefined }
          : { type: 'text' },
      seed,
      // Disable thinking tokens per user's requirement
      extra_body: { enable_thinking: false },
    })

    const stream = new ReadableStream<LanguageModelV2StreamPart>({
      async start(controller) {
        let fullText = ""
        const textId = "text-0"
        const toolCallId = "tool-0"
        
        controller.enqueue({ type: "stream-start", warnings: [] })
        
        try {
          for await (const chunk of response) {
            if (abortSignal?.aborted) {
              controller.close()
              return
            }
            console.log("🔍 Debug - Stream chunk:", chunk)
            const delta = chunk?.choices?.[0]?.delta?.content ?? ""
            if (delta) {
              fullText += delta
              
              // Detect a JSON tool call like {"tool":"name","input":{...}}
              if (webllmTools && webllmTools.length > 0) {
                const startIdx = fullText.indexOf('{"tool"')
                if (startIdx !== -1) {
                  // Try to find a plausible JSON end and parse
                  const endIdx = fullText.indexOf('}', startIdx)
                  // Attempt incremental expansion to find a valid JSON object
                  for (let i = endIdx; i !== -1 && i <= fullText.length; i = fullText.indexOf('}', i + 1)) {
                    const candidate = fullText.slice(startIdx, i + 1)
                    try {
                      const parsed = JSON.parse(candidate) as { tool?: string; input?: unknown }
                      if (parsed && parsed.tool && typeof parsed.tool === 'string') {
                        controller.enqueue({
                          type: 'tool-call',
                          toolCallId,
                          toolName: parsed.tool,
                          input: JSON.stringify(parsed.input ?? {}),
                        })
                        // Remove the parsed JSON from text buffer to avoid echoing it
                        fullText = fullText.slice(0, startIdx) + fullText.slice(i + 1)
                        break
                      }
                    } catch (_error) {
                      // keep accumulating until valid JSON
                    }
                  }
                }
              }

              if (fullText.length > 0) {
                // Regular text streaming
                if (fullText.length === delta.length) {
                  controller.enqueue({ type: "text-start", id: textId })
                }
                controller.enqueue({
                  type: "text-delta",
                  id: textId,
                  delta: delta,
                })
              }
            }
          }
          
          controller.enqueue({ type: "text-end", id: textId })
          
          controller.enqueue({ 
            type: "finish", 
            finishReason: "stop",
            usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 }
          })
          controller.close()
        } catch (error) {
          controller.error(error)
        }
      },
    })

    return { stream }
  }

  // Unsupported methods - stubbed out
  async doGenerate(_options: LanguageModelV2CallOptions) {
    return {
      content: [{ type: "text" as const, text: "" }],
      finishReason: "other" as const,
      usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
      warnings: [],
    }
  }
}
