import { Employee } from './employee';
import { Task } from './task';

export type AgentMessageType =
  | 'DIRECT_MESSAGE'
  | 'TASK_DELEGATION'
  | 'TASK_ACCEPTED'
  | 'TASK_REJECTED'
  | 'TASK_UPDATE'
  | 'TASK_COMPLETED'
  | 'QUERY'
  | 'RESPONSE';

export interface AgentMessage {
  id: string;
  senderEmployeeId: string;
  senderEmployee?: Employee;
  recipientEmployeeId: string;
  recipientEmployee?: Employee;
  taskId?: string | null;
  task?: Task | null;
  correlationId: string;
  messageType: AgentMessageType;
  content: string;
  payload?: Record<string, any> | null;
  readAt?: string | Date | null;
  createdAt: string | Date;
}

export interface SendAgentMessageDto {
  senderEmployeeId: string;
  recipientEmployeeId: string;
  messageType?: AgentMessageType;
  content: string;
  taskId?: string;
  correlationId?: string;
  payload?: Record<string, any>;
}

export interface DelegateTaskDto {
  parentTaskId: string;
  delegatingEmployeeId: string;
  assignedEmployeeId: string;
  subtaskTitle: string;
  subtaskDescription: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  requiredSkills?: string[];
  contextData?: Record<string, any>;
  autoAccept?: boolean;
}

export interface RespondToDelegationDto {
  subtaskId: string;
  recipientEmployeeId: string;
  accept: boolean;
  reason?: string;
  skipExecutionDispatch?: boolean;
}

