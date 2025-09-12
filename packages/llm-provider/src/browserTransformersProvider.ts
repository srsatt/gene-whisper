import { pipeline } from '@xenova/transformers';
import { ChatRequest, ChatResponse, EmbeddingsRequest, EmbeddingsResponse } from './index';

// A simplified version of the logic in apps/web/src/models.ts and apps/web/src/App.tsx
// In a real app, you would share the singleton instance and model loading logic.

class PipelineSingleton {
    private static instances = new Map<string, any>();
    static async getInstance(task: string, model: string) {
        const key = `${task}-${model}`;
        if (!this.instances.has(key)) {
            this.instances.set(key, await pipeline(task, model));
        }
        return this.instances.get(key);
    }
}

export class BrowserTransformersProvider {
    async createEmbedding(request: EmbeddingsRequest): Promise<EmbeddingsResponse> {
        const { input, model = 'Xenova/bge-small-en-v1.5' } = request;
        const embedder = await PipelineSingleton.getInstance('feature-extraction', model);
        const embeddings = await embedder(input, { pooling: 'mean', normalize: true });

        return {
            data: embeddings.tolist().map(e => ({ embedding: e })),
            model: model,
            dims: embeddings.dims[1],
        };
    }

    async createChatCompletion(request: ChatRequest): Promise<ChatResponse> {
        // This is a simplified implementation. Streaming is handled in the App.tsx for now.
        const { messages, model = 'Xenova/Qwen2.5-0.5B-Instruct' } = request;
        const generator = await PipelineSingleton.getInstance('text-generation', model);
        const output = await generator(messages);
        
        return {
            model: model,
            output: output[0].generated_text,
            usage: { prompt_tokens: 0, output_tokens: 0 },
        };
    }
}
