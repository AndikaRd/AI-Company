# Security Architecture, Autonomy & Permission Policy

**Virtual AI Company (VAC) Platform**  
*Document Version:* 1.0 (Sprint 3.1 Security & Reliability Audit)  
*Status:* Verified & Enforced  

---

## 1. Executive Summary

In Virtual AI Company (VAC), AI Employees are autonomous agents capable of invoking real development tools (file read/write, build execution, tests, git operations, deployment). To prevent unauthorized access, data exfiltration, system damage, or privilege escalation, the backend acts as the **final, authoritative security boundary**. Frontend controls exist purely for user convenience; all permissions, sandboxing, and approvals are verified and enforced strictly on the server.

---

## 2. Autonomy Policy & Risk Hierarchy

Every AI Employee is governed by an `AgentConfiguration` defining an **Autonomy Level** and associated permissions.

### 2.1 Autonomy Levels
| Autonomy Level | Core Philosophy | Default Tool Execution Behavior |
| :--- | :--- | :--- |
| `MANUAL` | Human-in-the-Loop strict oversight | `READ_ONLY` tools execute automatically with audit logging. **All mutating and command execution actions** (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`) require explicit human approval before execution. |
| `SUPERVISED` *(Default)* | Balanced productivity with safety rails | `READ_ONLY` and `LOW` risk tools execute automatically with audit logging. `MEDIUM` tools execute unless strict approval configured. `HIGH` risk tools (`git_commit`, `git_push`) and `CRITICAL` risk tools (`deploy_application`) require supervisor approval. |
| `AUTONOMOUS` | High-autonomy engineering execution | `READ_ONLY`, `LOW`, and `MEDIUM` tools execute automatically. `HIGH` risk tools require approval if flagged. `CRITICAL` risk tools (`deploy_application`) **permanently require explicit CEO approval**. |

> [!IMPORTANT]
> **Autonomy Invariant**: No autonomy level—including `AUTONOMOUS`—can bypass human CEO approval for `CRITICAL` risk tools (`deploy_application`).

---

## 3. Tool Permission & Risk Classification Matrix

The VAC backend Tool Registry registers 13 core engineering tools categorized into 4 risk tiers:

| Tool Name | Category | Risk Level | Requires Approval | MANUAL | SUPERVISED | AUTONOMOUS | Audit Logged |
| :--- | :--- | :--- | :---: | :---: | :---: | :---: | :---: |
| `list_files` | Read-Only | `READ_ONLY` | No | Auto | Auto | Auto | Yes |
| `read_file` | Read-Only | `READ_ONLY` | No | Auto | Auto | Auto | Yes |
| `search_code` | Read-Only | `READ_ONLY` | No | Auto | Auto | Auto | Yes |
| `get_file_info` | Read-Only | `READ_ONLY` | No | Auto | Auto | Auto | Yes |
| `git_status` | Read-Only | `READ_ONLY` | No | Auto | Auto | Auto | Yes |
| `create_file` | Write | `LOW` | No* | Approval | Auto* | Auto | Yes |
| `edit_file` | Write | `LOW` | No* | Approval | Auto* | Auto | Yes |
| `write_file` | Write | `LOW` | No* | Approval | Auto* | Auto | Yes |
| `run_build` | Execution | `MEDIUM` | No* | Approval | Auto* | Auto | Yes |
| `run_tests` | Execution | `MEDIUM` | No* | Approval | Auto* | Auto | Yes |
| `git_commit` | Approval | `HIGH` | **Yes** | Approval | Approval | Auto/Grant | Yes |
| `git_push` | Approval | `HIGH` | **Yes** | Approval | Approval | Approval | Yes |
| `deploy_application` | Release | `CRITICAL` | **Yes** | **Approval** | **Approval** | **Approval** | Yes |

*\* Note: If `permissionConfig.requireApprovalForExecution` is set to `true`, `LOW` and `MEDIUM` tools also mandate approval in `SUPERVISED` mode. If `allowFileSystemWrite === false`, write tools are permanently blocked (`allowed: false`). If `allowCommandExecution === false`, execution tools are permanently blocked (`allowed: false`).*

---

## 4. Permanently Prohibited Actions

Regardless of autonomy level or employee seniorities, the following actions are **permanently prohibited**:
1. **Self-Approval**: An AI Employee is strictly forbidden from approving its own approval requests (`task-runner.service.ts`).
2. **Unauthorized Tool Execution**: Any tool invocation outside the employee's `toolsEnabled` list is immediately rejected with `allowed: false`.
3. **Workspace Traversal**: Attempting to resolve paths outside the assigned `workspaceRoot` via relative jumps (`../`) or absolute path spoofing.
4. **Symlink / Junction Escapes**: Attempting to create or follow symlinks / junctions that point to directories outside the workspace root.
5. **Sensitive File Access**: Access to patterns matching `*.env*`, `id_rsa*`, `*.pem`, `*.key`, `*.pfx`, `*.token`, `*.secret`, `shadow`, or `passwd`.
6. **Destructive Shell Commands**: Blacklisted destructive commands including `rm -rf /`, `rmdir /s /q c:\`, `format`, `dd if=`, `shutdown`, `mkfs`, or piped remote scripts (`curl ... | sh`).

---

## 5. Approval Workflow & Lifecycle

The Human-in-the-Loop approval workflow guarantees human oversight over sensitive company operations:

```mermaid
stateDiagram-v2
    [*] --> InProgress: Task Dispatched
    InProgress --> ToolEvaluation: Agent Calls Tool
    ToolEvaluation --> InProgress: Allowed Tool Executed
    ToolEvaluation --> Blocked: Prohibited Action (Permanently Blocked)
    ToolEvaluation --> WaitingApproval: High/Critical Tool Paused
    WaitingApproval --> Approved: Authorized CEO Reviews (Approved)
    WaitingApproval --> Rejected: Authorized CEO Reviews (Rejected)
    WaitingApproval --> Expired: TTL Window Exceeded (>24h)
    Approved --> ResumeExecution: Tool Executed Within Sandbox
    ResumeExecution --> InProgress: Next Iteration
    Rejected --> SupervisorReview: Task Status -> REVIEW
    Expired --> SupervisorReview: Task Status -> REVIEW
    InProgress --> BuildVerification: Final Answer Provided
    BuildVerification --> Completed: Build Exit Code == 0
    BuildVerification --> SupervisorReview: Build Exit Code != 0
```

### 5.1 Security Controls in Approval Engine:
1. **Authorization Guard**: Only users with verified `CEO`, `Supervisor`, `Admin`, `Tech_Lead`, or `Director` roles can review approval requests.
2. **AI Identity Guard**: Rejection of any review attempt where the reviewer matches the assigned employee's ID, name, or employee code.
3. **Expiration Guard (TTL 24h)**: Approvals older than 24 hours are atomically marked `REJECTED` (`EXPIRED: Exceeded 24-hour approval window`).
4. **Duplicate Prevention**: If an approval is already `APPROVED` or `REJECTED`, duplicate submission throws `BadRequestException`.
5. **Rejection Safety**: If an action is rejected, the underlying tool is **never executed**, and the task transitions to `REVIEW`.

---

## 6. Workspace & Process Isolation Architecture

AI tool execution takes place inside a directory-contained `WorkspaceSandbox`:

### 6.1 Canonical Path & Containment
- `this.workspaceRoot`: Canonical directory allocated per task (e.g., `infrastructure/workspaces/task-<id>`).
- `realWorkspaceRoot`: Disk-resolved canonical real path using `fs.realpathSync`.
- **Absolute Path Check**: If an absolute path is provided, the sandbox verifies `path.normalize(target).startsWith(this.workspaceRoot)`. External drive paths (e.g. `C:\Windows`) are rejected.
- **Symlink Traversal Check**: If the target exists on disk, `fs.realpathSync(resolved)` is compared against `realWorkspaceRoot`. If a symlink points outside the workspace root, a `WorkspaceSecurityException` is thrown. For new files, the nearest existing ancestor directory is verified.

### 6.2 Process Execution & Resource Caps
- Commands run in an isolated child process via `cmd.exe` (Windows) or `/bin/sh` (POSIX).
- **Environment Sanitization**: Host credentials (`DATABASE_URL`, `POSTGRES_PASSWORD`, `JWT_SECRET`, etc.) are stripped from the child process environment before spawn.
- **Execution Timeout**: Enforced timeout (default 45s, configurable). On timeout, process trees are forcefully terminated (`taskkill /t /f` on Windows).
- **Buffer Exhaustion Protection**: Standard output is capped at 500KB and stderr at 200KB to prevent out-of-memory denial of service.

---

## 7. Audit Log Security & Secret Redaction

Audit records stored in PostgreSQL (`tool_execution_logs`) pass through `LogSanitizer`:
1. **Credential Sanitization**:
   - Bearer tokens (`Bearer <token>`) replaced with `Bearer [REDACTED_TOKEN]`.
   - Private keys (`-----BEGIN PRIVATE KEY-----`) replaced with `[REDACTED_PRIVATE_KEY]`.
   - Passwords in connection strings (`postgresql://user:password@host/db`) sanitized to `postgresql://user:[REDACTED_PASSWORD]@host/db`.
   - Sensitive JSON keys (`password`, `apiKey`, `authToken`, `secret`, `clientSecret`) replaced with `[REDACTED_CREDENTIAL]`.
2. **String Truncation**:
   - Large file contents or buffers exceeding 4,096 characters are truncated with an audit notice (`[TRUNCATED_FOR_AUDIT: total length N characters]`).

---

## 8. Execution Reliability & Error Recovery

1. **Stale Task Recovery on Boot**:
   Upon NestJS initialization (`TasksService.onModuleInit`), the backend queries all tasks with `status === 'IN_PROGRESS'`. Any tasks left pending due to server shutdown or unhandled crashes are cleanly updated to `REVIEW` with recovery deliverables recorded.
2. **Infinite Loop Detection**:
   The execution engine maintains a rolling signature of recent tool calls. If the same tool and arguments are executed 3 consecutive times, execution is paused and marked `REVIEW`.
3. **Build Verification Guard**:
   A task cannot automatically reach `COMPLETED` if the latest `run_build` or `run_tests` execution returned a non-zero exit code or `FAILURE` status. Instead, the task is routed to `REVIEW` for supervisor sign-off.

---

## 9. Known Security Limitations & Production Roadmap

1. **Child Process vs. Container Isolation**:
   - *Current Implementation*: Host-level child process sandboxing with path validation, pattern blacklists, timeout limits, and environment sanitization.
   - *Limitation*: Child process sandboxing runs under the host OS user permissions and does not provide Linux cgroups, namespaces, or kernel-level filesystem isolation.
   - *Production Roadmap*: Migrate to isolated Docker/container agents or microVM sandboxes (e.g. gVisor, Firecracker) for untrusted employee tool code.
2. **Deployment Adapter**:
   - *Current Implementation*: `SafeEnvironmentSimulationAdapter` verifies staging and production releases within an isolated sandbox test harness.
   - *Limitation*: Live cloud infrastructure deployment (AWS ECS, Kubernetes, Cloud Run) is currently disabled to prevent accidental cloud modifications until multi-tenant cluster management is established in Sprint 4.

