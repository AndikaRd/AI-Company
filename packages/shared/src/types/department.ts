export type DepartmentName =
  | 'Operations'
  | 'Technology'
  | 'Research'
  | 'Engineering'
  | 'Business Analysis'
  | 'Creative'
  | 'Quality Assurance'
  | 'Administration';

export interface Department {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  floorZone?: string | null;
  color?: string | null;
  companyId: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface DepartmentWithCounts extends Department {
  _count?: {
    employees: number;
  };
}
