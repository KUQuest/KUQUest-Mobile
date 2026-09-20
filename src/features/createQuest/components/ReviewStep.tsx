import { Check } from "lucide-react-native";

import type { QuestPublishCheck } from "../../questBoard/types";
import { formatSatang } from "@/domain/satang";
import type { CreateQuestMessages } from "@/locales/createQuestMessages";
import type { SupportedLocale } from "@/locales/locale";
import { Text, Pressable, View } from "@/tw";
import { cn } from "@/tw/cn";
import styles from "../createQuestStyles";
import { SectionHeading } from "./SectionHeading";

export interface ReviewSummaryItem {
  label: string;
  value: string;
}

export interface ReviewStepProps {
  messages: CreateQuestMessages;
  locale: SupportedLocale;
  summary: readonly ReviewSummaryItem[];
  rewardPerPerson: string;
  publishCheck: QuestPublishCheck;
  missingSatang: number;
  isCheckingPublish: boolean;
  onTopUp: () => void;
}

export function ReviewStep({
  messages,
  locale,
  summary,
  rewardPerPerson,
  publishCheck,
  missingSatang,
  isCheckingPublish,
  onTopUp,
}: ReviewStepProps) {
  return (
    <View className={styles.sectionCard}>
      <SectionHeading
        icon={Check}
        title={messages.review}
        description={messages.questSummaryLabel}
      />
      <View className={styles.summaryCard}>
        {summary.map((item) => (
          <View key={item.label} className={styles.summaryRow}>
            <Text className={styles.summaryLabel}>{item.label}</Text>
            <Text className={styles.summaryValue}>{item.value}</Text>
          </View>
        ))}
      </View>
      <View
        accessibilityRole={publishCheck.canPublish ? undefined : "alert"}
        accessibilityLiveRegion={
          publishCheck.canPublish ? "polite" : "assertive"
        }
        accessibilityState={{ busy: isCheckingPublish }}
        className={cn(
          styles.publishCheckCard,
          !publishCheck.canPublish && styles.publishCheckCardBlocked
        )}
        testID="create-quest-publish-check"
      >
        <Text className={styles.publishCheckTitle}>
          {messages.publishCheckTitle}
        </Text>
        <Text
          className={cn(
            styles.publishCheckStatus,
            !publishCheck.canPublish && styles.publishCheckStatusBlocked
          )}
        >
          {publishCheck.canPublish
            ? messages.publishCheckReady
            : messages.publishCheckBlocked}
        </Text>
        <View className={styles.escrowRows}>
          <View className={styles.escrowRow}>
            <Text className={styles.escrowLabel}>{messages.rewardPool}</Text>
            <Text className={styles.escrowValue}>
              {rewardPerPerson} × {publishCheck.escrow.headcount} ={" "}
              {formatSatang(publishCheck.escrow.rewardPoolSatang, locale)}
            </Text>
          </View>
          <View className={styles.escrowRow}>
            <Text className={styles.escrowLabel}>{messages.platformFee}</Text>
            <Text className={styles.escrowValue}>
              {formatSatang(publishCheck.escrow.platformFeeSatang, locale)}
            </Text>
          </View>
          <View className={styles.escrowRow}>
            <Text className={styles.escrowLabel}>{messages.escrowTotal}</Text>
            <Text className={styles.escrowValue}>
              {formatSatang(publishCheck.escrow.totalRequiredSatang, locale)}
            </Text>
          </View>
        </View>
        <Text className={styles.publishCheckNote}>
          {messages.escrowDescription}
        </Text>
        {publishCheck.warnings.length > 0 ? (
          <Text className={styles.publishCheckNote}>
            {messages.publishCheckWarning}
          </Text>
        ) : null}
        {!publishCheck.canPublish ? (
          <View testID="create-quest-blocking-guidance">
            {publishCheck.blockers.map((blocker) =>
              blocker === "INSUFFICIENT_SPENDING_BALANCE" ? (
                <View key={blocker}>
                  <Text className={styles.publishCheckNote}>
                    {messages.blockingGuidance.INSUFFICIENT_SPENDING_BALANCE(
                      formatSatang(missingSatang, locale)
                    )}
                  </Text>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={messages.topUpAction}
                    className={cn(styles.retryButton, styles.publishCheckNote)}
                    onPress={onTopUp}
                    testID="create-quest-top-up-button"
                  >
                    <Text className={styles.retryButtonText}>
                      {messages.topUpAction}
                    </Text>
                  </Pressable>
                </View>
              ) : (
                <Text className={styles.publishCheckNote} key={blocker}>
                  {(
                    messages.blockingGuidance as unknown as Record<
                      string,
                      string
                    >
                  )[blocker] ?? blocker}
                </Text>
              )
            )}
          </View>
        ) : null}
      </View>
    </View>
  );
}
