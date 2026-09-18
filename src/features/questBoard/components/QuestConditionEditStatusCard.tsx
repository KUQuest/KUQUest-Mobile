import React, { useEffect, useState } from "react";

import { Text, View } from "@/tw";
import type { QuestBoardMessages } from "@/locales/questBoardMessages";
import type { QuestV2EditRequest } from "@/api/questV2Contracts";
import { StateCard } from "./QuestWorkStateCard";

export interface QuestConditionEditStatusCardProps {
  editRequest: QuestV2EditRequest;
  messages: QuestBoardMessages;
}

function formatCountdown(milliseconds: number): string {
  const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

/**
 * Hirer-facing read-only status of the Quest Edit the Hirer just proposed:
 * a live 10-minute countdown plus how many Active Workers have responded.
 * The Hirer does not vote here; Worker responses happen in QuestWorkScreen.
 */
export function QuestConditionEditStatusCard({
  editRequest,
  messages,
}: QuestConditionEditStatusCardProps) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const remaining = Math.max(
    0,
    new Date(editRequest.expiresAt).getTime() - now
  );
  const { totalCount, acceptedCount } = editRequest.responseSummary;

  return (
    <StateCard tone="warning">
      <Text
        testID="hirer-condition-edit-pending-title"
        className="font-ku-bold text-ku-body text-ku-text-strong"
      >
        {messages.conditionEditPendingTitle}
      </Text>
      <Text className="mt-1 text-ku-body-small leading-5 text-ku-text-secondary">
        {messages.conditionEditPendingDescription}
      </Text>
      <View className="mt-3 flex-row items-center justify-between rounded-xl bg-white px-3 py-3">
        <Text className="text-ku-body-small text-ku-text-secondary">
          {messages.conditionEditCountdownLabel}
        </Text>
        <Text
          accessibilityLiveRegion="polite"
          testID="hirer-condition-edit-countdown"
          className="font-ku-bold text-ku-body text-ku-text-strong"
        >
          {formatCountdown(remaining)}
        </Text>
      </View>
      <Text
        testID="hirer-condition-edit-progress"
        className="mt-2 text-ku-body-small text-ku-text-secondary"
      >
        {messages.conditionEditVotingProgress(acceptedCount, totalCount)}
      </Text>
    </StateCard>
  );
}

QuestConditionEditStatusCard.displayName = "QuestConditionEditStatusCard";

export default QuestConditionEditStatusCard;
