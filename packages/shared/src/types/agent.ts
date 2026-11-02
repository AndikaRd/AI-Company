export type MemoryRetentionType = 'SESSION' | 'LONG_TERM';

export interface AgentConfiguration {
  id: string;
  employeeId: string;
  modelName: string;
  systemPrompt?: string | null;
  temperature: number;
  maxTokens: number;
  toolsEnabled?: Record<string, any> | string[] | null;
  memoryRetention: MemoryRetentionType;
  createdAt: string | Date;
  updatedAt: string | Date;
}
