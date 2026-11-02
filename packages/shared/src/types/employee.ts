import { AgentConfiguration } from './agent';
import { Department } from './department';

export type EmployeeStatus = 'ACTIVE' | 'IDLE' | 'BUSY' | 'OFFLINE';

export interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
  email: string;
  avatarUrl?: string | null;
  isAiAgent: boolean;
  status: EmployeeStatus;
  departmentId: string;
  createdAt: string | Date;
  updatedAt: string | Date;
  department?: Department;
  agentConfig?: AgentConfiguration | null;
}

