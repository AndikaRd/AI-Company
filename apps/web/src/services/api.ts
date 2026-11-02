import { HealthCheckResponse, Company, DepartmentWithCounts } from '@vac/shared';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

export interface EmployeeStats {
  totalEmployees: number;
  totalAiAgents: number;
  activeEmployees: number;
  idleEmployees: number;
  busyEmployees: number;
  offlineEmployees: number;
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

  async getDepartments(): Promise<DepartmentWithCounts[]> {
    return this.request('/departments');
  }

  async getEmployeeStats(): Promise<EmployeeStats> {
    return this.request('/employees/stats');
  }
}

export const api = new ApiService();
