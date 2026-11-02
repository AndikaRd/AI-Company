import { ToolRiskLevel, ToolParametersSchema, ToolExecutionResult } from '@vac/shared';
import { WorkspaceSandbox } from '../security/workspace-sandbox';

export interface ExecutionContext {
  taskId: string;
  taskExecutionId: string;
  employeeId: string;
  employeeName: string;
  autonomyLevel: string;
  sandbox: WorkspaceSandbox;
  permissionConfig?: {
    allowNetworkFetch?: boolean;
    allowFileSystemWrite?: boolean;
    requireApprovalForExecution?: boolean;
  };
}

export interface BackendToolDefinition {
  name: string;
  description: string;
  parameters: ToolParametersSchema;
  riskLevel: ToolRiskLevel;
  requiresApproval: boolean;
  execute(input: any, context: ExecutionContext): Promise<ToolExecutionResult>;
}
