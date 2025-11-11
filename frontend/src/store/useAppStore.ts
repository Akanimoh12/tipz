import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { Address } from 'viem';
import type { Profile } from '../services/contract.service';

export interface TipActivity {
  id: string;
  type: 'sent' | 'received';
  fromAddress: Address;
  fromUsername: string;
  toAddress: Address;
  toUsername: string;
  amount: bigint;
  amountFormatted: string;
  message: string;
  timestamp: number;
  txHash: string;
}

export interface DashboardStats {
  totalTipsReceived: bigint;
  totalTipsCount: number;
  withdrawableBalance: bigint;
  creditScore: number;
  totalWithdrawn: bigint;
}

interface AppState {
  profile: Profile | null;
  stats: DashboardStats | null;
  activities: TipActivity[];
  isLoadingProfile: boolean;
  isLoadingStats: boolean;
}

interface AppActions {
  setProfile: (profile: Profile | null) => void;
  updateStats: (stats: Partial<DashboardStats>) => void;
  addActivity: (activity: TipActivity) => void;
  addActivities: (activities: TipActivity[]) => void;
  clearActivities: () => void;
  setLoadingProfile: (loading: boolean) => void;
  setLoadingStats: (loading: boolean) => void;
  reset: () => void;
}

type AppStore = AppState & AppActions;

const initialState: AppState = {
  profile: null,
  stats: null,
  activities: [],
  isLoadingProfile: false,
  isLoadingStats: false,
};

export const useAppStore = create<AppStore>()(
  devtools(
    immer((set) => ({
      ...initialState,

      setProfile: (profile) =>
        set((state) => {
          state.profile = profile;
          if (profile) {
            state.stats = {
              totalTipsReceived: profile.totalTipsReceived,
              totalTipsCount: Number(profile.totalTipsCount),
              withdrawableBalance: profile.withdrawableBalance,
              creditScore: profile.creditScore,
              totalWithdrawn: profile.totalWithdrawn,
            };
          }
        }),

      updateStats: (stats) =>
        set((state) => {
          if (state.stats) {
            Object.assign(state.stats, stats);
          } else {
            state.stats = stats as DashboardStats;
          }
        }),

      addActivity: (activity) =>
        set((state) => {
          const exists = state.activities.some((a: TipActivity) => a.id === activity.id);
          if (!exists) {
            state.activities.unshift(activity);
            if (state.activities.length > 100) {
              state.activities = state.activities.slice(0, 100);
            }
          }
        }),

      addActivities: (activities) =>
        set((state) => {
          const existingIds = new Set(state.activities.map((a: TipActivity) => a.id));
          const newActivities = activities.filter((a: TipActivity) => !existingIds.has(a.id));
          state.activities = [...newActivities, ...state.activities].slice(0, 100);
        }),

      clearActivities: () =>
        set((state) => {
          state.activities = [];
        }),

      setLoadingProfile: (loading) =>
        set((state) => {
          state.isLoadingProfile = loading;
        }),

      setLoadingStats: (loading) =>
        set((state) => {
          state.isLoadingStats = loading;
        }),

      reset: () => set(initialState),
    })),
    { name: 'AppStore' }
  )
);

export const useProfile = () => useAppStore((state) => state.profile);
export const useStats = () => useAppStore((state) => state.stats);
export const useActivities = () => useAppStore((state) => state.activities);
export const useIsLoadingProfile = () => useAppStore((state) => state.isLoadingProfile);
export const useIsLoadingStats = () => useAppStore((state) => state.isLoadingStats);

export const useDashboardData = () =>
  useAppStore((state) => ({
    profile: state.profile,
    stats: state.stats,
    activities: state.activities,
    isLoadingProfile: state.isLoadingProfile,
    isLoadingStats: state.isLoadingStats,
  }));
