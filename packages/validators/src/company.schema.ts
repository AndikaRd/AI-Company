import { z } from 'zod';

export const CompanyStatusEnum = z.enum(['ACTIVE', 'SUSPENDED', 'ARCHIVED']);

export const CreateCompanySchema = z.object({
  name: z.string().min(2, 'Company name must be at least 2 characters').max(100),
  slug: z.string().min(2).max(100).regex(/^[a-z0-9-]+$/, 'Slug must only contain lowercase letters, numbers, and hyphens').optional(),
  description: z.string().max(500).optional(),
  industry: z.string().max(100).optional(),
  website: z.string().url('Invalid website URL').optional().or(z.literal('')),
  status: CompanyStatusEnum.default('ACTIVE'),
});

export const UpdateCompanySchema = CreateCompanySchema.partial();

export type CreateCompanyInput = z.infer<typeof CreateCompanySchema>;
export type UpdateCompanyInput = z.infer<typeof UpdateCompanySchema>;

