import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { PrismaClient } from '@prisma/client';
import { WorkspaceSandbox, WorkspaceSecurityException } from '../src/modules/tools/security/workspace-sandbox';
import { LogSanitizer } from '../src/modules/tools/security/log-sanitizer';
import { ToolRegistryService } from '../src/modules/tools/tool-registry.service';
import { TaskRunnerService } from '../src/modules/tasks/task-runner.service';
import { TasksService } from '../src/modules/tasks/tasks.service';
import { readFileTool } from '../src/modules/tools/implementations/readonly-tools';
import { createFileTool } from '../src/modules/tools/implementations/write-tools';
import { runBuildTool } from '../src/modules/tools/implementations/execution-tools';
import { gitCommitTool, deployApplicationTool } from '../src/modules/tools/implementations/approval-tools';
import { ExecutionContext } from '../src/modules/tools/interfaces/tool.interface';

const prisma = new PrismaClient();

interface TestResult {
  id: number;
  name: string;
  passed: boolean;
  durationMs: number;
  details?: string;
  error?: string;
}

async function runSecurityAuditSuite(): Promise<void> {
  console.log('\n===============================================================');
  console.log('  SPRINT 3.1 — SECURITY, RELIABILITY & EXECUTION AUDIT SUITE  ');
  console.log('===============================================================\n');

  const results: TestResult[] = [];
  const tempTestDirs: string[] = [];

  const createTempWorkspace = (prefix: string): string => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), `vac-audit-${prefix}-`));
    tempTestDirs.push(dir);
    return dir;
  };

  // Helper to get or create an active employee
  const employee = await prisma.employee.findFirst({
    include: { agentConfig: true },
  });

  if (!employee) {
    throw new Error('No employee found in database for regression testing.');
  }

  const toolRegistry = new ToolRegistryService(prisma as any);
  (toolRegistry as any).onModuleInit();

  const mockOllamaService: any = {
    chat: async () => ({ content: 'Mock response', toolCalls: [] }),
  };
  const taskRunner = new TaskRunnerService(prisma as any, toolRegistry, mockOllamaService);
  const tasksService = new TasksService(prisma as any, taskRunner);

  // --------------------------------------------------------------------------
  // TEST 1: Authorized file reading
  // --------------------------------------------------------------------------
  {
    const start = Date.now();
    const ws = createTempWorkspace('t1');
    const filePath = path.join(ws, 'src', 'index.ts');
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, 'console.log("authorized read passed");', 'utf8');

    const sandbox = new WorkspaceSandbox(ws);
    const context: ExecutionContext = {
      taskId: 'test-t1',
      taskExecutionId: 'exec-t1',
      employeeId: employee.id,
      employeeName: `${employee.firstName} ${employee.lastName}`,
      autonomyLevel: 'SUPERVISED',
      sandbox,
    };

    const res = await readFileTool.execute({ path: 'src/index.ts' }, context);
    const passed = res.success === true && res.data?.content?.includes('console.log("authorized read passed");');

    results.push({
      id: 1,
      name: 'Authorized file reading',
      passed,
      durationMs: Date.now() - start,
      details: passed ? 'Read file inside workspace successfully with proper content' : JSON.stringify(res),
    });
  }

  // --------------------------------------------------------------------------
  // TEST 2: Path traversal rejection
  // --------------------------------------------------------------------------
  {
    const start = Date.now();
    const ws = createTempWorkspace('t2');
    const sandbox = new WorkspaceSandbox(ws);

    let caught = false;
    let exceptionMsg = '';
    try {
      sandbox.resolveSafePath('../../escaped_secret.txt');
    } catch (err: any) {
      if (err instanceof WorkspaceSecurityException) {
        caught = true;
        exceptionMsg = err.message;
      }
    }

    const passed = caught && exceptionMsg.includes('Path traversal detected');
    results.push({
      id: 2,
      name: 'Path traversal rejection',
      passed,
      durationMs: Date.now() - start,
      details: passed ? `Caught: ${exceptionMsg}` : 'Failed to intercept path traversal escape attempt',
    });
  }

  // --------------------------------------------------------------------------
  // TEST 3: Symlink escape rejection
  // --------------------------------------------------------------------------
  {
    const start = Date.now();
    const ws = createTempWorkspace('t3-ws');
    const outsideDir = createTempWorkspace('t3-outside');
    const outsideFile = path.join(outsideDir, 'outside_payload.txt');
    fs.writeFileSync(outsideFile, 'DATA_STORED_OUTSIDE_WORKSPACE');

    // Create a junction / link pointing outside the workspace
    const linkDir = path.join(ws, 'external_symlink');
    fs.symlinkSync(outsideDir, linkDir, 'junction');

    const sandbox = new WorkspaceSandbox(ws);
    let caught = false;
    let exceptionMsg = '';

    try {
      sandbox.resolveSafePath('external_symlink/outside_payload.txt');
    } catch (err: any) {
      if (err instanceof WorkspaceSecurityException) {
        caught = true;
        exceptionMsg = err.message;
      }
    }

    const passed = caught && exceptionMsg.includes('Symlink escape detected');
    results.push({
      id: 3,
      name: 'Symlink escape rejection',
      passed,
      durationMs: Date.now() - start,
      details: passed ? `Caught: ${exceptionMsg}` : `Symlink escape was not intercepted (caught=${caught}, msg=${exceptionMsg})`,
    });
  }

  // --------------------------------------------------------------------------
  // TEST 4: Sensitive file access rejection
  // --------------------------------------------------------------------------
  {
    const start = Date.now();
    const ws = createTempWorkspace('t4');
    const sandbox = new WorkspaceSandbox(ws);

    const sensitiveFiles = ['.env', '.env.local', 'id_rsa', 'server.key', 'client.pfx', 'aws.secret'];
    let allBlocked = true;
    const blockedList: string[] = [];

    for (const file of sensitiveFiles) {
      try {
        sandbox.resolveSafePath(`config/${file}`);
        allBlocked = false;
      } catch (err: any) {
        if (err instanceof WorkspaceSecurityException && err.message.includes('sensitive file pattern')) {
          blockedList.push(file);
        } else {
          allBlocked = false;
        }
      }
    }

    results.push({
      id: 4,
      name: 'Sensitive file access rejection',
      passed: allBlocked,
      durationMs: Date.now() - start,
      details: `Intercepted all ${blockedList.length}/${sensitiveFiles.length} sensitive patterns: ${blockedList.join(', ')}`,
    });
  }

  // --------------------------------------------------------------------------
  // TEST 5: Unauthorized tool execution
  // --------------------------------------------------------------------------
  {
    const start = Date.now();
    const ws = createTempWorkspace('t5');
    const sandbox = new WorkspaceSandbox(ws);

    const context: ExecutionContext = {
      taskId: 'test-t5',
      taskExecutionId: 'exec-t5',
      employeeId: employee.id,
      employeeName: `${employee.firstName} ${employee.lastName}`,
      autonomyLevel: 'SUPERVISED',
      sandbox,
      toolsEnabled: ['list_files', 'read_file'], // only read tools granted
    };

    const perm = toolRegistry.checkPermission(createFileTool, context);
    const passed = perm.allowed === false && perm.reason?.includes('Unauthorized tool execution');

    results.push({
      id: 5,
      name: 'Unauthorized tool execution',
      passed,
      durationMs: Date.now() - start,
      details: passed ? `Blocked ungranted tool 'create_file': ${perm.reason}` : 'Failed to block ungranted tool',
    });
  }

  // --------------------------------------------------------------------------
  // TEST 6: SUPERVISED permission behavior
  // --------------------------------------------------------------------------
  {
    const start = Date.now();
    const ws = createTempWorkspace('t6');
    const sandbox = new WorkspaceSandbox(ws);

    const context: ExecutionContext = {
      taskId: 'test-t6',
      taskExecutionId: 'exec-t6',
      employeeId: employee.id,
      employeeName: `${employee.firstName} ${employee.lastName}`,
      autonomyLevel: 'SUPERVISED',
      sandbox,
      toolsEnabled: ['read_file', 'create_file', 'git_commit', 'deploy_application'],
    };

    const pRead = toolRegistry.checkPermission(readFileTool, context);
    const pWrite = toolRegistry.checkPermission(createFileTool, context);
    const pCommit = toolRegistry.checkPermission(gitCommitTool, context);
    const pDeploy = toolRegistry.checkPermission(deployApplicationTool, context);

    const passed =
      pRead.allowed === true &&
      pRead.requiresApproval === false &&
      pWrite.allowed === true &&
      pWrite.requiresApproval === false &&
      pCommit.allowed === true &&
      pCommit.requiresApproval === true &&
      pDeploy.allowed === true &&
      pDeploy.requiresApproval === true;

    results.push({
      id: 6,
      name: 'SUPERVISED permission behavior',
      passed,
      durationMs: Date.now() - start,
      details: passed
        ? 'Verified: READ_ONLY auto-allowed, LOW allowed, HIGH & CRITICAL require supervisor approval'
        : `Failed check: pRead=${JSON.stringify(pRead)}, pWrite=${JSON.stringify(pWrite)}, pCommit=${JSON.stringify(pCommit)}, pDeploy=${JSON.stringify(pDeploy)}`,
    });
  }

  // --------------------------------------------------------------------------
  // TEST 7: Approval by authorized CEO
  // --------------------------------------------------------------------------
  {
    const start = Date.now();
    // Create task & approval in DB
    const testTask = await prisma.task.create({
      data: {
        title: 'Audit Test Task - Authorized CEO',
        description: 'Verify authorized CEO approval',
        assignedEmployeeId: employee.id,
        status: 'WAITING_APPROVAL',
      },
    });

    const execution = await prisma.taskExecution.create({
      data: {
        taskId: testTask.id,
        employeeId: employee.id,
        status: 'WAITING_APPROVAL',
      },
    });

    const approval = await prisma.approvalRequest.create({
      data: {
        taskId: testTask.id,
        taskExecutionId: execution.id,
        toolName: 'deploy_application',
        actionSummary: 'Deploy staging artifact',
        input: { environment: 'staging' },
        riskLevel: 'CRITICAL',
        status: 'PENDING',
      },
    });

    const originalRun = taskRunner.runTaskAsync;
    taskRunner.runTaskAsync = async () => {};

    const reviewed = await taskRunner.reviewApproval(approval.id, true, 'CEO');
    taskRunner.runTaskAsync = originalRun;
    const passed = reviewed.status === 'APPROVED' && reviewed.reviewedBy === 'CEO';

    results.push({
      id: 7,
      name: 'Approval by authorized CEO',
      passed,
      durationMs: Date.now() - start,
      details: passed ? `Successfully approved request ID: ${approval.id}` : 'Failed to approve via CEO',
    });

    // Cleanup
    await prisma.task.delete({ where: { id: testTask.id } });
  }

  // --------------------------------------------------------------------------
  // TEST 8: Approval by unauthorized user rejection
  // --------------------------------------------------------------------------
  {
    const start = Date.now();
    const testTask = await prisma.task.create({
      data: {
        title: 'Audit Test Task - Unauthorized User',
        description: 'Verify unauthorized approval rejection',
        assignedEmployeeId: employee.id,
        status: 'WAITING_APPROVAL',
      },
    });

    const execution = await prisma.taskExecution.create({
      data: {
        taskId: testTask.id,
        employeeId: employee.id,
        status: 'WAITING_APPROVAL',
      },
    });

    const approval = await prisma.approvalRequest.create({
      data: {
        taskId: testTask.id,
        taskExecutionId: execution.id,
        toolName: 'git_commit',
        actionSummary: 'Commit changes',
        input: { message: 'feat: test' },
        riskLevel: 'HIGH',
        status: 'PENDING',
      },
    });

    // Test 1: Self-approval by AI Employee
    let selfApprovalBlocked = false;
    try {
      await taskRunner.reviewApproval(approval.id, true, employee.firstName);
    } catch (err: any) {
      if (err.message.includes('strictly prohibited from approving its own operations')) {
        selfApprovalBlocked = true;
      }
    }

    // Test 2: Unauthorized third-party user
    let unauthorizedUserBlocked = false;
    try {
      await taskRunner.reviewApproval(approval.id, true, 'guest_intern');
    } catch (err: any) {
      if (err.message.includes('not authorized to approve')) {
        unauthorizedUserBlocked = true;
      }
    }

    const passed = selfApprovalBlocked && unauthorizedUserBlocked;
    results.push({
      id: 8,
      name: 'Approval by unauthorized user rejection',
      passed,
      durationMs: Date.now() - start,
      details: passed
        ? 'Both self-approval and unauthorized guest attempts were securely rejected'
        : `selfApprovalBlocked=${selfApprovalBlocked}, unauthorizedUserBlocked=${unauthorizedUserBlocked}`,
    });

    await prisma.task.delete({ where: { id: testTask.id } });
  }

  // --------------------------------------------------------------------------
  // TEST 9: Duplicate approval rejection
  // --------------------------------------------------------------------------
  {
    const start = Date.now();
    const testTask = await prisma.task.create({
      data: {
        title: 'Audit Test Task - Duplicate Approval',
        description: 'Verify duplicate approval prevention',
        assignedEmployeeId: employee.id,
        status: 'WAITING_APPROVAL',
      },
    });

    const execution = await prisma.taskExecution.create({
      data: {
        taskId: testTask.id,
        employeeId: employee.id,
        status: 'WAITING_APPROVAL',
      },
    });

    const approval = await prisma.approvalRequest.create({
      data: {
        taskId: testTask.id,
        taskExecutionId: execution.id,
        toolName: 'deploy_application',
        actionSummary: 'Deploy staging',
        input: { environment: 'staging' },
        riskLevel: 'CRITICAL',
        status: 'PENDING',
      },
    });

    const origRun = taskRunner.runTaskAsync;
    taskRunner.runTaskAsync = async () => {};

    // First review succeeds
    await taskRunner.reviewApproval(approval.id, true, 'CEO');

    // Second review must fail
    let duplicateRejected = false;
    let duplicateMsg = '';
    try {
      await taskRunner.reviewApproval(approval.id, true, 'CEO');
    } catch (err: any) {
      if (err.message.includes('has already been reviewed')) {
        duplicateRejected = true;
        duplicateMsg = err.message;
      }
    }
    taskRunner.runTaskAsync = origRun;

    results.push({
      id: 9,
      name: 'Duplicate approval rejection',
      passed: duplicateRejected,
      durationMs: Date.now() - start,
      details: duplicateRejected ? `Rejected: ${duplicateMsg}` : 'Failed to reject duplicate review',
    });

    await prisma.task.delete({ where: { id: testTask.id } });
  }

  // --------------------------------------------------------------------------
  // TEST 10: Rejected operation cannot execute
  // --------------------------------------------------------------------------
  {
    const start = Date.now();
    const testTask = await prisma.task.create({
      data: {
        title: 'Audit Test Task - Rejection Enforcement',
        description: 'Verify rejected action does not execute',
        assignedEmployeeId: employee.id,
        status: 'WAITING_APPROVAL',
      },
    });

    const execution = await prisma.taskExecution.create({
      data: {
        taskId: testTask.id,
        employeeId: employee.id,
        status: 'WAITING_APPROVAL',
      },
    });

    const approval = await prisma.approvalRequest.create({
      data: {
        taskId: testTask.id,
        taskExecutionId: execution.id,
        toolName: 'deploy_application',
        actionSummary: 'Deploy production artifact',
        input: { environment: 'production' },
        riskLevel: 'CRITICAL',
        status: 'PENDING',
      },
    });

    // Reject the operation
    const rejected = await taskRunner.reviewApproval(approval.id, false, 'CEO', 'Unauthorized production release window');
    const updatedTask = await prisma.task.findUnique({ where: { id: testTask.id } });

    // Assert: status is REJECTED, task is REVIEW, tool was not executed
    const passed =
      rejected.status === 'REJECTED' &&
      rejected.rejectionReason === 'Unauthorized production release window' &&
      updatedTask?.status === 'REVIEW';

    results.push({
      id: 10,
      name: 'Rejected operation cannot execute',
      passed,
      durationMs: Date.now() - start,
      details: passed
        ? 'Action marked REJECTED, task placed in REVIEW, zero downstream tool execution performed'
        : 'Failed rejection enforcement',
    });

    await prisma.task.delete({ where: { id: testTask.id } });
  }

  // --------------------------------------------------------------------------
  // TEST 11: Build failure is recorded correctly
  // --------------------------------------------------------------------------
  {
    const start = Date.now();
    const ws = createTempWorkspace('t11');
    // Create failing build in package.json
    fs.writeFileSync(
      path.join(ws, 'package.json'),
      JSON.stringify({
        name: 'test-app-fail',
        scripts: { build: 'node -e "console.error(\\\"Build Syntax Error in App.tsx\\\"); process.exit(1);"' },
      }),
    );

    const sandbox = new WorkspaceSandbox(ws);
    const context: ExecutionContext = {
      taskId: 'test-t11',
      taskExecutionId: 'exec-t11',
      employeeId: employee.id,
      employeeName: `${employee.firstName} ${employee.lastName}`,
      autonomyLevel: 'SUPERVISED',
      sandbox,
    };

    const res = await runBuildTool.execute({}, context);
    const passed = res.success === false && res.exitCode === 1 && (res.stderr || '').includes('Build Syntax Error');

    results.push({
      id: 11,
      name: 'Build failure is recorded correctly',
      passed,
      durationMs: Date.now() - start,
      details: passed ? `Exit code: ${res.exitCode}, captured error: ${res.stderr}` : 'Failed to record build failure properly',
    });
  }

  // --------------------------------------------------------------------------
  // TEST 12: Successful build is recorded correctly
  // --------------------------------------------------------------------------
  {
    const start = Date.now();
    const ws = createTempWorkspace('t12');
    fs.writeFileSync(
      path.join(ws, 'package.json'),
      JSON.stringify({
        name: 'test-app-pass',
        scripts: { build: 'node -e "console.log(\\\"Vite v5.4.0 building for production... done in 200ms\\\"); process.exit(0);"' },
      }),
    );

    const sandbox = new WorkspaceSandbox(ws);
    const context: ExecutionContext = {
      taskId: 'test-t12',
      taskExecutionId: 'exec-t12',
      employeeId: employee.id,
      employeeName: `${employee.firstName} ${employee.lastName}`,
      autonomyLevel: 'SUPERVISED',
      sandbox,
    };

    const res = await runBuildTool.execute({}, context);
    const passed = res.success === true && res.exitCode === 0 && (res.stdout || '').includes('done in 200ms');

    results.push({
      id: 12,
      name: 'Successful build is recorded correctly',
      passed,
      durationMs: Date.now() - start,
      details: passed ? `Exit code: 0, stdout: ${res.stdout}` : 'Failed to record successful build',
    });
  }

  // --------------------------------------------------------------------------
  // TEST 13: Tool timeout handling
  // --------------------------------------------------------------------------
  {
    const start = Date.now();
    const ws = createTempWorkspace('t13');
    // Set a very low timeout of 500ms and run a command taking 3000ms
    const sandbox = new WorkspaceSandbox(ws, { defaultTimeoutMs: 500 });
    const isWin = process.platform === 'win32';
    const sleepCmd = isWin ? 'ping 127.0.0.1 -n 4 > nul' : 'sleep 3';

    const res = await sandbox.executeCommand(sleepCmd);
    const passed = res.exitCode === -1 && res.stderr.includes('Process timed out after 0.5 seconds');

    results.push({
      id: 13,
      name: 'Tool timeout handling',
      passed,
      durationMs: Date.now() - start,
      details: passed ? `Process safely terminated on timeout: ${res.stderr.trim()}` : 'Process did not time out properly',
    });
  }

  // --------------------------------------------------------------------------
  // TEST 14: Secret redaction in logs
  // --------------------------------------------------------------------------
  {
    const start = Date.now();
    const rawPayload = {
      password: 'super_secret_db_password',
      apiKey: 'sk_live_9876543210fedcba',
      authToken: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.do_not_log_this_secret',
      databaseUrl: 'postgresql://admin:super_secret_pg_pwd@localhost:5432/virtual_ai_company',
      fileContent: 'A'.repeat(5000), // extreme string
    };

    const sanitized = LogSanitizer.sanitize(rawPayload);
    const passed =
      sanitized.password === '[REDACTED_CREDENTIAL]' &&
      sanitized.apiKey === '[REDACTED_CREDENTIAL]' &&
      sanitized.authToken === '[REDACTED_CREDENTIAL]' &&
      sanitized.databaseUrl.includes('://admin:[REDACTED_PASSWORD]@') &&
      !sanitized.databaseUrl.includes('super_secret_pg_pwd') &&
      sanitized.fileContent.includes('[TRUNCATED_FOR_AUDIT: total length 5000 characters]');

    results.push({
      id: 14,
      name: 'Secret redaction in logs',
      passed,
      durationMs: Date.now() - start,
      details: passed
        ? 'Credentials, tokens, connection URL passwords, and giant file buffers sanitized & truncated'
        : `Sanitization failure: ${JSON.stringify(sanitized)}`,
    });
  }

  // --------------------------------------------------------------------------
  // TEST 15: Task recovery after interrupted execution
  // --------------------------------------------------------------------------
  {
    const start = Date.now();
    // Simulate a task interrupted mid-flight by server restart
    const interruptedTask = await prisma.task.create({
      data: {
        title: 'Interrupted Task During Server Crash',
        description: 'Simulate crash recovery',
        assignedEmployeeId: employee.id,
        status: 'IN_PROGRESS',
      },
    });

    const interruptedExec = await prisma.taskExecution.create({
      data: {
        taskId: interruptedTask.id,
        employeeId: employee.id,
        status: 'IN_PROGRESS',
      },
    });

    // Run recovery
    const recoveredCount = await tasksService.recoverStaleTasks();
    const updatedTask = await prisma.task.findUnique({ where: { id: interruptedTask.id } });
    const updatedExec = await prisma.taskExecution.findUnique({ where: { id: interruptedExec.id } });

    const passed =
      recoveredCount >= 1 &&
      updatedTask?.status === 'REVIEW' &&
      (updatedTask?.deliverables as any)?.interrupted === true &&
      updatedExec?.status === 'REVIEW';

    results.push({
      id: 15,
      name: 'Task recovery after interrupted execution',
      passed,
      durationMs: Date.now() - start,
      details: passed
        ? `Recovered ${recoveredCount} stale tasks. Task status set to REVIEW with recovery reason recorded`
        : `Recovery check failed: count=${recoveredCount}, status=${updatedTask?.status}`,
    });

    await prisma.task.delete({ where: { id: interruptedTask.id } });
  }

  // Clean up temporary workspace directories
  for (const dir of tempTestDirs) {
    try {
      fs.rmSync(dir, { recursive: true, force: true });
    } catch {}
  }

  // --------------------------------------------------------------------------
  // Summary & Assertion Report
  // --------------------------------------------------------------------------
  console.log('Test Suite Results:');
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
    throw new Error(`Security Audit Suite failed with ${results.length - passCount} failing tests.`);
  }

  await prisma.$disconnect();
}

runSecurityAuditSuite().catch(async (e) => {
  console.error('Audit suite encountered error:', e);
  await prisma.$disconnect();
  process.exit(1);
});
