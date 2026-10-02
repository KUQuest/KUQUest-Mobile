import { createStore, type StoreApi } from "zustand/vanilla";

import type { QuestDetailState } from "../domain/types";

export interface QuestStoreState {
  quests: Record<string, QuestDetailState>;
  revision: number;
  replaceQuestStates: (states: QuestDetailState[]) => void;
  setQuestState: (state: QuestDetailState) => void;
  touch: () => void;
}

export type QuestStore = StoreApi<QuestStoreState>;

export function createQuestStore(
  initialStates: QuestDetailState[] = []
): QuestStore {
  const initialQuests = Object.fromEntries(
    initialStates.map((state) => [state.quest.id, state])
  );
  return createStore<QuestStoreState>((set) => ({
    quests: initialQuests,
    revision: 0,
    replaceQuestStates: (states) =>
      set({
        quests: Object.fromEntries(
          states.map((state) => [state.quest.id, state])
        ),
        revision: 0,
      }),
    setQuestState: (state) =>
      set((current) => ({
        quests: { ...current.quests, [state.quest.id]: state },
        revision: current.revision + 1,
      })),
    touch: () => set((current) => ({ revision: current.revision + 1 })),
  }));
}

export const questStore = createQuestStore();
