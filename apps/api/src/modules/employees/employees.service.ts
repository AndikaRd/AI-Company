import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { OllamaService } from '../ollama/ollama.service';
import { SendChatMessageDto } from '../ollama/dto/chat-message.dto';
import { INITIAL_COMPANY_ROLES, RoleSpecification } from './employee-roles.constant';
import { OrganizationHierarchyNode } from '@vac/shared';

@Injectable()
export class EmployeesService implements OnModuleInit {
  private readonly logger = new Logger(EmployeesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly ollamaService: OllamaService,
  ) {}

  async onModuleInit() {
    await this.ensureInitialRolesProvisioned();
  }

  /**
   * Automatically provisions the 5 initial core company roles (COO, CTO, Alex Mercer, QA, Researcher)
   * while strictly preserving Alex Mercer's existing employee ID, tasks, configuration, and chat records.
   */
  async ensureInitialRolesProvisioned(): Promise<void> {
    try {
      this.logger.log('Checking and provisioning core company organizational roles...');

      // First Pass: Create or update employee records without supervisor links
      for (const roleDef of INITIAL_COMPANY_ROLES) {
        let department = await this.prisma.department.findFirst({
          where: { slug: roleDef.departmentSlug },
        });

        if (!department) {
          // Fallback to any department or engineering
          department = (await this.prisma.department.findFirst())!;
        }

        const existing = await this.prisma.employee.findFirst({
          where: {
            OR: [
              { employeeCode: roleDef.employeeCode },
              { email: roleDef.email },
            ],
          },
          include: { agentConfig: true },
        });

        if (existing) {
          // Update responsibilities, jobTitle, personality if missing
          await this.prisma.employee.update({
            where: { id: existing.id },
            data: {
              jobTitle: roleDef.jobTitle,
              role: roleDef.role,
              seniority: roleDef.seniority,
              responsibilities: roleDef.responsibilities as any,
              personality: existing.personality || roleDef.personality,
              primaryExpertise: existing.primaryExpertise || roleDef.primaryExpertise,
              skills: existing.skills || (roleDef.skills as any),
              workstationId: existing.workstationId || roleDef.workstationId,
            },
          });

          // Sync agent configuration if existing system prompt is legacy or missing reporting structure
          if (existing.agentConfig) {
            await this.prisma.agentConfiguration.update({
              where: { id: existing.agentConfig.id },
              data: {
                systemPrompt: roleDef.agentConfig.systemPrompt,
                toolsEnabled: roleDef.agentConfig.toolsEnabled as any,
                permissionConfig: roleDef.agentConfig.permissionConfig as any,
              },
            });
          }
        } else {
          // Create new employee
          const created = await this.prisma.employee.create({
            data: {
              employeeCode: roleDef.employeeCode,
              firstName: roleDef.firstName,
              lastName: roleDef.lastName,
              role: roleDef.role,
              jobTitle: roleDef.jobTitle,
              seniority: roleDef.seniority,
              personality: roleDef.personality,
              primaryExpertise: roleDef.primaryExpertise,
              skills: roleDef.skills as any,
              responsibilities: roleDef.responsibilities as any,
              email: roleDef.email,
              avatarUrl: roleDef.avatarUrl,
              workstationId: roleDef.workstationId,
              isAiAgent: true,
              status: 'ACTIVE',
              departmentId: department.id,
              agentConfig: {
                create: {
                  provider: roleDef.agentConfig.provider,
                  modelName: roleDef.agentConfig.modelName,
                  autonomyLevel: roleDef.agentConfig.autonomyLevel,
                  systemPrompt: roleDef.agentConfig.systemPrompt,
                  temperature: roleDef.agentConfig.temperature,
                  maxTokens: roleDef.agentConfig.maxTokens,
                  toolsEnabled: roleDef.agentConfig.toolsEnabled as any,
                  permissionConfig: roleDef.agentConfig.permissionConfig as any,
                },
              },
            },
          });
          this.logger.log(`Provisioned AI Employee: [${created.employeeCode}] ${created.firstName} ${created.lastName} (${created.role})`);
        }
      }

      // Second Pass: Establish supervisor relationships
      for (const roleDef of INITIAL_COMPANY_ROLES) {
        if (roleDef.supervisorCode) {
          const supervisor = await this.prisma.employee.findUnique({
            where: { employeeCode: roleDef.supervisorCode },
          });

          if (supervisor) {
            await this.prisma.employee.updateMany({
              where: {
                employeeCode: roleDef.employeeCode,
                supervisorId: null, // Only set if not already linked
              },
              data: { supervisorId: supervisor.id },
            });
          }
        }
      }

      const totalCount = await this.prisma.employee.count();
      this.logger.log(`Organizational hierarchy verified across ${totalCount} active employees.`);
    } catch (err: any) {
      this.logger.error(`Error during initial roles provisioning: ${err.message}`, err.stack);
    }
  }

  /**
   * Retrieves the complete company organizational hierarchy tree.
   * Root nodes are top-level executives (supervisorId is null).
   */
  async getHierarchy(): Promise<OrganizationHierarchyNode[]> {
    const allEmployees = await this.prisma.employee.findMany({
      include: {
        department: true,
        agentConfig: true,
        supervisor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            jobTitle: true,
            role: true,
            employeeCode: true,
          },
        },
      },
      orderBy: [{ seniority: 'desc' }, { firstName: 'asc' }],
    });

    const employeeMap = new Map<string, any>();
    const childrenMap = new Map<string, any[]>();

    for (const emp of allEmployees) {
      employeeMap.set(emp.id, emp);
      childrenMap.set(emp.id, []);
    }

    const roots: any[] = [];

    for (const emp of allEmployees) {
      if (emp.supervisorId && employeeMap.has(emp.supervisorId)) {
        childrenMap.get(emp.supervisorId)!.push(emp);
      } else {
        roots.push(emp);
      }
    }

    const buildNode = (emp: any, depth = 0): OrganizationHierarchyNode => {
      const directReportEmps = childrenMap.get(emp.id) || [];
      const directReports = directReportEmps.map((child) => buildNode(child, depth + 1));

      const countSubordinates = (node: OrganizationHierarchyNode): number =>
        node.directReports.reduce((acc, cur) => acc + 1 + countSubordinates(cur), 0);

      const totalSubordinates = directReports.reduce((acc, cur) => acc + 1 + countSubordinates(cur), 0);

      return {
        employee: emp,
        supervisorId: emp.supervisorId,
        directReports,
        department: emp.department,
        totalSubordinates,
        depth,
      };
    };

    return roots.map((r) => buildNode(r, 0));
  }

  /**
   * Retrieves direct and indirect subordinates under an employee
   */
  async getSubordinates(employeeId: string): Promise<any[]> {
    await this.findOne(employeeId);

    const directReports = await this.prisma.employee.findMany({
      where: { supervisorId: employeeId },
      include: { department: true, agentConfig: true },
    });

    const allSubordinates: any[] = [...directReports];
    for (const child of directReports) {
      const indirect = await this.getSubordinates(child.id);
      allSubordinates.push(...indirect);
    }

    return allSubordinates;
  }

  /**
   * Retrieves supervisor chain up to top executive
   */
  async getSupervisorChain(employeeId: string): Promise<any[]> {
    const chain: any[] = [];
    let currentId: string | null = employeeId;

    while (currentId) {
      const emp = await this.prisma.employee.findUnique({
        where: { id: currentId },
        include: {
          department: true,
          supervisor: {
            include: { department: true },
          },
        },
      });

      if (!emp || !emp.supervisor) break;
      chain.push(emp.supervisor);
      currentId = emp.supervisor.id;
    }

    return chain;
  }

  /**
   * Matches eligible employees for a delegated task based on required skills, role, or department
   */
  async getEligibleEmployees(filters?: {
    skills?: string[];
    role?: string;
    departmentSlug?: string;
  }) {
    const where: any = { isAiAgent: true, status: 'ACTIVE' };

    if (filters?.departmentSlug) {
      where.department = { slug: filters.departmentSlug };
    }

    const employees = await this.prisma.employee.findMany({
      where,
      include: { department: true, agentConfig: true },
    });

    if (!filters?.skills || filters.skills.length === 0) {
      return employees;
    }

    // Filter by skills match
    const requiredLower = filters.skills.map((s) => s.toLowerCase());
    return employees.filter((emp) => {
      const empSkills: string[] = Array.isArray(emp.skills) ? (emp.skills as string[]) : [];
      return requiredLower.some((req) =>
        empSkills.some((s) => s.toLowerCase().includes(req) || req.includes(s.toLowerCase())),
      );
    });
  }

  async findAll(departmentId?: string) {
    return this.prisma.employee.findMany({
      where: departmentId ? { departmentId } : undefined,
      include: {
        department: true,
        agentConfig: true,
        supervisor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
            jobTitle: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async getStats() {
    const [total, active, idle, busy, offline, aiAgents] = await Promise.all([
      this.prisma.employee.count(),
      this.prisma.employee.count({ where: { status: 'ACTIVE' } }),
      this.prisma.employee.count({ where: { status: 'IDLE' } }),
      this.prisma.employee.count({ where: { status: 'BUSY' } }),
      this.prisma.employee.count({ where: { status: 'OFFLINE' } }),
      this.prisma.employee.count({ where: { isAiAgent: true } }),
    ]);

    return {
      totalEmployees: total,
      totalAiAgents: aiAgents,
      activeEmployees: active,
      idleEmployees: idle,
      busyEmployees: busy,
      offlineEmployees: offline,
    };
  }

  async findOne(id: string) {
    const employee = await this.prisma.employee.findUnique({
      where: { id },
      include: {
        department: true,
        agentConfig: true,
        supervisor: true,
        subordinates: {
          include: { department: true },
        },
      },
    });

    if (!employee) {
      throw new NotFoundException(`Employee with ID "${id}" not found`);
    }

    return employee;
  }

  async update(id: string, data: any) {
    const employee = await this.prisma.employee.findUnique({ where: { id } });
    if (!employee) {
      throw new NotFoundException(`Employee with ID "${id}" not found`);
    }

    const { agentConfig, ...employeeData } = data;

    if (agentConfig) {
      await this.prisma.agentConfiguration.upsert({
        where: { employeeId: id },
        create: { ...agentConfig, employeeId: id },
        update: agentConfig,
      });
    }

    return this.prisma.employee.update({
      where: { id },
      data: employeeData,
      include: {
        department: true,
        agentConfig: true,
      },
    });
  }

  async create(createEmployeeDto: CreateEmployeeDto) {
    const { agentConfig, departmentId, supervisorId, ...employeeData } = createEmployeeDto;

    const department = await this.prisma.department.findUnique({
      where: { id: departmentId },
    });

    if (!department) {
      throw new NotFoundException(`Department with ID "${departmentId}" not found`);
    }

    const existing = await this.prisma.employee.findUnique({
      where: { email: employeeData.email },
    });

    if (existing) {
      throw new ConflictException(`Employee with email "${employeeData.email}" already exists`);
    }

    if (supervisorId) {
      const supervisor = await this.prisma.employee.findUnique({
        where: { id: supervisorId },
      });
      if (!supervisor) {
        throw new NotFoundException(`Supervisor with ID "${supervisorId}" not found`);
      }
    }

    return this.prisma.employee.create({
      data: {
        ...employeeData,
        departmentId,
        supervisorId,
        ...(agentConfig
          ? {
              agentConfig: {
                create: agentConfig,
              },
            }
          : {}),
      },
      include: {
        department: true,
        agentConfig: true,
        supervisor: true,
      },
    });
  }

  // --- CONVERSATION & CHAT INTERACTION ---

  async getConversations(employeeId: string) {
    await this.findOne(employeeId);
    return this.prisma.conversation.findMany({
      where: { employeeId },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async getMessages(conversationId: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    });
    if (!conversation) {
      throw new NotFoundException(`Conversation with ID "${conversationId}" not found`);
    }

    return this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async chatWithEmployee(employeeId: string, dto: SendChatMessageDto) {
    const employee = await this.findOne(employeeId);
    const agentConfig = employee.agentConfig;

    // 1. Resolve or create active Conversation
    let conversation;
    if (dto.conversationId) {
      conversation = await this.prisma.conversation.findUnique({
        where: { id: dto.conversationId },
      });
    }
    if (!conversation) {
      conversation = await this.prisma.conversation.create({
        data: {
          employeeId: employee.id,
          title: `Discussion with ${employee.firstName} (${new Date().toLocaleDateString()})`,
        },
      });
    }

    // 2. Persist incoming User Message
    const userMessage = await this.prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderType: 'USER',
        senderName: 'User',
        content: dto.message,
      },
    });

    // 3. Assemble chat history context (last 10 messages)
    const pastMessages = await this.prisma.message.findMany({
      where: {
        conversationId: conversation.id,
        id: { not: userMessage.id },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });
    const historyChronological = pastMessages.reverse();

    // 4. Construct System Prompt from Agent Persona
    const defaultPersona = `You are ${employee.firstName} ${employee.lastName}, a ${employee.jobTitle || employee.role} in the ${employee.department?.name || 'Engineering'} department at Virtual AI Company (VAC). ${employee.personality ? `Your personality: ${employee.personality}` : ''} ${employee.primaryExpertise ? `Your core expertise: ${employee.primaryExpertise}` : ''} You speak with technical precision, pragmatic reasoning, and professional dedication.`;

    const systemPrompt = agentConfig?.systemPrompt || defaultPersona;

    const formattedMessages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: systemPrompt },
      ...historyChronological.map((m) => ({
        role: (m.senderType === 'USER' ? 'user' : 'assistant') as 'user' | 'assistant',
        content: m.content,
      })),
      { role: 'user', content: dto.message },
    ];

    // 5. Query Ollama AI Runtime
    const modelToUse = agentConfig?.modelName || 'qwen3.5:4b';
    const temperature = agentConfig?.temperature ?? 0.7;
    const maxTokens = agentConfig?.maxTokens ?? 2048;

    this.logger.log(
      `Dispatching chat to Ollama [${modelToUse}] for employee ${employee.firstName} ${employee.lastName} (${employee.id})`,
    );

    const inferenceResult = await this.ollamaService.chat({
      model: modelToUse,
      messages: formattedMessages,
      temperature,
      maxTokens,
      think: dto.think ?? false,
    });

    // 6. Persist Agent Response Message
    const agentMessage = await this.prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderType: 'AGENT',
        senderName: `${employee.firstName} ${employee.lastName}`,
        content: inferenceResult.content,
        thinking: inferenceResult.thinking,
        metadata: {
          model: inferenceResult.model,
          durationMs: inferenceResult.durationMs,
          evalCount: inferenceResult.evalCount,
        },
      },
    });

    await this.prisma.conversation.update({
      where: { id: conversation.id },
      data: { updatedAt: new Date() },
    });

    return {
      conversationId: conversation.id,
      userMessage,
      agentMessage,
      executionMetrics: {
        durationMs: inferenceResult.durationMs,
        model: inferenceResult.model,
        provider: agentConfig?.provider || 'OLLAMA',
        promptEvalCount: inferenceResult.promptEvalCount,
        evalCount: inferenceResult.evalCount,
      },
    };
  }
}
