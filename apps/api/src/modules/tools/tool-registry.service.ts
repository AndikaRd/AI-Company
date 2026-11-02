import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BackendToolDefinition, ExecutionContext } from './interfaces/tool.interface';
import { ToolExecutionResult, ToolDefinitionDto } from '@vac/shared';
import { LogSanitizer } from './security/log-sanitizer';
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
   * Server-side permission check against employee runtime configuration & autonomy level.
   * Defines explicit behavior for:
   * - MANUAL
   * - SUPERVISED
   * - AUTONOMOUS
   */
  checkPermission(tool: BackendToolDefinition, context: ExecutionContext): PermissionCheckResult {
    // 1. Check if tool is explicitly granted in employee's toolsEnabled
    if (context.toolsEnabled && Array.isArray(context.toolsEnabled)) {
      if (!context.toolsEnabled.includes(tool.name)) {
        return {
          allowed: false,
          requiresApproval: false,
          reason: `Unauthorized tool execution: Tool '${tool.name}' is not in employee's granted tools list.`,
        };
      }
    }

    const perms = context.permissionConfig;

    // 2. Permanently Prohibited Actions via Permission Policies
    if (['create_file', 'edit_file', 'write_file'].includes(tool.name)) {
      if (perms?.allowFileSystemWrite === false) {
        return {
          allowed: false,
          requiresApproval: false,
          reason: `Permanently prohibited: Agent permissions explicitly forbid file system write operations.`,
        };
      }
    }

    if (['run_build', 'run_tests'].includes(tool.name)) {
      if (perms?.allowCommandExecution === false) {
        return {
          allowed: false,
          requiresApproval: false,
          reason: `Permanently prohibited: Agent permissions explicitly forbid command execution operations.`,
        };
      }
    }

    // 3. CRITICAL Risk Level Tools: Permanently require explicit CEO approval across ALL autonomy levels
    if (tool.riskLevel === 'CRITICAL') {
      return {
        allowed: true,
        requiresApproval: true,
        reason: `Tool '${tool.name}' has CRITICAL risk level and permanently requires explicit CEO approval.`,
      };
    }

    // 4. MANUAL Autonomy Level:
    // Read-only tools allowed with logging. ALL mutating or execution tools require human approval.
    if (context.autonomyLevel === 'MANUAL') {
      if (tool.riskLevel === 'READ_ONLY') {
        return { allowed: true, requiresApproval: false };
      }
      return {
        allowed: true,
        requiresApproval: true,
        reason: `Employee has MANUAL autonomy. Human approval required for all mutating and execution operations ('${tool.name}').`,
      };
    }

    // 5. SUPERVISED Autonomy Level (Default):
    // Read-only tools allowed. Low risk allowed unless strict approval configured.
    // Medium risk allowed unless strict approval configured. High risk always requires approval.
    if (context.autonomyLevel === 'SUPERVISED') {
      if (tool.riskLevel === 'READ_ONLY') {
        return { allowed: true, requiresApproval: false };
      }

      if (tool.riskLevel === 'HIGH' || tool.requiresApproval) {
        return {
          allowed: true,
          requiresApproval: true,
          reason: `Tool '${tool.name}' has risk level '${tool.riskLevel}' and requires supervisor approval under SUPERVISED autonomy.`,
        };
      }

      if (['LOW', 'MEDIUM'].includes(tool.riskLevel) && perms?.requireApprovalForExecution) {
        return {
          allowed: true,
          requiresApproval: true,
          reason: `Employee configured with strict approval required for '${tool.name}'.`,
        };
      }

      return { allowed: true, requiresApproval: false };
    }

    // 6. AUTONOMOUS Autonomy Level:
    // Read-only, Low, and Medium risk tools are automatically allowed with logging.
    // High risk tools require approval if marked requiresApproval.
    if (context.autonomyLevel === 'AUTONOMOUS') {
      if (tool.riskLevel === 'HIGH' && tool.requiresApproval) {
        return {
          allowed: true,
          requiresApproval: true,
          reason: `Tool '${tool.name}' requires explicit approval before remote operations.`,
        };
      }
      return { allowed: true, requiresApproval: false };
    }

    // Fallback if tool explicitly mandates approval
    if (tool.requiresApproval) {
      return {
        allowed: true,
        requiresApproval: true,
        reason: `Tool '${tool.name}' requires explicit approval.`,
      };
    }

    return {
      allowed: true,
      requiresApproval: false,
    };
  }

  /**
   * Securely executes a tool with input schema validation, permission checks, and sanitized database audit logging
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

    // Input schema validation
    const validationError = this.validateInputSchema(tool, input);
    if (validationError) {
      await this.logExecution(
        context.taskExecutionId,
        name,
        input,
        { success: false, error: validationError },
        'FAILURE',
        tool.riskLevel,
      );
      return {
        success: false,
        error: validationError,
      };
    }

    // Check permissions
    const permission = this.checkPermission(tool, context);

    if (!permission.allowed) {
      // Log blocked execution
      await this.logExecution(
        context.taskExecutionId,
        name,
        input,
        { success: false, error: permission.reason },
        'BLOCKED',
        tool.riskLevel,
      );

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
          actionSummary: `Execute tool '${name}' with parameters: ${JSON.stringify(LogSanitizer.sanitize(input))}`,
          input: (LogSanitizer.sanitize(input) as any) || {},
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
      await this.logExecution(
        context.taskExecutionId,
        name,
        input,
        {
          success: false,
          error: `Action requires human approval. Approval Request ID: ${approval.id}`,
        },
        'APPROVAL_REQUIRED',
        tool.riskLevel,
      );

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

  /**
   * Validates required parameters against tool parameters schema
   */
  private validateInputSchema(tool: BackendToolDefinition, input: any): string | null {
    if (!input || typeof input !== 'object') {
      return `Validation error: Expected JSON object arguments for tool '${tool.name}'.`;
    }

    const requiredProps = tool.parameters?.required;
    if (Array.isArray(requiredProps)) {
      for (const prop of requiredProps) {
        if (input[prop] === undefined || input[prop] === null || input[prop] === '') {
          return `Validation error: Missing required property '${prop}' for tool '${tool.name}'.`;
        }
      }
    }

    return null;
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
        const sanitizedInput = LogSanitizer.sanitize(input || {});
        const sanitizedOutput = LogSanitizer.sanitize(output || {});

        await this.prisma.toolExecutionLog.create({
          data: {
            taskExecutionId,
            toolName,
            input: sanitizedInput,
            output: sanitizedOutput,
            status,
            riskLevel,
            durationMs,
            exitCode,
            error: output?.error ? LogSanitizer.sanitizeString(String(output.error)) : null,
          },
        });
      }
    } catch (err) {
      this.logger.error(`Failed to persist tool execution log: ${err}`);
    }
  }
}
