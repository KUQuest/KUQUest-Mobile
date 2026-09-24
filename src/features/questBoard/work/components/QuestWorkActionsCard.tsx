import React from "react";
import {
  AlertTriangle,
  CheckCircle2,
  FileEdit,
  ListChecks,
  MessageCircle,
  ShieldCheck,
} from "lucide-react-native";

import { ActivityIndicator, Pressable, Text, View } from "@/tw";
import { cn } from "@/tw/cn";
import { colors } from "@/theme/colors";
import { useAppTheme } from "@/features/workspace/AppThemeProvider";
import { useLocale } from "@/features/preferences/localeStore";
import { type QuestWorkMessages } from "@/locales/questWorkMessages";
import type { LiveQuestSnapshot } from "../../live/liveQuestService";
import { QuestMode, QuestParticipation } from "../../domain/types";

export interface QuestWorkActionsCardProps {
  snapshot: LiveQuestSnapshot;
  messages: QuestWorkMessages;
  stale: boolean;
  errorText?: string;
  conditions: LiveQuestSnapshot["quest"]["condition"]["items"];
  editSending: boolean;
  editFeedback?: string;
  confirmationSending: boolean;
  /** Required starter, Start Work not recorded, and startTime reached. */
  canPressStartWork: boolean;
  /** Formatted startTime while the viewer must still wait to press Start Work. */
  startWorkOpensAt?: string;
  /** Formatted startedAt once the viewer's Start Work is recorded. */
  startWorkRecordedAt?: string;
  startWorkSending: boolean;
  onStartWork: () => void | Promise<void>;
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
  canPressStartWork,
  startWorkOpensAt,
  startWorkRecordedAt,
  startWorkSending,
  onStartWork,
  canOpenChat,
  onRespondToEdit,
  onConfirmCompletion,
  onFileDispute,
  onOpenChat,
  isTerminal,
}: QuestWorkActionsCardProps) {
  const { colors: palette } = useAppTheme();
  const { locale } = useLocale();
  const unreadCount = snapshot.workConversation?.unreadCount ?? 0;
  const isGroup = snapshot.participation === QuestParticipation.GROUP;
  const assignedDetails = startWorkRecordedAt
    ? [
        `${messages.startWorkRecordedAt} ${startWorkRecordedAt}`,
        isGroup && snapshot.mode === QuestMode.FIRST_COME_FIRST_SERVED
          ? messages.waitingForOtherWorkers
          : messages.waitingForQuestStart,
      ]
    : canPressStartWork
      ? [messages.startWorkDescription]
      : startWorkOpensAt
        ? [`${messages.startWorkOpensAt} ${startWorkOpensAt}`]
        : isGroup && snapshot.mode === QuestMode.CANDIDATE
          ? [messages.waitingForTeamLeader]
          : [];

  return (
    <>
      {/* Stale Cache Notice */}
      {stale ? (
        <View className="mt-ku-14 rounded-2xl border border-ku-border-warning bg-ku-surface-warning px-ku-16 py-ku-12">
          <Text className="font-ku-medium text-ku-body-small text-ku-warning-dark">
            {messages.stale}
          </Text>
          {errorText ? (
            <Text className="mt-ku-xs text-ku-label text-ku-warning-dark">
              {errorText}
            </Text>
          ) : null}
        </View>
      ) : null}

      {/* Start Work Callout */}
      {snapshot.state === "QUEST_ASSIGNED" ? (
        <View className="mt-ku-16 rounded-2xl border border-ku-terracotta/30 bg-ku-surface-terracotta/60 p-ku-16 shadow-sm">
          <View className="flex-row items-start gap-ku-12">
            <View className="mt-0.5 h-9 w-9 items-center justify-center rounded-full bg-ku-surface-terracotta">
              <ShieldCheck
                color={palette.terracotta ?? colors.terracotta}
                size={20}
              />
            </View>
            <View className="flex-1">
              <Text className="font-ku-bold text-ku-body text-ku-text-strong">
                {canPressStartWork
                  ? messages.startWorkCta
                  : messages.waitingForStart}
              </Text>
              {assignedDetails.map((detail) => (
                <Text
                  key={detail}
                  className="mt-ku-xs text-ku-body-small leading-[20px] text-ku-text-secondary"
                >
                  {detail}
                </Text>
              ))}
            </View>
          </View>
          {canPressStartWork ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={messages.startWorkCta}
              accessibilityState={{
                disabled: startWorkSending,
                busy: startWorkSending,
              }}
              disabled={startWorkSending}
              className="mt-ku-14 h-12 flex-row items-center justify-center rounded-xl bg-ku-primary px-ku-16 active:opacity-90 disabled:opacity-50"
              onPress={() => void onStartWork()}
            >
              {startWorkSending ? (
                <ActivityIndicator color={colors.onPrimary} />
              ) : (
                <Text className="text-center font-ku-semibold text-ku-body-small text-ku-on-primary">
                  {messages.startWorkCta}
                </Text>
              )}
            </Pressable>
          ) : null}
        </View>
      ) : null}

      {/* Terminal / Archived Banner */}
      {isTerminal ? (
        <View className="mt-ku-16 rounded-2xl border border-ku-border/60 bg-ku-surface-muted p-ku-16 dark:bg-ku-surface-raised">
          <Text className="text-ku-body-small leading-[20px] text-ku-text-secondary">
            {messages.archiveDescription}
          </Text>
          {snapshot.state === "QUEST_FAILED" && onFileDispute ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={messages.fileDispute}
              className="mt-ku-14 h-12 flex-row items-center justify-center gap-ku-sm rounded-xl bg-ku-warning px-ku-md"
              onPress={onFileDispute}
            >
              <AlertTriangle color={colors.onPrimary} size={18} />
              <Text className="text-center font-ku-semibold text-ku-body-small text-ku-on-primary">
                {messages.fileDispute}
              </Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      {/* Conditions / Deliverables Checklist */}
      <View className="mt-ku-24">
        <View className="mb-ku-12 flex-row items-center justify-between">
          <View className="flex-row items-center gap-ku-sm">
            <ListChecks color={palette.primary ?? colors.primary} size={18} />
            <Text className="font-ku-bold text-ku-subtitle text-ku-text-strong">
              {messages.conditions}
            </Text>
          </View>
          {conditions.length > 0 ? (
            <View className="rounded-full border border-ku-border/40 bg-ku-surface-raised px-2.5 py-0.5 dark:bg-ku-surface-high">
              <Text className="font-ku-semibold text-[11px] text-ku-text-secondary">
                {conditions.length} {locale === "th" ? "ข้อ" : "items"}
              </Text>
            </View>
          ) : null}
        </View>

        <View className="rounded-2xl border border-ku-border/60 bg-ku-surface p-ku-16 shadow-sm dark:bg-ku-card">
          {conditions.length ? (
            conditions.map((condition, idx) => (
              <View
                key={`${condition.position}-${condition.text}`}
                className={cn(
                  "flex-row items-start gap-ku-10 py-ku-10",
                  idx > 0 && "border-t border-ku-border/30",
                  idx === 0 && "pt-0",
                  idx === conditions.length - 1 && "pb-0"
                )}
              >
                <View className="mt-0.5 h-6 w-6 items-center justify-center rounded-full bg-ku-primary-subtle dark:bg-ku-primary-subtle/30">
                  <CheckCircle2
                    color={palette.primary ?? colors.primary}
                    size={15}
                  />
                </View>
                <Text className="flex-1 font-ku-medium text-ku-body-small leading-[21px] text-ku-text">
                  {condition.text}
                </Text>
              </View>
            ))
          ) : (
            <Text className="py-ku-sm text-ku-body-small text-ku-text-subtle">
              {messages.actionUnavailable}
            </Text>
          )}
        </View>
      </View>

      {/* Pending Condition Edit Request */}
      {snapshot.editRequest?.status === "EDIT_REQUEST_PENDING" ? (
        <View className="mt-ku-20 rounded-2xl border border-ku-border-warning bg-ku-surface-warning p-ku-16">
          <View className="mb-ku-xs flex-row items-center gap-ku-sm">
            <FileEdit color={colors.warning} size={18} />
            <Text className="font-ku-bold text-ku-subtitle text-ku-text-strong">
              {messages.editTitle}
            </Text>
          </View>
          <Text className="text-ku-body-small leading-[20px] text-ku-text-secondary">
            {messages.editDescription}
          </Text>
          <View className="mt-ku-12 rounded-xl border border-ku-border/40 bg-ku-surface p-ku-12 dark:bg-ku-surface-raised">
            {snapshot.editRequest.proposedCondition.items.map((item) => (
              <Text
                key={`${item.position}-${item.text}`}
                className="mb-ku-xs text-ku-body-small text-ku-text-secondary last:mb-0"
              >
                • {item.text}
              </Text>
            ))}
          </View>
          {snapshot.capabilities.canRespondToEdit ? (
            <View className="mt-ku-14 flex-row gap-ku-sm">
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={messages.acceptEdit}
                disabled={editSending}
                className="h-12 flex-1 items-center justify-center rounded-xl bg-ku-primary px-ku-12 active:opacity-90 disabled:opacity-50"
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
                className="h-12 flex-1 items-center justify-center rounded-xl border border-ku-border bg-ku-surface px-ku-12 active:opacity-90 disabled:opacity-50 dark:bg-ku-card"
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
        </View>
      ) : null}

      {editFeedback ? (
        <Text className="mt-ku-sm font-ku-medium text-ku-body-small text-ku-success">
          {editFeedback}
        </Text>
      ) : null}

      {/* Confirmation CTA */}
      {snapshot.capabilities.canConfirmCompletion ? (
        <View className="mt-ku-20 rounded-2xl border border-ku-border/60 bg-ku-surface p-ku-16 shadow-sm dark:bg-ku-card">
          <View className="flex-row items-center gap-ku-sm">
            <CheckCircle2
              color={palette.primaryDeep ?? colors.primaryDeep}
              size={20}
            />
            <Text className="font-ku-bold text-ku-body text-ku-text-strong">
              {messages.confirmationCta}
            </Text>
          </View>
          <Text className="mt-ku-xs text-ku-body-small leading-[20px] text-ku-text-secondary">
            {messages.confirmationPlaceholder}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={messages.confirmationCta}
            disabled={confirmationSending}
            className="mt-ku-14 h-12 flex-row items-center justify-center rounded-xl bg-ku-primary px-ku-16 active:opacity-90 disabled:opacity-50"
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

      {/* Work Chat Card */}
      <View className="mt-ku-24">
        {canOpenChat ? (
          <View className="rounded-2xl border border-ku-border/60 bg-ku-surface p-ku-16 shadow-sm dark:bg-ku-card">
            <View className="mb-ku-12 flex-row items-center justify-between">
              <View className="flex-1 flex-row items-center gap-ku-10">
                <View className="h-10 w-10 items-center justify-center rounded-full bg-ku-surface-terracotta">
                  <MessageCircle
                    color={palette.terracotta ?? colors.terracotta}
                    size={20}
                  />
                </View>
                <View className="flex-1 pr-2">
                  <Text className="font-ku-bold text-ku-body text-ku-text-strong">
                    {locale === "th" ? "แชตประสานงาน" : "Work Conversation"}
                  </Text>
                  <Text className="mt-0.5 text-ku-label text-ku-text-secondary">
                    {unreadCount > 0
                      ? `${unreadCount} ${locale === "th" ? "ข้อความใหม่" : "unread messages"}`
                      : locale === "th"
                        ? "สื่อสารและประสานงานเควสต์นี้กับผู้ว่าจ้าง"
                        : "Coordinate with Hirer on this quest"}
                  </Text>
                </View>
              </View>
              {unreadCount > 0 ? (
                <View className="h-6 min-w-6 items-center justify-center rounded-full bg-ku-danger px-1.5">
                  <Text className="font-ku-bold text-[11px] text-ku-on-primary">
                    {unreadCount}
                  </Text>
                </View>
              ) : null}
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={messages.workChat}
              className="h-12 flex-row items-center justify-center gap-ku-sm rounded-xl bg-ku-primary px-ku-md active:opacity-90"
              onPress={onOpenChat}
            >
              <MessageCircle color={colors.onPrimary} size={18} />
              <Text className="font-ku-semibold text-ku-body text-ku-on-primary">
                {messages.workChat}
              </Text>
            </Pressable>
          </View>
        ) : (
          <Text className="py-ku-12 text-center text-ku-body-small text-ku-text-subtle">
            {messages.noChat}
          </Text>
        )}
      </View>
    </>
  );
}
