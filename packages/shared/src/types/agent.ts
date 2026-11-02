export type AiProvider = 'OLLAMA' | 'OPENAI' | 'ANTHROPIC';

export type AutonomyLevel = 'MANUAL' | 'SUPERVISED' | 'AUTONOMOUS';

export type MemoryRetentionType = 'SESSION' | 'LONG_TERM';

export interface AgentConfiguration {
  id: string;
  employeeId: string;
  provider: AiProvider;
  modelName: string;
  autonomyLevel: AutonomyLevel;
  systemPrompt?: string | null;
  temperature: number;
  maxTokens: number;
  toolsEnabled?: Record<string, any> | string[] | null;
  permissionConfig?: Record<string, any> | null;
  memoryRetention: MemoryRetentionType;
  memoryConfig?: Record<string, any> | null;
  createdAt: string | Date;
  updatedAt: string | Date;
}
