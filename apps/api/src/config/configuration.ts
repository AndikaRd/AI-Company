export interface AiProviderConfig {
  defaultProvider: 'OLLAMA' | 'OPENAI' | 'ANTHROPIC';
  ollama: {
    baseUrl: string;
    defaultModel: string;
  };
  openai: {
    apiKey?: string;
    baseUrl?: string;
    defaultModel: string;
  };
}

export interface AppConfig {
  port: number;
  nodeEnv: string;
  apiPrefix: string;
  corsOrigin: string;
  databaseUrl: string;
  ai: AiProviderConfig;
}

export default (): { app: AppConfig } => ({
  app: {
    port: parseInt(process.env.PORT || '3000', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    apiPrefix: process.env.API_PREFIX || '/api',
    corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    databaseUrl: process.env.DATABASE_URL || '',
    ai: {
      defaultProvider: (process.env.AI_DEFAULT_PROVIDER as any) || 'OLLAMA',
      ollama: {
        baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
        defaultModel: process.env.OLLAMA_DEFAULT_MODEL || 'qwen3.5:4b',
      },
      openai: {
        apiKey: process.env.OPENAI_API_KEY,
        baseUrl: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
        defaultModel: process.env.OPENAI_DEFAULT_MODEL || 'gpt-4o',
      },
    },
  },
});
