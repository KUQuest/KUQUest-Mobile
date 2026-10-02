import type { QuestDetailState } from "./types";

export function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export function addMilliseconds(value: string, milliseconds: number): string {
  return new Date(new Date(value).getTime() + milliseconds).toISOString();
}

export function blankCapabilities(): QuestDetailState["capabilities"] {
  return {
    availableActions: [],
    canReadConversation: false,
    canWriteConversation: false,
  };
}
