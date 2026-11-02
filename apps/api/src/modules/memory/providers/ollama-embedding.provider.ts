import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IEmbeddingProvider } from './embedding-provider.interface';

@Injectable()
export class OllamaEmbeddingProvider implements IEmbeddingProvider {
  private readonly logger = new Logger(OllamaEmbeddingProvider.name);
  readonly name = 'OllamaEmbeddingProvider';
  private readonly baseUrl: string;
  private readonly modelName: string;
  private readonly dimension: number = 768;
  private isSupportedCache: boolean | null = null;

  constructor(private readonly configService: ConfigService) {
    const aiConfig = this.configService.get('app.ai');
    this.baseUrl = (aiConfig?.ollama?.baseUrl || 'http://localhost:11434').replace(/\/$/, '');
    this.modelName = aiConfig?.ollama?.embeddingModel || 'nomic-embed-text';
  }

  getDimension(): number {
    return this.dimension;
  }

  async isAvailable(): Promise<boolean> {
    if (this.isSupportedCache !== null) {
      return this.isSupportedCache;
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4000);

      const response = await fetch(`${this.baseUrl}/api/embed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: this.modelName, input: 'ping' }),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!response.ok) {
        this.isSupportedCache = false;
        return false;
      }

      const data = (await response.json()) as any;
      const available = Array.isArray(data.embeddings) && data.embeddings.length > 0;
      this.isSupportedCache = available;
      return available;
    } catch (err: any) {
      this.logger.debug(`Ollama embeddings offline or unsupported: ${err.message}`);
      this.isSupportedCache = false;
      return false;
    }
  }

  async generateEmbedding(text: string): Promise<number[] | null> {
    const supported = await this.isAvailable();
    if (!supported) {
      return null;
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);

      const response = await fetch(`${this.baseUrl}/api/embed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: this.modelName, input: text }),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!response.ok) {
        return null;
      }

      const data = (await response.json()) as any;
      if (Array.isArray(data.embeddings) && Array.isArray(data.embeddings[0])) {
        return data.embeddings[0];
      }

      return null;
    } catch (err: any) {
      this.logger.warn(`Failed to generate Ollama embedding: ${err.message}`);
      return null;
    }
  }
}
