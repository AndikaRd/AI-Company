export type FeedCategory =
  | 'ALL'
  | 'IDEAS'
  | 'TASKS'
  | 'MEETINGS'
  | 'MESSAGES'
  | 'APPROVALS'
  | 'ALERTS';

export type CeoTargetType = 'COMPANY' | 'DEPARTMENT' | 'EMPLOYEE';

export interface CompanyFeedItem {
  id: string;
  category: 'IDEAS' | 'TASKS' | 'MEETINGS' | 'MESSAGES' | 'APPROVALS' | 'ALERTS';
  title: string;
  description: string;
  timestamp: string;
  author?: {
    id: string;
    name: string;
    role: string;
    employeeCode?: string;
    departmentName?: string;
    departmentSlug?: string;
    avatarUrl?: string;
  };
  target?: {
    id?: string;
    name: string;
    type: 'COMPANY' | 'DEPARTMENT' | 'EMPLOYEE' | 'TASK' | 'APPROVAL';
  };
  metadata?: Record<string, any>;
  entityType: 'agent_message' | 'task' | 'approval_request' | 'life_event' | 'ceo_command';
  entityId: string;
  status?: string;
  priority?: string;
  actionable?: boolean;
}

export interface CeoCommandPayload {
  targetType: CeoTargetType;
  targetId?: string; // department id/slug or employee id
  targetName: string;
  instruction: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface CeoCommandResult {
  id: string;
  targetType: CeoTargetType;
  targetName: string;
  instruction: string;
  status: 'PENDING' | 'ACKNOWLEDGED' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  response: string;
  createdTaskId?: string | null;
  assignedEmployeeId?: string | null;
  assignedEmployeeName?: string | null;
  departmentName?: string | null;
  createdAt: string;
}

