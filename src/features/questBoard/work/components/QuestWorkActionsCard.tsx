import React from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  FileEdit,
  MessageCircle,
  ShieldCheck,
} from "lucide-react-native";

import { ActivityIndicator, Pressable, Text, View } from "@/tw";
import { cn } from "@/tw/cn";
import { useAppTheme } from "@/features/workspace/AppThemeProvider";
import { type QuestWorkMessages } from "@/locales/questWorkMessages";
import type { LiveQuestSnapshot } from "../../live/liveQuestService";
import {
  QuestEditRequestStatus,
  QuestEditResponseDecision,
  QuestMode,
  QuestParticipation,
  QuestStatus,
} from "../../domain/types";

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
    decision: QuestEditResponseDecision
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
  const unreadLabel = messages.unreadMessages(unreadCount);

  return (
    <>
      {stale ? (
        <View className={styles.warningCard}>
          <Text className={styles.warningTitle}>{messages.stale}</Text>
          {errorText ? (
            <Text className={styles.warningText}>{errorText}</Text>
          ) : null}
        </View>
      ) : null}

      {snapshot.state === QuestStatus.QUEST_ASSIGNED ? (
        <View className={styles.startCard}>
          <View className={styles.calloutRow}>
            <View className={styles.calloutIcon}>
              <ShieldCheck color={palette.primaryDark} size={20} />
            </View>
            <View className={styles.calloutCopy}>
              <Text className={styles.calloutTitle}>
                {canPressStartWork
                  ? messages.startWorkCta
                  : messages.waitingForStart}
              </Text>
              {assignedDetails.map((detail) => (
                <Text key={detail} className={styles.bodyText}>
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
              className={styles.primaryButton}
              onPress={() => void onStartWork()}
            >
              {startWorkSending ? (
                <ActivityIndicator color={palette.onPrimary} />
              ) : (
                <Text className={styles.primaryButtonText}>
                  {messages.startWorkCta}
                </Text>
              )}
            </Pressable>
          ) : null}
        </View>
      ) : null}

      {isTerminal ? (
        <View className={styles.mutedCard}>
          <Text className={styles.bodyText}>{messages.archiveDescription}</Text>
          {snapshot.state === QuestStatus.QUEST_FAILED && onFileDispute ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={messages.fileDispute}
              className={styles.warningButton}
              onPress={onFileDispute}
            >
              <AlertTriangle color={palette.warningDark} size={18} />
              <Text className={styles.warningButtonText}>
                {messages.fileDispute}
              </Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      <View className={styles.section}>
        <View className={styles.sectionHeader}>
          <Text accessibilityRole="header" className={styles.sectionTitle}>
            {messages.conditions}
          </Text>
          {conditions.length > 0 ? (
            <Text className={styles.countPill}>
              {messages.conditionCount(conditions.length)}
            </Text>
          ) : null}
        </View>
        <View className={styles.listCard}>
          {conditions.length ? (
            conditions.map((condition, idx) => (
              <View
                key={`${condition.position}-${condition.text}`}
                className={cn(
                  styles.conditionRow,
                  idx > 0 && styles.rowDivider
                )}
              >
                <Text className={styles.conditionIndex}>{idx + 1}</Text>
                <Text className={styles.conditionText}>{condition.text}</Text>
              </View>
            ))
          ) : (
            <Text className={cn(styles.bodyText, styles.listEmpty)}>
              {messages.actionUnavailable}
            </Text>
          )}
        </View>
      </View>

      {snapshot.editRequest?.status ===
      QuestEditRequestStatus.EDIT_REQUEST_PENDING ? (
        <View className={styles.warningCard}>
          <View className={styles.calloutRow}>
            <FileEdit color={palette.warningDark} size={20} />
            <View className={styles.calloutCopy}>
              <Text className={styles.calloutTitle}>{messages.editTitle}</Text>
              <Text className={styles.bodyText}>
                {messages.editDescription}
              </Text>
            </View>
          </View>
          <View className={styles.proposedList}>
            {snapshot.editRequest.proposedCondition.items.map((item) => (
              <Text
                key={`${item.position}-${item.text}`}
                className={styles.bodyText}
              >
                • {item.text}
              </Text>
            ))}
          </View>
          {snapshot.capabilities.canRespondToEdit ? (
            <View className={styles.buttonRow}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={messages.acceptEdit}
                accessibilityState={{ disabled: editSending }}
                disabled={editSending}
                className={cn(styles.primaryButton, styles.buttonFlex)}
                onPress={() =>
                  void onRespondToEdit(
                    QuestEditResponseDecision.EDIT_RESPONSE_ACCEPTED
                  )
                }
              >
                <Text className={styles.primaryButtonText}>
                  {messages.acceptEdit}
                </Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={messages.declineEdit}
                accessibilityState={{ disabled: editSending }}
                disabled={editSending}
                className={cn(styles.secondaryButton, styles.buttonFlex)}
                onPress={() =>
                  void onRespondToEdit(
                    QuestEditResponseDecision.EDIT_RESPONSE_DECLINED
                  )
                }
              >
                <Text className={styles.secondaryButtonText}>
                  {messages.declineEdit}
                </Text>
              </Pressable>
            </View>
          ) : (
            <Text className={styles.bodyText}>
              {messages.actionUnavailable}
            </Text>
          )}
        </View>
      ) : null}

      {editFeedback ? (
        <Text className={styles.successText}>{editFeedback}</Text>
      ) : null}

      {snapshot.capabilities.canConfirmCompletion ? (
        <View className={styles.startCard}>
          <View className={styles.calloutRow}>
            <View className={styles.calloutIcon}>
              <CheckCircle2 color={palette.primaryDark} size={20} />
            </View>
            <View className={styles.calloutCopy}>
              <Text className={styles.calloutTitle}>
                {messages.confirmationCta}
              </Text>
              <Text className={styles.bodyText}>
                {messages.confirmationPlaceholder}
              </Text>
            </View>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={messages.confirmationCta}
            accessibilityState={{
              disabled: confirmationSending,
              busy: confirmationSending,
            }}
            disabled={confirmationSending}
            className={styles.primaryButton}
            onPress={() => void onConfirmCompletion()}
          >
            {confirmationSending ? (
              <ActivityIndicator color={palette.onPrimary} />
            ) : (
              <Text className={styles.primaryButtonText}>
                {messages.confirmationCta}
              </Text>
            )}
          </Pressable>
        </View>
      ) : null}

      {canOpenChat ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            unreadCount > 0
              ? `${messages.workChat}, ${unreadLabel}`
              : messages.workChat
          }
          className={styles.chatRow}
          onPress={onOpenChat}
        >
          <View className={styles.chatIcon}>
            <MessageCircle color={palette.primaryDark} size={20} />
          </View>
          <View className={styles.calloutCopy}>
            <Text className={styles.calloutTitle}>{messages.workChat}</Text>
            <Text className={styles.chatHint} numberOfLines={2}>
              {unreadCount > 0 ? unreadLabel : messages.workChatHint}
            </Text>
          </View>
          {unreadCount > 0 ? (
            <Text className={styles.unreadBadge}>{unreadCount}</Text>
          ) : null}
          <ChevronRight color={palette.textSecondary} size={20} />
        </Pressable>
      ) : (
        <Text className={styles.noChat}>{messages.noChat}</Text>
      )}
    </>
  );
}

const styles = {
  section: "gap-ku-12",
  sectionHeader: "flex-row items-center justify-between gap-ku-sm px-ku-xs",
  sectionTitle: "font-ku-bold text-ku-subtitle text-ku-text-strong",
  countPill:
    "rounded-ku-pill bg-ku-primary-subtle px-ku-sm py-ku-2 font-ku-semibold text-ku-label text-ku-primary-dark",
  listCard:
    "overflow-hidden rounded-ku-card border border-ku-border bg-ku-surface",
  listEmpty: "p-ku-md",
  conditionRow: "flex-row items-start gap-ku-12 px-ku-md py-ku-12",
  rowDivider: "border-t border-ku-divider",
  conditionIndex:
    "h-[24px] w-[24px] rounded-ku-pill bg-ku-primary-subtle text-center font-ku-semibold text-ku-label leading-[24px] text-ku-primary-dark",
  conditionText: "flex-1 font-ku-regular text-ku-body-small text-ku-text",
  startCard:
    "gap-ku-md rounded-ku-card border border-ku-primary-border bg-ku-primary-subtle p-ku-md",
  mutedCard: "gap-ku-md rounded-ku-card bg-ku-surface-raised p-ku-md",
  warningCard:
    "gap-ku-12 rounded-ku-card border border-ku-border-warning bg-ku-surface-warning p-ku-md",
  warningTitle: "font-ku-medium text-ku-body-small text-ku-warning-dark",
  warningText: "font-ku-regular text-ku-label text-ku-warning-dark",
  calloutRow: "flex-row items-start gap-ku-12",
  calloutIcon:
    "h-[40px] w-[40px] items-center justify-center rounded-ku-pill bg-ku-surface",
  calloutCopy: "min-w-0 flex-1 gap-ku-xs",
  calloutTitle: "font-ku-bold text-ku-body text-ku-text-strong",
  bodyText: "font-ku-regular text-ku-body-small text-ku-text-secondary",
  proposedList:
    "gap-ku-xs rounded-ku-field border border-ku-border bg-ku-surface p-ku-12",
  buttonRow: "flex-row gap-ku-sm",
  buttonFlex: "flex-1",
  primaryButton:
    "min-h-[48px] flex-row items-center justify-center rounded-ku-pill bg-ku-primary px-ku-md active:bg-ku-primary-dark disabled:opacity-50",
  primaryButtonText:
    "text-center font-ku-semibold text-ku-body-small text-ku-on-primary",
  secondaryButton:
    "min-h-[48px] items-center justify-center rounded-ku-pill border border-ku-border bg-ku-surface px-ku-md active:bg-ku-surface-raised disabled:opacity-50",
  secondaryButtonText:
    "text-center font-ku-semibold text-ku-body-small text-ku-text-strong",
  warningButton:
    "min-h-[48px] flex-row items-center justify-center gap-ku-sm rounded-ku-pill border border-ku-border-warning bg-ku-surface-warning px-ku-md",
  warningButtonText: "font-ku-semibold text-ku-body-small text-ku-warning-dark",
  successText: "font-ku-medium text-ku-body-small text-ku-success",
  chatRow:
    "min-h-[72px] flex-row items-center gap-ku-12 rounded-ku-card border border-ku-border bg-ku-surface p-ku-md active:bg-ku-surface-raised",
  chatIcon:
    "h-[40px] w-[40px] items-center justify-center rounded-ku-pill bg-ku-primary-subtle",
  chatHint: "font-ku-regular text-ku-label text-ku-text-secondary",
  unreadBadge:
    "min-w-[24px] rounded-ku-pill bg-ku-danger px-ku-6 py-ku-2 text-center font-ku-bold text-ku-caption text-ku-on-primary",
  noChat:
    "py-ku-12 text-center font-ku-regular text-ku-body-small text-ku-text-secondary",
} as const;
