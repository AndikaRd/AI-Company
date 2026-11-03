import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';

export class DispatchCeoCommandDto {
  @IsString()
  @IsNotEmpty()
  targetType: 'COMPANY' | 'DEPARTMENT' | 'EMPLOYEE';

  @IsString()
  @IsOptional()
  targetId?: string;

  @IsString()
  @IsNotEmpty()
  targetName: string;

  @IsString()
  @IsNotEmpty()
  instruction: string;

  @IsString()
  @IsOptional()
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export class FeedQueryDto {
  @IsString()
  @IsOptional()
  category?: string;

  @IsOptional()
  limit?: string;
}

