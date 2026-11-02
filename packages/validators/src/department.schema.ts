import { z } from 'zod';

export const CreateDepartmentSchema = z.object({
  name: z.string().min(2, 'Department name must be at least 2 characters').max(100),
  slug: z.string().min(2).max(100).regex(/^[a-z0-9-]+$/, 'Slug must only contain lowercase letters, numbers, and hyphens').optional(),
  description: z.string().max(500).optional(),
  floorZone: z.string().max(50).optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Color must be a valid hex code (e.g. #3b82f6)').optional(),
  companyId: z.string().uuid('Invalid company ID format'),
});

export const UpdateDepartmentSchema = CreateDepartmentSchema.partial().omit({ companyId: true });

export type CreateDepartmentInput = z.infer<typeof CreateDepartmentSchema>;
export type UpdateDepartmentInput = z.infer<typeof UpdateDepartmentSchema>;
