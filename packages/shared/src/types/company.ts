export type CompanyStatus = 'ACTIVE' | 'SUSPENDED' | 'ARCHIVED';

export interface Company {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  industry?: string | null;
  website?: string | null;
  status: CompanyStatus;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface CompanyWithDepartmentCount extends Company {
  _count?: {
    departments: number;
    employees?: number;
  };
}

