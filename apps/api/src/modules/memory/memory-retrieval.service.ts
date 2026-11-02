import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  MemoryRetrievalContext,
  RetrievedMemoryItem,
  FormattedMemoryContext,
} from '@vac/shared';
import { MemoryCategory, MemoryScope, MemoryStatus } from '@prisma/client';

@Injectable()
export class MemoryRetrievalService {
  private readonly logger = new Logger(MemoryRetrievalService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Retrieves relevant authorized memories for an employee before task execution or inference.
   * Strictly enforces that EMPLOYEE_PRIVATE memories of other employees are never returned.
   */
  async retrieveContext(context: MemoryRetrievalContext): Promise<FormattedMemoryContext> {
    const { employeeId, taskObjective, projectId, taskId, maxTokens = 800, categories } = context;

    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
      include: { department: true },
    });

    if (!employee) {
      throw new NotFoundException(`Employee with ID '${employeeId}' not found.`);
    }

    this.logger.log(
      `[MemoryRetrieval] Querying memories for [${employee.firstName} ${employee.lastName}] (${employee.employeeCode}) - Task: "${taskObjective.slice(0, 50)}..."`,
    );

    // 1. Authorization Filter:
    // Can access:
    // - COMPANY_SHARED memories
    // - PROJECT_SHARED memories matching projectId (or department)
    // - EMPLOYEE_PRIVATE memories owned strictly by employeeId
    // - TASK_SCOPED memories matching taskId
    const whereConditions: any = {
      status: 'ACTIVE',
      OR: [
        // Company-wide knowledge
        { scope: 'COMPANY_SHARED' },
        // Department-scoped company knowledge
        { scope: 'COMPANY_SHARED', departmentId: employee.departmentId },
        // Private memories owned strictly by this employee
        { scope: 'EMPLOYEE_PRIVATE', ownerEmployeeId: employeeId },
      ],
    };

    if (projectId) {
      whereConditions.OR.push({
        scope: 'PROJECT_SHARED',
        projectId,
      });
    }

    if (taskId) {
      whereConditions.OR.push({
        scope: 'TASK_SCOPED',
        taskId,
      });
    }

    // Optional category filter
    if (categories && categories.length > 0) {
      whereConditions.category = { in: categories };
    }

    const candidateMemories = await this.prisma.memory.findMany({
      where: whereConditions,
      include: { source: true },
      orderBy: [{ importance: 'desc' }, { createdAt: 'desc' }],
      take: 40,
    });

    // 2. Score relevance based on keyword match, importance, confidence, and recency
    const queryTokens = this.tokenize(taskObjective);
    const scoredMemories: Array<{ memory: any; score: number }> = [];

    for (const mem of candidateMemories) {
      // Security Double-Check: Guarantee no private memory leakage
      if (mem.scope === 'EMPLOYEE_PRIVATE' && mem.ownerEmployeeId !== employeeId) {
        continue;
      }

      const score = this.calculateRelevance(mem, queryTokens);
      if (score > 0.1) {
        scoredMemories.push({ memory: mem, score });
      }
    }

    // Sort by relevance score descending
    scoredMemories.sort((a, b) => b.score - a.score);

    // 3. Assemble and budget context tokens
    const working: string[] = [];
    const episodic: string[] = [];
    const semantic: string[] = [];
    const retrievedIds: string[] = [];
    let estimatedTokens = 0;

    for (const item of scoredMemories) {
      const mem = item.memory;
      const entryText = `- [${mem.title}]: ${mem.summary || mem.content}`;
      const entryTokenCost = Math.ceil(entryText.length / 4);

      if (estimatedTokens + entryTokenCost > maxTokens) {
        break;
      }

      retrievedIds.push(mem.id);
      estimatedTokens += entryTokenCost;

      if (mem.category === 'WORKING') {
        working.push(entryText);
      } else if (mem.category === 'EPISODIC') {
        episodic.push(entryText);
      } else {
        semantic.push(entryText);
      }

      // Log access audit asynchronously
      this.logAccess(mem.id, employeeId, taskId, 'RETRIEVED', taskObjective, item.score);
    }

    // 4. Construct unified prompt snippet
    const sections: string[] = [];
    if (working.length > 0) {
      sections.push(`### Working Memory (Current Task Context):\n${working.join('\n')}`);
    }
    if (episodic.length > 0) {
      sections.push(`### Relevant Past Experiences & Outcomes:\n${episodic.join('\n')}`);
    }
    if (semantic.length > 0) {
      sections.push(`### Verified Company Knowledge & Conventions:\n${semantic.join('\n')}`);
    }

    const promptSnippet = sections.length > 0
      ? `## RETRIEVED RELEVANT COMPANY & AGENT MEMORY:\n${sections.join('\n\n')}\n*Use the above memories and conventions to inform your decisions and implementations.*`
      : '';

    return {
      workingMemory: working,
      episodicMemory: episodic,
      semanticKnowledge: semantic,
      retrievedMemoryIds: retrievedIds,
      totalTokenEstimate: estimatedTokens,
      promptSnippet,
    };
  }

  /**
   * Search memories with query, scope, and employee authorization
   */
  async searchMemories(params: {
    requestingEmployeeId?: string;
    query?: string;
    category?: MemoryCategory;
    scope?: MemoryScope;
    status?: MemoryStatus;
    limit?: number;
    offset?: number;
  }) {
    const { requestingEmployeeId, query, category, scope, status = 'ACTIVE', limit = 20, offset = 0 } = params;

    const where: any = {
      status,
    };

    if (category) where.category = category;
    if (scope) where.scope = scope;

    // Authorization: If searching without an executive role, ensure private memories of others are excluded
    if (requestingEmployeeId) {
      where.OR = [
        { scope: { in: ['COMPANY_SHARED', 'PROJECT_SHARED'] } },
        { scope: 'EMPLOYEE_PRIVATE', ownerEmployeeId: requestingEmployeeId },
      ];
    } else {
      // Unauthenticated / generic query can only view company/project shared
      where.scope = { in: ['COMPANY_SHARED', 'PROJECT_SHARED'] };
    }

    if (query && query.trim()) {
      const q = query.trim();
      where.AND = [
        {
          OR: [
            { title: { contains: q, mode: 'insensitive' } },
            { content: { contains: q, mode: 'insensitive' } },
            { summary: { contains: q, mode: 'insensitive' } },
          ],
        },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.memory.findMany({
        where,
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
        orderBy: [{ importance: 'desc' }, { createdAt: 'desc' }],
        take: limit,
        skip: offset,
      }),
      this.prisma.memory.count({ where }),
    ]);

    return { total, items };
  }

  /**
   * Get single memory with access authorization check
   */
  async getMemoryById(id: string, requestingEmployeeId?: string) {
    const memory = await this.prisma.memory.findUnique({
      where: { id },
      include: {
        source: true,
        ownerEmployee: true,
        accessLogs: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!memory) {
      throw new NotFoundException(`Memory with ID '${id}' not found.`);
    }

    // Authorization: Block access if private memory belongs to someone else
    if (
      memory.scope === 'EMPLOYEE_PRIVATE' &&
      requestingEmployeeId &&
      memory.ownerEmployeeId !== requestingEmployeeId
    ) {
      throw new ForbiddenException('Access denied: This memory is private to another employee.');
    }

    return memory;
  }

  /**
   * Tokenizes text into normalized unique keywords
   */
  private tokenize(text: string): Set<string> {
    const words = text
      .toLowerCase()
      .replace(/[^a-z0-9_\s-]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 2);
    return new Set(words);
  }

  /**
   * Calculates relevance score based on lexical match, importance, confidence, and recency
   */
  private calculateRelevance(memory: any, queryTokens: Set<string>): number {
    const memoryTokens = this.tokenize(`${memory.title} ${memory.summary || ''} ${memory.content}`);
    const tags = Array.isArray(memory.tags) ? (memory.tags as string[]) : [];
    for (const tag of tags) {
      memoryTokens.add(tag.toLowerCase());
    }

    let matchCount = 0;
    for (const token of queryTokens) {
      if (memoryTokens.has(token)) {
        matchCount++;
      }
    }

    // Base lexical ratio
    const lexicalScore = queryTokens.size > 0 ? matchCount / queryTokens.size : 0.5;

    // Multipliers
    const importance = memory.importance ?? 0.5;
    const confidence = memory.confidence ?? 1.0;

    // Recency decay: memories created within last 7 days get a slight boost
    const ageDays = (Date.now() - new Date(memory.createdAt).getTime()) / (1000 * 60 * 60 * 24);
    const recencyBoost = ageDays < 7 ? 1.2 : ageDays < 30 ? 1.0 : 0.8;

    // Verified boost
    const verifiedBoost = memory.source?.isVerified ? 1.15 : 1.0;

    return Math.min(1.0, (lexicalScore * 0.6 + importance * 0.4) * confidence * recencyBoost * verifiedBoost);
  }

  /**
   * Records an access audit log asynchronously
   */
  private async logAccess(
    memoryId: string,
    employeeId: string,
    taskId?: string,
    action = 'RETRIEVED',
    context?: string,
    relevance?: number,
  ) {
    try {
      await this.prisma.$transaction(async (tx) => {
        await tx.memoryAccessLog.create({
          data: {
            memoryId,
            accessedByEmployeeId: employeeId,
            taskId: taskId || null,
            action,
            queryContext: context ? context.slice(0, 500) : null,
            relevanceScore: relevance || null,
          },
        });

        await tx.memory.update({
          where: { id: memoryId },
          data: {
            accessCount: { increment: 1 },
            lastAccessedAt: new Date(),
          },
        });
      });
    } catch (err: any) {
      this.logger.warn(`Failed to log memory access for [${memoryId}]: ${err.message}`);
    }
  }
}
