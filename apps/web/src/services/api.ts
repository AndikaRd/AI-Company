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
}

export const api = new ApiService();
