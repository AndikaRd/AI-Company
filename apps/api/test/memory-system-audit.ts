/**
 * SPRINT 5 — COMPANY INTELLIGENCE & MEMORY SYSTEM AUDIT SUITE
 *
 * Validates:
 * - Employee private memory isolation
 * - Project shared memory access
 * - Company shared memory access
 * - Unauthorized memory retrieval rejection
 * - Task memory creation & ingestion
 * - Memory retrieval relevance
 * - Memory deduplication
 * - Memory expiration
 * - Memory archival
 * - Memory deletion
 * - Source provenance tracking
 * - Cross-agent memory permission boundaries
 * - Context token limits
 * - Ollama embedding failure handling
 * - Sensitive information scrubbing
 */

import { PrismaClient } from '@prisma/client';
import { MemoryIngestionService } from '../src/modules/memory/memory-ingestion.service';
import { MemoryRetrievalService } from '../src/modules/memory/memory-retrieval.service';
import { OllamaEmbeddingProvider } from '../src/modules/memory/providers/ollama-embedding.provider';
import { EmployeesService } from '../src/modules/employees/employees.service';

interface TestResult {
  id: number;
  name: string;
  passed: boolean;
  durationMs: number;
  details: string;
}

async function runMemoryAuditSuite() {
  console.log('\n===============================================================');
  console.log('    SPRINT 5 — COMPANY INTELLIGENCE & MEMORY SYSTEM AUDIT      ');
  console.log('===============================================================\n');

  const prisma = new PrismaClient();
  const results: TestResult[] = [];

  const mockConfig: any = {
    get: (key: string) => {
      if (key === 'app.ai') {
        return {
          ollama: {
            baseUrl: 'http://localhost:11434',
            embeddingModel: 'nomic-embed-text',
          },
        };
      }
      return null;
    },
  };

  const embeddingProvider = new OllamaEmbeddingProvider(mockConfig);
  const ingestionService = new MemoryIngestionService(prisma as any, embeddingProvider);
  const retrievalService = new MemoryRetrievalService(prisma as any);
  const employeesService = new EmployeesService(prisma as any, { chat: async () => ({ content: '' }) } as any);

  await employeesService.ensureInitialRolesProvisioned();
  await ingestionService.seedInitialCompanyKnowledge();

  const [elena, marcus, alex, sophia, maya] = await Promise.all([
    prisma.employee.findUnique({ where: { employeeCode: 'VAC-OPS-001' } }),
    prisma.employee.findUnique({ where: { employeeCode: 'VAC-TECH-001' } }),
    prisma.employee.findUnique({ where: { employeeCode: 'VAC-ENG-001' } }),
    prisma.employee.findUnique({ where: { employeeCode: 'VAC-QA-001' } }),
    prisma.employee.findUnique({ where: { employeeCode: 'VAC-RES-001' } }),
  ]);

  if (!elena || !marcus || !alex || !sophia || !maya) {
    throw new Error('Required organizational roles not found in database.');
  }

  // --------------------------------------------------------------------------
  // TEST 1: Sensitive Information Scrubbing
  // --------------------------------------------------------------------------
  {
    const start = Date.now();
    const raw = 'Config: password=SuperSecret123; api_key="sk-live-9999"; url=postgresql://admin:SecretPass@localhost:5432/db';
    const clean = ingestionService.sanitizeContent(raw);

    const passed =
      !clean.includes('SuperSecret123') &&
      !clean.includes('sk-live-9999') &&
      !clean.includes('SecretPass') &&
      clean.includes('[REDACTED_CREDENTIAL]');

    results.push({
      id: 1,
      name: 'Sensitive information scrubbing',
      passed,
      durationMs: Date.now() - start,
      details: passed
        ? 'Passwords, API keys, and connection strings sanitized to [REDACTED_CREDENTIAL]'
        : `Sanitization failed: ${clean}`,
    });
  }

  // --------------------------------------------------------------------------
  // TEST 2: Employee Private Memory Isolation
  // --------------------------------------------------------------------------
  let alexPrivateMemoryId = '';
  {
    const start = Date.now();
    const mem = await ingestionService.createMemory({
      category: 'EPISODIC',
      scope: 'EMPLOYEE_PRIVATE',
      title: 'Alex Personal Debugging Technique',
      content: 'Alex discovered that React Three Fiber canvas crashes when unmounting without disposing geometry caches.',
      ownerEmployeeId: alex.id,
      importance: 0.8,
      confidence: 0.9,
    });
    alexPrivateMemoryId = mem.id;

    // Alex retrieves context -> should find it
    const alexContext = await retrievalService.retrieveContext({
      employeeId: alex.id,
      taskObjective: 'Fix 3D Virtual Office canvas disposal bug',
    });

    // Sophia retrieves context -> must NOT see Alex's private memory
    const sophiaContext = await retrievalService.retrieveContext({
      employeeId: sophia.id,
      taskObjective: 'Fix 3D Virtual Office canvas disposal bug',
    });

    const passed =
      alexContext.retrievedMemoryIds.includes(alexPrivateMemoryId) &&
      !sophiaContext.retrievedMemoryIds.includes(alexPrivateMemoryId);

    results.push({
      id: 2,
      name: 'Employee private memory isolation',
      passed,
      durationMs: Date.now() - start,
      details: passed
        ? `Alex private memory [${alexPrivateMemoryId}] accessible to Alex, strictly excluded from Sophia`
        : 'Failed private memory isolation',
    });
  }

  // --------------------------------------------------------------------------
  // TEST 3: Project Shared Memory Access
  // --------------------------------------------------------------------------
  const sharedProjectId = `proj-test-${Date.now()}`;
  let projectMemoryId = '';
  {
    const start = Date.now();
    const mem = await ingestionService.createMemory({
      category: 'SEMANTIC',
      scope: 'PROJECT_SHARED',
      title: 'Inventory Project Database Schema Specification',
      content: 'All inventory tables must use UUID primary keys and soft delete status flags.',
      projectId: sharedProjectId,
      ownerEmployeeId: marcus.id,
      importance: 0.85,
    });
    projectMemoryId = mem.id;

    const alexContext = await retrievalService.retrieveContext({
      employeeId: alex.id,
      taskObjective: 'Implement inventory tables and schemas',
      projectId: sharedProjectId,
    });

    const sophiaContext = await retrievalService.retrieveContext({
      employeeId: sophia.id,
      taskObjective: 'Verify inventory schema constraints',
      projectId: sharedProjectId,
    });

    const passed =
      alexContext.retrievedMemoryIds.includes(projectMemoryId) &&
      sophiaContext.retrievedMemoryIds.includes(projectMemoryId);

    results.push({
      id: 3,
      name: 'Project shared memory access',
      passed,
      durationMs: Date.now() - start,
      details: passed
        ? `Shared project memory [${projectMemoryId}] accessible to both Alex (SWE) and Sophia (QA)`
        : 'Failed project shared memory access',
    });
  }

  // --------------------------------------------------------------------------
  // TEST 4: Company Shared Memory Access
  // --------------------------------------------------------------------------
  {
    const start = Date.now();
    const mayaContext = await retrievalService.retrieveContext({
      employeeId: maya.id,
      taskObjective: 'Review company coding standards and TypeScript practices',
    });

    const passed =
      mayaContext.semanticKnowledge.length > 0 &&
      mayaContext.semanticKnowledge.some((k) => k.includes('TypeScript & Engineering Coding Standards') || k.includes('Coding Standards'));

    results.push({
      id: 4,
      name: 'Company shared memory access',
      passed,
      durationMs: Date.now() - start,
      details: passed
        ? 'Company-shared standards retrieved by Dr. Maya Patel without employee restriction'
        : 'Failed to retrieve company-shared knowledge',
    });
  }

  // --------------------------------------------------------------------------
  // TEST 5: Unauthorized Memory Retrieval Rejection
  // --------------------------------------------------------------------------
  {
    const start = Date.now();
    let rejected = false;
    try {
      await retrievalService.getMemoryById(alexPrivateMemoryId, sophia.id);
    } catch (err: any) {
      rejected = err.status === 403 || err.message.includes('Access denied');
    }

    results.push({
      id: 5,
      name: 'Unauthorized memory retrieval rejection',
      passed: rejected,
      durationMs: Date.now() - start,
      details: rejected
        ? 'Direct request for another employee\'s private memory rejected with ForbiddenException (403)'
        : 'Failed to reject unauthorized direct memory request',
    });
  }

  // --------------------------------------------------------------------------
  // TEST 6: Task Memory Creation & Ingestion
  // --------------------------------------------------------------------------
  let taskMemoryId = '';
  {
    const start = Date.now();
    // Create actual task to satisfy foreign key relation
    const testTask = await prisma.task.create({
      data: {
        title: 'Implement Stock Ledger Validation',
        description: 'Ensure negative stock balances cannot be committed to ledger.',
        assignedEmployeeId: alex.id,
        delegatedByEmployeeId: elena.id,
        status: 'COMPLETED',
      },
    });
    const mem = await ingestionService.ingestTaskOutcome({
      taskId: testTask.id,
      employeeId: alex.id,
      taskTitle: 'Implement Stock Ledger Validation',
      taskDescription: 'Ensure negative stock balances cannot be committed to ledger.',
      deliverablesSummary: 'Implemented validation guard in stock ledger service. Exit code 0.',
      keyLearnings: ['Atomic transaction required when updating multi-bin inventory balances.'],
    });
    taskMemoryId = mem.id;

    const passed =
      mem !== undefined &&
      mem.category === 'EPISODIC' &&
      mem.source?.sourceType === 'TASK_EXECUTION' &&
      mem.source?.isVerified === true;

    results.push({
      id: 6,
      name: 'Task memory creation & provenance',
      passed,
      durationMs: Date.now() - start,
      details: passed
        ? `Task outcome ingested as EPISODIC memory [${taskMemoryId}] with verified TASK_EXECUTION provenance`
        : 'Failed task memory creation',
    });
  }

  // --------------------------------------------------------------------------
  // TEST 7: Memory Retrieval Relevance Scoring
  // --------------------------------------------------------------------------
  {
    const start = Date.now();
    const searchRes = await retrievalService.searchMemories({
      requestingEmployeeId: alex.id,
      query: 'Stock Ledger',
    });

    const topItem = searchRes.items[0];
    const passed = searchRes.items.length > 0 && topItem.title.includes('Stock Ledger');

    results.push({
      id: 7,
      name: 'Memory retrieval relevance scoring',
      passed,
      durationMs: Date.now() - start,
      details: passed
        ? `Relevant memory [${topItem.title}] ranked #1 for query 'Stock Ledger'`
        : 'Failed relevance ranking',
    });
  }

  // --------------------------------------------------------------------------
  // TEST 8: Memory Deduplication
  // --------------------------------------------------------------------------
  {
    const start = Date.now();
    const duplicateTitle = 'Unique Architectural Convention For Testing';
    const mem1 = await ingestionService.createMemory({
      category: 'SEMANTIC',
      scope: 'COMPANY_SHARED',
      title: duplicateTitle,
      content: 'Initial content for testing deduplication.',
      importance: 0.6,
    });

    // Ingest with identical title and scope
    const mem2 = await ingestionService.createMemory({
      category: 'SEMANTIC',
      scope: 'COMPANY_SHARED',
      title: duplicateTitle,
      content: 'Updated content for testing deduplication.',
      importance: 0.7,
    });

    const passed = mem1.id === mem2.id && mem2.accessCount >= 1;

    results.push({
      id: 8,
      name: 'Memory deduplication',
      passed,
      durationMs: Date.now() - start,
      details: passed
        ? `Existing memory ID [${mem1.id}] reused and updated instead of creating duplicate entity`
        : `Deduplication failed: mem1=${mem1.id}, mem2=${mem2.id}`,
    });
  }

  // --------------------------------------------------------------------------
  // TEST 9: Memory Expiration Lifecycle
  // --------------------------------------------------------------------------
  {
    const start = Date.now();
    const expiredMem = await ingestionService.createMemory({
      category: 'WORKING',
      scope: 'TASK_SCOPED',
      title: 'Temporary Scratchpad Data',
      content: 'Intermediate calculation results for in-flight task.',
      expiresAt: new Date(Date.now() - 10000), // In the past
    });

    const expiredCount = await ingestionService.expireStaleWorkingMemories();
    const updated = await prisma.memory.findUnique({ where: { id: expiredMem.id } });

    const passed = expiredCount >= 1 && updated?.status === 'EXPIRED';

    results.push({
      id: 9,
      name: 'Memory expiration lifecycle',
      passed,
      durationMs: Date.now() - start,
      details: passed
        ? `Expired working memory status transitioned to EXPIRED (${expiredCount} expired total)`
        : 'Failed expiration lifecycle',
    });
  }

  // --------------------------------------------------------------------------
  // TEST 10: Memory Archival
  // --------------------------------------------------------------------------
  {
    const start = Date.now();
    const mem = await ingestionService.createMemory({
      category: 'SEMANTIC',
      scope: 'COMPANY_SHARED',
      title: 'Deprecated Protocol 2025',
      content: 'Old protocol to be archived.',
    });

    const archived = await ingestionService.archiveMemory(mem.id, 'Superseded by VAC Protocol 2026');

    // Ensure it is excluded from default ACTIVE search
    const activeSearch = await retrievalService.searchMemories({
      query: 'Deprecated Protocol 2025',
      status: 'ACTIVE',
    });

    const passed = archived.status === 'ARCHIVED' && activeSearch.items.length === 0;

    results.push({
      id: 10,
      name: 'Memory archival',
      passed,
      durationMs: Date.now() - start,
      details: passed
        ? 'Archived memory status set to ARCHIVED and cleanly filtered out from active retrieval'
        : 'Failed memory archival',
    });
  }

  // --------------------------------------------------------------------------
  // TEST 11: Memory Deletion
  // --------------------------------------------------------------------------
  {
    const start = Date.now();
    const mem = await ingestionService.createMemory({
      category: 'WORKING',
      scope: 'TASK_SCOPED',
      title: 'Temporary Scrap File To Delete',
      content: 'Will be deleted.',
    });

    await ingestionService.deleteMemory(mem.id, false); // soft delete
    const softDeleted = await prisma.memory.findUnique({ where: { id: mem.id } });

    await ingestionService.deleteMemory(mem.id, true); // hard delete
    const hardDeleted = await prisma.memory.findUnique({ where: { id: mem.id } });

    const passed = softDeleted?.status === 'DELETED' && hardDeleted === null;

    results.push({
      id: 11,
      name: 'Memory deletion',
      passed,
      durationMs: Date.now() - start,
      details: passed
        ? 'Supported soft deletion (status=DELETED) followed by permanent purge'
        : 'Failed memory deletion',
    });
  }

  // --------------------------------------------------------------------------
  // TEST 12: Context Token Budget Limits
  // --------------------------------------------------------------------------
  {
    const start = Date.now();
    const context = await retrievalService.retrieveContext({
      employeeId: alex.id,
      taskObjective: 'Coding standards and architecture guidelines',
      maxTokens: 100, // Very tight limit
    });

    const passed = context.totalTokenEstimate <= 100;

    results.push({
      id: 12,
      name: 'Context token budget limits',
      passed,
      durationMs: Date.now() - start,
      details: passed
        ? `Retrieved context respected token cap: estimate=${context.totalTokenEstimate} <= maxTokens=100`
        : `Token budget exceeded: ${context.totalTokenEstimate} > 100`,
    });
  }

  // --------------------------------------------------------------------------
  // TEST 13: Memory Access Audit Logging
  // --------------------------------------------------------------------------
  {
    const start = Date.now();
    await retrievalService.retrieveContext({
      employeeId: sophia.id,
      taskObjective: 'Quality Assurance Testing standards and policies',
      taskId: 'task-audit-check',
    });

    const logs = await prisma.memoryAccessLog.findMany({
      where: { accessedByEmployeeId: sophia.id },
      orderBy: { createdAt: 'desc' },
      take: 3,
    });

    const passed = logs.length > 0 && logs[0].action === 'RETRIEVED';

    results.push({
      id: 13,
      name: 'Memory access audit logging',
      passed,
      durationMs: Date.now() - start,
      details: passed
        ? `Logged ${logs.length} MemoryAccessLog entries tracking Sophia\'s retrieval actions`
        : 'Failed access audit logging',
    });
  }

  // --------------------------------------------------------------------------
  // TEST 14: Ollama Embedding Failure Graceful Handling
  // --------------------------------------------------------------------------
  {
    const start = Date.now();
    const embedding = await embeddingProvider.generateEmbedding('test text');
    const available = await embeddingProvider.isAvailable();

    // Must handle gracefully without throwing exception, returning null when unsupported
    const passed = embedding === null || Array.isArray(embedding);

    results.push({
      id: 14,
      name: 'Ollama embedding failure graceful handling',
      passed,
      durationMs: Date.now() - start,
      details: passed
        ? `Embedding provider handled server capability safely: available=${available}, returned=${embedding === null ? 'null (graceful fallback)' : 'vector'}`
        : 'Embedding provider threw uncaught exception',
    });
  }

  // --------------------------------------------------------------------------
  // RESULTS SUMMARY
  // --------------------------------------------------------------------------
  console.log('---------------------------------------------------------------');
  for (const r of results) {
    const symbol = r.passed ? '✓ [PASS]' : '✗ [FAIL]';
    console.log(`${symbol} Test ${String(r.id).padStart(2, '0')}: ${r.name} (${r.durationMs}ms)`);
    console.log(`       ↳ ${r.details}`);
  }
  console.log('---------------------------------------------------------------');

  const passedCount = results.filter((r) => r.passed).length;
  console.log(`Total: ${passedCount}/${results.length} tests passed.\n`);

  await prisma.$disconnect();

  if (passedCount !== results.length) {
    throw new Error(`Memory Audit Suite failed with ${results.length - passedCount} failing tests.`);
  }

  return true;
}

runMemoryAuditSuite().catch((err) => {
  console.error('Audit suite encountered error:', err);
  process.exit(1);
});
