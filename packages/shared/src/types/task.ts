import { Employee } from './employee';
import { ToolRiskLevel, ToolCallStatus } from './tool';

export type TaskStatus =
  | 'PENDING'
  | 'PLANNING'
  | 'IN_PROGRESS'
  | 'WAITING_APPROVAL'
  | 'REVIEW'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED';

export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type ExecutionStatus =
  | 'PLANNING'
  | 'IN_PROGRESS'
  | 'WAITING_APPROVAL'
  | 'REVIEW'
  | 'COMPLETED'
  | 'FAILED';
export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface ToolExecutionLog {
  id: string;
  taskExecutionId: string;
  toolName: string;
  input: Record<string, any>;
  output?: Record<string, any> | null;
  exitCode?: number | null;
  durationMs?: number | null;
  riskLevel: ToolRiskLevel;
  status: ToolCallStatus;
  error?: string | null;
  createdAt: string | Date;
}

export interface ApprovalRequest {
  id: string;
  taskId: string;
  taskExecutionId: string;
  toolName: string;
  actionSummary: string;
  input: Record<string, any>;
  riskLevel: ToolRiskLevel;
  status: ApprovalStatus;
  reviewedBy?: string | null;
  reviewedAt?: string | Date | null;
  rejectionReason?: string | null;
  createdAt: string | Date;
}

export interface TaskExecution {
  id: string;
  taskId: string;
  employeeId: string;
  status: ExecutionStatus;
  summary?: string | null;
  deliverables?: Record<string, any> | null;
  startedAt: string | Date;
  completedAt?: string | Date | null;
  error?: string | null;
  toolLogs?: ToolExecutionLog[];
  approvalRequests?: ApprovalRequest[];
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignedEmployeeId: string;
  assignedEmployee?: Employee;
  workspacePath?: string | null;
  deliverables?: Record<string, any> | null;
  executions?: TaskExecution[];
  approvalRequests?: ApprovalRequest[];
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface CreateTaskDto {
  title: string;
  description: string;
  priority?: TaskPriority;
  assignedEmployeeId: string;
  workspacePath?: string;
}

export interface ReviewApprovalDto {
  approved: boolean;
  reviewedBy?: string;
  rejectionReason?: string;
}
