import { create } from 'zustand';
import { Company, DepartmentWithCounts, HealthCheckResponse, Employee } from '@vac/shared';
import { api, EmployeeStats } from '../services/api';

interface CompanyState {
  company: (Company & { departments: DepartmentWithCounts[] }) | null;
  departments: DepartmentWithCounts[];
  employees: Employee[];
  employeeStats: EmployeeStats;
  health: HealthCheckResponse | null;
  isLoading: boolean;
  error: string | null;
  lastFetchedAt: Date | null;

  fetchData: () => Promise<void>;
  fetchHealth: () => Promise<void>;
  fetchEmployees: () => Promise<void>;
  updateCompanyProfile: (data: Partial<Company>) => Promise<void>;
}

export const useCompanyStore = create<CompanyState>((set, get) => ({
  company: null,
  departments: [],
  employees: [],
  employeeStats: {
    totalEmployees: 0,
    totalAiAgents: 0,
    activeEmployees: 0,
    idleEmployees: 0,
    busyEmployees: 0,
    offlineEmployees: 0,
  },
  health: null,
  isLoading: true,
  error: null,
  lastFetchedAt: null,

  fetchData: async () => {
    set({ isLoading: true, error: null });
    try {
      const [companyData, healthData, statsData, employeesData] = await Promise.allSettled([
        api.getActiveCompany(),
        api.getHealth(),
        api.getEmployeeStats(),
        api.getEmployees(),
      ]);

      set((state) => ({
        company: companyData.status === 'fulfilled' ? companyData.value : state.company,
        departments: companyData.status === 'fulfilled' ? companyData.value.departments || [] : state.departments,
        health: healthData.status === 'fulfilled' ? healthData.value : state.health,
        employeeStats: statsData.status === 'fulfilled' ? statsData.value : state.employeeStats,
        employees: employeesData.status === 'fulfilled' ? employeesData.value : state.employees,
        isLoading: false,
        lastFetchedAt: new Date(),
        error: companyData.status === 'rejected' ? 'Failed to connect to backend API' : null,
      }));
    } catch (err: any) {
      set({
        isLoading: false,
        error: err.message || 'Error loading platform data',
      });
    }
  },

  fetchEmployees: async () => {
    try {
      const employees = await api.getEmployees();
      set({ employees });
    } catch (err) {
      console.warn('Failed to load employees:', err);
    }
  },

  fetchHealth: async () => {
    try {
      const health = await api.getHealth();
      set({ health });
    } catch {
      set((state) => ({
        health: state.health ? { ...state.health, status: 'error' } : null,
      }));
    }
  },

  updateCompanyProfile: async (data: Partial<Company>) => {
    const current = get().company;
    if (!current?.id) return;

    try {
      const updated = await api.updateCompany(current.id, data);
      set((state) => ({
        company: {
          ...state.company!,
          ...updated,
          departments: updated.departments || state.company?.departments || [],
        },
      }));
    } catch (err: any) {
      throw err;
    }
  },
}));
