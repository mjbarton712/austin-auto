import axios, { AxiosInstance } from 'axios';

interface ClaudeResponse {
    content: Array<{
        text: string;
        type: string;
    }>;
    role: string;
    model: string;
    id: string;
}

interface ClaudeOptions {
    maxTokens?: number;
    temperature?: number;
    model?: string;
}

export class ClaudeClient {
    private apiKey: string;
    private client: AxiosInstance;
    private defaultModel: string = 'claude-3-sonnet-20240229';

    constructor(apiKey: string) {
        this.apiKey = apiKey;
        this.client = axios.create({
            baseURL: 'https://api.anthropic.com/v1',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': this.apiKey,
                'anthropic-version': '2023-06-01'
            }
        });
    }

    async createMessage(prompt: string, options: ClaudeOptions = {}): Promise<string> {
        try {
            const response = await this.client.post<ClaudeResponse>('/messages', {
                model: options.model || this.defaultModel,
                max_tokens: options.maxTokens || 1024,
                temperature: options.temperature || 0.7,
                messages: [{
                    role: 'user',
                    content: prompt
                }]
            });

            return response.data.content[0].text;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                console.error('Error calling Claude API:', error.response?.data || error.message);
            }
            throw error;
        }
    }
}
