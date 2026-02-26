// ============================================================
// Martha Store — Character state, tips, onboarding
// ============================================================

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { MarthaPose, MarthaTip } from '../types';

interface MarthaStore {
  currentPose: MarthaPose;
  currentMessage: string;
  tips: MarthaTip[];
  hasCompletedOnboarding: boolean;
  isFirstVisit: boolean;

  setPose: (pose: MarthaPose) => void;
  setMessage: (message: string) => void;
  speak: (message: string, pose?: MarthaPose) => void;
  addTip: (tip: MarthaTip) => void;
  dismissTip: (id: string) => void;
  completeOnboarding: () => void;
  setFirstVisit: (val: boolean) => void;
}

export const useMarthaStore = create<MarthaStore>()(
  persist(
    (set) => ({
      currentPose: 'greeting',
      currentMessage: "Welcome! I'm Martha, your virtual assistant. I'm here to help you manage the Europe Mission finances with ease!",
      tips: [],
      hasCompletedOnboarding: false,
      isFirstVisit: true,

      setPose: (pose) => set({ currentPose: pose }),
      setMessage: (message) => set({ currentMessage: message }),
      speak: (message, pose) =>
        set((state) => ({
          currentMessage: message,
          currentPose: pose ?? state.currentPose,
        })),
      addTip: (tip) => set((state) => ({ tips: [...state.tips, tip] })),
      dismissTip: (id) =>
        set((state) => ({
          tips: state.tips.map((t) => (t.id === id ? { ...t, dismissed: true } : t)),
        })),
      completeOnboarding: () => set({ hasCompletedOnboarding: true, isFirstVisit: false }),
      setFirstVisit: (val) => set({ isFirstVisit: val }),
    }),
    {
      name: 'martha-assistant-state',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        hasCompletedOnboarding: state.hasCompletedOnboarding,
        isFirstVisit: state.isFirstVisit,
      }),
    }
  )
);
