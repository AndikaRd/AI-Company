import { AgentConfiguration } from './agent';
import { Department } from './department';

export type EmployeeStatus = 'ACTIVE' | 'IDLE' | 'BUSY' | 'OFFLINE';

export type SeniorityLevel =
  | 'INTERN'
  | 'JUNIOR'
  | 'MID'
  | 'SENIOR'
  | 'LEAD'
  | 'PRINCIPAL'
  | 'EXECUTIVE';

export interface Employee {
  id: string;
  employeeCode?: string | null;
  firstName: string;
  lastName: string;
  role: string;
  jobTitle?: string | null;
  seniority: SeniorityLevel;
  personality?: string | null;
  primaryExpertise?: string | null;
  skills?: string[] | Record<string, any> | null;
  email: string;
  avatarUrl?: string | null;
  workstationId?: string | null;
  isAiAgent: boolean;
  status: EmployeeStatus;
  departmentId: string;
  supervisorId?: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
  department?: Department;
  supervisor?: Employee | null;
  subordinates?: Employee[];
  agentConfig?: AgentConfiguration | null;
}
