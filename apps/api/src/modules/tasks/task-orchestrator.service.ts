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
import { OllamaService } from '../ollama/ollama.service';
import { AgentCommunicationService } from '../agent-communication/agent-communication.service';
import { DecomposeTaskDto, TaskDecompositionPlanDto, SubtaskDefinitionDto } from '@vac/shared';

@Injectable()
export class TaskOrchestratorService {
  private readonly logger = new Logger(TaskOrchestratorService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly ollamaService: OllamaService,
    @Inject(forwardRef(() => AgentCommunicationService))
    private readonly agentComms: AgentCommunicationService,
  ) {}

  /**
   * Decomposes a high-level CEO directive into role-specialized subtasks
   * assigned to eligible employees across departments.
   */
  async decomposeTask(dto: DecomposeTaskDto): Promise<{
    plan: TaskDecompositionPlanDto;
    subtasks: any[];
  }> {
    const parentTask = await this.prisma.task.findUnique({
      where: { id: dto.taskId },
      include: { assignedEmployee: true, subtasks: true },
    });

    if (!parentTask) {
      throw new NotFoundException(`Task with ID '${dto.taskId}' not found.`);
    }

    const coordinator = await this.prisma.employee.findUnique({
      where: { id: dto.coordinatorEmployeeId },
      include: { department: true, agentConfig: true },
    });

    if (!coordinator) {
      throw new NotFoundException(`Coordinator employee '${dto.coordinatorEmployeeId}' not found.`);
    }

    // Authorization Guard: Must be Executive, Lead, or task assignee
    const isExecutive = ['EXECUTIVE', 'PRINCIPAL', 'LEAD'].includes(coordinator.seniority);
    const isAssignee = parentTask.assignedEmployeeId === coordinator.id;
    if (!isExecutive && !isAssignee) {
      throw new ForbiddenException(
        `Unauthorized: Employee '${coordinator.firstName}' does not hold orchestration authority.`,
      );
    }

    this.logger.log(
      `[TaskOrchestrator] Decomposing Task [${parentTask.title}] (${parentTask.id}) via Coordinator [${coordinator.firstName} ${coordinator.lastName}]`,
    );

    // Retrieve active employees
    const employees = await this.prisma.employee.findMany({
      where: { isAiAgent: true, status: 'ACTIVE' },
      include: { department: true },
    });

    // 1. Generate Structured Decomposition Plan
    let subtaskDefs: SubtaskDefinitionDto[] = [];
    let rationale = '';

    try {
      const systemPrompt = coordinator.agentConfig?.systemPrompt ||
        `You are ${coordinator.firstName} ${coordinator.lastName}, ${coordinator.jobTitle || coordinator.role} at Virtual AI Company (VAC).\n` +
        `Your mandate is cross-functional task orchestration, operational governance, and workflow decomposition.`;

      const userPrompt =
        `You are decomposing an executive directive from the CEO into 2 to 3 sequential, concrete subtasks for your team:\n\n` +
        `DIRECTIVE TITLE: ${parentTask.title}\n` +
        `DIRECTIVE OBJECTIVE: ${parentTask.description}\n` +
        (dto.guidelines ? `COORDINATION GUIDELINES: ${dto.guidelines}\n` : '') +
        `\nAVAILABLE TEAM MEMBERS:\n` +
        employees
          .map((e) => `- ${e.firstName} ${e.lastName} [${e.employeeCode}] (${e.jobTitle || e.role}, Dept: ${e.department.name}, Skills: ${((e.skills as any) || []).join(', ')})`)
          .join('\n') +
        `\n\nOUTPUT INSTRUCTIONS:\n` +
        `Respond ONLY with a valid JSON array of subtask objects. Example format:\n` +
        `[\n` +
        `  {\n` +
        `    "title": "Subtask title",\n` +
        `    "description": "Specific deliverable objective",\n` +
        `    "requiredRole": "Technology" or "Engineering" or "Quality Assurance" or "Research",\n` +
        `    "priority": "HIGH" or "MEDIUM"\n` +
        `  }\n` +
        `]\n` +
        `Do not include any prose outside the JSON brackets.`;

      const response = await this.ollamaService.chat({
        model: coordinator.agentConfig?.modelName || 'qwen3.5:4b',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.2,
        think: false,
      });

      const rawContent = response.content || '';
      const jsonMatch = rawContent.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        subtaskDefs = JSON.parse(jsonMatch[0]);
        rationale = `Plan synthesized by ${coordinator.firstName} ${coordinator.lastName} (COO) via Ollama inference (${response.durationMs}ms).`;
      }
    } catch (err: any) {
      this.logger.warn(`AI decomposition returned unstructured output (${err.message}). Using deterministic fallback.`);
    }

    // Deterministic fallback if model did not return structured array
    if (!subtaskDefs || !Array.isArray(subtaskDefs) || subtaskDefs.length === 0) {
      subtaskDefs = this.generateDeterministicPlan(parentTask.title, parentTask.description);
      rationale = `Automated multi-department decomposition plan for [${parentTask.title}].`;
    }

    // 2. Delegate and persist each subtask
    const createdSubtasks: any[] = [];

    for (const def of subtaskDefs) {
      // Find eligible assignee matching role or department
      const targetEmployee = this.findBestAssignee(def, employees);

      const delegated = await this.agentComms.delegateTask({
        parentTaskId: parentTask.id,
        delegatingEmployeeId: coordinator.id,
        assignedEmployeeId: targetEmployee.id,
        subtaskTitle: def.title,
        subtaskDescription: def.description,
        priority: def.priority || 'MEDIUM',
        contextData: {
          parentTaskObjective: parentTask.description,
          assignedRole: def.requiredRole,
        },
      });

      createdSubtasks.push(delegated.subtask);
    }

    // Update parent task to IN_PROGRESS with plan metadata
    await this.prisma.task.update({
      where: { id: parentTask.id },
      data: {
        status: 'IN_PROGRESS',
        deliverables: {
          decompositionPlan: {
            coordinatorId: coordinator.id,
            coordinatorName: `${coordinator.firstName} ${coordinator.lastName}`,
            rationale,
            subtaskCount: createdSubtasks.length,
            decomposedAt: new Date().toISOString(),
          },
        },
      },
    });

    return {
      plan: {
        parentTaskId: parentTask.id,
        coordinatorId: coordinator.id,
        subtasks: subtaskDefs,
        rationale,
      },
      subtasks: createdSubtasks,
    };
  }

  /**
   * Retrieves the complete hierarchical task tree (parent, subtasks, dependencies)
   */
  async getTaskTree(taskId: string) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: {
        assignedEmployee: {
          include: { department: true },
        },
        delegatedBy: {
          include: { department: true },
        },
        subtasks: {
          include: {
            assignedEmployee: {
              include: { department: true },
            },
            delegatedBy: true,
            executions: {
              orderBy: { startedAt: 'desc' },
              take: 1,
            },
          },
          orderBy: { createdAt: 'asc' },
        },
        executions: {
          orderBy: { startedAt: 'desc' },
          take: 1,
        },
        agentMessages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!task) {
      throw new NotFoundException(`Task with ID '${taskId}' not found.`);
    }

    const allCorrelatedMessages = await this.prisma.agentMessage.findMany({
      where: {
        OR: [
          { taskId },
          { correlationId: taskId },
          { task: { parentTaskId: taskId } },
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

    return {
      ...task,
      agentMessages: allCorrelatedMessages,
    };
  }

  /**
   * Checks whether all subtasks for a parent task have completed,
   * consolidating deliverables and generating an executive briefing.
   */
  async checkParentTaskCompletion(parentTaskId: string): Promise<boolean> {
    const parentTask = await this.prisma.task.findUnique({
      where: { id: parentTaskId },
      include: {
        subtasks: {
          include: { assignedEmployee: true },
        },
        assignedEmployee: true,
      },
    });

    if (!parentTask || parentTask.subtasks.length === 0) {
      return false;
    }

    const allCompleted = parentTask.subtasks.every((st) => st.status === 'COMPLETED');
    const hasFailed = parentTask.subtasks.some((st) => st.status === 'FAILED');

    if (hasFailed) {
      this.logger.warn(`Parent task [${parentTaskId}] has failed subtasks. Setting status to REVIEW.`);
      await this.prisma.task.update({
        where: { id: parentTaskId },
        data: {
          status: 'REVIEW',
          deliverables: {
            note: 'One or more delegated subtasks failed. Supervisor review required.',
          },
        },
      });
      return false;
    }

    if (allCompleted) {
      this.logger.log(`All ${parentTask.subtasks.length} subtasks completed for Parent Task [${parentTask.title}]. Consolidating executive deliverable...`);

      const subtaskDeliverables = parentTask.subtasks.map((st) => ({
        title: st.title,
        assignee: `${st.assignedEmployee.firstName} ${st.assignedEmployee.lastName} (${st.assignedEmployee.role})`,
        deliverables: st.deliverables,
      }));

      // Find Elena (COO) to perform executive evaluation and synthesis
      const coo = await this.prisma.employee.findFirst({
        where: { employeeCode: 'VAC-OPS-001' },
        include: { agentConfig: true },
      });

      let summary = '';

      if (coo && coo.agentConfig) {
        try {
          const evalPrompt =
            `You are Elena Rostova, Chief Operating Officer (COO) and Chief of Staff at Virtual AI Company (VAC).\n` +
            `Synthesize the following completed team deliverables for the CEO into an Executive Briefing:\n\n` +
            `DIRECTIVE: ${parentTask.title}\n` +
            `OBJECTIVE: ${parentTask.description}\n\n` +
            `SUBTASK DELIVERABLES:\n` +
            subtaskDeliverables
              .map((sd, i) => `${i + 1}. [${sd.title}] by ${sd.assignee}:\n${JSON.stringify(sd.deliverables || 'Completed')}`)
              .join('\n\n') +
            `\n\nProvide a concise 3-part synthesis:\n` +
            `1. Executive Assessment & Objective Verification\n` +
            `2. Summary of Verified Technical Deliverables\n` +
            `3. Operational Readiness for CEO Sign-Off.`;

          const aiEval = await this.ollamaService.chat({
            model: coo.agentConfig.modelName || 'qwen3.5:4b',
            messages: [
              { role: 'system', content: coo.agentConfig.systemPrompt },
              { role: 'user', content: evalPrompt },
            ],
            temperature: 0.2,
            think: false,
          });

          if (aiEval.content && aiEval.content.trim().length > 50) {
            summary =
              `### Consolidated Executive Briefing (Ollama AI Synthesis)\n` +
              `*Synthesized by Elena Rostova (COO) via Ollama ${coo.agentConfig.modelName}*\n\n` +
              aiEval.content;
          }
        } catch (evalErr: any) {
          this.logger.warn(`AI executive synthesis failed (${evalErr.message}). Using structured fallback.`);
        }
      }

      if (!summary) {
        summary =
          `### Consolidated Multi-Agent Executive Report\n\n` +
          `**Directive:** ${parentTask.title}\n` +
          `**Status:** 100% Subtasks Verified & Completed\n\n` +
          `#### Subtask Execution Deliverables:\n` +
          subtaskDeliverables
            .map(
              (sd, idx) =>
                `${idx + 1}. **${sd.title}** (${sd.assignee})\n` +
                `   - Deliverable summary: ${JSON.stringify(sd.deliverables || 'Execution completed with exit code 0.')}`,
            )
            .join('\n\n') +
          `\n\n*Prepared by Elena Rostova (COO) via VAC Autonomous Orchestration Engine.*`;
      }

      await this.prisma.task.update({
        where: { id: parentTaskId },
        data: {
          status: 'COMPLETED',
          deliverables: {
            consolidatedSummary: summary,
            completedAt: new Date().toISOString(),
            subtaskCount: parentTask.subtasks.length,
          },
        },
      });

      return true;
    }

    return false;
  }

  private generateDeterministicPlan(title: string, description: string): SubtaskDefinitionDto[] {
    return [
      {
        title: `Technical Architecture Spike: ${title}`,
        description: `Analyze architectural requirements, identify dependencies, and outline implementation specifications for: ${description}`,
        requiredRole: 'Technology',
        requiredExpertise: 'Systems Architecture',
        priority: 'HIGH',
      },
      {
        title: `Core Engineering Implementation: ${title}`,
        description: `Implement the code changes, refactors, or feature logic according to specifications for: ${description}`,
        requiredRole: 'Engineering',
        requiredExpertise: 'Full-Stack Software Engineering',
        priority: 'HIGH',
      },
      {
        title: `Automated Quality & Verification: ${title}`,
        description: `Author unit & regression tests, execute build verification, and validate edge cases for: ${description}`,
        requiredRole: 'Quality Assurance',
        requiredExpertise: 'Automated Testing',
        priority: 'MEDIUM',
      },
    ];
  }

  private findBestAssignee(def: SubtaskDefinitionDto, employees: any[]): any {
    const roleTarget = (def.requiredRole || def.requiredExpertise || '').toLowerCase();

    // 1. Direct match on department slug or name
    let matched = employees.find(
      (e) =>
        e.department.slug.toLowerCase().includes(roleTarget) ||
        e.department.name.toLowerCase().includes(roleTarget) ||
        e.role.toLowerCase().includes(roleTarget),
    );

    // 2. Specific role mapping
    if (!matched) {
      if (roleTarget.includes('qa') || roleTarget.includes('test') || roleTarget.includes('quality')) {
        matched = employees.find((e) => e.employeeCode === 'VAC-QA-001');
      } else if (roleTarget.includes('tech') || roleTarget.includes('arch') || roleTarget.includes('cto')) {
        matched = employees.find((e) => e.employeeCode === 'VAC-TECH-001');
      } else if (roleTarget.includes('research') || roleTarget.includes('spike')) {
        matched = employees.find((e) => e.employeeCode === 'VAC-RES-001');
      } else {
        matched = employees.find((e) => e.employeeCode === 'VAC-ENG-001'); // Alex Mercer default
      }
    }

    return matched || employees[0];
  }
}
