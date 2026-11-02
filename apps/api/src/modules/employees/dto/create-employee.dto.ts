import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum EmployeeStatusEnum {
  ACTIVE = 'ACTIVE',
  IDLE = 'IDLE',
  BUSY = 'BUSY',
  OFFLINE = 'OFFLINE',
}

export enum SeniorityLevelEnum {
  INTERN = 'INTERN',
  JUNIOR = 'JUNIOR',
  MID = 'MID',
  SENIOR = 'SENIOR',
  LEAD = 'LEAD',
  PRINCIPAL = 'PRINCIPAL',
  EXECUTIVE = 'EXECUTIVE',
}

export enum AiProviderEnum {
  OLLAMA = 'OLLAMA',
  OPENAI = 'OPENAI',
  ANTHROPIC = 'ANTHROPIC',
}

export enum AutonomyLevelEnum {
  MANUAL = 'MANUAL',
  SUPERVISED = 'SUPERVISED',
  AUTONOMOUS = 'AUTONOMOUS',
}

export enum MemoryRetentionEnum {
  SESSION = 'SESSION',
  LONG_TERM = 'LONG_TERM',
}

export class AgentConfigurationDto {
  @IsEnum(AiProviderEnum)
  @IsOptional()
  provider?: AiProviderEnum = AiProviderEnum.OLLAMA;

  @IsString()
  @IsOptional()
  modelName?: string = 'qwen3.5:4b';

  @IsEnum(AutonomyLevelEnum)
  @IsOptional()
  autonomyLevel?: AutonomyLevelEnum = AutonomyLevelEnum.SUPERVISED;

  @IsString()
  @IsOptional()
  @MaxLength(4000)
  systemPrompt?: string;

  @IsNumber()
  @Min(0)
  @Max(2)
  @IsOptional()
  temperature?: number = 0.7;

  @IsNumber()
  @Min(1)
  @Max(16384)
  @IsOptional()
  maxTokens?: number = 2048;

  @IsOptional()
  toolsEnabled?: any;

  @IsOptional()
  permissionConfig?: any;

  @IsEnum(MemoryRetentionEnum)
  @IsOptional()
  memoryRetention?: MemoryRetentionEnum = MemoryRetentionEnum.SESSION;

  @IsOptional()
  memoryConfig?: any;
}

export class CreateEmployeeDto {
  @IsString()
  @IsOptional()
  @MinLength(2)
  @MaxLength(20)
  employeeCode?: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(50)
  firstName: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(50)
  lastName: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  role: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  jobTitle?: string;

  @IsEnum(SeniorityLevelEnum)
  @IsOptional()
  seniority?: SeniorityLevelEnum = SeniorityLevelEnum.MID;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  personality?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  primaryExpertise?: string;

  @IsOptional()
  skills?: any;

  @IsEmail()
  email: string;

  @IsString()
  @IsOptional()
  avatarUrl?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  workstationId?: string;

  @IsBoolean()
  @IsOptional()
  isAiAgent?: boolean = true;

  @IsEnum(EmployeeStatusEnum)
  @IsOptional()
  status?: EmployeeStatusEnum = EmployeeStatusEnum.ACTIVE;

  @IsUUID()
  @IsNotEmpty()
  departmentId: string;

  @IsUUID()
  @IsOptional()
  supervisorId?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => AgentConfigurationDto)
  agentConfig?: AgentConfigurationDto;
}
