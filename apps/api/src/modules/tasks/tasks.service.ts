import { Injectable, Logger, NotFoundException, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TaskRunnerService } from './task-runner.service';
import { CreateTaskDto, ReviewApprovalDto } from './dto/task.dto';
import { TaskStatus } from '@prisma/client';

@Injectable()
export class TasksService implements OnModuleInit {
  private readonly logger = new Logger(TasksService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly taskRunner: TaskRunnerService,
  ) {}

  async onModuleInit() {
    await this.recoverStaleTasks();
  }

  /**
   * Stale Task Recovery Handler:
   * Detects tasks left in IN_PROGRESS after backend crash or restart,
   * transitioning them to REVIEW status with descriptive metadata.
   */
  async recoverStaleTasks(): Promise<number> {
    try {
      const staleTasks = await this.prisma.task.findMany({
        where: { status: 'IN_PROGRESS' },
        include: { executions: { where: { status: 'IN_PROGRESS' } } },
      });

      if (staleTasks.length > 0) {
        this.logger.warn(`Recovering ${staleTasks.length} interrupted in-progress tasks after server restart.`);

        for (const task of staleTasks) {
          // Transition task to REVIEW
          await this.prisma.task.update({
            where: { id: task.id },
            data: {
              status: 'REVIEW',
              deliverables: {
                interrupted: true,
                recoveryReason: 'Execution was interrupted by a server restart or crash. Ready for supervisor retry.',
                interruptedAt: new Date().toISOString(),
              },
            },
          });

          // Transition any open executions to REVIEW
          for (const exec of task.executions) {
            await this.prisma.taskExecution.update({
              where: { id: exec.id },
              data: {
                status: 'REVIEW',
                summary: 'Execution was interrupted by server shutdown. Ready for resume.',
                completedAt: new Date(),
              },
            });
          }
        }

        this.logger.log(`Successfully recovered ${staleTasks.length} stale tasks.`);
      }

      return staleTasks.length;
    } catch (err: any) {
      this.logger.error(`Failed to execute stale task recovery: ${err.message}`);
      return 0;
    }
  }

  async createTask(dto: CreateTaskDto) {
    const employee = await this.prisma.employee.findUnique({
      where: { id: dto.assignedEmployeeId },
      include: { agentConfig: true },
    });

    if (!employee) {
      throw new NotFoundException(`Employee with ID '${dto.assignedEmployeeId}' not found.`);
    }

    const task = await this.prisma.task.create({
      data: {
        title: dto.title,
        description: dto.description,
        priority: dto.priority || 'MEDIUM',
        assignedEmployeeId: dto.assignedEmployeeId,
        workspacePath: dto.workspacePath || null,
        status: 'PENDING',
      },
      include: {
        assignedEmployee: {
          include: { department: true },
        },
      },
    });

    // Dispatch background execution
    await this.taskRunner.runTaskAsync(task.id);

    return task;
  }

  async findAll(query?: { status?: TaskStatus; employeeId?: string }) {
    return this.prisma.task.findMany({
      where: {
        ...(query?.status ? { status: query.status } : {}),
        ...(query?.employeeId ? { assignedEmployeeId: query.employeeId } : {}),
      },
      include: {
        assignedEmployee: {
          include: { department: true, agentConfig: true },
        },
        executions: {
          orderBy: { startedAt: 'desc' },
          take: 1,
          include: {
            toolLogs: {
              orderBy: { createdAt: 'desc' },
              take: 20,
            },
          },
        },
        approvalRequests: {
          where: { status: 'PENDING' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    const task = await this.prisma.task.findUnique({
      where: { id },
      include: {
        assignedEmployee: {
          include: { department: true, agentConfig: true },
        },
        executions: {
          orderBy: { startedAt: 'desc' },
          include: {
            toolLogs: {
              orderBy: { createdAt: 'asc' },
            },
            approvalRequests: true,
          },
        },
        approvalRequests: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!task) {
      throw new NotFoundException(`Task with ID '${id}' not found.`);
    }

    return task;
  }

  async retryTask(id: string) {
    const task = await this.findById(id);
    await this.prisma.task.update({
      where: { id },
      data: { status: 'IN_PROGRESS' },
    });
    await this.taskRunner.runTaskAsync(id);
    return { success: true, message: `Execution re-dispatched for task [${task.title}].` };
  }

  async reviewApproval(approvalId: string, dto: ReviewApprovalDto) {
    return this.taskRunner.reviewApproval(
      approvalId,
      dto.approved,
      dto.reviewedBy || 'CEO',
      dto.rejectionReason,
    );
  }

  async getPendingApprovals() {
    return this.prisma.approvalRequest.findMany({
      where: { status: 'PENDING' },
      include: {
        task: {
          include: {
            assignedEmployee: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
