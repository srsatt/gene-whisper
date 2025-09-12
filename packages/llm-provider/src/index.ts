export * from './httpProvider';
export * from './browserTransformersProvider';
import { z } from 'zod';

export const ChatMessageSchema = z.object({
  role: z.enum(['system', 'user', 'assistant']),
  content: z.string(),
});
export type ChatMessage = z.infer<typeof ChatMessageSchema>;

export const ToolSpecSchema = z.object({
  name: z.string(),
  description: z.string(),
  parameters: z.record(z.any()),
});
export type ToolSpec = z.infer<typeof ToolSpecSchema>;

export const ToolCallSchema = z.object({
  name: z.string(),
  arguments: z.record(z.any()),
});
export type ToolCall = z.infer<typeof ToolCallSchema>;

export const ChatRequestSchema = z.object({
  model: z.string(),
  messages: z.array(ChatMessageSchema),
  tools: z.array(ToolSpecSchema).optional(),
  tool_choice: z.enum(['auto', 'none']).optional(),
  max_tokens: z.number().optional(),
  temperature: z.number().optional(),
});
export type ChatRequest = z.infer<typeof ChatRequestSchema>;

export const ChatResponseSchema = z.object({
  model: z.string(),
  output: z.string(),
  tool_calls: z.array(ToolCallSchema).optional(),
  usage: z.object({
    prompt_tokens: z.number(),
    output_tokens: z.number(),
  }),
});
export type ChatResponse = z.infer<typeof ChatResponseSchema>;

export const EmbeddingsRequestSchema = z.object({
  input: z.array(z.string()),
});
export type EmbeddingsRequest = z.infer<typeof EmbeddingsRequestSchema>;

export const EmbeddingsResponseSchema = z.object({
  data: z.array(z.object({
    embedding: z.array(z.number()),
  })),
  model: z.string(),
  dims: z.number(),
});
export type EmbeddingsResponse = z.infer<typeof EmbeddingsResponseSchema>;
