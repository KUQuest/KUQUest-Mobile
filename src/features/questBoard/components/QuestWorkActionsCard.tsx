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
        <View className="mt-3 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2">
          <Text className="text-sm text-amber-900">{messages.stale}</Text>
          {errorText ? (
            <Text className="mt-1 text-xs text-amber-800">{errorText}</Text>
          ) : null}
        </View>
      ) : null}

      {snapshot.state === "QUEST_ASSIGNED" ? (
        <View className="mt-3 flex-row items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 px-3 py-3">
          <ShieldCheck color={colors.primary} size={20} />
          <View className="flex-1">
            <Text className="font-semibold text-blue-950">
              {messages.waitingForStart}
            </Text>
            <Text className="mt-1 text-sm leading-5 text-blue-900">
              {messages.startsAutomatically}
            </Text>
          </View>
        </View>
      ) : null}

      {isTerminal ? (
        <View className="mt-3 rounded-xl border border-slate-200 bg-slate-100 px-3 py-3">
          <Text className="text-sm leading-5 text-slate-700">
            {messages.archiveDescription}
          </Text>
          {snapshot.state === "QUEST_FAILED" && onFileDispute ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={messages.fileDispute}
              className="mt-3 flex-row items-center justify-center gap-2 rounded-xl bg-amber-600 px-3 py-2.5"
              onPress={onFileDispute}
            >
              <AlertTriangle color="white" size={16} />
              <Text className="text-center text-sm font-semibold text-white">
                {messages.fileDispute}
              </Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      <View className="mt-5">
        <Text className="mb-3 text-lg font-bold text-slate-950">
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
                <Text className="flex-1 text-sm leading-5 text-slate-700">
                  {condition.text}
                </Text>
              </View>
            ))
          ) : (
            <Text className="text-sm text-slate-500">
              {messages.actionUnavailable}
            </Text>
          )}
        </StateCard>
      </View>

      {snapshot.editRequest?.status === "EDIT_REQUEST_PENDING" ? (
        <StateCard tone="warning">
          <Text className="text-lg font-bold text-slate-950">
            {messages.editTitle}
          </Text>
          <Text className="mt-1 text-sm leading-5 text-slate-700">
            {messages.editDescription}
          </Text>
          <View className="mt-3 rounded-xl bg-white px-3 py-3">
            {snapshot.editRequest.proposedCondition.items.map((item) => (
              <Text
                key={`${item.position}-${item.text}`}
                className="mb-1 text-sm text-slate-700"
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
                className="flex-1 rounded-xl bg-slate-950 px-3 py-3 disabled:opacity-50"
                onPress={() => void onRespondToEdit("EDIT_RESPONSE_ACCEPTED")}
              >
                <Text className="text-center text-sm font-semibold text-white">
                  {messages.acceptEdit}
                </Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={messages.declineEdit}
                disabled={editSending}
                className="flex-1 rounded-xl border border-slate-300 bg-white px-3 py-3 disabled:opacity-50"
                onPress={() => void onRespondToEdit("EDIT_RESPONSE_DECLINED")}
              >
                <Text className="text-center text-sm font-semibold text-slate-900">
                  {messages.declineEdit}
                </Text>
              </Pressable>
            </View>
          ) : (
            <Text className="mt-3 text-sm text-slate-500">
              {messages.actionUnavailable}
            </Text>
          )}
        </StateCard>
      ) : null}
      {editFeedback ? (
        <Text className="mt-2 text-sm text-emerald-700">{editFeedback}</Text>
      ) : null}

      {snapshot.capabilities.canSubmitProof ? (
        <View className="mt-5 rounded-2xl border border-slate-200 bg-white p-4">
          <View className="flex-row items-center gap-2">
            <CheckCircle2 color={colors.primaryDeep} size={20} />
            <Text className="font-bold text-slate-950">
              {messages.proofCta}
            </Text>
          </View>
          <Text className="mt-2 text-sm leading-5 text-slate-600">
            {messages.proofPlaceholder}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={messages.proofCta}
            className="mt-3 rounded-xl bg-slate-950 px-3 py-3"
            onPress={onOpenProof}
          >
            <Text className="text-center text-sm font-semibold text-white">
              {messages.proofCta}
            </Text>
          </Pressable>
        </View>
      ) : null}

      {snapshot.capabilities.canConfirmCompletion ? (
        <View className="mt-5 rounded-2xl border border-slate-200 bg-white p-4">
          <View className="flex-row items-center gap-2">
            <CheckCircle2 color={colors.primaryDeep} size={20} />
            <Text className="font-bold text-slate-950">
              {messages.confirmationCta}
            </Text>
          </View>
          <Text className="mt-2 text-sm leading-5 text-slate-600">
            {messages.confirmationPlaceholder}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={messages.confirmationCta}
            disabled={confirmationSending}
            className="mt-3 rounded-xl bg-slate-950 px-3 py-3 disabled:opacity-50"
            onPress={() => void onConfirmCompletion()}
          >
            {confirmationSending ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-center text-sm font-semibold text-white">
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
            className="flex-row items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3"
            onPress={onOpenChat}
          >
            <MessageCircle color="white" size={18} />
            <Text className="font-semibold text-white">
              {messages.workChat}
            </Text>
          </Pressable>
        ) : (
          <Text className="text-center text-sm text-slate-500">
            {messages.noChat}
          </Text>
        )}
      </View>
    </>
  );
}
