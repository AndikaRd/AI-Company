import { z } from 'zod';

export const EmployeeStatusEnum = z.enum(['ACTIVE', 'IDLE', 'BUSY', 'OFFLINE']);

export const SeniorityLevelEnum = z.enum([
  'INTERN',
  'JUNIOR',
  'MID',
  'SENIOR',
  'LEAD',
  'PRINCIPAL',
  'EXECUTIVE',
]);

export const AiProviderEnum = z.enum(['OLLAMA', 'OPENAI', 'ANTHROPIC']);

export const AutonomyLevelEnum = z.enum(['MANUAL', 'SUPERVISED', 'AUTONOMOUS']);

export const AgentConfigSchema = z.object({
  provider: AiProviderEnum.default('OLLAMA'),
  modelName: z.string().default('qwen3.5:4b'),
  autonomyLevel: AutonomyLevelEnum.default('SUPERVISED'),
  systemPrompt: z.string().max(4000).optional(),
  temperature: z.number().min(0).max(2).default(0.7),
  maxTokens: z.number().int().positive().default(2048),
  toolsEnabled: z.any().optional(),
  permissionConfig: z.any().optional(),
  memoryRetention: z.enum(['SESSION', 'LONG_TERM']).default('SESSION'),
  memoryConfig: z.any().optional(),
});

export const CreateEmployeeSchema = z.object({
  employeeCode: z.string().min(2).max(20).optional(),
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
  role: z.string().min(2, 'Role is required').max(100),
  jobTitle: z.string().max(100).optional(),
  seniority: SeniorityLevelEnum.default('MID'),
  personality: z.string().max(1000).optional(),
  primaryExpertise: z.string().max(100).optional(),
  skills: z.any().optional(),
  email: z.string().email('Invalid email address'),
  avatarUrl: z.string().url('Invalid avatar URL').optional().or(z.literal('')),
  workstationId: z.string().max(50).optional(),
  isAiAgent: z.boolean().default(true),
  status: EmployeeStatusEnum.default('ACTIVE'),
  departmentId: z.string().uuid('Invalid department ID'),
  supervisorId: z.string().uuid('Invalid supervisor ID').optional(),
  agentConfig: AgentConfigSchema.optional(),
});

export const UpdateEmployeeSchema = CreateEmployeeSchema.partial().omit({ departmentId: true });

export type CreateEmployeeInput = z.infer<typeof CreateEmployeeSchema>;
export type UpdateEmployeeInput = z.infer<typeof UpdateEmployeeSchema>;
export type AgentConfigInput = z.infer<typeof AgentConfigSchema>;
