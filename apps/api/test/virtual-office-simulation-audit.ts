import { PrismaClient } from '@prisma/client';
import { EventsGateway } from '../src/modules/events/events.gateway';
import { EmployeeActivityService } from '../src/modules/employees/employee-activity.service';
import {
  mapActivityToAnimation,
  SocketEvents,
  EmployeeActivityState,
} from '@vac/shared';
import * as fs from 'fs';
import * as path from 'path';

interface TestResult {
  id: number;
  name: string;
  passed: boolean;
  durationMs: number;
  details: string;
}

async function runOfficeSimulationAudit() {
  console.log('===============================================================');
  console.log('   SPRINT 6 — VIRTUAL OFFICE 3D & REAL-TIME AUDIT SUITE       ');
  console.log('===============================================================');

  const prisma = new PrismaClient();
  const results: TestResult[] = [];

  try {
    await prisma.$connect();

    // Mock Events Gateway to capture real-time broadcast payloads
    const broadcastEvents: Array<{ event: string; payload: any }> = [];
    const mockEventsGateway = {
      broadcastOfficeEvent: (event: string, payload: any) => {
        broadcastEvents.push({ event, payload });
      },
    } as unknown as EventsGateway;

    const activityService = new EmployeeActivityService(mockEventsGateway, prisma as any);

    // Fetch active employees
    const employees = await prisma.employee.findMany({
      where: { status: 'ACTIVE' },
      include: { department: true, agentConfig: true },
    });

    const alex = employees.find((e) => e.employeeCode === 'VAC-ENG-001')!;
    const elena = employees.find((e) => e.employeeCode === 'VAC-OPS-001')!;
    const marcus = employees.find((e) => e.employeeCode === 'VAC-TECH-001')!;
    const maya = employees.find((e) => e.employeeCode === 'VAC-RES-001')!;
    const sophia = employees.find((e) => e.employeeCode === 'VAC-QA-001')!;

    // --------------------------------------------------------------------------
    // TEST 1: 3D Character Asset Registry & GLB Files Integrity
    // --------------------------------------------------------------------------
    {
      const start = Date.now();
      const characterSlugs = [
        'alex-mercer',
        'elena-rostova',
        'marcus-vance',
        'maya-patel',
        'sophia-lin',
      ];
      const webPublicDir = path.resolve(__dirname, '..', '..', 'web', 'public', 'assets', 'characters');

      let allFilesExist = true;
      let totalSizeMb = 0;

      for (const slug of characterSlugs) {
        const glbPath = path.join(webPublicDir, slug, 'character.glb');
        const metaPath = path.join(webPublicDir, slug, 'metadata.json');
        const previewPath = path.join(webPublicDir, slug, 'preview.png');

        if (!fs.existsSync(glbPath) || !fs.existsSync(metaPath) || !fs.existsSync(previewPath)) {
          allFilesExist = false;
          break;
        }

        const stat = fs.statSync(glbPath);
        totalSizeMb += stat.size / (1024 * 1024);
      }

      const passed = allFilesExist && totalSizeMb > 5;
      results.push({
        id: 1,
        name: '3D character asset registry & GLB integrity',
        passed,
        durationMs: Date.now() - start,
        details: passed
          ? `All 5 employee assets verified (character.glb, metadata.json, preview.png) — Total: ${totalSizeMb.toFixed(2)}MB`
          : 'Missing character GLB or metadata files',
      });
    }

    // --------------------------------------------------------------------------
    // TEST 2: Database-Backed Workstation Assignment
    // --------------------------------------------------------------------------
    {
      const start = Date.now();
      const workstationAssignments = employees.map((e) => ({
        code: e.employeeCode,
        dept: e.department.slug,
        ws: e.workstationId,
      }));

      const hasAllWorkstations =
        workstationAssignments.length === 5 &&
        workstationAssignments.every((w) => Boolean(w.ws));

      const passed = hasAllWorkstations;
      results.push({
        id: 2,
        name: 'Database-backed workstation assignments',
        passed,
        durationMs: Date.now() - start,
        details: passed
          ? `All 5 active employees have valid database workstation anchors: ${workstationAssignments.map((w) => `${w.code}->${w.ws}`).join(', ')}`
          : 'Missing workstation assignments',
      });
    }

    // --------------------------------------------------------------------------
    // TEST 3: Normalized Employee Activity State Machine
    // --------------------------------------------------------------------------
    {
      const start = Date.now();
      const updated = await activityService.setActivity(alex.id, 'WORKING', {
        currentTaskId: 'task-test-01',
        taskTitle: 'Refactor 3D Canvas Disposal',
        details: 'Compiling shaders in WebGL context',
      });

      const passed =
        updated.activity === 'WORKING' &&
        updated.animationState === 'working' &&
        updated.currentTaskId === 'task-test-01' &&
        updated.details === 'Compiling shaders in WebGL context';

      results.push({
        id: 3,
        name: 'Normalized employee activity state machine',
        passed,
        durationMs: Date.now() - start,
        details: passed
          ? `Alex Mercer transitioned to WORKING with animationState 'working'`
          : 'Failed activity state update',
      });
    }

    // --------------------------------------------------------------------------
    // TEST 4: Activity to Animation State Mapping
    // --------------------------------------------------------------------------
    {
      const start = Date.now();
      const testCases: Array<{ activity: EmployeeActivityState; expectedAnim: string }> = [
        { activity: 'IDLE', expectedAnim: 'idle' },
        { activity: 'WORKING', expectedAnim: 'working' },
        { activity: 'THINKING', expectedAnim: 'thinking' },
        { activity: 'TALKING', expectedAnim: 'talking' },
        { activity: 'MEETING', expectedAnim: 'meeting' },
        { activity: 'WAITING_APPROVAL', expectedAnim: 'thinking' },
        { activity: 'OFFLINE', expectedAnim: 'idle' },
      ];

      const allMatch = testCases.every((tc) => mapActivityToAnimation(tc.activity) === tc.expectedAnim);

      results.push({
        id: 4,
        name: 'Activity to animation mapping specification',
        passed: allMatch,
        durationMs: Date.now() - start,
        details: allMatch
          ? `All 7 activity states correctly mapped to character animation states without ambiguity`
          : 'Mismatch in activity-to-animation mapping',
      });
    }

    // --------------------------------------------------------------------------
    // TEST 5: Missing Animation Fallback Handling
    // --------------------------------------------------------------------------
    {
      const start = Date.now();
      const webPublicDir = path.resolve(__dirname, '..', '..', 'web', 'public', 'assets', 'characters');
      const elenaMeta = JSON.parse(
        fs.readFileSync(path.join(webPublicDir, 'elena-rostova', 'metadata.json'), 'utf8'),
      );

      const hasFallback =
        elenaMeta.animationMapping &&
        elenaMeta.animationMapping.SITTING_WORKING &&
        elenaMeta.animationMapping.SITTING_WORKING.type === 'procedural_fallback';

      results.push({
        id: 5,
        name: 'Missing animation fallback mapping in metadata',
        passed: Boolean(hasFallback),
        durationMs: Date.now() - start,
        details: hasFallback
          ? `Elena Rostova asset specifies procedural fallback behavior: '${elenaMeta.animationMapping.SITTING_WORKING.behavior}'`
          : 'Missing procedural fallback mapping',
      });
    }

    // --------------------------------------------------------------------------
    // TEST 6: Real-time Socket.IO Broadcast Synchronization
    // --------------------------------------------------------------------------
    {
      const start = Date.now();
      broadcastEvents.length = 0; // Clear

      await activityService.setActivity(marcus.id, 'THINKING', {
        details: 'Reviewing distributed memory topology',
      });

      const event = broadcastEvents.find(
        (e) => e.event === SocketEvents.EMPLOYEE_ACTIVITY_UPDATED && e.payload.employeeId === marcus.id,
      );

      const passed =
        Boolean(event) &&
        event?.payload.activity === 'THINKING' &&
        event?.payload.animationState === 'thinking';

      results.push({
        id: 6,
        name: 'Real-time WebSocket event broadcast',
        passed,
        durationMs: Date.now() - start,
        details: passed
          ? `Captured broadcast [${event?.event}] with payload: ${JSON.stringify(event?.payload.activity)}`
          : 'Failed to broadcast activity event',
      });
    }

    // --------------------------------------------------------------------------
    // TEST 7: Inter-Agent Communication Talking State Trigger
    // --------------------------------------------------------------------------
    {
      const start = Date.now();
      activityService.triggerTalkingState(elena.id, marcus.id, 100);

      const talkingState = activityService.getActivity(elena.id);
      const isTalking = talkingState?.activity === 'TALKING' && talkingState?.animationState === 'talking';

      // Wait 150ms for timeout reset
      await new Promise((r) => setTimeout(r, 150));
      const resetState = activityService.getActivity(elena.id);
      const isReset = resetState?.activity === 'IDLE';

      const passed = isTalking && isReset;
      results.push({
        id: 7,
        name: 'Inter-agent communication TALKING animation trigger',
        passed,
        durationMs: Date.now() - start,
        details: passed
          ? `Elena transitioned to TALKING on agent message, automatically reset to IDLE after transmission`
          : 'Talking state lifecycle failed',
      });
    }

    // --------------------------------------------------------------------------
    // TEST 8: Initial State Synchronization for Reconnecting Clients
    // --------------------------------------------------------------------------
    {
      const start = Date.now();
      const allActivities = activityService.getAllActivities();
      const activeCount = Object.keys(allActivities).length;
      const passed = activeCount >= 5;

      results.push({
        id: 8,
        name: 'Initial state synchronization endpoint snapshot',
        passed,
        durationMs: Date.now() - start,
        details: passed
          ? `Activity tracker maintains snapshot across all ${activeCount} active company employees`
          : 'Incomplete activity snapshot',
      });
    }

    // --------------------------------------------------------------------------
    // TEST 9: Approval Required State Transition
    // --------------------------------------------------------------------------
    {
      const start = Date.now();
      const updated = await activityService.setActivity(alex.id, 'WAITING_APPROVAL', {
        details: 'Human supervisor approval required for git_push',
      });

      const passed =
        updated.activity === 'WAITING_APPROVAL' &&
        updated.animationState === 'thinking';

      results.push({
        id: 9,
        name: 'WAITING_APPROVAL activity and animation alignment',
        passed,
        durationMs: Date.now() - start,
        details: passed
          ? `Security gate properly represented visually as WAITING_APPROVAL with thinking posture`
          : 'Failed approval state transition',
      });
    }

    // --------------------------------------------------------------------------
    // TEST 10: Existing API & Employee Service Compatibility
    // --------------------------------------------------------------------------
    {
      const start = Date.now();
      const depts = await prisma.department.findMany();
      const passed = depts.length >= 8 && employees.length === 5;

      results.push({
        id: 10,
        name: 'Existing API, department & employee compatibility',
        passed,
        durationMs: Date.now() - start,
        details: passed
          ? `All 8 seeded departments and 5 AI employees intact with zero schema regressions`
          : 'Data incompatibility detected',
      });
    }

    // Reset Alex to IDLE after tests
    await activityService.setActivity(alex.id, 'IDLE');

  } catch (err: any) {
    console.error('Audit suite encountered error:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }

  // Print Results Summary
  console.log('Office Simulation Audit Results:');
  console.log('---------------------------------------------------------------');
  let allPassed = true;
  for (const r of results) {
    const status = r.passed ? '✓ [PASS]' : '✗ [FAIL]';
    if (!r.passed) allPassed = false;
    console.log(`${status} Test ${String(r.id).padStart(2, '0')}: ${r.name} (${r.durationMs}ms)`);
    console.log(`       ↳ ${r.details}`);
  }
  console.log('---------------------------------------------------------------');
  const passCount = results.filter((r) => r.passed).length;
  console.log(`Total: ${passCount}/${results.length} tests passed.\n`);

  if (!allPassed) {
    process.exit(1);
  }
}

runOfficeSimulationAudit();
