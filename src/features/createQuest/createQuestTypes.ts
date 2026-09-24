import type { ComponentRef } from "react";
import type { LucideIcon } from "lucide-react-native";
import type {
  Pressable as RNPressable,
  TextInput as RNTextInput,
} from "react-native";

export type Step = 1 | 2 | 3;
export type ScheduleField = "start" | "end";
export type SaveState = "idle" | "saving" | "saved" | "error";
export type CompletionState = "DRAFT" | "OPEN";
export type SaveErrorIntent = {
  state: CompletionState;
  completesFlow: boolean;
};
export type Focusable =
  ComponentRef<typeof RNTextInput> | ComponentRef<typeof RNPressable>;
export type ChoiceVariant = "format" | "acceptance";
export type ChoiceOption = {
  value: string;
  label: string;
  description: string;
  icon: LucideIcon;
};

export const QUEST_DETAIL_FIELDS: Record<string, true> = {
  title: true,
  tag: true,
  description: true,
  conditions: true,
};
export const LOGISTICS_FIELDS: Record<string, true> = {
  startDate: true,
  deadline: true,
  startTime: true,
  endTime: true,
  location: true,
};
