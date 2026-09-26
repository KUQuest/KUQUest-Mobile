import { Check, CircleAlert, CircleCheck, Info } from "lucide-react-native";

import type { QuestPublishCheck } from "../../questBoard/domain/types";
import type {
  CreateQuestPublishBlocker,
  CreateQuestReviewSummaryItem,
} from "../presentation/createQuestPresentation";
import { colors } from "@/theme/colors";
import { formatSatang } from "@/domain/satang";
import type { CreateQuestMessages } from "@/locales/createQuestMessages";
import type { SupportedLocale } from "@/locales/locale";
import { Image, Text, Pressable, View } from "@/tw";
import { cn } from "@/tw/cn";
import styles from "./createQuestStyles";
import { SectionHeading } from "./SectionHeading";

export interface ReviewStepProps {
  messages: CreateQuestMessages;
  locale: SupportedLocale;
  summary: readonly CreateQuestReviewSummaryItem[];
  rewardPerPerson: string;
  publishCheck: QuestPublishCheck;
  blockers: readonly CreateQuestPublishBlocker[];
  isCheckingPublish: boolean;
  onFixBlocker: (field: string) => void;
  onTopUp: () => void;
}

export function ReviewStep({
  messages,
  locale,
  summary,
  rewardPerPerson,
  publishCheck,
  blockers,
  isCheckingPublish,
  onFixBlocker,
  onTopUp,
}: ReviewStepProps) {
  const { escrow } = publishCheck;
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
            {item.imageUris?.length ? (
              <View
                accessible
                accessibilityLabel={item.value}
                className={styles.summaryImages}
              >
                {item.imageUris.map((uri, index) => (
                  <Image
                    key={`${uri}-${index}`}
                    cachePolicy="memory-disk"
                    source={{ uri }}
                    className={styles.summaryImage}
                  />
                ))}
              </View>
            ) : (
              <Text className={styles.summaryValue}>{item.value}</Text>
            )}
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
        <View className={styles.publishCheckHeader}>
          <View
            className={cn(
              styles.publishCheckIcon,
              !publishCheck.canPublish && styles.publishCheckIconBlocked
            )}
          >
            {publishCheck.canPublish ? (
              <CircleCheck color={colors.hirer} size={22} strokeWidth={2.2} />
            ) : (
              <CircleAlert
                color={colors.dangerDark}
                size={22}
                strokeWidth={2.2}
              />
            )}
          </View>
          <View className={styles.publishCheckHeaderCopy}>
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
          </View>
        </View>
        {blockers.length > 0 ? (
          <View
            className={styles.blockerList}
            testID="create-quest-blocking-guidance"
          >
            {blockers.map((blocker) => {
              const actionLabel =
                blocker.code === "INSUFFICIENT_SPENDING_BALANCE"
                  ? messages.topUpAction
                  : blocker.field
                    ? messages.fixBlocker
                    : null;
              return (
                <View key={blocker.code} className={styles.blockerRow}>
                  <CircleAlert
                    color={colors.dangerDark}
                    size={18}
                    strokeWidth={2.2}
                  />
                  <Text className={styles.blockerText}>{blocker.message}</Text>
                  {actionLabel ? (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`${actionLabel}: ${blocker.message}`}
                      className={styles.blockerAction}
                      hitSlop={4}
                      onPress={() =>
                        blocker.field ? onFixBlocker(blocker.field) : onTopUp()
                      }
                      testID={
                        blocker.field
                          ? `create-quest-fix-${blocker.code}`
                          : "create-quest-top-up-button"
                      }
                    >
                      <Text className={styles.blockerActionText}>
                        {actionLabel}
                      </Text>
                    </Pressable>
                  ) : null}
                </View>
              );
            })}
          </View>
        ) : null}
        <View className={styles.fundingPanel}>
          <Text className={styles.fundingLabel}>{messages.escrowTotal}</Text>
          <Text className={styles.fundingTotal}>
            {formatSatang(escrow.totalRequiredSatang, locale)}
          </Text>
          <Text className={styles.fundingFormula}>
            {messages.fundingPerPerson(rewardPerPerson, escrow.headcount)}
          </Text>
          <View className={styles.escrowRows}>
            <View className={styles.escrowRow}>
              <Text className={styles.escrowLabel}>{messages.rewardPool}</Text>
              <Text className={styles.escrowValue}>
                {formatSatang(escrow.rewardPoolSatang, locale)}
              </Text>
            </View>
            <View className={styles.escrowRow}>
              <Text className={styles.escrowLabel}>{messages.platformFee}</Text>
              <Text className={styles.escrowValue}>
                {formatSatang(escrow.platformFeeSatang, locale)}
              </Text>
            </View>
          </View>
        </View>
        <View className={styles.publishCheckNoteRow}>
          <Info color={colors.textMuted} size={16} strokeWidth={2} />
          <Text className={styles.publishCheckNote}>
            {messages.escrowDescription}
          </Text>
        </View>
        {publishCheck.warnings.length > 0 ? (
          <View className={styles.publishCheckNoteRow}>
            <Info color={colors.textMuted} size={16} strokeWidth={2} />
            <Text className={styles.publishCheckNote}>
              {messages.publishCheckWarning}
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}
