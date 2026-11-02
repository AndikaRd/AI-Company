import { Employee } from './employee';
import { Department } from './department';
import { Task } from './task';

export type MemoryCategory = 'WORKING' | 'EPISODIC' | 'SEMANTIC';

export type MemoryScope = 'EMPLOYEE_PRIVATE' | 'PROJECT_SHARED' | 'COMPANY_SHARED' | 'TASK_SCOPED';

export type MemoryStatus = 'ACTIVE' | 'ARCHIVED' | 'EXPIRED' | 'DELETED';

export type MemorySourceType =
  | 'TASK_EXECUTION'
  | 'AGENT_DECISION'
  | 'AGENT_COMMUNICATION'
  | 'KNOWLEDGE_DOCUMENT'
  | 'EXECUTIVE_DIRECTIVE'
  | 'MANUAL_ENTRY';

export type KnowledgeCategory =
  | 'CODING_STANDARDS'
  | 'ARCHITECTURE_GUIDELINES'
  | 'COMPANY_POLICY'
  | 'PRODUCT_SPECIFICATION'
  | 'SECURITY_PRACTICES'
  | 'QA_VERIFICATION'
  | 'GENERAL';

export interface MemorySource {
  id: string;
  sourceType: MemorySourceType;
  sourceRef?: string | null;
  isVerified: boolean;
  verifiedBy?: string | null;
  verifiedAt?: string | Date | null;
  confidenceScore: number;
  rawContent?: string | null;
  createdAt: string | Date;
}

export interface Memory {
  id: string;
  category: MemoryCategory;
  scope: MemoryScope;
  status: MemoryStatus;
  title: string;
  content: string;
  summary?: string | null;
  tags?: string[] | null;
  ownerEmployeeId?: string | null;
  ownerEmployee?: Employee | null;
  departmentId?: string | null;
  department?: Department | null;
  projectId?: string | null;
  taskId?: string | null;
  task?: Task | null;
  importance: number;
  confidence: number;
  accessCount: number;
  lastAccessedAt?: string | Date | null;
  expiresAt?: string | Date | null;
  metadata?: Record<string, any> | null;
  sourceId?: string | null;
  source?: MemorySource | null;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface KnowledgeDocument {
  id: string;
  title: string;
  slug: string;
  category: KnowledgeCategory;
  content: string;
  summary?: string | null;
  authorEmployeeId?: string | null;
  authorEmployee?: Employee | null;
  departmentId?: string | null;
  department?: Department | null;
  version: number;
  isApproved: boolean;
  approvedBy?: string | null;
  approvedAt?: string | Date | null;
  tags?: string[] | null;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface ProjectKnowledge {
  id: string;
  projectId: string;
  title: string;
  key: string;
  value: string;
  isVerified: boolean;
  updatedByEmployeeId?: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface MemoryAccessLog {
  id: string;
  memoryId: string;
  accessedByEmployeeId: string;
  taskId?: string | null;
  action: string;
  queryContext?: string | null;
  relevanceScore?: number | null;
  createdAt: string | Date;
}

export interface CreateMemoryDto {
  category: MemoryCategory;
  scope: MemoryScope;
  title: string;
  content: string;
  summary?: string;
  tags?: string[];
  ownerEmployeeId?: string;
  departmentId?: string;
  projectId?: string;
  taskId?: string;
  importance?: number;
  confidence?: number;
  expiresAt?: string | Date;
  metadata?: Record<string, any>;
  sourceType?: MemorySourceType;
  sourceRef?: string;
  isVerified?: boolean;
}

export interface UpdateMemoryDto {
  title?: string;
  content?: string;
  summary?: string;
  tags?: string[];
  importance?: number;
  confidence?: number;
  status?: MemoryStatus;
  scope?: MemoryScope;
  metadata?: Record<string, any>;
}

export interface QueryMemoryDto {
  employeeId?: string;
  category?: MemoryCategory;
  scope?: MemoryScope;
  status?: MemoryStatus;
  projectId?: string;
  taskId?: string;
  query?: string;
  limit?: number;
  offset?: number;
  minImportance?: number;
}

export interface MemoryRetrievalContext {
  employeeId: string;
  taskObjective: string;
  projectId?: string;
  taskId?: string;
  maxTokens?: number;
  categories?: MemoryCategory[];
}

export interface RetrievedMemoryItem {
  id: string;
  title: string;
  content: string;
  category: MemoryCategory;
  scope: MemoryScope;
  relevanceScore: number;
  provenance: {
    sourceType?: MemorySourceType;
    isVerified: boolean;
    sourceRef?: string | null;
  };
}

export interface FormattedMemoryContext {
  workingMemory: string[];
  episodicMemory: string[];
  semanticKnowledge: string[];
  retrievedMemoryIds: string[];
  totalTokenEstimate: number;
  promptSnippet: string;
}
