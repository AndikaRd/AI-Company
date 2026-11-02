import { PrismaClient } from '@prisma/client';
import { ToolRegistryService } from '../src/modules/tools/tool-registry.service';
import { EmployeesService } from '../src/modules/employees/employees.service';
import { AgentCommunicationService } from '../src/modules/agent-communication/agent-communication.service';
import { TaskOrchestratorService } from '../src/modules/tasks/task-orchestrator.service';
import { TaskRunnerService } from '../src/modules/tasks/task-runner.service';
import { WorkspaceSandbox } from '../src/modules/tools/security/workspace-sandbox';
import { ExecutionContext } from '../src/modules/tools/interfaces/tool.interface';
import { runBuildTool } from '../src/modules/tools/implementations/execution-tools';
import { gitPushTool } from '../src/modules/tools/implementations/approval-tools';
import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';

const prisma = new PrismaClient();

interface TestResult {
  id: number;
  name: string;
  passed: boolean;
  durationMs: number;
  details?: string;
}

async function runMultiAgentSuite(): Promise<void> {
  console.log('\n===============================================================');
  console.log('  SPRINT 4 — MULTI-AGENT COLLABORATION & HIERARCHY AUDIT SUITE ');
  console.log('===============================================================\n');

  const results: TestResult[] = [];
  const toolRegistry = new ToolRegistryService(prisma as any);
  (toolRegistry as any).onModuleInit();

  const mockOllamaService: any = {
    chat: async () => ({ content: 'Mock response', toolCalls: [] }),
  };
  const mockOrchestrator: any = {
    checkParentTaskCompletion: async () => true,
  };
  const taskRunner = new TaskRunnerService(prisma as any, toolRegistry, mockOllamaService, mockOrchestrator);
  const agentComms = new AgentCommunicationService(prisma as any, taskRunner);
  const taskOrchestrator = new TaskOrchestratorService(prisma as any, mockOllamaService, agentComms);
  mockOrchestrator.checkParentTaskCompletion = (id: string) => taskOrchestrator.checkParentTaskCompletion(id);
  const employeesService = new EmployeesService(prisma as any, mockOllamaService);

  // Ensure initial roles exist
  await employeesService.ensureInitialRolesProvisioned();

  // Retrieve employees
  const [elena, marcus, alex, sophia, maya] = await Promise.all([
    prisma.employee.findUnique({ where: { employeeCode: 'VAC-OPS-001' }, include: { agentConfig: true, department: true } }),
    prisma.employee.findUnique({ where: { employeeCode: 'VAC-TECH-001' }, include: { agentConfig: true, department: true } }),
    prisma.employee.findUnique({ where: { employeeCode: 'VAC-ENG-001' }, include: { agentConfig: true, department: true } }),
    prisma.employee.findUnique({ where: { employeeCode: 'VAC-QA-001' }, include: { agentConfig: true, department: true } }),
    prisma.employee.findUnique({ where: { employeeCode: 'VAC-RES-001' }, include: { agentConfig: true, department: true } }),
  ]);

  if (!elena || !marcus || !alex || !sophia || !maya) {
    throw new Error('Initial roles not provisioned properly for testing.');
  }

  // --------------------------------------------------------------------------
  // TEST 1: Organizational hierarchy retrieval
  // --------------------------------------------------------------------------
  {
    const start = Date.now();
    const tree = await employeesService.getHierarchy();
    const root = tree.find((r) => r.employee.employeeCode === 'VAC-OPS-001');

    const passed =
      tree.length >= 1 &&
      root !== undefined &&
      root.directReports.length === 2 &&
      root.totalSubordinates === 4;

    results.push({
      id: 1,
      name: 'Organizational hierarchy retrieval',
      passed,
      durationMs: Date.now() - start,
      details: passed
        ? `Retrieved tree with root Elena (COO), ${root?.directReports.length} direct reports, ${root?.totalSubordinates} total subordinates`
        : `Hierarchy check failed: root=${JSON.stringify(root)}`,
    });
  }

  // --------------------------------------------------------------------------
  // TEST 2: Supervisor and subordinate relationships
  // --------------------------------------------------------------------------
  {
    const start = Date.now();
    const marcusSubs = await employeesService.getSubordinates(marcus.id);
    const alexChain = await employeesService.getSupervisorChain(alex.id);

    const hasAlex = marcusSubs.some((s) => s.employeeCode === 'VAC-ENG-001');
    const hasSophia = marcusSubs.some((s) => s.employeeCode === 'VAC-QA-001');
    const directSupIsMarcus = alexChain.length >= 1 && alexChain[0].id === marcus.id;
    const topSupIsElena = alexChain.length >= 2 && alexChain[1].id === elena.id;

    const passed = hasAlex && hasSophia && directSupIsMarcus && topSupIsElena;
    results.push({
      id: 2,
      name: 'Supervisor and subordinate relationships',
      passed,
      durationMs: Date.now() - start,
      details: passed
        ? 'Marcus supervises Alex & Sophia; Alex supervisor chain resolves Marcus -> Elena'
        : `Subs count: ${marcusSubs.length}, Chain count: ${alexChain.length}`,
    });
  }

  // --------------------------------------------------------------------------
  // TEST 3: Agent message persistence
  // --------------------------------------------------------------------------
  {
    const start = Date.now();
    const msg = await agentComms.sendMessage({
      senderEmployeeId: marcus.id,
      recipientEmployeeId: alex.id,
      content: 'Marcus direct briefing to Alex Mercer regarding system refactoring.',
      messageType: 'DIRECT_MESSAGE',
    });

    const fetched = await prisma.agentMessage.findUnique({
      where: { id: msg.id },
    });

    const passed =
      fetched !== null &&
      fetched.senderEmployeeId === marcus.id &&
      fetched.recipientEmployeeId === alex.id &&
      fetched.correlationId !== null;

    results.push({
      id: 3,
      name: 'Agent message persistence',
      passed,
      durationMs: Date.now() - start,
      details: passed
        ? `Message persisted with correlation ID: ${msg.correlationId}`
        : 'Failed to persist agent message',
    });

    await prisma.agentMessage.delete({ where: { id: msg.id } });
  }

  // --------------------------------------------------------------------------
  // TEST 4: Task delegation
  // --------------------------------------------------------------------------
  let sharedParentTaskId = '';
  let delegatedSubtaskId = '';
  {
    const start = Date.now();
    const parentTask = await prisma.task.create({
      data: {
        title: 'Executive Task - Multi-Agent Test Parent',
        description: 'Testing task delegation flow',
        assignedEmployeeId: marcus.id,
        priority: 'HIGH',
      },
    });
    sharedParentTaskId = parentTask.id;

    const delegation = await agentComms.delegateTask({
      parentTaskId: parentTask.id,
      delegatingEmployeeId: marcus.id,
      assignedEmployeeId: alex.id,
      subtaskTitle: 'Implement Core Data Entity',
      subtaskDescription: 'Create schema definitions and interfaces',
      priority: 'HIGH',
    });
    delegatedSubtaskId = delegation.subtask.id;

    const passed =
      delegation.subtask.parentTaskId === parentTask.id &&
      delegation.subtask.delegatedByEmployeeId === marcus.id &&
      delegation.subtask.delegationDepth === 1 &&
      delegation.message.messageType === 'TASK_DELEGATION';

    results.push({
      id: 4,
      name: 'Task delegation',
      passed,
      durationMs: Date.now() - start,
      details: passed
        ? `Subtask created (depth ${delegation.subtask.delegationDepth}) and TASK_DELEGATION message generated`
        : 'Delegation failed',
    });
  }

  // --------------------------------------------------------------------------
  // TEST 5: Unauthorized delegation rejection
  // --------------------------------------------------------------------------
  {
    const start = Date.now();
    let unauthorizedBlocked = false;
    let errorMsg = '';

    try {
      // Alex (Senior SWE) attempts to delegate Marcus's task to Sophia without being supervisor or assigned to parent
      // Create a task assigned to Elena
      const elenaTask = await prisma.task.create({
        data: {
          title: 'Elena Confidential Initiative',
          description: 'Top secret executive work',
          assignedEmployeeId: elena.id,
        },
      });

      try {
        await agentComms.delegateTask({
          parentTaskId: elenaTask.id,
          delegatingEmployeeId: alex.id, // Alex has no authority over Elena's task
          assignedEmployeeId: sophia.id,
          subtaskTitle: 'Unauthorized Action',
          subtaskDescription: 'This should fail',
        });
      } finally {
        await prisma.task.delete({ where: { id: elenaTask.id } });
      }
    } catch (err: any) {
      if (err.message.includes('Unauthorized task delegation')) {
        unauthorizedBlocked = true;
        errorMsg = err.message;
      }
    }

    results.push({
      id: 5,
      name: 'Unauthorized delegation rejection',
      passed: unauthorizedBlocked,
      durationMs: Date.now() - start,
      details: unauthorizedBlocked ? `Rejected unauthorized delegation: ${errorMsg}` : 'Failed to block unauthorized delegation',
    });
  }

  // --------------------------------------------------------------------------
  // TEST 6: Employee-specific tool permissions
  // --------------------------------------------------------------------------
  {
    const start = Date.now();
    const sandbox = new WorkspaceSandbox(os.tmpdir());

    // 1. Dr. Maya Patel (Researcher) has allowCommandExecution: false
    const mayaContext: ExecutionContext = {
      taskId: 'test-maya',
      taskExecutionId: 'exec-maya',
      employeeId: maya.id,
      employeeName: `${maya.firstName} ${maya.lastName}`,
      autonomyLevel: maya.agentConfig?.autonomyLevel || 'SUPERVISED',
      sandbox,
      toolsEnabled: (maya.agentConfig?.toolsEnabled as string[]) || [],
      permissionConfig: (maya.agentConfig?.permissionConfig as any) || {},
    };

    const mayaBuildCheck = toolRegistry.checkPermission(runBuildTool, mayaContext);
    // Should be permanently prohibited because allowCommandExecution is false or run_build not in toolsEnabled
    const mayaBlocked = mayaBuildCheck.allowed === false;

    // 2. Sophia Lin (QA) does not have git_push enabled
    const sophiaContext: ExecutionContext = {
      taskId: 'test-sophia',
      taskExecutionId: 'exec-sophia',
      employeeId: sophia.id,
      employeeName: `${sophia.firstName} ${sophia.lastName}`,
      autonomyLevel: sophia.agentConfig?.autonomyLevel || 'SUPERVISED',
      sandbox,
      toolsEnabled: (sophia.agentConfig?.toolsEnabled as string[]) || [],
      permissionConfig: (sophia.agentConfig?.permissionConfig as any) || {},
    };

    const sophiaPushCheck = toolRegistry.checkPermission(gitPushTool, sophiaContext);
    const sophiaBlocked = sophiaPushCheck.allowed === false;

    // 3. Marcus Vance (CTO) has git_push enabled (requires approval)
    const marcusContext: ExecutionContext = {
      taskId: 'test-marcus',
      taskExecutionId: 'exec-marcus',
      employeeId: marcus.id,
      employeeName: `${marcus.firstName} ${marcus.lastName}`,
      autonomyLevel: marcus.agentConfig?.autonomyLevel || 'AUTONOMOUS',
      sandbox,
      toolsEnabled: (marcus.agentConfig?.toolsEnabled as string[]) || [],
      permissionConfig: (marcus.agentConfig?.permissionConfig as any) || {},
    };

    const marcusPushCheck = toolRegistry.checkPermission(gitPushTool, marcusContext);
    const marcusAllowed = marcusPushCheck.allowed === true;

    const passed = mayaBlocked && sophiaBlocked && marcusAllowed;
    results.push({
      id: 6,
      name: 'Employee-specific tool permissions',
      passed,
      durationMs: Date.now() - start,
      details: passed
        ? 'Verified distinct tool boundaries: Maya command execution blocked, Sophia push blocked, Marcus push allowed'
        : `mayaBlocked=${mayaBlocked}, sophiaBlocked=${sophiaBlocked}, marcusAllowed=${marcusAllowed}`,
    });
  }

  // --------------------------------------------------------------------------
  // TEST 7: Employee-specific system prompts
  // --------------------------------------------------------------------------
  {
    const start = Date.now();
    const promptElena = elena.agentConfig?.systemPrompt || '';
    const promptMarcus = marcus.agentConfig?.systemPrompt || '';
    const promptAlex = alex.agentConfig?.systemPrompt || '';
    const promptSophia = sophia.agentConfig?.systemPrompt || '';
    const promptMaya = maya.agentConfig?.systemPrompt || '';

    const allDistinct =
      promptElena.includes('Elena Rostova') &&
      promptMarcus.includes('Marcus Vance') &&
      promptAlex.includes('Alex Mercer') &&
      promptSophia.includes('Sophia Lin') &&
      promptMaya.includes('Maya Patel');

    results.push({
      id: 7,
      name: 'Employee-specific system prompts',
      passed: allDistinct,
      durationMs: Date.now() - start,
      details: allDistinct
        ? 'Each employee configuration retains a dedicated, role-specific system prompt persona'
        : 'System prompts are overlapping or not unique',
    });
  }

  // --------------------------------------------------------------------------
  // TEST 8: Task dependency handling & tree consolidation
  // --------------------------------------------------------------------------
  {
    const start = Date.now();
    // Simulate subtask completion
    await prisma.task.update({
      where: { id: delegatedSubtaskId },
      data: {
        status: 'COMPLETED',
        deliverables: { output: 'Module interfaces and entities verified' },
      },
    });

    const consolidated = await taskOrchestrator.checkParentTaskCompletion(sharedParentTaskId);
    const updatedParent = await prisma.task.findUnique({
      where: { id: sharedParentTaskId },
    });

    const passed = consolidated === true && updatedParent?.status === 'COMPLETED';

    results.push({
      id: 8,
      name: 'Task dependency handling & consolidation',
      passed,
      durationMs: Date.now() - start,
      details: passed
        ? `Consolidated parent task [${updatedParent?.title}] to COMPLETED status upon subtask completion`
        : 'Failed parent consolidation',
    });

    // Cleanup parent and subtasks
    await prisma.task.delete({ where: { id: sharedParentTaskId } });
  }

  // --------------------------------------------------------------------------
  // TEST 9: Delegation depth limits
  // --------------------------------------------------------------------------
  {
    const start = Date.now();
    let depthLimitCaught = false;

    // Create a task with delegationDepth = 3
    const maxDepthTask = await prisma.task.create({
      data: {
        title: 'Deep Task Level 3',
        description: 'At max delegation depth limit',
        assignedEmployeeId: marcus.id,
        delegationDepth: 3,
      },
    });

    try {
      await agentComms.delegateTask({
        parentTaskId: maxDepthTask.id,
        delegatingEmployeeId: marcus.id,
        assignedEmployeeId: alex.id,
        subtaskTitle: 'Forbidden Level 4 Task',
        subtaskDescription: 'Should exceed depth 3 limit',
      });
    } catch (err: any) {
      if (err.message.includes('Maximum delegation depth')) {
        depthLimitCaught = true;
      }
    } finally {
      await prisma.task.delete({ where: { id: maxDepthTask.id } });
    }

    results.push({
      id: 9,
      name: 'Delegation depth limits',
      passed: depthLimitCaught,
      durationMs: Date.now() - start,
      details: depthLimitCaught
        ? 'Prevented uncontrolled delegation: Depth >= 3 rejected with BadRequestException'
        : 'Failed to enforce delegation depth limit',
    });
  }

  // --------------------------------------------------------------------------
  // TEST 10: Existing Alex Mercer compatibility
  // --------------------------------------------------------------------------
  {
    const start = Date.now();
    const alexRecord = await prisma.employee.findUnique({
      where: { id: 'ab4620cd-0eaa-468f-930c-712ec7496797' },
      include: { agentConfig: true, department: true, supervisor: true },
    });

    const passed =
      alexRecord !== null &&
      alexRecord.firstName === 'Alex' &&
      alexRecord.lastName === 'Mercer' &&
      alexRecord.department.slug === 'engineering' &&
      alexRecord.supervisor?.employeeCode === 'VAC-TECH-001' &&
      (alexRecord.agentConfig?.toolsEnabled as string[])?.includes('run_build');

    results.push({
      id: 10,
      name: 'Existing Alex Mercer compatibility',
      passed,
      durationMs: Date.now() - start,
      details: passed
        ? `Alex Mercer record preserved: ID=${alexRecord?.id}, Dept=${alexRecord?.department.name}, Supervisor=${alexRecord?.supervisor?.firstName}`
        : 'Alex Mercer record was modified or corrupted',
    });
  }

  // --------------------------------------------------------------------------
  // Summary
  // --------------------------------------------------------------------------
  console.log('Multi-Agent Suite Results:');
  console.log('---------------------------------------------------------------');
  let allPassed = true;
  for (const r of results) {
    const statusIcon = r.passed ? '✓ [PASS]' : '✗ [FAIL]';
    if (!r.passed) allPassed = false;
    console.log(`${statusIcon} Test ${r.id.toString().padStart(2, '0')}: ${r.name} (${r.durationMs}ms)`);
    if (r.details) {
      console.log(`       ↳ ${r.details}`);
    }
  }
  console.log('---------------------------------------------------------------');
  const passCount = results.filter((r) => r.passed).length;
  console.log(`Total: ${passCount}/${results.length} tests passed.\n`);

  if (!allPassed) {
    throw new Error(`Multi-Agent Audit Suite failed with ${results.length - passCount} failing tests.`);
  }

  await prisma.$disconnect();
}

runMultiAgentSuite().catch(async (e) => {
  console.error('Audit suite encountered error:', e);
  await prisma.$disconnect();
  process.exit(1);
});
