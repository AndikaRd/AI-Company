const http = require('http');

async function testRealAlexExecution() {
  console.log('\n===============================================================');
  console.log('  SPRINT 6.7 — REAL AI EMPLOYEE DIRECTIVE EXECUTION TEST        ');
  console.log('===============================================================\n');

  const directive = "Alex, inspect the existing VAC frontend architecture and prepare a short technical report identifying three maintainability improvements. Do not modify any files.";

  // 1. Check initial employee state
  console.log('--- Step 1: Checking Alex Mercer initial state ---');
  const initialEmpRes = await fetch('http://localhost:3000/api/employees');
  const emps = await initialEmpRes.json();
  const alex = emps.data?.find(e => e.employeeCode === 'VAC-ENG-001');
  console.log(`Alex Mercer ID: ${alex?.id}`);

  const initialActRes = await fetch(`http://localhost:3000/api/employees/${alex.id}/activity`);
  const initialAct = await initialActRes.json();
  console.log(`Initial Activity: ${initialAct.data?.state || 'IDLE'}`);

  // 2. Dispatch CEO Directive
  console.log('\n--- Step 2: Dispatching CEO Directive ---');
  console.log(`Directive: "${directive}"`);
  const startTime = Date.now();

  const dispatchRes = await fetch('http://localhost:3000/api/company-feed/ceo-command', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      targetType: 'EMPLOYEE',
      targetId: alex.id,
      targetName: `${alex.firstName} ${alex.lastName}`,
      instruction: directive
    })
  });

  const dispatchData = await dispatchRes.json();
  const dispatchDuration = Date.now() - startTime;
  console.log(`Dispatch HTTP Status: ${dispatchRes.status} (took ${dispatchDuration}ms)`);
  console.log('Immediate Dispatch Response:');
  console.log(JSON.stringify(dispatchData, null, 2));

  const taskId = dispatchData.data?.createdTaskId;
  const commandId = dispatchData.data?.id;

  if (!taskId) {
    console.error('ERROR: No Task ID was created for this directive!');
    return;
  }

  // 3. Monitor Execution Lifecycle
  console.log(`\n--- Step 3: Monitoring Real AI Execution for Task [${taskId}] ---`);
  let isDone = false;
  let pollCount = 0;
  const maxPolls = 40; // up to 120 seconds

  while (!isDone && pollCount < maxPolls) {
    pollCount++;
    await new Promise(r => setTimeout(r, 3000));
    const elapsed = Math.round((Date.now() - startTime) / 1000);

    // Fetch Task status
    const taskRes = await fetch(`http://localhost:3000/api/tasks`);
    const tasksData = await taskRes.json();
    const task = tasksData.data?.find(t => t.id === taskId);

    // Fetch Alex activity
    const actRes = await fetch(`http://localhost:3000/api/employees/${alex.id}/activity`);
    const actData = await actRes.json();

    console.log(`[T+${elapsed}s] Task Status: ${task?.status || 'UNKNOWN'} | Alex Activity: ${actData.data?.state || 'UNKNOWN'}`);

    if (task && (task.status === 'COMPLETED' || task.status === 'REVIEW' || task.status === 'FAILED')) {
      isDone = true;
      console.log(`\nExecution finished with status: ${task.status}!`);
    }
  }

  // 4. Retrieve Comprehensive Outcomes
  console.log('\n--- Step 4: Final Execution Results & Evidence ---');

  // A. Check Task Deliverables
  const finalTasksRes = await fetch('http://localhost:3000/api/tasks');
  const finalTasksData = await finalTasksRes.json();
  const finalTask = finalTasksData.data?.find(t => t.id === taskId);
  console.log('\n[Task Record]');
  console.log(`  ID: ${finalTask?.id}`);
  console.log(`  Title: ${finalTask?.title}`);
  console.log(`  Final Status: ${finalTask?.status}`);
  console.log(`  Workspace: ${finalTask?.workspacePath}`);
  console.log(`  Deliverables:`, JSON.stringify(finalTask?.deliverables, null, 2));

  // B. Check CeoCommand Record
  const cmdsRes = await fetch('http://localhost:3000/api/company-feed/ceo-commands?limit=5');
  const cmdsData = await cmdsRes.json();
  const finalCmd = cmdsData.data?.find(c => c.id === commandId);
  console.log('\n[CeoCommand Record]');
  console.log(`  ID: ${finalCmd?.id}`);
  console.log(`  Status: ${finalCmd?.status}`);
  console.log(`  Final Response (Substantive Deliverable):`);
  console.log(finalCmd?.response);

  // C. Check Global Company Feed
  const feedRes = await fetch('http://localhost:3000/api/company-feed?limit=10');
  const feedData = await feedRes.json();
  console.log('\n[Global Company Feed Events (Top 5)]');
  feedData.data?.slice(0, 5).forEach((item, idx) => {
    console.log(`  ${idx + 1}. [${item.category}] ${item.title}`);
    console.log(`     Author: ${item.author?.name} | Entity: ${item.entityType}`);
    console.log(`     Description: ${item.description?.slice(0, 150)}...`);
  });
}

testRealAlexExecution().catch(console.error);

