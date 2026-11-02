import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMemoryDto, UpdateMemoryDto } from './dto/memory.dto';
import { MemoryCategory, MemoryScope, MemoryStatus, MemorySourceType } from '@prisma/client';
import { OllamaEmbeddingProvider } from './providers/ollama-embedding.provider';

@Injectable()
export class MemoryIngestionService implements OnModuleInit {
  private readonly logger = new Logger(MemoryIngestionService.name);

  // Sensitive patterns to scrub from all memory content
  private static readonly SENSITIVE_PATTERNS = [
    /(password|passwd|pwd)\s*[:=]\s*['"]?[^\s'"]+['"]?/gi,
    /(secret|api_key|apikey|access_token|bearer)\s*[:=]\s*['"]?[^\s'"]+['"]?/gi,
    /-----BEGIN\s+(RSA|OPENSSH|PGP|CERTIFICATE)?\s*PRIVATE\s+KEY-----[\s\S]*?-----END\s+(RSA|OPENSSH|PGP|CERTIFICATE)?\s*PRIVATE\s+KEY-----/gi,
    /postgres(ql)?:\/\/[^:]+:[^@]+@[^\s/]+/gi,
    /mongodb(\+srv)?:\/\/[^:]+:[^@]+@[^\s/]+/gi,
  ];

  constructor(
    private readonly prisma: PrismaService,
    private readonly embeddingProvider: OllamaEmbeddingProvider,
  ) {}

  async onModuleInit() {
    await this.seedInitialCompanyKnowledge();
    await this.expireStaleWorkingMemories();
  }

  /**
   * Scrubs passwords, keys, and credentials before memory ingestion
   */
  sanitizeContent(text: string): string {
    if (!text) return text;
    let sanitized = text;
    for (const pattern of MemoryIngestionService.SENSITIVE_PATTERNS) {
      sanitized = sanitized.replace(pattern, '[REDACTED_CREDENTIAL]');
    }
    return sanitized;
  }

  /**
   * Ingests a new memory record with provenance, sanitization, and deduplication
   */
  async createMemory(dto: CreateMemoryDto) {
    const cleanTitle = dto.title.trim();
    const cleanContent = this.sanitizeContent(dto.content.trim());
    const cleanSummary = dto.summary ? this.sanitizeContent(dto.summary.trim()) : null;

    if (!cleanContent) {
      throw new BadRequestException('Memory content cannot be empty.');
    }

    // 1. Deduplication Guard: Check if an active memory with exact title & scope exists
    const existing = await this.prisma.memory.findFirst({
      where: {
        title: cleanTitle,
        category: dto.category,
        scope: dto.scope,
        ownerEmployeeId: dto.ownerEmployeeId || null,
        projectId: dto.projectId || null,
        status: 'ACTIVE',
      },
    });

    if (existing) {
      this.logger.log(`[Memory Deduplication] Found existing memory [${existing.id}] for title: "${cleanTitle}". Updating metadata and access count.`);
      return this.prisma.memory.update({
        where: { id: existing.id },
        data: {
          content: cleanContent,
          summary: cleanSummary || existing.summary,
          tags: (dto.tags as any) || existing.tags,
          importance: dto.importance !== undefined ? dto.importance : existing.importance,
          confidence: dto.confidence !== undefined ? dto.confidence : existing.confidence,
          accessCount: existing.accessCount + 1,
          lastAccessedAt: new Date(),
        },
        include: { source: true, ownerEmployee: true },
      });
    }

    // 2. Generate optional embedding via provider (graceful fallback if offline)
    let embedding: any = null;
    try {
      const vector = await this.embeddingProvider.generateEmbedding(`${cleanTitle}\n${cleanContent}`);
      if (vector) {
        embedding = vector;
      }
    } catch (err: any) {
      this.logger.debug(`Embedding generation skipped: ${err.message}`);
    }

    // 3. Create MemorySource provenance record
    const source = await this.prisma.memorySource.create({
      data: {
        sourceType: dto.sourceType || 'MANUAL_ENTRY',
        sourceRef: dto.sourceRef || null,
        isVerified: dto.isVerified ?? false,
        confidenceScore: dto.confidence ?? (dto.isVerified ? 1.0 : 0.8),
        rawContent: cleanContent.slice(0, 1000),
      },
    });

    // Validate foreign keys to avoid constraint violations
    let validTaskId: string | null = null;
    if (dto.taskId) {
      const task = await this.prisma.task.findUnique({ where: { id: dto.taskId }, select: { id: true } });
      if (task) {
        validTaskId = task.id;
      }
    }

    let validDepartmentId: string | null = null;
    if (dto.departmentId) {
      const dept = await this.prisma.department.findUnique({ where: { id: dto.departmentId }, select: { id: true } });
      if (dept) {
        validDepartmentId = dept.id;
      }
    }

    let validOwnerId: string | null = null;
    if (dto.ownerEmployeeId) {
      const emp = await this.prisma.employee.findUnique({ where: { id: dto.ownerEmployeeId }, select: { id: true } });
      if (emp) {
        validOwnerId = emp.id;
      }
    }

    // 4. Create Memory
    const memory = await this.prisma.memory.create({
      data: {
        category: dto.category,
        scope: dto.scope,
        title: cleanTitle,
        content: cleanContent,
        summary: cleanSummary,
        tags: (dto.tags as any) || [],
        ownerEmployeeId: validOwnerId,
        departmentId: validDepartmentId,
        projectId: dto.projectId || null,
        taskId: validTaskId,
        importance: dto.importance ?? 0.5,
        confidence: dto.confidence ?? 1.0,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
        metadata: dto.metadata || null,
        embedding: embedding ? (embedding as any) : null,
        sourceId: source.id,
        status: 'ACTIVE',
      },
      include: {
        source: true,
        ownerEmployee: {
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

    this.logger.log(`Ingested Memory [${memory.id}] Category: ${memory.category}, Scope: ${memory.scope}, Title: "${memory.title}"`);
    return memory;
  }

  /**
   * Automatically extracts and ingests episodic and working memories from a completed task
   */
  async ingestTaskOutcome(params: {
    taskId: string;
    employeeId: string;
    taskTitle: string;
    taskDescription: string;
    deliverablesSummary: string;
    projectId?: string;
    keyLearnings?: string[];
  }) {
    const { taskId, employeeId, taskTitle, taskDescription, deliverablesSummary, projectId, keyLearnings } = params;

    // 1. Ingest Episodic Memory for the employee who performed the work
    const episodicMemory = await this.createMemory({
      category: 'EPISODIC',
      scope: 'PROJECT_SHARED',
      title: `Task Outcome: ${taskTitle}`,
      content:
        `TASK OBJECTIVE: ${taskDescription}\n\n` +
        `EXECUTED DELIVERABLE:\n${deliverablesSummary}\n` +
        (keyLearnings && keyLearnings.length > 0 ? `\nKEY LESSONS LEARNED:\n- ${keyLearnings.join('\n- ')}` : ''),
      summary: deliverablesSummary.slice(0, 250),
      ownerEmployeeId: employeeId,
      projectId: projectId || null,
      taskId,
      importance: 0.75,
      confidence: 0.95,
      sourceType: 'TASK_EXECUTION',
      sourceRef: taskId,
      isVerified: true,
      tags: ['task_outcome', 'completed_work', ...(keyLearnings ? ['lessons_learned'] : [])],
    });

    return episodicMemory;
  }

  /**
   * Updates an existing memory record
   */
  async updateMemory(id: string, dto: UpdateMemoryDto) {
    const memory = await this.prisma.memory.findUnique({ where: { id } });
    if (!memory) {
      throw new NotFoundException(`Memory with ID '${id}' not found.`);
    }

    const data: any = {};
    if (dto.title) data.title = dto.title.trim();
    if (dto.content) data.content = this.sanitizeContent(dto.content.trim());
    if (dto.summary !== undefined) data.summary = dto.summary ? this.sanitizeContent(dto.summary.trim()) : null;
    if (dto.tags) data.tags = dto.tags;
    if (dto.importance !== undefined) data.importance = dto.importance;
    if (dto.confidence !== undefined) data.confidence = dto.confidence;
    if (dto.status) data.status = dto.status;
    if (dto.scope) data.scope = dto.scope;
    if (dto.metadata) data.metadata = dto.metadata;

    return this.prisma.memory.update({
      where: { id },
      data,
      include: { source: true, ownerEmployee: true },
    });
  }

  /**
   * Soft-archives a memory so it remains for audit but is excluded from active retrieval
   */
  async archiveMemory(id: string, reason?: string) {
    const memory = await this.prisma.memory.findUnique({ where: { id } });
    if (!memory) {
      throw new NotFoundException(`Memory with ID '${id}' not found.`);
    }

    return this.prisma.memory.update({
      where: { id },
      data: {
        status: 'ARCHIVED',
        metadata: {
          ...((memory.metadata as any) || {}),
          archivedAt: new Date().toISOString(),
          archiveReason: reason || 'Manually archived',
        },
      },
    });
  }

  /**
   * Deletes a memory (soft delete or purge)
   */
  async deleteMemory(id: string, hardDelete = false) {
    const memory = await this.prisma.memory.findUnique({ where: { id } });
    if (!memory) {
      throw new NotFoundException(`Memory with ID '${id}' not found.`);
    }

    if (hardDelete) {
      return this.prisma.memory.delete({ where: { id } });
    }

    return this.prisma.memory.update({
      where: { id },
      data: { status: 'DELETED' },
    });
  }

  /**
   * Automatically expires working memories past their expiresAt date
   */
  async expireStaleWorkingMemories(): Promise<number> {
    const now = new Date();
    const result = await this.prisma.memory.updateMany({
      where: {
        category: 'WORKING',
        status: 'ACTIVE',
        expiresAt: { lt: now },
      },
      data: { status: 'EXPIRED' },
    });

    if (result.count > 0) {
      this.logger.log(`Expired ${result.count} stale working memories.`);
    }
    return result.count;
  }

  /**
   * Seeds foundational Company Knowledge documents & verified company-shared semantic memories
   */
  async seedInitialCompanyKnowledge() {
    const count = await this.prisma.knowledgeDocument.count();
    if (count > 0) {
      return;
    }

    this.logger.log('Seeding initial verified company knowledge documents...');

    // 1. Engineering Coding Standards
    await this.prisma.knowledgeDocument.create({
      data: {
        title: 'Virtual AI Company TypeScript & Engineering Coding Standards',
        slug: 'vac-engineering-standards',
        category: 'CODING_STANDARDS',
        content:
          `# VAC Engineering Standards\n\n` +
          `1. Language & Runtimes: All application code must use TypeScript with strict mode enabled.\n` +
          `2. Architecture: Follow NestJS modular design for backend APIs and React functional components for web.\n` +
          `3. Security: All filesystem operations must execute within WorkspaceSandbox. Never use arbitrary shell execution outside granted tools.\n` +
          `4. Verification: Any implementation feature must be accompanied by automated unit or verification tests before marking COMPLETED.\n` +
          `5. Error Handling: Never silence exceptions silently; log meaningful errors with structured metadata.`,
        summary: 'Official coding standards, architecture principles, and verification requirements for engineering.',
        isApproved: true,
        approvedBy: 'Marcus Vance (CTO)',
        approvedAt: new Date(),
        tags: ['typescript', 'coding_standards', 'nestjs', 'react', 'security'],
      },
    });

    // 2. Platform Architecture Guidelines
    await this.prisma.knowledgeDocument.create({
      data: {
        title: 'Multi-Agent Autonomous Orchestration Architecture',
        slug: 'vac-architecture-guidelines',
        category: 'ARCHITECTURE_GUIDELINES',
        content:
          `# Multi-Agent Platform Guidelines\n\n` +
          `1. Chain of Command: CEO directs high-level directives. Elena Rostova (COO) orchestrates cross-functional decomposition.\n` +
          `2. Technical Oversight: Marcus Vance (CTO) supervises software implementation by Alex Mercer and QA verification by Sophia Lin.\n` +
          `3. Delegation Depth: Maximum delegation depth is strictly capped at 3 levels.\n` +
          `4. Agent Messages: Inter-agent communications must include correlation IDs and proper message types (TASK_DELEGATION, TASK_ACCEPTED, TASK_COMPLETED).\n` +
          `5. Isolation: Each employee operates within its designated autonomy level and tool whitelist.`,
        summary: 'Core architectural guidelines for multi-agent delegation, hierarchy, and supervision.',
        isApproved: true,
        approvedBy: 'Elena Rostova (COO)',
        approvedAt: new Date(),
        tags: ['architecture', 'multi_agent', 'delegation', 'supervision'],
      },
    });

    // 3. QA Testing & Verification Standards
    await this.prisma.knowledgeDocument.create({
      data: {
        title: 'QA Testing and Regression Boundary Policy',
        slug: 'vac-qa-standards',
        category: 'QA_VERIFICATION',
        content:
          `# QA Verification Standards\n\n` +
          `1. Test Coverage: Every functional deliverable must be validated against happy path and edge-case boundary conditions.\n` +
          `2. Build Integrity: Tasks cannot transition to COMPLETED if any build step or test step returned non-zero exit codes.\n` +
          `3. Autonomous Verification: Sophia Lin evaluates defects objectively. Any failing scenario keeps task in REVIEW.`,
        summary: 'Quality assurance protocol and release readiness verification rules.',
        isApproved: true,
        approvedBy: 'Sophia Lin (Senior QA)',
        approvedAt: new Date(),
        tags: ['qa', 'testing', 'regression', 'verification'],
      },
    });

    // Create corresponding Semantic Company-Shared Memories
    await this.createMemory({
      category: 'SEMANTIC',
      scope: 'COMPANY_SHARED',
      title: 'Company Engineering & Coding Standards',
      content: 'All code must be strict TypeScript, verified with run_build, and sandboxed within WorkspaceSandbox.',
      summary: 'Strict TypeScript and sandbox verification standard.',
      importance: 0.9,
      confidence: 1.0,
      isVerified: true,
      sourceType: 'KNOWLEDGE_DOCUMENT',
      sourceRef: 'vac-engineering-standards',
      tags: ['coding_standards', 'typescript', 'verification'],
    });

    await this.createMemory({
      category: 'SEMANTIC',
      scope: 'COMPANY_SHARED',
      title: 'Multi-Agent Delegation Policy & Depth Limits',
      content: 'Max delegation depth is 3. High-risk actions require CEO approval. Agents cannot self-approve.',
      summary: 'Delegation depth limit of 3 and human approval policy.',
      importance: 0.95,
      confidence: 1.0,
      isVerified: true,
      sourceType: 'KNOWLEDGE_DOCUMENT',
      sourceRef: 'vac-architecture-guidelines',
      tags: ['governance', 'delegation', 'security'],
    });

    this.logger.log('Seeded 3 knowledge documents and 2 semantic memories successfully.');
  }
}
