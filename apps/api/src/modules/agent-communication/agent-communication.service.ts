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
import {
  SendAgentMessageDto,
  DelegateTaskDto,
  RespondToDelegationDto,
} from './dto/agent-message.dto';
import { TaskRunnerService } from '../tasks/task-runner.service';
import { randomUUID } from 'crypto';

@Injectable()
export class AgentCommunicationService {
  private readonly logger = new Logger(AgentCommunicationService.name);
  public static readonly MAX_DELEGATION_DEPTH = 3;

  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => TaskRunnerService))
    private readonly taskRunner: TaskRunnerService,
  ) {}

  /**
   * Persists an internal agent-to-agent message with correlation tracking
   */
  async sendMessage(dto: SendAgentMessageDto) {
    const [sender, recipient] = await Promise.all([
      this.prisma.employee.findUnique({ where: { id: dto.senderEmployeeId } }),
      this.prisma.employee.findUnique({ where: { id: dto.recipientEmployeeId } }),
    ]);

    if (!sender) {
      throw new NotFoundException(`Sender employee with ID '${dto.senderEmployeeId}' not found.`);
    }
    if (!recipient) {
      throw new NotFoundException(`Recipient employee with ID '${dto.recipientEmployeeId}' not found.`);
    }

    const correlationId = dto.correlationId || dto.taskId || randomUUID();

    const message = await this.prisma.agentMessage.create({
      data: {
        senderEmployeeId: dto.senderEmployeeId,
        recipientEmployeeId: dto.recipientEmployeeId,
        taskId: dto.taskId || null,
        correlationId,
        messageType: dto.messageType || 'DIRECT_MESSAGE',
        content: dto.content,
        payload: (dto.payload as any) || null,
      },
      include: {
        senderEmployee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
            employeeCode: true,
          },
        },
        recipientEmployee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
            employeeCode: true,
          },
        },
      },
    });

    this.logger.log(
      `[AgentMessage] [${message.messageType}] from ${sender.firstName} (${sender.employeeCode}) to ${recipient.firstName} (${recipient.employeeCode}) - Correlation: ${correlationId}`,
    );

    return message;
  }

  /**
   * Delegates a subtask from one employee to another with authorization and recursion depth enforcement
   */
  async delegateTask(dto: DelegateTaskDto) {
    const parentTask = await this.prisma.task.findUnique({
      where: { id: dto.parentTaskId },
      include: { assignedEmployee: true },
    });

    if (!parentTask) {
      throw new NotFoundException(`Parent task with ID '${dto.parentTaskId}' not found.`);
    }

    const [delegator, assignee] = await Promise.all([
      this.prisma.employee.findUnique({
        where: { id: dto.delegatingEmployeeId },
        include: { subordinates: true },
      }),
      this.prisma.employee.findUnique({
        where: { id: dto.assignedEmployeeId },
        include: { department: true, agentConfig: true },
      }),
    ]);

    if (!delegator) {
      throw new NotFoundException(`Delegating employee with ID '${dto.delegatingEmployeeId}' not found.`);
    }
    if (!assignee) {
      throw new NotFoundException(`Assigned employee with ID '${dto.assignedEmployeeId}' not found.`);
    }

    // 1. Authorization Guard
    const isDirectAssignee = parentTask.assignedEmployeeId === delegator.id;
    const isSupervisor = delegator.subordinates.some((s) => s.id === assignee.id);
    const isExecutive = ['EXECUTIVE', 'PRINCIPAL', 'LEAD'].includes(delegator.seniority);

    if (!isDirectAssignee && !isSupervisor && !isExecutive) {
      throw new ForbiddenException(
        `Unauthorized task delegation: '${delegator.firstName} ${delegator.lastName}' does not hold supervisory or assignment authority over this task.`,
      );
    }

    // 2. Recursion & Delegation Depth Guard
    if (parentTask.delegationDepth >= AgentCommunicationService.MAX_DELEGATION_DEPTH) {
      throw new BadRequestException(
        `Task delegation rejected: Maximum delegation depth of ${AgentCommunicationService.MAX_DELEGATION_DEPTH} exceeded for task tree.`,
      );
    }

    const newDepth = parentTask.delegationDepth + 1;
    const correlationId = parentTask.id;

    // 3. Atomic Subtask & Delegation Message Creation
    const result = await this.prisma.$transaction(async (tx) => {
      // Create Subtask
      const subtask = await tx.task.create({
        data: {
          title: dto.subtaskTitle,
          description: dto.subtaskDescription,
          priority: dto.priority || parentTask.priority,
          assignedEmployeeId: dto.assignedEmployeeId,
          delegatedByEmployeeId: dto.delegatingEmployeeId,
          parentTaskId: parentTask.id,
          delegationDepth: newDepth,
          requiredSkills: (dto.requiredSkills as any) || [],
          status: 'PENDING',
        },
        include: {
          assignedEmployee: {
            include: { department: true },
          },
          delegatedBy: true,
        },
      });

      // Create Delegation Notification Message
      const message = await tx.agentMessage.create({
        data: {
          senderEmployeeId: dto.delegatingEmployeeId,
          recipientEmployeeId: dto.assignedEmployeeId,
          taskId: subtask.id,
          correlationId,
          messageType: 'TASK_DELEGATION',
          content: `Task Delegation: "${dto.subtaskTitle}". Context: ${dto.subtaskDescription}`,
          payload: {
            parentTaskId: parentTask.id,
            parentTaskTitle: parentTask.title,
            priority: subtask.priority,
            delegationDepth: newDepth,
            contextData: dto.contextData || null,
          },
        },
      });

      return { subtask, message };
    });

    this.logger.log(
      `Task [${dto.subtaskTitle}] (${result.subtask.id}) delegated from ${delegator.firstName} to ${assignee.firstName} (Depth: ${newDepth})`,
    );

    return result;
  }

  /**
   * Responds to a delegated task (Accept or Reject)
   */
  async respondToDelegation(dto: RespondToDelegationDto) {
    const subtask = await this.prisma.task.findUnique({
      where: { id: dto.subtaskId },
      include: {
        delegatedBy: true,
        assignedEmployee: true,
      },
    });

    if (!subtask) {
      throw new NotFoundException(`Subtask with ID '${dto.subtaskId}' not found.`);
    }

    if (subtask.assignedEmployeeId !== dto.recipientEmployeeId) {
      throw new ForbiddenException(
        `Unauthorized response: Only assigned employee '${subtask.assignedEmployee.firstName}' can accept/reject this subtask.`,
      );
    }

    if (subtask.status !== 'PENDING') {
      throw new BadRequestException(
        `Cannot respond to delegation: Subtask '${subtask.title}' is in '${subtask.status}' state (must be PENDING).`,
      );
    }

    const correlationId = subtask.parentTaskId || subtask.id;

    if (dto.accept) {
      // 1. Mark IN_PROGRESS
      const updatedSubtask = await this.prisma.task.update({
        where: { id: subtask.id },
        data: { status: 'IN_PROGRESS' },
      });

      // 2. Persist Acceptance Message
      if (subtask.delegatedByEmployeeId) {
        await this.prisma.agentMessage.create({
          data: {
            senderEmployeeId: subtask.assignedEmployeeId,
            recipientEmployeeId: subtask.delegatedByEmployeeId,
            taskId: subtask.id,
            correlationId,
            messageType: 'TASK_ACCEPTED',
            content: `Accepted task "${subtask.title}". Commencing execution within scoped sandbox.`,
          },
        });
      }

      // 3. Dispatch execution
      await this.taskRunner.runTaskAsync(subtask.id);

      return {
        accepted: true,
        subtask: updatedSubtask,
        message: 'Task accepted and execution dispatched.',
      };
    } else {
      // Mark CANCELLED
      const updatedSubtask = await this.prisma.task.update({
        where: { id: subtask.id },
        data: {
          status: 'CANCELLED',
          deliverables: {
            rejectionReason: dto.reason || 'Declined by assigned employee',
            rejectedAt: new Date().toISOString(),
          },
        },
      });

      if (subtask.delegatedByEmployeeId) {
        await this.prisma.agentMessage.create({
          data: {
            senderEmployeeId: subtask.assignedEmployeeId,
            recipientEmployeeId: subtask.delegatedByEmployeeId,
            taskId: subtask.id,
            correlationId,
            messageType: 'TASK_REJECTED',
            content: `Declined task "${subtask.title}". Reason: ${dto.reason || 'Capacity / domain constraint'}`,
          },
        });
      }

      return {
        accepted: false,
        subtask: updatedSubtask,
        message: 'Task delegation was rejected.',
      };
    }
  }

  /**
   * Retrieves all messages correlated with a specific task tree
   */
  async getMessagesForTask(taskId: string) {
    return this.prisma.agentMessage.findMany({
      where: {
        OR: [{ taskId }, { correlationId: taskId }],
      },
      include: {
        senderEmployee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
            employeeCode: true,
          },
        },
        recipientEmployee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
            employeeCode: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  /**
   * Retrieves communication history between two specific employees
   */
  async getDirectMessages(employeeAId: string, employeeBId: string) {
    return this.prisma.agentMessage.findMany({
      where: {
        OR: [
          { senderEmployeeId: employeeAId, recipientEmployeeId: employeeBId },
          { senderEmployeeId: employeeBId, recipientEmployeeId: employeeAId },
        ],
      },
      include: {
        senderEmployee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
            employeeCode: true,
          },
        },
        recipientEmployee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
            employeeCode: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  /**
   * Retrieves company-wide recent internal agent communications
   */
  async getRecentMessages(limit = 50) {
    return this.prisma.agentMessage.findMany({
      take: limit,
      include: {
        senderEmployee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
            employeeCode: true,
          },
        },
        recipientEmployee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
            employeeCode: true,
          },
        },
        task: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
