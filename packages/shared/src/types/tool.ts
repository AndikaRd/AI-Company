export type ToolRiskLevel = 'READ_ONLY' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type ToolCallStatus = 'SUCCESS' | 'FAILURE' | 'BLOCKED' | 'APPROVAL_REQUIRED';

export interface ToolParameterProperty {
  type: string;
  description: string;
  enum?: string[];
  items?: Record<string, any>;
  default?: any;
}

export interface ToolParametersSchema {
  type: 'object';
  properties: Record<string, ToolParameterProperty>;
  required?: string[];
}

export interface ToolDefinitionDto {
  name: string;
  description: string;
  parameters: ToolParametersSchema;
  riskLevel: ToolRiskLevel;
  requiresApproval: boolean;
}

export interface ToolExecutionResult {
  success: boolean;
  data?: any;
  error?: string;
  exitCode?: number;
  stdout?: string;
  stderr?: string;
  durationMs?: number;
}
