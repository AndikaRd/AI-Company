import { create } from 'zustand';
import {
  CompanyFeedItem,
  FeedCategory,
  CeoCommandPayload,
  CeoCommandResult,
} from '@vac/shared';
import { api } from '../services/api';

export type CommandExecutionState =
  | 'idle'
  | 'sending'
  | 'acknowledged'
  | 'in_progress'
  | 'failed';

interface CompanyFeedState {
  // Feed
  items: CompanyFeedItem[];
  activeCategory: FeedCategory;
  isLoading: boolean;
  error: string | null;

  // Layout
  isRightSidebarOpen: boolean;

  // CEO Directives
  commandStatus: CommandExecutionState;
  lastDispatchedCommand: CeoCommandResult | null;
  commandError: string | null;
  commandHistory: CeoCommandResult[];
  isHistoryOpen: boolean;

  // Actions
  fetchFeed: (category?: FeedCategory) => Promise<void>;
  setCategory: (category: FeedCategory) => void;
  addFeedItem: (item: CompanyFeedItem) => void;
  dispatchCeoCommand: (payload: CeoCommandPayload) => Promise<CeoCommandResult | null>;
  fetchCommandHistory: () => Promise<void>;
  toggleRightSidebar: () => void;
  setRightSidebarOpen: (open: boolean) => void;
  toggleHistory: () => void;
  setCommandStatus: (status: CommandExecutionState) => void;
  clearCommandState: () => void;
}

export const useCompanyFeedStore = create<CompanyFeedState>((set, get) => ({
  items: [],
  activeCategory: 'ALL',
  isLoading: false,
  error: null,

  isRightSidebarOpen: true,

  commandStatus: 'idle',
  lastDispatchedCommand: null,
  commandError: null,
  commandHistory: [],
  isHistoryOpen: false,

  fetchFeed: async (category?: FeedCategory) => {
    const targetCategory = category || get().activeCategory;
    set({ isLoading: true, error: null });
    try {
      const items = await api.getCompanyFeed(targetCategory, 60);
      set({ items, isLoading: false, activeCategory: targetCategory });
    } catch (err: any) {
      console.error('[CompanyFeedStore] Failed to fetch feed:', err);
      set({ error: err.message || 'Failed to load company feed', isLoading: false });
    }
  },

  setCategory: (category: FeedCategory) => {
    set({ activeCategory: category });
    get().fetchFeed(category);
  },

  addFeedItem: (item: CompanyFeedItem) => {
    set((state) => {
      // Avoid duplicate entries
      const exists = state.items.some((i) => i.id === item.id);
      if (exists) return state;

      // Filter check based on current activeCategory
      const matchesFilter =
        state.activeCategory === 'ALL' || state.activeCategory === item.category;

      const newItems = matchesFilter ? [item, ...state.items] : state.items;
      return { items: newItems.slice(0, 80) };
    });
  },

  dispatchCeoCommand: async (payload: CeoCommandPayload): Promise<CeoCommandResult | null> => {
    set({ commandStatus: 'sending', commandError: null });
    try {
      const result = await api.dispatchCeoCommand(payload);
      set((state) => ({
        commandStatus: 'acknowledged',
        lastDispatchedCommand: result,
        commandHistory: [result, ...state.commandHistory.filter((c) => c.id !== result.id)],
      }));

      // Automatically transition to in_progress after brief acknowledgement
      setTimeout(() => {
        if (get().commandStatus === 'acknowledged') {
          set({ commandStatus: 'in_progress' });
        }
      }, 2500);

      // Re-fetch feed to ensure latest created tasks/events are included
      get().fetchFeed();

      return result;
    } catch (err: any) {
      console.error('[CompanyFeedStore] CEO command error:', err);
      set({
        commandStatus: 'failed',
        commandError: err.message || 'Failed to dispatch CEO directive',
      });
      return null;
    }
  },

  fetchCommandHistory: async () => {
    try {
      const history = await api.getCeoCommands(25);
      set({ commandHistory: history });
    } catch (err: any) {
      console.warn('[CompanyFeedStore] Failed to fetch command history:', err);
    }
  },

  toggleRightSidebar: () => {
    set((state) => ({ isRightSidebarOpen: !state.isRightSidebarOpen }));
  },

  setRightSidebarOpen: (open: boolean) => {
    set({ isRightSidebarOpen: open });
  },

  toggleHistory: () => {
    set((state) => ({ isHistoryOpen: !state.isHistoryOpen }));
  },

  setCommandStatus: (status: CommandExecutionState) => {
    set({ commandStatus: status });
  },

  clearCommandState: () => {
    set({ commandStatus: 'idle', commandError: null });
  },
}));

