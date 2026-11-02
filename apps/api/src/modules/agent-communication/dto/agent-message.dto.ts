import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsUUID,
  IsBoolean,
  IsArray,
} from 'class-validator';
import { AgentMessageType, TaskPriority } from '@prisma/client';

export class SendAgentMessageDto {
  @IsUUID()
  @IsNotEmpty()
  senderEmployeeId: string;

  @IsUUID()
  @IsNotEmpty()
  recipientEmployeeId: string;

  @IsOptional()
  @IsEnum(AgentMessageType)
  messageType?: AgentMessageType;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsOptional()
  @IsUUID()
  taskId?: string;

  @IsOptional()
  @IsString()
  correlationId?: string;

  @IsOptional()
  payload?: Record<string, any>;
}

export class DelegateTaskDto {
  @IsUUID()
  @IsNotEmpty()
  parentTaskId: string;

  @IsUUID()
  @IsNotEmpty()
  delegatingEmployeeId: string;

  @IsUUID()
  @IsNotEmpty()
  assignedEmployeeId: string;

  @IsString()
  @IsNotEmpty()
  subtaskTitle: string;

  @IsString()
  @IsNotEmpty()
  subtaskDescription: string;

  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @IsOptional()
  @IsArray()
  requiredSkills?: string[];

  @IsOptional()
  contextData?: Record<string, any>;

  @IsOptional()
  @IsBoolean()
  autoAccept?: boolean;
}

export class RespondToDelegationDto {
  @IsUUID()
  @IsNotEmpty()
  subtaskId: string;

  @IsUUID()
  @IsNotEmpty()
  recipientEmployeeId: string;

  @IsBoolean()
  accept: boolean;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsBoolean()
  skipExecutionDispatch?: boolean;
}

