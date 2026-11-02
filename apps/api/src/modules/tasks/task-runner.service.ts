import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ToolRegistryService } from '../tools/tool-registry.service';
import { OllamaService } from '../ollama/ollama.service';
import { WorkspaceSandbox } from '../tools/security/workspace-sandbox';
import { ExecutionContext } from '../tools/interfaces/tool.interface';
import { TaskOrchestratorService } from './task-orchestrator.service';
import * as path from 'path';
import * as fs from 'fs/promises';
import { existsSync } from 'fs';

@Injectable()
export class TaskRunnerService {
  private readonly logger = new Logger(TaskRunnerService.name);
  private static readonly APPROVAL_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

  constructor(
    private readonly prisma: PrismaService,
    private readonly toolRegistry: ToolRegistryService,
    private readonly ollamaService: OllamaService,
    @Inject(forwardRef(() => TaskOrchestratorService))
    private readonly taskOrchestrator: TaskOrchestratorService,
  ) {}

  /**
   * Dispatches task execution asynchronously in background
   */
  async runTaskAsync(taskId: string): Promise<void> {
    setImmediate(async () => {
      try {
        await this.executeTask(taskId);
      } catch (err: any) {
        this.logger.error(`Task [${taskId}] execution failure: ${err.message}`, err.stack);
      }
    });
  }

  /**
   * Core Agent Execution Loop with Sandboxed Tools, Security Controls, and Loop Detection
   */
  async executeTask(taskId: string): Promise<void> {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: {
        assignedEmployee: {
          include: { agentConfig: true },
        },
      },
    });

    if (!task) {
      throw new NotFoundException(`Task [${taskId}] not found.`);
    }

    const employee = task.assignedEmployee;
    const agentConfig = employee.agentConfig;

    if (!agentConfig) {
      throw new Error(`Employee [${employee.id}] has no AgentConfiguration.`);
    }

    this.logger.log(
      `Starting execution for Task [${task.title}] (${taskId}) assigned to [${employee.firstName} ${employee.lastName}]`,
    );

    // 1. Resolve workspace root
    let workspaceRoot = task.workspacePath;
    if (!workspaceRoot || !existsSync(workspaceRoot)) {
      if (task.parentTaskId) {
        // Inherit parent project workspace to allow cross-subtask context sharing and verification
        const parent = await this.prisma.task.findUnique({
          where: { id: task.parentTaskId },
        });
        if (parent?.workspacePath && existsSync(parent.workspacePath)) {
          workspaceRoot = parent.workspacePath;
        } else {
          workspaceRoot = path.resolve(process.cwd(), 'infrastructure', 'workspaces', `task-${task.parentTaskId}`);
          await fs.mkdir(workspaceRoot, { recursive: true });
          if (parent) {
            await this.prisma.task.update({
              where: { id: parent.id },
              data: { workspacePath: workspaceRoot },
            });
          }
        }
      } else {
        workspaceRoot = path.resolve(process.cwd(), 'infrastructure', 'workspaces', `task-${taskId}`);
        await fs.mkdir(workspaceRoot, { recursive: true });
      }

      await this.prisma.task.update({
        where: { id: taskId },
        data: { workspacePath: workspaceRoot },
      });
    }

    const sandbox = new WorkspaceSandbox(workspaceRoot);

    // 2. Initialize or retrieve TaskExecution record
    let execution = await this.prisma.taskExecution.findFirst({
      where: { taskId, status: { in: ['PLANNING', 'IN_PROGRESS', 'WAITING_APPROVAL'] } },
      orderBy: { startedAt: 'desc' },
    });

    if (!execution) {
      execution = await this.prisma.taskExecution.create({
        data: {
          taskId,
          employeeId: employee.id,
          status: 'IN_PROGRESS',
        },
      });
    } else {
      await this.prisma.taskExecution.update({
        where: { id: execution.id },
        data: { status: 'IN_PROGRESS' },
      });
    }

    await this.prisma.task.update({
      where: { id: taskId },
      data: { status: 'IN_PROGRESS' },
    });

    const executionId = execution.id;

    // 3. Prepare ExecutionContext with explicit tool grants and permissions
    const toolsEnabled = Array.isArray(agentConfig.toolsEnabled)
      ? (agentConfig.toolsEnabled as string[])
      : undefined;

    const context: ExecutionContext = {
      taskId: task.id,
      taskExecutionId: executionId,
      employeeId: employee.id,
      employeeName: `${employee.firstName} ${employee.lastName}`,
      autonomyLevel: agentConfig.autonomyLevel,
      sandbox,
      toolsEnabled,
      permissionConfig: (agentConfig.permissionConfig as any) || undefined,
    };

    // 4. Construct Prompt & Message History using employee's unique AgentConfiguration persona
    const employeePersona = agentConfig.systemPrompt ||
      `You are ${employee.firstName} ${employee.lastName}, ${employee.role} at Virtual AI Company (VAC).\n` +
      `Personality & Principles: ${employee.personality || 'Analytical, pragmatic, and thorough.'}\n` +
      `Primary Technical Domain: ${employee.primaryExpertise || 'Full-Stack Software Engineering'}`;

    const systemPrompt =
      `${employeePersona}\n\n` +
      `You are operating directly within an isolated workspace sandbox to complete the assigned task.\n` +
      `WORKSPACE INSTRUCTIONS:\n` +
      `- Available tools: ${(toolsEnabled || []).join(', ')}.\n` +
      `- Work sequentially to accomplish your assigned responsibilities:\n` +
      `  1. Inspect the workspace files with list_files or read_file.\n` +
      `  2. Execute your specific deliverables (specifying architecture, implementing code, or writing tests).\n` +
      `  3. Use run_build or run_tests to verify your work when appropriate.\n` +
      `  4. When your work is complete, provide a comprehensive final deliverable summary.\n` +
      `- Do not attempt to traverse outside the workspace (e.g. "../" is forbidden by sandbox security).`;

    const messages: Array<{
      role: 'system' | 'user' | 'assistant' | 'tool';
      content: string;
      tool_calls?: any[];
    }> = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Task Title: ${task.title}\n\nTask Objective:\n${task.description}` },
    ];

    // Load available tools restricted to employee's enabled tools
    const tools = this.toolRegistry.getOllamaToolDeclarations(toolsEnabled);
    const maxIterations = 15;
    let iteration = 0;
    let completedSuccessfully = false;
    let finalSummary = '';
    const recentToolSignatures: string[] = [];

    try {
      while (iteration < maxIterations) {
        iteration++;
        this.logger.log(`[Task ${taskId}] Reasoning iteration ${iteration}/${maxIterations}`);

        const response = await this.ollamaService.chat({
          model: agentConfig.modelName,
          messages: messages as any,
          tools,
          think: false,
          temperature: agentConfig.temperature || 0.4,
        });

        // Check if model called tools
        if (response.toolCalls && response.toolCalls.length > 0) {
          messages.push({
            role: 'assistant',
            content: response.content || '',
            tool_calls: response.toolCalls,
          });

          let pausedForApproval = false;
          let loopDetected = false;

          for (const toolCall of response.toolCalls) {
            const toolName = toolCall.function.name;
            const toolArgs = toolCall.function.arguments;

            // Loop Detection: Check for repeated failing tool calls
            const callSignature = `${toolName}:${JSON.stringify(toolArgs)}`;
            recentToolSignatures.push(callSignature);
            if (recentToolSignatures.length > 3) {
              recentToolSignatures.shift();
            }

            if (
              recentToolSignatures.length === 3 &&
              recentToolSignatures[0] === recentToolSignatures[1] &&
              recentToolSignatures[1] === recentToolSignatures[2]
            ) {
              this.logger.warn(`[Task ${taskId}] Loop detected: tool '${toolName}' called 3 times identically.`);
              loopDetected = true;
              break;
            }

            this.logger.log(`[Task ${taskId}] Executing tool '${toolName}' with arguments: ${JSON.stringify(toolArgs)}`);
            const result = await this.toolRegistry.executeTool(toolName, toolArgs, context);

            // Check if execution was paused for human approval
            if (!result.success && result.error?.includes('human approval')) {
              this.logger.warn(`[Task ${taskId}] Execution paused: human approval required for tool '${toolName}'`);
              pausedForApproval = true;
              break;
            }

            const responseData = result.success ? result.data : { error: result.error };
            messages.push({
              role: 'tool',
              content: typeof responseData === 'string' ? responseData : JSON.stringify(responseData),
            });
          }

          if (loopDetected) {
            await this.prisma.taskExecution.update({
              where: { id: executionId },
              data: {
                status: 'REVIEW',
                summary: 'Repeated failing tool call loop detected. Execution paused for supervisor review.',
                completedAt: new Date(),
              },
            });
            await this.prisma.task.update({
              where: { id: taskId },
              data: { status: 'REVIEW' },
            });
            return;
          }

          if (pausedForApproval) {
            // Task status is set to WAITING_APPROVAL by toolRegistry
            return;
          }
        } else {
          // No tool calls: model provided its final deliverable
          finalSummary = response.content;

          // Reliability Guard: Ensure tasks cannot become COMPLETED after an unsuccessful build
          const lastBuildLog = await this.prisma.toolExecutionLog.findFirst({
            where: {
              taskExecutionId: executionId,
              toolName: { in: ['run_build', 'run_tests'] },
            },
            orderBy: { createdAt: 'desc' },
          });

          if (lastBuildLog && (lastBuildLog.exitCode !== 0 || lastBuildLog.status === 'FAILURE')) {
            this.logger.warn(
              `[Task ${taskId}] Final build verification failed (exit code: ${lastBuildLog.exitCode}). Marking REVIEW instead of COMPLETED.`,
            );
            await this.prisma.taskExecution.update({
              where: { id: executionId },
              data: {
                status: 'REVIEW',
                summary: `Verification failed: Application build exited with error (code ${lastBuildLog.exitCode}). Supervisor review required.`,
                completedAt: new Date(),
              },
            });
            await this.prisma.task.update({
              where: { id: taskId },
              data: { status: 'REVIEW' },
            });
            return;
          }

          completedSuccessfully = true;
          break;
        }
      }

      if (completedSuccessfully) {
        this.logger.log(`[Task ${taskId}] Task completed successfully.`);
        await this.prisma.taskExecution.update({
          where: { id: executionId },
          data: {
            status: 'COMPLETED',
            summary: finalSummary,
            completedAt: new Date(),
          },
        });

        await this.prisma.task.update({
          where: { id: taskId },
          data: {
            status: 'COMPLETED',
            deliverables: {
              summary: finalSummary,
              completedAt: new Date().toISOString(),
            },
          },
        });

        // If this is a subtask with a delegator, emit TASK_COMPLETED message to delegator
        if (task.delegatedByEmployeeId) {
          try {
            await this.prisma.agentMessage.create({
              data: {
                senderEmployeeId: employee.id,
                recipientEmployeeId: task.delegatedByEmployeeId,
                taskId: task.id,
                correlationId: task.parentTaskId || task.id,
                messageType: 'TASK_COMPLETED',
                content: `Completed subtask "${task.title}". Deliverable: ${finalSummary.slice(0, 500)}`,
                payload: {
                  subtaskId: task.id,
                  subtaskTitle: task.title,
                  summary: finalSummary,
                  completedAt: new Date().toISOString(),
                },
              },
            });
            this.logger.log(`[Task ${taskId}] Emitted TASK_COMPLETED message from ${employee.firstName} to supervisor.`);
          } catch (msgErr: any) {
            this.logger.warn(`Failed to emit TASK_COMPLETED message: ${msgErr.message}`);
          }
        }

        // If this is a subtask, notify orchestrator to verify parent task completion
        if (task.parentTaskId) {
          try {
            await this.taskOrchestrator.checkParentTaskCompletion(task.parentTaskId);
          } catch (orchErr: any) {
            this.logger.warn(`Failed to check parent task completion: ${orchErr.message}`);
          }
        }
      } else {
        this.logger.warn(`[Task ${taskId}] Reached iteration limit (${maxIterations}) without final answer.`);
        await this.prisma.taskExecution.update({
          where: { id: executionId },
          data: {
            status: 'REVIEW',
            summary: `Reached maximum iterations (${maxIterations}). Awaiting supervisor review.`,
            completedAt: new Date(),
          },
        });

        await this.prisma.task.update({
          where: { id: taskId },
          data: { status: 'REVIEW' },
        });
      }
    } catch (err: any) {
      this.logger.error(`[Task ${taskId}] Unhandled execution error: ${err.message}`, err.stack);

      // Reliability Guard: Update state to FAILED so task never remains stuck in IN_PROGRESS
      await this.prisma.taskExecution.update({
        where: { id: executionId },
        data: {
          status: 'FAILED',
          summary: `Execution aborted due to runtime error: ${err.message}`,
          completedAt: new Date(),
        },
      });

      await this.prisma.task.update({
        where: { id: taskId },
        data: {
          status: 'FAILED',
          deliverables: {
            error: err.message,
            failedAt: new Date().toISOString(),
          },
        },
      });
    }
  }

  /**
   * Reviews an approval request with strict authorization, expiration, and duplicate guards
   */
  async reviewApproval(
    approvalId: string,
    approved: boolean,
    reviewedBy = 'CEO',
    rejectionReason?: string,
  ): Promise<any> {
    const approval = await this.prisma.approvalRequest.findUnique({
      where: { id: approvalId },
      include: {
        task: {
          include: {
            assignedEmployee: { include: { agentConfig: true } },
          },
        },
        taskExecution: true,
      },
    });

    if (!approval) {
      throw new NotFoundException(`Approval request [${approvalId}] not found.`);
    }

    const assignedEmployee = approval.task.assignedEmployee;

    // 1. Duplicate Approval Prevention
    if (approval.status !== 'PENDING') {
      throw new BadRequestException(
        `Approval request [${approvalId}] has already been reviewed (Status: ${approval.status}). Duplicate review is prohibited.`,
      );
    }

    // 2. Self-Approval Guard: AI Employee must never approve its own requests
    const reviewerClean = (reviewedBy || '').trim().toLowerCase();
    const isSelfApproval =
      reviewerClean === assignedEmployee.id.toLowerCase() ||
      reviewerClean === assignedEmployee.employeeCode.toLowerCase() ||
      reviewerClean === assignedEmployee.firstName.toLowerCase() ||
      reviewerClean === `${assignedEmployee.firstName} ${assignedEmployee.lastName}`.toLowerCase() ||
      reviewerClean === 'alex' ||
      reviewerClean === 'employee' ||
      reviewerClean === 'ai_employee';

    if (isSelfApproval) {
      throw new BadRequestException(
        `Security violation: AI Employee '${assignedEmployee.firstName} ${assignedEmployee.lastName}' is strictly prohibited from approving its own operations.`,
      );
    }

    // 3. Authorization Check: Only authorized CEO / Supervisor identities may approve sensitive operations
    const authorizedRoles = ['ceo', 'supervisor', 'admin', 'tech_lead', 'director'];
    const isAuthorized = authorizedRoles.some((role) => reviewerClean.includes(role));

    if (!isAuthorized) {
      throw new ForbiddenException(
        `Unauthorized approval: Reviewer '${reviewedBy}' is not authorized to approve '${approval.riskLevel}' risk operations. Only CEO or Supervisor roles may grant approval.`,
      );
    }

    // 4. Expiration Guard (24 hour TTL)
    const createdAtMs = new Date(approval.createdAt).getTime();
    if (Date.now() - createdAtMs > TaskRunnerService.APPROVAL_TTL_MS) {
      await this.prisma.approvalRequest.update({
        where: { id: approvalId },
        data: {
          status: 'REJECTED',
          reviewedBy: 'SYSTEM_EXPIRATION_MONITOR',
          reviewedAt: new Date(),
          rejectionReason: 'EXPIRED: Exceeded 24-hour approval window.',
        },
      });

      throw new BadRequestException(
        `Approval request [${approvalId}] has expired (exceeded 24-hour window). Re-run the task to generate a fresh approval request.`,
      );
    }

    // 5. Update Approval Record
    const updatedApproval = await this.prisma.approvalRequest.update({
      where: { id: approvalId },
      data: {
        status: approved ? 'APPROVED' : 'REJECTED',
        reviewedBy,
        reviewedAt: new Date(),
        rejectionReason: approved ? null : rejectionReason || 'Rejected by supervisor',
      },
    });

    if (approved) {
      this.logger.log(`Approval [${approvalId}] APPROVED for tool '${approval.toolName}'. Resuming task [${approval.taskId}].`);

      // Execute the approved tool directly
      const workspaceRoot =
        approval.task.workspacePath ||
        path.resolve(process.cwd(), 'infrastructure', 'workspaces', `task-${approval.taskId}`);
      const sandbox = new WorkspaceSandbox(workspaceRoot);
      const context: ExecutionContext = {
        taskId: approval.taskId,
        taskExecutionId: approval.taskExecutionId,
        employeeId: approval.task.assignedEmployeeId,
        employeeName: `${approval.task.assignedEmployee.firstName} ${approval.task.assignedEmployee.lastName}`,
        autonomyLevel: 'AUTONOMOUS', // Temporarily bypass check for the explicitly approved action
        sandbox,
      };

      const tool = this.toolRegistry.getTool(approval.toolName);
      if (tool) {
        const result = await tool.execute(approval.input, context);

        // Record execution outcome in audit logs
        await this.prisma.toolExecutionLog.create({
          data: {
            taskExecutionId: approval.taskExecutionId,
            toolName: approval.toolName,
            input: (approval.input as any) || {},
            output: (result.data as any) || {},
            status: result.success ? 'SUCCESS' : 'FAILURE',
            riskLevel: approval.riskLevel,
            durationMs: result.durationMs,
            exitCode: result.exitCode,
            error: result.error || null,
          },
        });

        if (!result.success) {
          this.logger.error(`Approved execution for '${approval.toolName}' failed: ${result.error}`);
          await this.prisma.task.update({
            where: { id: approval.taskId },
            data: { status: 'REVIEW' },
          });
          return updatedApproval;
        }
      }

      // Resume task execution in background
      await this.runTaskAsync(approval.taskId);
    } else {
      this.logger.log(`Approval [${approvalId}] REJECTED. Task [${approval.taskId}] set to REVIEW.`);
      await this.prisma.task.update({
        where: { id: approval.taskId },
        data: { status: 'REVIEW' },
      });
    }

    return updatedApproval;
  }
}
