import {
  HealthCheckResponse,
  Company,
  DepartmentWithCounts,
  Employee,
  ChatMessage,
  SendChatMessageDto,
  ChatExecutionResponse,
  Task,
  CreateTaskDto,
  ReviewApprovalDto,
  ApprovalRequest,
  ToolDefinitionDto,
  OrganizationHierarchyNode,
  AgentMessage,
  DelegateTaskDto,
  RespondToDelegationDto,
  Memory,
  KnowledgeDocument,
  KnowledgeCategory,
  CreateMemoryDto,
  QueryMemoryDto,
  RetrievedMemoryItem,
  MemoryAccessLog,
  EmployeeActivityInfo,
} from '@vac/shared';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

export interface EmployeeStats {
  totalEmployees: number;
  totalAiAgents: number;
  activeEmployees: number;
  idleEmployees: number;
  busyEmployees: number;
  offlineEmployees: number;
}

export interface AiHealthInfo {
  available: boolean;
  latencyMs: number;
  baseUrlSafe: string;
  version?: string;
}

class ApiService {
  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${API_BASE}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          ...options?.headers,
        },
        ...options,
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(errorBody.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const json = await response.json();
      return json.data !== undefined ? json.data : json;
    } catch (error) {
      console.warn(`[API] Failed request to ${endpoint}:`, error);
      throw error;
    }
  }

  async getHealth(): Promise<HealthCheckResponse> {
    const url = `${API_BASE}/health`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Health check returned status ${response.status}`);
    }
    return response.json();
  }

  async getActiveCompany(): Promise<Company & { departments: DepartmentWithCounts[] }> {
    return this.request('/companies/active');
  }

  async updateCompany(
    id: string,
    data: Partial<Company>,
  ): Promise<Company & { departments: DepartmentWithCounts[] }> {
    return this.request(`/companies/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async getDepartments(): Promise<DepartmentWithCounts[]> {
    return this.request('/departments');
  }

  async getEmployeeStats(): Promise<EmployeeStats> {
    return this.request('/employees/stats');
  }

  async getEmployees(departmentId?: string): Promise<Employee[]> {
    return this.request(departmentId ? `/employees?departmentId=${departmentId}` : '/employees');
  }

  async getEmployee(id: string): Promise<Employee> {
    return this.request(`/employees/${id}`);
  }

  async createEmployee(data: any): Promise<Employee> {
    return this.request('/employees', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getConversations(employeeId: string): Promise<any[]> {
    return this.request(`/employees/${employeeId}/conversations`);
  }

  async getMessages(conversationId: string): Promise<ChatMessage[]> {
    return this.request(`/employees/conversations/${conversationId}/messages`);
  }

  async sendChatMessage(
    employeeId: string,
    dto: SendChatMessageDto,
  ): Promise<ChatExecutionResponse> {
    return this.request(`/employees/${employeeId}/chat`, {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  }

  async getAiHealth(): Promise<AiHealthInfo> {
    return this.request('/ai/health');
  }

  async getAiModels(): Promise<any[]> {
    return this.request('/ai/models');
  }

  async getTasks(query?: { status?: string; employeeId?: string }): Promise<Task[]> {
    const params = new URLSearchParams();
    if (query?.status) params.append('status', query.status);
    if (query?.employeeId) params.append('employeeId', query.employeeId);
    const queryString = params.toString() ? `?${params.toString()}` : '';
    return this.request(`/tasks${queryString}`);
  }

  async getTask(id: string): Promise<Task> {
    return this.request(`/tasks/${id}`);
  }

  async createTask(dto: CreateTaskDto): Promise<Task> {
    return this.request('/tasks', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  }

  async retryTask(id: string): Promise<{ success: boolean; message: string }> {
    return this.request(`/tasks/${id}/retry`, {
      method: 'POST',
    });
  }

  async getPendingApprovals(): Promise<ApprovalRequest[]> {
    return this.request('/tasks/approvals/pending');
  }

  async reviewApproval(approvalId: string, dto: ReviewApprovalDto): Promise<any> {
    return this.request(`/tasks/approvals/${approvalId}/review`, {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  }

  async getRegisteredTools(): Promise<ToolDefinitionDto[]> {
    return this.request('/tools');
  }

  // --- SPRINT 4: MULTI-AGENT COLLABORATION & HIERARCHY ---

  async getOrganizationHierarchy(): Promise<OrganizationHierarchyNode[]> {
    return this.request('/employees/hierarchy');
  }

  async getSubordinates(employeeId: string): Promise<Employee[]> {
    return this.request(`/employees/${employeeId}/subordinates`);
  }

  async getTaskTree(taskId: string): Promise<any> {
    return this.request(`/tasks/${taskId}/tree`);
  }

  async decomposeTask(
    taskId: string,
    coordinatorEmployeeId: string,
    guidelines?: string,
  ): Promise<any> {
    return this.request(`/tasks/${taskId}/decompose`, {
      method: 'POST',
      body: JSON.stringify({ coordinatorEmployeeId, guidelines }),
    });
  }

  async consolidateTask(taskId: string): Promise<any> {
    return this.request(`/tasks/${taskId}/consolidate`, {
      method: 'POST',
    });
  }

  async getRecentAgentMessages(limit = 50): Promise<AgentMessage[]> {
    return this.request(`/agent-communication/recent?limit=${limit}`);
  }

  async getTaskMessages(taskId: string): Promise<AgentMessage[]> {
    return this.request(`/agent-communication/tasks/${taskId}`);
  }

  async delegateTask(dto: DelegateTaskDto): Promise<any> {
    return this.request('/agent-communication/delegate', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  }

  async respondToDelegation(dto: RespondToDelegationDto): Promise<any> {
    return this.request('/agent-communication/respond', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  }

  // --- Sprint 5: Company Intelligence & Memory System ---

  async searchMemories(query: QueryMemoryDto): Promise<{ total: number; items: RetrievedMemoryItem[] }> {
    const params = new URLSearchParams();
    if (query.query) params.append('query', query.query);
    if (query.employeeId) params.append('employeeId', query.employeeId);
    if (query.category) params.append('category', query.category);
    if (query.scope) params.append('scope', query.scope);
    if (query.status) params.append('status', query.status);
    if (query.limit) params.append('limit', String(query.limit));
    if (query.offset) params.append('offset', String(query.offset));
    return this.request(`/memory/search?${params.toString()}`);
  }

  async getEmployeeMemories(
    employeeId: string,
    params?: { category?: string; status?: string; limit?: number },
  ): Promise<{
    total: number;
    working: Memory[];
    episodic: Memory[];
    semantic: Memory[];
    all: Memory[];
  }> {
    const query = new URLSearchParams();
    if (params?.category) query.append('category', params.category);
    if (params?.status) query.append('status', params.status);
    if (params?.limit) query.append('limit', String(params.limit));
    return this.request(`/memory/employee/${employeeId}?${query.toString()}`);
  }

  async getMemoryById(id: string, requestingEmployeeId?: string): Promise<Memory> {
    const query = requestingEmployeeId ? `?requestingEmployeeId=${requestingEmployeeId}` : '';
    return this.request(`/memory/${id}${query}`);
  }

  async createMemory(dto: CreateMemoryDto): Promise<Memory> {
    return this.request('/memory', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  }

  async updateMemory(id: string, dto: Partial<CreateMemoryDto>): Promise<Memory> {
    return this.request(`/memory/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(dto),
    });
  }

  async archiveMemory(id: string, reason?: string): Promise<Memory> {
    return this.request(`/memory/${id}/archive`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  async deleteMemory(id: string, hard = false): Promise<{ success: boolean; message: string }> {
    return this.request(`/memory/${id}?hard=${hard}`, {
      method: 'DELETE',
    });
  }

  async getKnowledgeDocuments(category?: KnowledgeCategory): Promise<KnowledgeDocument[]> {
    const query = category ? `?category=${category}` : '';
    return this.request(`/memory/knowledge/documents${query}`);
  }

  async getKnowledgeDocumentBySlug(slug: string): Promise<KnowledgeDocument> {
    return this.request(`/memory/knowledge/documents/${slug}`);
  }

  async createKnowledgeDocument(dto: {
    title: string;
    slug: string;
    category?: KnowledgeCategory;
    content: string;
    summary?: string;
    authorEmployeeId?: string;
    departmentId?: string;
    tags?: string[];
  }): Promise<KnowledgeDocument> {
    return this.request('/memory/knowledge/documents', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  }

  async getMemoryAccessLogs(limit = 50): Promise<MemoryAccessLog[]> {
    return this.request(`/memory/access-logs?limit=${limit}`);
  }

  // --- Sprint 6: Real-time Employee Activity ---

  async getEmployeesActivity(): Promise<Record<string, EmployeeActivityInfo>> {
    return this.request('/employees/activity');
  }

  async getEmployeeActivity(id: string): Promise<EmployeeActivityInfo> {
    return this.request(`/employees/${id}/activity`);
  }
}

export const api = new ApiService();
