import React from "react";
import { Clock3 } from "lucide-react-native";

import { Text, View } from "@/tw";
import { colors } from "@/theme/colors";
import { type QuestWorkMessages } from "@/locales/questWorkMessages";
import type { LiveQuestSnapshot } from "../liveQuestService";
import { StateCard } from "./QuestWorkStateCard";

export interface QuestWorkStatusCardProps {
  snapshot: LiveQuestSnapshot;
  status: string;
  assignment: string;
  nextAction: string;
  countdown: string;
  dueAtDetail?: string;
  isTerminal: boolean;
  messages: QuestWorkMessages;
}

function WorkRow({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail?: string;
}) {
  return (
    <View className="mb-ku-12 flex-row justify-between gap-ku-12">
      <Text className="flex-1 text-ku-body-small text-ku-text-subtle">
        {label}
      </Text>
      <View className="flex-1 items-end">
        <Text className="text-right font-ku-semibold text-ku-body-small text-ku-text-strong">
          {value}
        </Text>
        {detail ? (
          <Text className="mt-ku-xs text-right text-ku-label text-ku-text-subtle">
            {detail}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

export default function QuestWorkStatusCard({
  snapshot,
  status,
  assignment,
  nextAction,
  countdown,
  dueAtDetail,
  isTerminal,
  messages,
}: QuestWorkStatusCardProps) {
  return (
    <StateCard
      tone={
        isTerminal
          ? "neutral"
          : snapshot.state === "QUEST_IN_PROGRESS"
            ? "success"
            : "warning"
      }
    >
      <View className="flex-row items-start justify-between gap-ku-12">
        <View className="flex-1">
          <Text className="font-ku-semibold text-ku-label tracking-wider text-ku-text-subtle uppercase">
            {status}
          </Text>
          <Text className="mt-ku-xs font-ku-bold text-ku-title text-ku-text-strong">
            {snapshot.quest.title}
          </Text>
        </View>
        <Clock3
          color={isTerminal ? colors.textMuted : colors.primary}
          size={22}
        />
      </View>
      <View className="mt-ku-md border-t border-ku-border pt-ku-12">
        <WorkRow label={messages.assignment} value={assignment} />
        <WorkRow label={messages.nextAction} value={nextAction} />
        <WorkRow
          label={messages.dueAt}
          value={countdown}
          detail={dueAtDetail}
        />
      </View>
    </StateCard>
  );
}
