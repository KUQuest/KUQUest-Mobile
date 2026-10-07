import React from "react";

import { Check, CircleAlert, UsersRound } from "lucide-react-native";

import { ActivityIndicator, Pressable, Text, View } from "@/tw";
import { useAppTheme } from "@/features/workspace/AppThemeProvider";
import type { ProposalFileItem } from "../types";

import styles from "../groupQuestStyles";

export interface TeamAssembleSubmissionMessages {
  teamSubmissionUnavailable: string;
  submissionContentRequired: string;
  reviewTitle: string;
  reviewDescription: string;
  roster: string;
  rosterCount: (actual: number, required: number) => string;
  partialRosterHint: string;
  attachedFiles: string;
  proposal: string;
  submittingTeam: string;
  confirmSubmit: string;
  cancel: string;
  reviewRoster: string;
}

export interface TeamAssembleSubmissionPanelProps {
  submissionBlocker?: string;
  canonical: boolean;
  submissionReady: boolean;
  isReviewing: boolean;
  acceptedCount: number;
  requiredHeadcount: number;
  files: readonly ProposalFileItem[];
  text: string;
  submitting: boolean;
  messages: TeamAssembleSubmissionMessages;
  onSubmit: () => void;
  onReviewChange: (reviewing: boolean) => void;
}

export function TeamAssembleSubmissionPanel({
  submissionBlocker,
  canonical,
  submissionReady,
  isReviewing,
  acceptedCount,
  requiredHeadcount,
  files,
  text,
  submitting,
  messages,
  onSubmit,
  onReviewChange,
}: TeamAssembleSubmissionPanelProps) {
  const { colors } = useAppTheme();
  const canSubmit =
    submissionReady && (!canonical || Boolean(text.trim()));
  if (submissionBlocker && canonical && submissionReady) {
    return (
      <View
        accessibilityRole="alert"
        className={`${styles.notice} ${styles.noticeDanger}`}
        testID="team-assemble-submission-blocked"
      >
        <View className={`${styles.noticeIcon} ${styles.noticeIconDanger}`}>
          <CircleAlert color={colors.dangerDark} size={18} strokeWidth={2.1} />
        </View>
        <View className={styles.noticeCopy}>
          <Text className={styles.noticeTitle}>
            {messages.teamSubmissionUnavailable}
          </Text>
          <Text className={styles.noticeText}>{submissionBlocker}</Text>
        </View>
      </View>
    );
  }
  if (isReviewing) {
    return (
      <View className={styles.reviewCard} testID="team-assemble-review">
        <View className={styles.reviewHeader}>
          <View className={styles.reviewIcon}>
            <Check color={colors.primary} size={20} strokeWidth={2.5} />
          </View>
          <View className={styles.reviewHeaderCopy}>
            <Text accessibilityRole="header" className={styles.reviewHeading}>
              {messages.reviewTitle}
            </Text>
            <Text className={styles.reviewCopy}>
              {messages.reviewDescription}
            </Text>
          </View>
        </View>
        <View className={styles.reviewRows}>
          <View className={styles.reviewRow}>
            <Text className={styles.reviewLabel}>{messages.roster}</Text>
            <Text className={styles.reviewValue}>
              {messages.rosterCount(acceptedCount, requiredHeadcount)}
            </Text>
          </View>
          <View className={styles.reviewRow}>
            <Text className={styles.reviewLabel}>
              {messages.partialRosterHint}
            </Text>
          </View>
          {files.length > 0 ? (
            <View className={styles.reviewRow}>
              <Text className={styles.reviewLabel}>
                {messages.attachedFiles}
              </Text>
              <Text className={styles.reviewValue}>{files.length}</Text>
            </View>
          ) : null}
          {text.trim() ? (
            <View className={styles.reviewRow}>
              <Text className={styles.reviewLabel}>{messages.proposal}</Text>
              <Text className={styles.reviewValue} numberOfLines={2}>
                {text.trim()}
              </Text>
            </View>
          ) : null}
        </View>
        {canonical && !text.trim() ? (
          <Text
            accessibilityRole="alert"
            className={styles.noticeText}
            testID="team-assemble-content-required"
          >
            {messages.submissionContentRequired}
          </Text>
        ) : null}
        <Pressable
          accessibilityLabel={
            submitting ? messages.submittingTeam : messages.confirmSubmit
          }
          accessibilityState={{ disabled: submitting || !canSubmit }}
          className={`${styles.submitButton} ${submitting || !canSubmit ? styles.submitButtonDisabled : ""}`}
          disabled={submitting || !canSubmit}
          onPress={onSubmit}
          testID="team-assemble-confirm-submit"
        >
          {submitting ? (
            <ActivityIndicator color={colors.onPrimary} size="small" />
          ) : (
            <Check
              color={!canSubmit ? colors.textMuted : colors.onPrimary}
              size={18}
              strokeWidth={2.7}
            />
          )}
          <Text
            className={`${styles.submitButtonText} ${!canSubmit ? styles.submitButtonTextDisabled : ""}`}
          >
            {submitting ? messages.submittingTeam : messages.confirmSubmit}
          </Text>
        </Pressable>
        <Pressable
          accessibilityLabel={messages.cancel}
          accessibilityRole="button"
          className={styles.searchClear}
          onPress={() => onReviewChange(false)}
          testID="team-assemble-review-cancel"
        >
          <Text className={styles.memberInviteText}>{messages.cancel}</Text>
        </Pressable>
      </View>
    );
  }
  return (
    <Pressable
      accessibilityLabel={messages.reviewRoster}
      accessibilityRole="button"
      accessibilityState={{ disabled: !submissionReady }}
      className={`${styles.submitButton} ${!submissionReady ? styles.submitButtonDisabled : ""}`}
      disabled={!submissionReady}
      onPress={() => onReviewChange(true)}
      testID="team-assemble-review-roster"
    >
      <UsersRound
        color={!submissionReady ? colors.textMuted : colors.onPrimary}
        size={18}
        strokeWidth={2.3}
      />
      <Text
        className={`${styles.submitButtonText} ${!submissionReady ? styles.submitButtonTextDisabled : ""}`}
      >
        {messages.reviewRoster}
      </Text>
    </Pressable>
  );
}
