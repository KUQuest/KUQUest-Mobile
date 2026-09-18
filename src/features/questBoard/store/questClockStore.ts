import { createStore, type StoreApi } from "zustand/vanilla";

interface QuestClockState {
  nowMs: number;
  setNow: (nowMs: number) => void;
  advance: (amountMs: number) => void;
}

export type QuestClockStore = StoreApi<QuestClockState>;

export function createQuestClockStore(initialNow: Date): QuestClockStore {
  return createStore<QuestClockState>((set) => ({
    nowMs: initialNow.getTime(),
    setNow: (nowMs) => set({ nowMs }),
    advance: (amountMs) => set((state) => ({ nowMs: state.nowMs + amountMs })),
  }));
}
