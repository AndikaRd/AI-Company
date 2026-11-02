import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { OllamaService } from '../ollama/ollama.service';
import { SendChatMessageDto } from '../ollama/dto/chat-message.dto';

@Injectable()
export class EmployeesService {
  private readonly logger = new Logger(EmployeesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly ollamaService: OllamaService,
  ) {}

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
          },
        },
      },
      orderBy: { createdAt: 'desc' },
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
        subordinates: true,
      },
    });

    if (!employee) {
      throw new NotFoundException(`Employee with ID "${id}" not found`);
    }

    return employee;
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

  // --- CONVERSATION & CHAT INTERACTION (PHASE 4) ---

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

    // Touch conversation updated timestamp
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
