import React from "react";
import {
  AlertTriangle,
  CheckCircle2,
  MessageCircle,
  ShieldCheck,
} from "lucide-react-native";

import { ActivityIndicator, Pressable, Text, View } from "@/tw";
import { type QuestWorkMessages } from "@/locales/questWorkMessages";
import { colors } from "@/theme/colors";
import type { LiveQuestSnapshot } from "../../live/liveQuestService";
import { StateCard } from "../../shared/components/QuestWorkStateCard";

export interface QuestWorkActionsCardProps {
  snapshot: LiveQuestSnapshot;
  messages: QuestWorkMessages;
  stale: boolean;
  errorText?: string;
  conditions: LiveQuestSnapshot["quest"]["condition"]["items"];
  editSending: boolean;
  editFeedback?: string;
  confirmationSending: boolean;
  isTerminal: boolean;
  canOpenChat: boolean;
  onRespondToEdit: (
    decision: "EDIT_RESPONSE_ACCEPTED" | "EDIT_RESPONSE_DECLINED"
  ) => void | Promise<void>;
  onConfirmCompletion: () => void | Promise<void>;
  onFileDispute?: () => void;
  onOpenChat: () => void;
}

export default function QuestWorkActionsCard({
  snapshot,
  messages,
  stale,
  errorText,
  conditions,
  editSending,
  editFeedback,
  confirmationSending,
  canOpenChat,
  onRespondToEdit,
  onConfirmCompletion,
  onFileDispute,
  onOpenChat,
  isTerminal,
}: QuestWorkActionsCardProps) {
  return (
    <>
      {stale ? (
        <View className="mt-ku-12 rounded-xl border border-ku-border-warning bg-ku-surface-warning px-ku-12 py-ku-sm">
          <Text className="text-ku-body-small text-ku-warning-dark">
            {messages.stale}
          </Text>
          {errorText ? (
            <Text className="mt-ku-xs text-ku-label text-ku-warning-dark">
              {errorText}
            </Text>
          ) : null}
        </View>
      ) : null}

      {snapshot.state === "QUEST_ASSIGNED" ? (
        <View className="mt-ku-12 flex-row items-start gap-ku-12 rounded-xl border border-ku-border-accent bg-ku-surface-accent px-ku-12 py-ku-12">
          <ShieldCheck color={colors.worker} size={20} />
          <View className="flex-1">
            <Text className="font-ku-semibold text-ku-text-strong">
              {messages.waitingForStart}
            </Text>
            <Text className="mt-ku-xs text-ku-body-small text-ku-text-secondary">
              {messages.startsAutomatically}
            </Text>
          </View>
        </View>
      ) : null}

      {isTerminal ? (
        <View className="mt-ku-12 rounded-xl border border-ku-border bg-ku-surface-muted px-ku-12 py-ku-12">
          <Text className="text-ku-body-small text-ku-text-secondary">
            {messages.archiveDescription}
          </Text>
          {snapshot.state === "QUEST_FAILED" && onFileDispute ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={messages.fileDispute}
              className="mt-ku-12 flex-row items-center justify-center gap-ku-sm rounded-xl bg-ku-warning px-ku-12 py-ku-10"
              onPress={onFileDispute}
            >
              <AlertTriangle color={colors.onWorker} size={16} />
              <Text className="text-center font-ku-semibold text-ku-body-small text-ku-on-worker">
                {messages.fileDispute}
              </Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      <View className="mt-ku-20">
        <Text className="mb-ku-12 font-ku-bold text-ku-subtitle text-ku-text-strong">
          {messages.conditions}
        </Text>
        <StateCard>
          {conditions.length ? (
            conditions.map((condition) => (
              <View
                key={`${condition.position}-${condition.text}`}
                className="mb-ku-12 flex-row items-start gap-ku-sm last:mb-ku-0"
              >
                <CheckCircle2 color={colors.worker} size={18} />
                <Text className="flex-1 text-ku-body-small text-ku-text-secondary">
                  {condition.text}
                </Text>
              </View>
            ))
          ) : (
            <Text className="text-ku-body-small text-ku-text-subtle">
              {messages.actionUnavailable}
            </Text>
          )}
        </StateCard>
      </View>

      {snapshot.editRequest?.status === "EDIT_REQUEST_PENDING" ? (
        <StateCard tone="warning">
          <Text className="font-ku-bold text-ku-subtitle text-ku-text-strong">
            {messages.editTitle}
          </Text>
          <Text className="mt-ku-xs text-ku-body-small text-ku-text-secondary">
            {messages.editDescription}
          </Text>
          <View className="mt-ku-12 rounded-xl bg-ku-surface px-ku-12 py-ku-12">
            {snapshot.editRequest.proposedCondition.items.map((item) => (
              <Text
                key={`${item.position}-${item.text}`}
                className="mb-ku-xs text-ku-body-small text-ku-text-secondary"
              >
                • {item.text}
              </Text>
            ))}
          </View>
          {snapshot.capabilities.canRespondToEdit ? (
            <View className="mt-ku-12 flex-row gap-ku-sm">
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={messages.acceptEdit}
                disabled={editSending}
                className="flex-1 rounded-xl bg-ku-worker px-ku-12 py-ku-12 disabled:opacity-50"
                onPress={() => void onRespondToEdit("EDIT_RESPONSE_ACCEPTED")}
              >
                <Text className="text-center font-ku-semibold text-ku-body-small text-ku-on-worker">
                  {messages.acceptEdit}
                </Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={messages.declineEdit}
                disabled={editSending}
                className="flex-1 rounded-xl border border-ku-border bg-ku-surface px-ku-12 py-ku-12 disabled:opacity-50"
                onPress={() => void onRespondToEdit("EDIT_RESPONSE_DECLINED")}
              >
                <Text className="text-center font-ku-semibold text-ku-body-small text-ku-text-strong">
                  {messages.declineEdit}
                </Text>
              </Pressable>
            </View>
          ) : (
            <Text className="mt-ku-12 text-ku-body-small text-ku-text-subtle">
              {messages.actionUnavailable}
            </Text>
          )}
        </StateCard>
      ) : null}
      {editFeedback ? (
        <Text className="mt-ku-sm text-ku-body-small text-ku-success">
          {editFeedback}
        </Text>
      ) : null}

      {snapshot.capabilities.canConfirmCompletion ? (
        <View className="mt-ku-20 rounded-2xl border border-ku-border bg-ku-card p-ku-md">
          <View className="flex-row items-center gap-ku-sm">
            <CheckCircle2 color={colors.workerDeep} size={20} />
            <Text className="font-ku-bold text-ku-text-strong">
              {messages.confirmationCta}
            </Text>
          </View>
          <Text className="mt-ku-sm text-ku-body-small text-ku-text-secondary">
            {messages.confirmationPlaceholder}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={messages.confirmationCta}
            disabled={confirmationSending}
            className="mt-ku-12 rounded-xl bg-ku-worker px-ku-12 py-ku-12 disabled:opacity-50"
            onPress={() => void onConfirmCompletion()}
          >
            {confirmationSending ? (
              <ActivityIndicator color={colors.onWorker} />
            ) : (
              <Text className="text-center font-ku-semibold text-ku-body-small text-ku-on-worker">
                {messages.confirmationCta}
              </Text>
            )}
          </Pressable>
        </View>
      ) : null}

      <View className="mt-ku-20">
        {canOpenChat ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={messages.workChat}
            className="flex-row items-center justify-center gap-ku-sm rounded-xl bg-ku-worker px-ku-md py-ku-12"
            onPress={onOpenChat}
          >
            <MessageCircle color={colors.onWorker} size={18} />
            <Text className="font-ku-semibold text-ku-on-worker">
              {messages.workChat}
            </Text>
          </Pressable>
        ) : (
          <Text className="text-center text-ku-body-small text-ku-text-subtle">
            {messages.noChat}
          </Text>
        )}
      </View>
    </>
  );
}
