import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  Inject,
  forwardRef,
  Optional,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DispatchCeoCommandDto, FeedQueryDto } from './dto/ceo-command.dto';
import { CompanyFeedItem, CeoCommandResult, SocketEvents } from '@vac/shared';
import { EventsGateway } from '../events/events.gateway';
import { EmployeeActivityService } from '../employees/employee-activity.service';
import { TaskRunnerService } from '../tasks/task-runner.service';
import * as path from 'path';
import { existsSync } from 'fs';

@Injectable()
export class CompanyFeedService {
  private readonly logger = new Logger(CompanyFeedService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Optional()
    @Inject(forwardRef(() => EventsGateway))
    private readonly eventsGateway?: EventsGateway,
    @Optional()
    @Inject(forwardRef(() => EmployeeActivityService))
    private readonly activityService?: EmployeeActivityService,
    @Optional()
    @Inject(forwardRef(() => TaskRunnerService))
    private readonly taskRunner?: TaskRunnerService,
  ) {}

  /**
   * Aggregates real backend records (messages, tasks, approvals, life events, CEO directives)
   * into a unified, chronologically sorted company activity stream.
   */
  async getGlobalFeed(query?: FeedQueryDto): Promise<CompanyFeedItem[]> {
    const limit = query?.limit ? Math.min(parseInt(query.limit, 10), 100) : 50;
    const category = (query?.category || 'ALL').toUpperCase();

    const [agentMessages, tasks, approvals, lifeEvents, ceoCommands] = await Promise.all([
      // 1. Employee / Agent Messages
      this.prisma.agentMessage.findMany({
        take: 30,
        orderBy: { createdAt: 'desc' },
        include: {
          senderEmployee: {
            include: { department: true },
          },
          recipientEmployee: {
            include: { department: true },
          },
        },
      }),

      // 2. Tasks created / in progress / completed
      this.prisma.task.findMany({
        take: 30,
        orderBy: { updatedAt: 'desc' },
        include: {
          assignedEmployee: {
            include: { department: true },
          },
        },
      }),

      // 3. Approval Requests
      this.prisma.approvalRequest.findMany({
        take: 20,
        orderBy: { createdAt: 'desc' },
        include: {
          task: true,
        },
      }),

      // 4. Employee Life Events (meetings, research, breaks)
      (this.prisma as any).employeeLifeEvent.findMany({
        take: 30,
        orderBy: { createdAt: 'desc' },
        include: {
          employee: {
            include: { department: true },
          },
        },
      }),

      // 5. CEO Commands
      (this.prisma as any).ceoCommand.findMany({
        take: 20,
        orderBy: { createdAt: 'desc' },
        include: {
          assignedEmployee: {
            include: { department: true },
          },
          department: true,
          createdTask: true,
        },
      }),
    ]);

    const feed: CompanyFeedItem[] = [];

    // Map CEO Commands
    for (const cmd of ceoCommands) {
      feed.push({
        id: `ceo-${cmd.id}`,
        category: 'TASKS',
        title: `CEO Directive to ${cmd.targetName}`,
        description: cmd.instruction,
        timestamp: cmd.createdAt.toISOString(),
        author: {
          id: 'ceo-user',
          name: 'Chief Executive Officer',
          role: 'Executive Chairman',
          employeeCode: 'VAC-CEO-001',
          departmentName: 'Executive',
          departmentSlug: 'operations',
        },
        target: {
          id: cmd.targetId || undefined,
          name: cmd.targetName,
          type: cmd.targetType as any,
        },
        metadata: {
          status: cmd.status,
          response: cmd.response,
          createdTaskId: cmd.createdTaskId,
        },
        entityType: 'ceo_command',
        entityId: cmd.id,
        status: cmd.status,
      });

      // Also add employee response if acknowledged
      if (cmd.response && cmd.assignedEmployee) {
        feed.push({
          id: `ceo-resp-${cmd.id}`,
          category: 'MESSAGES',
          title: `${cmd.assignedEmployee.firstName} ${cmd.assignedEmployee.lastName} responded to CEO`,
          description: cmd.response,
          timestamp: cmd.updatedAt.toISOString(),
          author: {
            id: cmd.assignedEmployee.id,
            name: `${cmd.assignedEmployee.firstName} ${cmd.assignedEmployee.lastName}`,
            role: cmd.assignedEmployee.role,
            employeeCode: cmd.assignedEmployee.employeeCode ?? undefined,
            departmentName: cmd.assignedEmployee.department?.name,
            departmentSlug: cmd.assignedEmployee.department?.slug,
          },
          target: {
            name: 'CEO',
            type: 'EMPLOYEE',
          },
          metadata: {
            inResponseToDirective: cmd.instruction,
          },
          entityType: 'ceo_command',
          entityId: cmd.id,
          status: 'COMPLETED',
        });
      }
    }

    // Map Agent Messages
    for (const msg of agentMessages) {
      const isIdea =
        msg.content.toLowerCase().includes('proposal') ||
        msg.content.toLowerCase().includes('idea') ||
        msg.content.toLowerCase().includes('research');
      feed.push({
        id: `msg-${msg.id}`,
        category: isIdea ? 'IDEAS' : 'MESSAGES',
        title: `${msg.senderEmployee.firstName} ${msg.senderEmployee.lastName} → ${msg.recipientEmployee.firstName} ${msg.recipientEmployee.lastName}`,
        description: msg.content,
        timestamp: msg.createdAt.toISOString(),
        author: {
          id: msg.senderEmployee.id,
          name: `${msg.senderEmployee.firstName} ${msg.senderEmployee.lastName}`,
          role: msg.senderEmployee.role,
          employeeCode: msg.senderEmployee.employeeCode ?? undefined,
          departmentName: msg.senderEmployee.department?.name,
          departmentSlug: msg.senderEmployee.department?.slug,
        },
        target: {
          id: msg.recipientEmployee.id,
          name: `${msg.recipientEmployee.firstName} ${msg.recipientEmployee.lastName}`,
          type: 'EMPLOYEE',
        },
        metadata: {
          messageType: msg.messageType,
          taskId: msg.taskId,
        },
        entityType: 'agent_message',
        entityId: msg.id,
      });
    }

    // Map Tasks
    for (const t of tasks) {
      let taskCat: 'TASKS' | 'IDEAS' = 'TASKS';
      if (t.title.toLowerCase().includes('research') || t.title.toLowerCase().includes('synthesis')) {
        taskCat = 'IDEAS';
      }

      feed.push({
        id: `task-${t.id}`,
        category: taskCat,
        title: `Task: ${t.title}`,
        description: t.description || 'Enterprise deliverable in progress.',
        timestamp: t.updatedAt.toISOString(),
        author: t.assignedEmployee
          ? {
              id: t.assignedEmployee.id,
              name: `${t.assignedEmployee.firstName} ${t.assignedEmployee.lastName}`,
              role: t.assignedEmployee.role,
              employeeCode: t.assignedEmployee.employeeCode ?? undefined,
              departmentName: t.assignedEmployee.department?.name,
              departmentSlug: t.assignedEmployee.department?.slug,
            }
          : undefined,
        metadata: {
          priority: t.priority,
          status: t.status,
          deliverables: t.deliverables,
        },
        entityType: 'task',
        entityId: t.id,
        status: t.status,
        priority: t.priority,
      });
    }

    // Map Approval Requests
    for (const app of approvals) {
      feed.push({
        id: `app-${app.id}`,
        category: 'APPROVALS',
        title: `Approval ${app.status}: ${app.toolName}`,
        description: app.actionSummary || 'Authorization required for automated execution.',
        timestamp: app.createdAt.toISOString(),
        metadata: {
          status: app.status,
          toolName: app.toolName,
          riskLevel: app.riskLevel,
          taskId: app.taskId,
        },
        entityType: 'approval_request',
        entityId: app.id,
        status: app.status,
        actionable: app.status === 'PENDING',
      });
    }

    // Map Life Events (meetings, breaks, research milestones)
    for (const ev of lifeEvents) {
      const isMeeting = ev.behavior === 'ATTENDING_MEETING' || ev.eventType.includes('meeting');
      feed.push({
        id: `event-${ev.id}`,
        category: isMeeting ? 'MEETINGS' : 'ALERTS',
        title: `${ev.employee.firstName} ${ev.employee.lastName} · ${ev.behavior}`,
        description: ev.details || ev.thought || `Activity at ${ev.locationName || 'Workplace'}.`,
        timestamp: ev.createdAt.toISOString(),
        author: {
          id: ev.employee.id,
          name: `${ev.employee.firstName} ${ev.employee.lastName}`,
          role: ev.employee.role,
          employeeCode: ev.employee.employeeCode ?? undefined,
          departmentName: ev.employee.department?.name,
          departmentSlug: ev.employee.department?.slug,
        },
        target: {
          name: ev.locationName || 'Office',
          type: 'DEPARTMENT',
        },
        entityType: 'life_event',
        entityId: ev.id,
      });
    }

    // Sort all events descending by timestamp
    const sorted = feed.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );

    // Apply Filter if not ALL
    if (category !== 'ALL') {
      return sorted.filter((item) => item.category === category).slice(0, limit);
    }

    return sorted.slice(0, limit);
  }

  /**
   * Dispatches a CEO instruction, persists it in PostgreSQL, routes to recipient,
   * creates actual tasks where appropriate, and notifies all connected clients via Socket.IO.
   */
  async dispatchCeoCommand(dto: DispatchCeoCommandDto): Promise<CeoCommandResult> {
    if (!dto.instruction || dto.instruction.trim().length === 0) {
      throw new BadRequestException('CEO instruction cannot be empty.');
    }

    this.logger.log(
      `[CeoCommand] Dispatched to ${dto.targetType} [${dto.targetName}]: "${dto.instruction}"`,
    );

    // 1. Resolve Target Employee / Lead
    let targetEmployee: any = null;
    let targetDepartment: any = null;

    if (dto.targetType === 'EMPLOYEE') {
      if (dto.targetId) {
        targetEmployee = await this.prisma.employee.findUnique({
          where: { id: dto.targetId },
          include: { department: true },
        });
      }
      if (!targetEmployee) {
        // Find by split name or code
        const nameParts = dto.targetName.trim().split(/\s+/);
        const first = nameParts[0];
        const last = nameParts[nameParts.length - 1];
        targetEmployee = await this.prisma.employee.findFirst({
          where: {
            OR: [
              { firstName: { equals: dto.targetName, mode: 'insensitive' } },
              { firstName: { equals: first, mode: 'insensitive' } },
              { lastName: { equals: last, mode: 'insensitive' } },
              { employeeCode: { contains: dto.targetName, mode: 'insensitive' } },
            ],
          },
          include: { department: true },
        });
      }

      if (!targetEmployee) {
        // Fallback by checking instruction content
        const lowerInstruction = dto.instruction.toLowerCase();
        if (lowerInstruction.includes('alex')) {
          targetEmployee = await this.prisma.employee.findFirst({ where: { firstName: { equals: 'Alex', mode: 'insensitive' } }, include: { department: true } });
        } else if (lowerInstruction.includes('marcus')) {
          targetEmployee = await this.prisma.employee.findFirst({ where: { firstName: { equals: 'Marcus', mode: 'insensitive' } }, include: { department: true } });
        } else if (lowerInstruction.includes('maya')) {
          targetEmployee = await this.prisma.employee.findFirst({ where: { firstName: { equals: 'Maya', mode: 'insensitive' } }, include: { department: true } });
        } else if (lowerInstruction.includes('sophia')) {
          targetEmployee = await this.prisma.employee.findFirst({ where: { firstName: { equals: 'Sophia', mode: 'insensitive' } }, include: { department: true } });
        }
      }
    } else if (dto.targetType === 'DEPARTMENT') {
      const lower = dto.targetName.toLowerCase();
      targetDepartment = await this.prisma.department.findFirst({
        where: {
          OR: [
            { slug: { contains: lower, mode: 'insensitive' } },
            { name: { contains: lower, mode: 'insensitive' } },
          ],
        },
        include: { employees: true },
      });

      if (targetDepartment && targetDepartment.employees.length > 0) {
        // Select department lead / senior member
        targetEmployee =
          targetDepartment.employees.find(
            (e: any) =>
              e.seniority === 'EXECUTIVE' ||
              e.seniority === 'LEAD' ||
              e.seniority === 'SENIOR' ||
              e.seniority === 'PRINCIPAL',
          ) || targetDepartment.employees[0];
      }
    } else {
      // COMPANY_WIDE -> Routed to Elena Rostova (COO / Chief of Staff)
      targetEmployee = await this.prisma.employee.findFirst({
        where: {
          OR: [
            { employeeCode: 'VAC-OPS-001' },
            { role: { contains: 'Chief of Staff', mode: 'insensitive' } },
            { role: { contains: 'COO', mode: 'insensitive' } },
          ],
        },
        include: { department: true },
      });
    }

    // Default fallback to Elena or Alex if not resolved
    if (!targetEmployee) {
      targetEmployee = await this.prisma.employee.findFirst({
        where: { employeeCode: 'VAC-OPS-001' },
        include: { department: true },
      });
    }

    if (!targetEmployee) {
      throw new NotFoundException('Could not resolve an active employee recipient for this command.');
    }

    // 2. Synthesize Role-Specific Realistic Response
    const responseText = this.generateEmployeeResponse(targetEmployee, dto.instruction);

    // 3. Create actual Task if the instruction represents a work objective
    let createdTaskId: string | null = null;
    const isTaskDirective =
      dto.instruction.toLowerCase().includes('review') ||
      dto.instruction.toLowerCase().includes('implement') ||
      dto.instruction.toLowerCase().includes('prepare') ||
      dto.instruction.toLowerCase().includes('analyze') ||
      dto.instruction.toLowerCase().includes('coordinate') ||
      dto.instruction.toLowerCase().includes('test') ||
      dto.instruction.toLowerCase().includes('plan');

    if (isTaskDirective) {
      try {
        const titleSnippet = dto.instruction.length > 60
          ? dto.instruction.slice(0, 57) + '...'
          : dto.instruction;

        const isFrontendInspection =
          dto.instruction.toLowerCase().includes('frontend') ||
          dto.instruction.toLowerCase().includes('web') ||
          dto.instruction.toLowerCase().includes('architecture');

        const resolvedWebPath = path.resolve(process.cwd(), '..', 'web');
        const workspacePath = isFrontendInspection && existsSync(resolvedWebPath)
          ? resolvedWebPath
          : null;

        // Task starts in PENDING status.
        // It transitions to IN_PROGRESS when TaskRunner actually initiates the execution loop.
        const newTask = await this.prisma.task.create({
          data: {
            title: `Executive Directive: ${titleSnippet}`,
            description: dto.instruction,
            priority: (dto.priority as any) || 'HIGH',
            status: 'PENDING',
            assignedEmployeeId: targetEmployee.id,
            workspacePath,
            requiredSkills: targetEmployee.skills || ['Planning', 'Execution'],
          },
        });
        createdTaskId = newTask.id;

        // Dispatches genuine asynchronous AI employee reasoning and tool execution
        if (this.taskRunner) {
          this.logger.log(`Dispatching genuine AI task runner for Task [${newTask.id}] to [${targetEmployee.firstName}]`);
          await this.taskRunner.runTaskAsync(newTask.id);
        }
      } catch (err: any) {
        this.logger.warn(`Failed to create task for CEO command: ${err.message}`);
      }
    } else {
      // Non-task conversational instruction: set employee to thinking
      if (this.activityService) {
        await this.activityService.setActivity(targetEmployee.id, 'THINKING', {
          details: `Reviewing executive instruction from CEO`,
        });
      }
    }

    // 4. Persist CeoCommand in PostgreSQL
    const record = await (this.prisma as any).ceoCommand.create({
      data: {
        targetType: dto.targetType,
        targetId: dto.targetId || targetEmployee.id,
        targetName: dto.targetName,
        instruction: dto.instruction,
        status: createdTaskId ? 'IN_PROGRESS' : 'ACKNOWLEDGED',
        response: responseText,
        createdTaskId: createdTaskId,
        assignedEmployeeId: targetEmployee.id,
        departmentId: targetDepartment?.id || targetEmployee.departmentId,
        metadata: {
          priority: dto.priority || 'HIGH',
          taskCreated: Boolean(createdTaskId),
        },
      },
      include: {
        assignedEmployee: {
          include: { department: true },
        },
        department: true,
      },
    });

    // 5. Broadcast Real-Time Events over Socket.IO
    if (this.eventsGateway) {
      // A. Broadcast CEO instruction event
      this.eventsGateway.broadcastOfficeEvent(SocketEvents.CEO_INSTRUCTION_DISPATCHED, {
        commandId: record.id,
        targetType: record.targetType,
        targetName: record.targetName,
        instruction: record.instruction,
        recipient: {
          id: targetEmployee.id,
          name: `${targetEmployee.firstName} ${targetEmployee.lastName}`,
          role: targetEmployee.role,
        },
        response: responseText,
        createdTaskId,
        timestamp: record.createdAt.toISOString(),
      });

      // B. Broadcast new Feed item added
      this.eventsGateway.broadcastOfficeEvent(SocketEvents.COMPANY_FEED_ITEM_ADDED, {
        feedItem: {
          id: `ceo-${record.id}`,
          category: 'TASKS',
          title: `CEO Directive to ${record.targetName}`,
          description: record.instruction,
          timestamp: record.createdAt.toISOString(),
          author: {
            id: 'ceo-user',
            name: 'Chief Executive Officer',
            role: 'Executive Chairman',
            employeeCode: 'VAC-CEO-001',
          },
          target: {
            id: record.targetId,
            name: record.targetName,
            type: record.targetType,
          },
          status: record.status,
          entityType: 'ceo_command',
          entityId: record.id,
        },
      });
    }

    return {
      id: record.id,
      targetType: record.targetType as any,
      targetName: record.targetName,
      instruction: record.instruction,
      status: record.status as any,
      response: responseText,
      createdTaskId,
      assignedEmployeeId: targetEmployee.id,
      assignedEmployeeName: `${targetEmployee.firstName} ${targetEmployee.lastName}`,
      departmentName: targetEmployee.department?.name,
      createdAt: record.createdAt.toISOString(),
    };
  }

  /**
   * Retrieves previous CEO commands
   */
  async getCeoCommandHistory(limit = 20): Promise<CeoCommandResult[]> {
    const records = await (this.prisma as any).ceoCommand.findMany({
      take: Math.min(limit, 50),
      orderBy: { createdAt: 'desc' },
      include: {
        assignedEmployee: {
          include: { department: true },
        },
        department: true,
      },
    });

    return records.map((r: any) => ({
      id: r.id,
      targetType: r.targetType,
      targetName: r.targetName,
      instruction: r.instruction,
      status: r.status,
      response: r.response || '',
      createdTaskId: r.createdTaskId,
      assignedEmployeeId: r.assignedEmployeeId,
      assignedEmployeeName: r.assignedEmployee
        ? `${r.assignedEmployee.firstName} ${r.assignedEmployee.lastName}`
        : null,
      departmentName: r.department?.name || r.assignedEmployee?.department?.name || null,
      createdAt: r.createdAt.toISOString(),
    }));
  }

  /**
   * Generates persona-aligned, professional employee responses to executive directives
   */
  private generateEmployeeResponse(employee: any, instruction: string): string {
    const code = employee.employeeCode;
    const name = employee.firstName;

    if (code === 'VAC-OPS-001' || name.toLowerCase().includes('elena')) {
      return `Understood, CEO. I am coordinating with the department leads to organize and execute this initiative immediately. Operational milestones are being scheduled.`;
    }
    if (code === 'VAC-TECH-001' || name.toLowerCase().includes('marcus')) {
      return `Directive received. Reviewing technical architecture, evaluating infrastructure risks, and aligning our engineering roadmap accordingly.`;
    }
    if (code === 'VAC-ENG-001' || name.toLowerCase().includes('alex')) {
      return `On it, CEO. Breaking down the engineering specifications, drafting implementation commits, and preparing unit tests for review.`;
    }
    if (code === 'VAC-RES-001' || name.toLowerCase().includes('maya')) {
      return `Acknowledged. Synthesizing literature, formulating experimental hypotheses, and preparing an analytical research brief.`;
    }
    if (code === 'VAC-QA-001' || name.toLowerCase().includes('sophia')) {
      return `Received. Outlining verification matrix, automated test boundaries, and regression safety checks for the team.`;
    }

    return `Directive acknowledged by ${employee.firstName} ${employee.lastName} (${employee.role}). Executing according to enterprise standards.`;
  }
}
