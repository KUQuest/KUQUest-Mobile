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
import type { LiveQuestSnapshot } from "../liveQuestService";
import { StateCard } from "./QuestWorkStateCard";

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
  onOpenProof: () => void;
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
  onOpenProof,
  onConfirmCompletion,
  onFileDispute,
  onOpenChat,
  isTerminal,
}: QuestWorkActionsCardProps) {
  return (
    <>
      {stale ? (
        <View className="mt-3 rounded-xl border border-ku-border-warning bg-ku-surface-warning px-3 py-2">
          <Text className="text-ku-body-small text-ku-warning-dark">
            {messages.stale}
          </Text>
          {errorText ? (
            <Text className="mt-1 text-ku-label text-ku-warning-dark">
              {errorText}
            </Text>
          ) : null}
        </View>
      ) : null}

      {snapshot.state === "QUEST_ASSIGNED" ? (
        <View className="mt-3 flex-row items-start gap-3 rounded-xl border border-ku-border-accent bg-ku-surface-accent px-3 py-3">
          <ShieldCheck color={colors.primary} size={20} />
          <View className="flex-1">
            <Text className="font-ku-semibold text-ku-text-strong">
              {messages.waitingForStart}
            </Text>
            <Text className="mt-1 text-ku-body-small text-ku-text-secondary">
              {messages.startsAutomatically}
            </Text>
          </View>
        </View>
      ) : null}

      {isTerminal ? (
        <View className="mt-3 rounded-xl border border-ku-border bg-ku-surface-muted px-3 py-3">
          <Text className="text-ku-body-small text-ku-text-secondary">
            {messages.archiveDescription}
          </Text>
          {snapshot.state === "QUEST_FAILED" && onFileDispute ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={messages.fileDispute}
              className="mt-3 flex-row items-center justify-center gap-2 rounded-xl bg-ku-warning px-3 py-2.5"
              onPress={onFileDispute}
            >
              <AlertTriangle color={colors.onPrimary} size={16} />
              <Text className="text-center font-ku-semibold text-ku-body-small text-ku-on-primary">
                {messages.fileDispute}
              </Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      <View className="mt-5">
        <Text className="mb-3 font-ku-bold text-ku-subtitle text-ku-text-strong">
          {messages.conditions}
        </Text>
        <StateCard>
          {conditions.length ? (
            conditions.map((condition) => (
              <View
                key={`${condition.position}-${condition.text}`}
                className="mb-3 flex-row items-start gap-2 last:mb-0"
              >
                <CheckCircle2 color={colors.primary} size={18} />
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
          <Text className="mt-1 text-ku-body-small text-ku-text-secondary">
            {messages.editDescription}
          </Text>
          <View className="mt-3 rounded-xl bg-ku-surface px-3 py-3">
            {snapshot.editRequest.proposedCondition.items.map((item) => (
              <Text
                key={`${item.position}-${item.text}`}
                className="mb-1 text-ku-body-small text-ku-text-secondary"
              >
                • {item.text}
              </Text>
            ))}
          </View>
          {snapshot.capabilities.canRespondToEdit ? (
            <View className="mt-3 flex-row gap-2">
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={messages.acceptEdit}
                disabled={editSending}
                className="flex-1 rounded-xl bg-ku-primary px-3 py-3 disabled:opacity-50"
                onPress={() => void onRespondToEdit("EDIT_RESPONSE_ACCEPTED")}
              >
                <Text className="text-center font-ku-semibold text-ku-body-small text-ku-on-primary">
                  {messages.acceptEdit}
                </Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={messages.declineEdit}
                disabled={editSending}
                className="flex-1 rounded-xl border border-ku-border bg-ku-surface px-3 py-3 disabled:opacity-50"
                onPress={() => void onRespondToEdit("EDIT_RESPONSE_DECLINED")}
              >
                <Text className="text-center font-ku-semibold text-ku-body-small text-ku-text-strong">
                  {messages.declineEdit}
                </Text>
              </Pressable>
            </View>
          ) : (
            <Text className="mt-3 text-ku-body-small text-ku-text-subtle">
              {messages.actionUnavailable}
            </Text>
          )}
        </StateCard>
      ) : null}
      {editFeedback ? (
        <Text className="mt-2 text-ku-body-small text-ku-success">
          {editFeedback}
        </Text>
      ) : null}

      {snapshot.capabilities.canSubmitProof ? (
        <View className="mt-5 rounded-2xl border border-ku-border bg-ku-card p-4">
          <View className="flex-row items-center gap-2">
            <CheckCircle2 color={colors.primaryDeep} size={20} />
            <Text className="font-ku-bold text-ku-text-strong">
              {messages.proofCta}
            </Text>
          </View>
          <Text className="mt-2 text-ku-body-small text-ku-text-secondary">
            {messages.proofPlaceholder}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={messages.proofCta}
            className="mt-3 rounded-xl bg-ku-primary px-3 py-3"
            onPress={onOpenProof}
          >
            <Text className="text-center font-ku-semibold text-ku-body-small text-ku-on-primary">
              {messages.proofCta}
            </Text>
          </Pressable>
        </View>
      ) : null}

      {snapshot.capabilities.canConfirmCompletion ? (
        <View className="mt-5 rounded-2xl border border-ku-border bg-ku-card p-4">
          <View className="flex-row items-center gap-2">
            <CheckCircle2 color={colors.primaryDeep} size={20} />
            <Text className="font-ku-bold text-ku-text-strong">
              {messages.confirmationCta}
            </Text>
          </View>
          <Text className="mt-2 text-ku-body-small text-ku-text-secondary">
            {messages.confirmationPlaceholder}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={messages.confirmationCta}
            disabled={confirmationSending}
            className="mt-3 rounded-xl bg-ku-primary px-3 py-3 disabled:opacity-50"
            onPress={() => void onConfirmCompletion()}
          >
            {confirmationSending ? (
              <ActivityIndicator color={colors.onPrimary} />
            ) : (
              <Text className="text-center font-ku-semibold text-ku-body-small text-ku-on-primary">
                {messages.confirmationCta}
              </Text>
            )}
          </Pressable>
        </View>
      ) : null}

      <View className="mt-5">
        {canOpenChat ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={messages.workChat}
            className="flex-row items-center justify-center gap-2 rounded-xl bg-ku-primary px-4 py-3"
            onPress={onOpenChat}
          >
            <MessageCircle color={colors.onPrimary} size={18} />
            <Text className="font-ku-semibold text-ku-on-primary">
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
