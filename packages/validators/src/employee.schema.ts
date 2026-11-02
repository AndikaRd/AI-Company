import { z } from 'zod';

export const EmployeeStatusEnum = z.enum(['ACTIVE', 'IDLE', 'BUSY', 'OFFLINE']);

export const AgentConfigSchema = z.object({
  modelName: z.string().default('gpt-4o'),
  systemPrompt: z.string().max(2000).optional(),
  temperature: z.number().min(0).max(2).default(0.7),
  maxTokens: z.number().int().positive().default(2048),
  toolsEnabled: z.any().optional(),
  memoryRetention: z.enum(['SESSION', 'LONG_TERM']).default('SESSION'),
});

export const CreateEmployeeSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
  role: z.string().min(2, 'Role is required').max(100),
  email: z.string().email('Invalid email address'),
  avatarUrl: z.string().url('Invalid avatar URL').optional().or(z.literal('')),
  isAiAgent: z.boolean().default(true),
  status: EmployeeStatusEnum.default('ACTIVE'),
  departmentId: z.string().uuid('Invalid department ID'),
  agentConfig: AgentConfigSchema.optional(),
});

export const UpdateEmployeeSchema = CreateEmployeeSchema.partial().omit({ departmentId: true });

export type CreateEmployeeInput = z.infer<typeof CreateEmployeeSchema>;
export type UpdateEmployeeInput = z.infer<typeof UpdateEmployeeSchema>;
export type AgentConfigInput = z.infer<typeof AgentConfigSchema>;
