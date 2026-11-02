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

export enum MemoryRetentionEnum {
  SESSION = 'SESSION',
  LONG_TERM = 'LONG_TERM',
}

export class AgentConfigurationDto {
  @IsString()
  @IsOptional()
  modelName?: string = 'gpt-4o';

  @IsString()
  @IsOptional()
  @MaxLength(2000)
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

  @IsEnum(MemoryRetentionEnum)
  @IsOptional()
  memoryRetention?: MemoryRetentionEnum = MemoryRetentionEnum.SESSION;
}

export class CreateEmployeeDto {
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

  @IsEmail()
  email: string;

  @IsString()
  @IsOptional()
  avatarUrl?: string;

  @IsBoolean()
  @IsOptional()
  isAiAgent?: boolean = true;

  @IsEnum(EmployeeStatusEnum)
  @IsOptional()
  status?: EmployeeStatusEnum = EmployeeStatusEnum.ACTIVE;

  @IsUUID()
  @IsNotEmpty()
  departmentId: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => AgentConfigurationDto)
  agentConfig?: AgentConfigurationDto;
}

