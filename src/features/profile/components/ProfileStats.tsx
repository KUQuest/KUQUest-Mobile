import { cn } from "@/tw/cn";
import { Text, View } from "@/tw";
import styles from "../styles/profileComponentStyles";
import type { ProfileStatsData } from "./profileTypes";
import { defaultAccessibilityLabels } from "./profileShared";
import { SectionNotice, type SectionNoticeProps } from "./ProfileSection";

export function ProfileStats({
  stats,
  ratingLabel,
  questsLabel,
  reviewsLabel = "Reviews",
  noRatingLabel = "No ratings yet",
  accessibilityLabel = defaultAccessibilityLabels.statisticsLabel,
  errorText,
  retryLabel,
  onRetry,
}: {
  stats: ProfileStatsData;
  ratingLabel: string;
  questsLabel: string;
  reviewsLabel?: string;
  noRatingLabel?: string;
  accessibilityLabel?: string;
} & SectionNoticeProps) {
  const ratingText =
    stats.ratingAverage === null
      ? noRatingLabel
      : stats.ratingAverage.toFixed(1);
  return (
    <View
      testID="profile-stats"
      className={styles.statsCard}
      accessibilityLabel={accessibilityLabel}
    >
      {errorText ? null : (
        <View className={styles.statsTopRow}>
          <View className={styles.statItem}>
            <View className={styles.statValueRow}>
              <Text
                accessibilityLabel={`${ratingLabel}: ${ratingText}`}
                maxFontSizeMultiplier={2}
                className={cn(
                  styles.statValue,
                  stats.ratingAverage === null && styles.statEmptyValue
                )}
              >
                {ratingText}
              </Text>
              {stats.ratingAverage !== null ? (
                <Text accessible={false} className={styles.statStar}>
                  ★
                </Text>
              ) : null}
            </View>
            <Text className={styles.statLabel} maxFontSizeMultiplier={2}>
              {ratingLabel}
            </Text>
          </View>
          <View className={styles.statDivider} />
          <View className={styles.statItem}>
            <Text
              accessibilityLabel={`${questsLabel}: ${stats.totalQuests === null ? "—" : stats.totalQuests}`}
              maxFontSizeMultiplier={2}
              className={styles.statValue}
            >
              {stats.totalQuests === null ? "—" : stats.totalQuests}
            </Text>
            <Text className={styles.statLabel} maxFontSizeMultiplier={2}>
              {questsLabel}
            </Text>
          </View>
          <View className={styles.statDivider} />
          <View className={styles.statItem}>
            <Text
              accessibilityLabel={`${reviewsLabel}: ${stats.ratingCount}`}
              maxFontSizeMultiplier={2}
              className={styles.statValue}
            >
              {stats.ratingCount}
            </Text>
            <Text className={styles.statLabel} maxFontSizeMultiplier={2}>
              {reviewsLabel}
            </Text>
          </View>
        </View>
      )}
      {errorText ? (
        <SectionNotice
          errorText={errorText}
          retryLabel={retryLabel}
          onRetry={onRetry}
        />
      ) : null}
    </View>
  );
}
