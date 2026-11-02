import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BackendToolDefinition, ExecutionContext } from './interfaces/tool.interface';
import { ToolExecutionResult, ToolDefinitionDto } from '@vac/shared';
import {
  listFilesTool,
  readFileTool,
  searchCodeTool,
  getFileInfoTool,
  gitStatusTool,
} from './implementations/readonly-tools';
import {
  createFileTool,
  editFileTool,
  writeFileTool,
} from './implementations/write-tools';
import {
  runBuildTool,
  runTestsTool,
} from './implementations/execution-tools';
import {
  gitCommitTool,
  gitPushTool,
  deployApplicationTool,
} from './implementations/approval-tools';

export interface PermissionCheckResult {
  allowed: boolean;
  requiresApproval: boolean;
  reason?: string;
}

@Injectable()
export class ToolRegistryService implements OnModuleInit {
  private readonly logger = new Logger(ToolRegistryService.name);
  private readonly registry = new Map<string, BackendToolDefinition>();

  constructor(private readonly prisma: PrismaService) {}

  onModuleInit() {
    this.registerDefaults();
  }

  private registerDefaults() {
    // 1. Read-Only Tools
    this.registerTool(listFilesTool);
    this.registerTool(readFileTool);
    this.registerTool(searchCodeTool);
    this.registerTool(getFileInfoTool);
    this.registerTool(gitStatusTool);

    // 2. Write Tools
    this.registerTool(createFileTool);
    this.registerTool(editFileTool);
    this.registerTool(writeFileTool);

    // 3. Execution Tools
    this.registerTool(runBuildTool);
    this.registerTool(runTestsTool);

    // 4. Approval-Based Tools
    this.registerTool(gitCommitTool);
    this.registerTool(gitPushTool);
    this.registerTool(deployApplicationTool);

    this.logger.log(`Initialized ToolRegistry with ${this.registry.size} verified backend tools.`);
  }

  registerTool(tool: BackendToolDefinition) {
    if (this.registry.has(tool.name)) {
      this.logger.warn(`Overwriting previously registered tool '${tool.name}'`);
    }
    this.registry.set(tool.name, tool);
  }

  getTool(name: string): BackendToolDefinition | undefined {
    return this.registry.get(name);
  }

  getAllTools(): BackendToolDefinition[] {
    return Array.from(this.registry.values());
  }

  getToolsSummary(): ToolDefinitionDto[] {
    return this.getAllTools().map((t) => ({
      name: t.name,
      description: t.description,
      parameters: t.parameters,
      riskLevel: t.riskLevel,
      requiresApproval: t.requiresApproval,
    }));
  }

  /**
   * Translates registered tools into Ollama function calling schema format
   */
  getOllamaToolDeclarations(allowedToolNames?: string[]): any[] {
    return this.getAllTools()
      .filter((tool) => !allowedToolNames || allowedToolNames.includes(tool.name))
      .map((tool) => ({
        type: 'function',
        function: {
          name: tool.name,
          description: tool.description,
          parameters: tool.parameters,
        },
      }));
  }

  /**
   * Server-side permission check against employee runtime configuration
   */
  checkPermission(tool: BackendToolDefinition, context: ExecutionContext): PermissionCheckResult {
    // Critical tools ALWAYS require approval
    if (tool.riskLevel === 'CRITICAL' || tool.requiresApproval) {
      return {
        allowed: true,
        requiresApproval: true,
        reason: `Tool '${tool.name}' has risk level '${tool.riskLevel}' and requires explicit approval.`,
      };
    }

    const perms = context.permissionConfig;

    // Check write permissions
    if (['create_file', 'edit_file', 'write_file'].includes(tool.name)) {
      if (perms?.allowFileSystemWrite === false) {
        return {
          allowed: false,
          requiresApproval: false,
          reason: `Agent permissions explicitly forbid file system write operations.`,
        };
      }
    }

    // Check supervised autonomy setting
    if (context.autonomyLevel === 'SUPERVISED' && perms?.requireApprovalForExecution) {
      if (['MEDIUM', 'HIGH'].includes(tool.riskLevel)) {
        return {
          allowed: true,
          requiresApproval: true,
          reason: `Employee is configured with SUPERVISED autonomy and requires approval for '${tool.name}'.`,
        };
      }
    }

    return {
      allowed: true,
      requiresApproval: false,
    };
  }

  /**
   * Securely executes a tool with input schema validation, permission checks, and database audit logging
   */
  async executeTool(
    name: string,
    input: any,
    context: ExecutionContext,
  ): Promise<ToolExecutionResult> {
    const tool = this.registry.get(name);

    if (!tool) {
      return {
        success: false,
        error: `Tool '${name}' is not recognized in the backend Tool Registry.`,
      };
    }

    // Check permissions
    const permission = this.checkPermission(tool, context);

    if (!permission.allowed) {
      // Log blocked execution
      await this.logExecution(context.taskExecutionId, name, input, {
        success: false,
        error: permission.reason,
      }, 'BLOCKED', tool.riskLevel);

      return {
        success: false,
        error: permission.reason || `Tool execution blocked by security policy.`,
      };
    }

    if (permission.requiresApproval) {
      // Create Approval Request in database
      const approval = await this.prisma.approvalRequest.create({
        data: {
          taskId: context.taskId,
          taskExecutionId: context.taskExecutionId,
          toolName: name,
          actionSummary: `Execute tool '${name}' with parameters: ${JSON.stringify(input)}`,
          input: input || {},
          riskLevel: tool.riskLevel,
          status: 'PENDING',
        },
      });

      // Update Task status to WAITING_APPROVAL
      await this.prisma.task.update({
        where: { id: context.taskId },
        data: { status: 'WAITING_APPROVAL' },
      });

      // Log execution state
      await this.logExecution(context.taskExecutionId, name, input, {
        success: false,
        error: `Action requires human approval. Approval Request ID: ${approval.id}`,
      }, 'APPROVAL_REQUIRED', tool.riskLevel);

      return {
        success: false,
        error: `Action requires human approval. Approval Request ID: ${approval.id}. Task paused in WAITING_APPROVAL state.`,
      };
    }

    // Execute tool within sandbox
    const startTime = Date.now();
    try {
      const result = await tool.execute(input || {}, context);
      const durationMs = Date.now() - startTime;
      result.durationMs = durationMs;

      // Log successful/failed tool execution
      await this.logExecution(
        context.taskExecutionId,
        name,
        input,
        result,
        result.success ? 'SUCCESS' : 'FAILURE',
        tool.riskLevel,
        durationMs,
        result.exitCode,
      );

      return result;
    } catch (err: any) {
      const durationMs = Date.now() - startTime;
      const errorResult: ToolExecutionResult = {
        success: false,
        error: err.message || `Unhandled exception during tool execution.`,
        durationMs,
      };

      await this.logExecution(
        context.taskExecutionId,
        name,
        input,
        errorResult,
        'FAILURE',
        tool.riskLevel,
        durationMs,
      );

      return errorResult;
    }
  }

  private async logExecution(
    taskExecutionId: string,
    toolName: string,
    input: any,
    output: any,
    status: 'SUCCESS' | 'FAILURE' | 'BLOCKED' | 'APPROVAL_REQUIRED',
    riskLevel: string,
    durationMs?: number,
    exitCode?: number,
  ) {
    try {
      if (taskExecutionId) {
        await this.prisma.toolExecutionLog.create({
          data: {
            taskExecutionId,
            toolName,
            input: input || {},
            output: output || {},
            status,
            riskLevel,
            durationMs,
            exitCode,
            error: output?.error || null,
          },
        });
      }
    } catch (err) {
      this.logger.error(`Failed to persist tool execution log: ${err}`);
    }
  }
}
