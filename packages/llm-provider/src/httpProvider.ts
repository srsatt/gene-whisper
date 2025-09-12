import { ChatRequest, ChatResponse, EmbeddingsRequest, EmbeddingsResponse } from './index';

export class HttpProvider {
    private baseUrl: string;

    constructor(baseUrl = 'http://localhost:3001') {
        this.baseUrl = baseUrl;
    }

    async createEmbedding(request: EmbeddingsRequest): Promise<EmbeddingsResponse> {
        const response = await fetch(`${this.baseUrl}/v1/embeddings`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(request),
        });
        return response.json();
    }

    async createChatCompletion(request: ChatRequest): Promise<ChatResponse> {
        const response = await fetch(`${this.baseUrl}/v1/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(request),
        });
        return response.json();
    }
}
