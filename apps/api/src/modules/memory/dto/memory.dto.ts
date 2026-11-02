import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsUUID,
  IsNumber,
  IsArray,
  IsBoolean,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  MemoryCategory,
  MemoryScope,
  MemoryStatus,
  MemorySourceType,
  KnowledgeCategory,
} from '@prisma/client';

export class CreateMemoryDto {
  @IsEnum(MemoryCategory)
  @IsNotEmpty()
  category: MemoryCategory;

  @IsEnum(MemoryScope)
  @IsNotEmpty()
  scope: MemoryScope;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsOptional()
  @IsString()
  summary?: string;

  @IsOptional()
  @IsArray()
  tags?: string[];

  @IsOptional()
  @IsUUID()
  ownerEmployeeId?: string;

  @IsOptional()
  @IsUUID()
  departmentId?: string;

  @IsOptional()
  @IsString()
  projectId?: string;

  @IsOptional()
  @IsUUID()
  taskId?: string;

  @IsOptional()
  @IsNumber()
  @Min(0.0)
  @Max(1.0)
  importance?: number;

  @IsOptional()
  @IsNumber()
  @Min(0.0)
  @Max(1.0)
  confidence?: number;

  @IsOptional()
  expiresAt?: string | Date;

  @IsOptional()
  metadata?: Record<string, any>;

  @IsOptional()
  @IsEnum(MemorySourceType)
  sourceType?: MemorySourceType;

  @IsOptional()
  @IsString()
  sourceRef?: string;

  @IsOptional()
  @IsBoolean()
  isVerified?: boolean;
}

export class UpdateMemoryDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsString()
  summary?: string;

  @IsOptional()
  @IsArray()
  tags?: string[];

  @IsOptional()
  @IsNumber()
  @Min(0.0)
  @Max(1.0)
  importance?: number;

  @IsOptional()
  @IsNumber()
  @Min(0.0)
  @Max(1.0)
  confidence?: number;

  @IsOptional()
  @IsEnum(MemoryStatus)
  status?: MemoryStatus;

  @IsOptional()
  @IsEnum(MemoryScope)
  scope?: MemoryScope;

  @IsOptional()
  metadata?: Record<string, any>;
}

export class QueryMemoryDto {
  @IsOptional()
  @IsUUID()
  employeeId?: string;

  @IsOptional()
  @IsEnum(MemoryCategory)
  category?: MemoryCategory;

  @IsOptional()
  @IsEnum(MemoryScope)
  scope?: MemoryScope;

  @IsOptional()
  @IsEnum(MemoryStatus)
  status?: MemoryStatus;

  @IsOptional()
  @IsString()
  projectId?: string;

  @IsOptional()
  @IsUUID()
  taskId?: string;

  @IsOptional()
  @IsString()
  query?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  offset?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  minImportance?: number;
}

export class CreateKnowledgeDocumentDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  slug: string;

  @IsOptional()
  @IsEnum(KnowledgeCategory)
  category?: KnowledgeCategory;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsOptional()
  @IsString()
  summary?: string;

  @IsOptional()
  @IsUUID()
  authorEmployeeId?: string;

  @IsOptional()
  @IsUUID()
  departmentId?: string;

  @IsOptional()
  @IsArray()
  tags?: string[];
}
