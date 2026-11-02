import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ToolRegistryService } from '../tools/tool-registry.service';
import { OllamaService } from '../ollama/ollama.service';
import { WorkspaceSandbox } from '../tools/security/workspace-sandbox';
import { ExecutionContext } from '../tools/interfaces/tool.interface';
import * as path from 'path';
import * as fs from 'fs/promises';
import { existsSync } from 'fs';

@Injectable()
export class TaskRunnerService {
  private readonly logger = new Logger(TaskRunnerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly toolRegistry: ToolRegistryService,
    private readonly ollamaService: OllamaService,
  ) {}

  /**
   * Dispatches task execution in the background
   */
  async runTaskAsync(taskId: string): Promise<void> {
    // Run asynchronously without blocking HTTP caller
    setImmediate(async () => {
      try {
        await this.executeTask(taskId);
      } catch (err: any) {
        this.logger.error(`Task [${taskId}] execution failure: ${err.message}`, err.stack);
      }
    });
  }

  /**
   * Core Agent Execution Loop
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

    this.logger.log(`Starting execution for Task [${task.title}] (${taskId}) assigned to [${employee.firstName} ${employee.lastName}]`);

    // 1. Resolve workspace root
    let workspaceRoot = task.workspacePath;
    if (!workspaceRoot || !existsSync(workspaceRoot)) {
      workspaceRoot = path.resolve(process.cwd(), 'infrastructure', 'workspaces', `task-${taskId}`);
      await fs.mkdir(workspaceRoot, { recursive: true });
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

    // 3. Prepare ExecutionContext
    const context: ExecutionContext = {
      taskId: task.id,
      taskExecutionId: execution.id,
      employeeId: employee.id,
      employeeName: `${employee.firstName} ${employee.lastName}`,
      autonomyLevel: agentConfig.autonomyLevel,
      sandbox,
      permissionConfig: (agentConfig.permissionConfig as any) || undefined,
    };

    // 4. Construct Prompt & Message History
    const systemPrompt =
      `You are ${employee.firstName} ${employee.lastName}, ${employee.role} at Virtual AI Company (VAC).\n` +
      `Personality & Principles: ${employee.personality || 'Analytical, pragmatic, and thorough.'}\n` +
      `Primary Technical Domain: ${employee.primaryExpertise || 'Full-Stack Software Engineering'}\n\n` +
      `You are operating directly within an isolated workspace sandbox to complete the assigned engineering task.\n` +
      `WORKSPACE INSTRUCTIONS:\n` +
      `- Available tools: list_files, read_file, search_code, create_file, edit_file, write_file, run_build, run_tests, git_status, git_commit.\n` +
      `- Work sequentially:\n` +
      `  1. Inspect the workspace files with list_files or read_file.\n` +
      `  2. Run the build with run_build to see any compile errors.\n` +
      `  3. If run_build shows an error (e.g. in src/App.tsx), immediately read that file with read_file.\n` +
      `  4. Fix the bug using edit_file (pass path, target string to replace, and corrected replacement).\n` +
      `  5. Run run_build again to confirm the build succeeds with exit code 0.\n` +
      `  6. When the build succeeds, stop calling tools and output your final engineering report detailing the root cause, changes made, and build result.\n` +
      `- Do not attempt to traverse outside the workspace (e.g. "../" is forbidden by sandbox security).`;

    const messages: Array<{
      role: 'system' | 'user' | 'assistant' | 'tool';
      content: string;
      tool_calls?: any[];
    }> = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Task Title: ${task.title}\n\nTask Objective:\n${task.description}` },
    ];

    // Load available tools
    const tools = this.toolRegistry.getOllamaToolDeclarations();
    const maxIterations = 15;
    let iteration = 0;
    let completedSuccessfully = false;
    let finalSummary = '';

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

        for (const toolCall of response.toolCalls) {
          const toolName = toolCall.function.name;
          const toolArgs = toolCall.function.arguments;

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

        if (pausedForApproval) {
          // Task status is already set to WAITING_APPROVAL by toolRegistry
          return;
        }
      } else {
        // No tool calls: model has provided its final deliverable
        finalSummary = response.content;
        completedSuccessfully = true;
        break;
      }
    }

    if (completedSuccessfully) {
      this.logger.log(`[Task ${taskId}] Task completed successfully.`);
      await this.prisma.taskExecution.update({
        where: { id: execution.id },
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
    } else {
      this.logger.warn(`[Task ${taskId}] Reached iteration limit (${maxIterations}) without final answer.`);
      await this.prisma.taskExecution.update({
        where: { id: execution.id },
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
  }

  /**
   * Reviews an approval request and resumes task execution if approved
   */
  async reviewApproval(
    approvalId: string,
    approved: boolean,
    reviewedBy = 'CEO / Supervisor',
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

    if (approval.status !== 'PENDING') {
      throw new Error(`Approval request has already been reviewed (Status: ${approval.status}).`);
    }

    // Update approval record
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
      const workspaceRoot = approval.task.workspacePath || path.resolve(process.cwd(), 'infrastructure', 'workspaces', `task-${approval.taskId}`);
      const sandbox = new WorkspaceSandbox(workspaceRoot);
      const context: ExecutionContext = {
        taskId: approval.taskId,
        taskExecutionId: approval.taskExecutionId,
        employeeId: approval.task.assignedEmployeeId,
        employeeName: `${approval.task.assignedEmployee.firstName} ${approval.task.assignedEmployee.lastName}`,
        autonomyLevel: 'AUTONOMOUS', // Temporarily bypass check for the approved action
        sandbox,
      };

      const tool = this.toolRegistry.getTool(approval.toolName);
      if (tool) {
        await tool.execute(approval.input, context);
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
