import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface OllamaModelInfo {
  name: string;
  model: string;
  parameterSize?: string;
  quantizationLevel?: string;
  capabilities: string[];
  contextLength?: number;
}

export interface OllamaChatPayload {
  model: string;
  messages: Array<{
    role: 'system' | 'user' | 'assistant' | 'tool';
    content: string;
    tool_calls?: any[];
  }>;
  tools?: any[];
  temperature?: number;
  maxTokens?: number;
  think?: boolean;
}

export interface OllamaChatResult {
  content: string;
  thinking?: string;
  toolCalls?: Array<{
    id?: string;
    function: {
      name: string;
      arguments: Record<string, any>;
    };
  }>;
  evalCount?: number;
  promptEvalCount?: number;
  durationMs: number;
  model: string;
}

@Injectable()
export class OllamaService {
  private readonly logger = new Logger(OllamaService.name);
  private readonly baseUrl: string;
  private readonly defaultModel: string;
  private readonly requestTimeoutMs = 60000;

  constructor(private readonly configService: ConfigService) {
    const aiConfig = this.configService.get('app.ai');
    this.baseUrl = (aiConfig?.ollama?.baseUrl || 'http://localhost:11434').replace(/\/$/, '');
    this.defaultModel = aiConfig?.ollama?.defaultModel || 'qwen3.5:4b';
  }

  async checkHealth(): Promise<{
    available: boolean;
    latencyMs: number;
    baseUrlSafe: string;
    version?: string;
  }> {
    const start = performance.now();
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${this.baseUrl}/api/version`, {
        signal: controller.signal,
      });
      clearTimeout(timeout);

      const latencyMs = Math.round(performance.now() - start);

      if (!response.ok) {
        return { available: false, latencyMs, baseUrlSafe: 'Ollama service offline' };
      }

      const data = (await response.json()) as { version?: string };
      return {
        available: true,
        latencyMs,
        baseUrlSafe: 'Connected (localhost:11434)',
        version: data.version,
      };
    } catch (err: any) {
      const latencyMs = Math.round(performance.now() - start);
      this.logger.warn(`Ollama health check failed: ${err.message}`);
      return {
        available: false,
        latencyMs,
        baseUrlSafe: 'Unreachable',
      };
    }
  }

  async listModels(): Promise<OllamaModelInfo[]> {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${this.baseUrl}/api/tags`, {
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = (await response.json()) as { models?: any[] };
      const models = data.models || [];

      return models.map((m) => ({
        name: m.name,
        model: m.model,
        parameterSize: m.details?.parameter_size,
        quantizationLevel: m.details?.quantization_level,
        capabilities: m.capabilities || [],
        contextLength: m.details?.context_length,
      }));
    } catch (err: any) {
      this.logger.error(`Failed to list Ollama models: ${err.message}`);
      return [];
    }
  }

  async verifyModel(modelName: string): Promise<{
    available: boolean;
    capabilities: string[];
    parameterSize?: string;
  }> {
    const models = await this.listModels();
    const cleanTarget = modelName.trim().toLowerCase();

    const matched = models.find(
      (m) =>
        m.name.toLowerCase() === cleanTarget ||
        m.model.toLowerCase() === cleanTarget ||
        m.name.toLowerCase().startsWith(`${cleanTarget}:`),
    );

    if (!matched) {
      return { available: false, capabilities: [] };
    }

    return {
      available: true,
      capabilities: matched.capabilities,
      parameterSize: matched.parameterSize,
    };
  }

  async chat(payload: OllamaChatPayload): Promise<OllamaChatResult> {
    const targetModel = payload.model || this.defaultModel;
    const startTime = performance.now();

    const requestBody: Record<string, any> = {
      model: targetModel,
      messages: payload.messages,
      stream: false,
      think: payload.think ?? false,
      options: {
        temperature: payload.temperature ?? 0.7,
        num_predict: payload.maxTokens ?? 2048,
      },
    };

    if (payload.tools && payload.tools.length > 0) {
      requestBody.tools = payload.tools;
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), this.requestTimeoutMs);

      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      const durationMs = Math.round(performance.now() - startTime);

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        throw new HttpException(
          `Ollama inference error (${response.status}): ${errorText || response.statusText}`,
          HttpStatus.BAD_GATEWAY,
        );
      }

      const result = (await response.json()) as any;
      const message = result.message || {};

      this.logger.log(
        `Ollama inference completed for [${targetModel}] in ${durationMs}ms (eval_count: ${result.eval_count || 0})`,
      );

      return {
        content: message.content || '',
        thinking: message.thinking || undefined,
        toolCalls: message.tool_calls || undefined,
        evalCount: result.eval_count,
        promptEvalCount: result.prompt_eval_count,
        durationMs,
        model: targetModel,
      };
    } catch (err: any) {
      const durationMs = Math.round(performance.now() - startTime);
      if (err.name === 'AbortError') {
        throw new HttpException(
          `Ollama request timed out after ${this.requestTimeoutMs}ms`,
          HttpStatus.GATEWAY_TIMEOUT,
        );
      }
      if (err instanceof HttpException) {
        throw err;
      }
      this.logger.error(`Ollama network failure: ${err.message}`);
      throw new HttpException(
        `Unable to reach local Ollama AI runtime at ${this.baseUrl}: ${err.message}`,
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }
}

