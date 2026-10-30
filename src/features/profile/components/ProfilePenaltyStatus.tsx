import { cn } from "@/tw/cn";
import { Text, View } from "@/tw";
import { formatTimestampDateTime } from "@/domain/datetime";
import { useLocale } from "@/features/preferences/localeStore";
import { profileMessages } from "@/locales/profileMessages";
import type { PenaltyResult } from "@/locales/profileMessages";

import { usePenaltyStatusQuery } from "../api/profileQueries";
import styles from "../styles/profileComponentStyles";

function PenaltyLadder({
  label,
  strikeCount,
  ladderLength,
  nextResult,
}: {
  label: string;
  strikeCount: number;
  ladderLength: number;
  nextResult: PenaltyResult;
}) {
  const { locale } = useLocale();
  const messages = profileMessages[locale];
  const steps = Array.from({ length: ladderLength }, (_, step) => step);
  return (
    <View className={styles.penaltyLadder}>
      <Text className={styles.penaltyLadderLabel}>{label}</Text>
      <View
        className={styles.penaltySteps}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        {steps.map((step) => (
          <View
            key={step}
            testID={step < strikeCount ? "penalty-step-filled" : "penalty-step"}
            className={cn(
              styles.penaltyStep,
              step < strikeCount && styles.penaltyStepFilled
            )}
          />
        ))}
      </View>
      <Text className={styles.penaltyText}>
        {messages.penaltyStrikes(strikeCount, ladderLength)}
      </Text>
      <Text className={styles.penaltyNextResult}>
        {messages.penaltyNextResult(messages.penaltyResults[nextResult])}
      </Text>
    </View>
  );
}

/** The Member's own penalty position. Hidden for a Member with no penalty. */
export function ProfilePenaltyStatus() {
  const { locale } = useLocale();
  const messages = profileMessages[locale];
  const { data } = usePenaltyStatusQuery();
  if (!data) return null;

  const { misconduct, review, redFlagExpiresAt } = data;
  if (
    misconduct.strikeCount === 0 &&
    review.strikeCount === 0 &&
    !redFlagExpiresAt
  ) {
    return null;
  }

  return (
    <View className={styles.penaltyCard} testID="profile-penalty-status">
      <Text accessibilityRole="header" className={styles.penaltyTitle}>
        {messages.penaltyStatusTitle}
      </Text>
      {redFlagExpiresAt && (
        <Text className={styles.penaltyText}>
          {messages.penaltyRedFlagActive(
            formatTimestampDateTime(redFlagExpiresAt, locale)
          )}
        </Text>
      )}
      {misconduct.strikeCount > 0 && (
        <PenaltyLadder
          label={messages.penaltyMisconductLadder}
          {...misconduct}
        />
      )}
      {review.strikeCount > 0 && (
        <PenaltyLadder label={messages.penaltyReviewLadder} {...review} />
      )}
    </View>
  );
}
