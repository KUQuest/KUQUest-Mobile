import React, { useMemo, useState } from "react";
import { FlatList, Pressable, Text, View } from "@/tw";
import {
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  useWindowDimensions,
} from "react-native";
import { cn } from "@/tw/cn";
import { Star } from "lucide-react-native";
import { Avatar } from "../../../components/ui/Avatar";
import { colors } from "../../../theme/colors";
import { getProfileLayoutMetrics } from "../../../theme/profileLayout";
import type { SupportedLocale } from "@/locales/locale";
import styles from "../styles/profileComponentStyles";
import type {
  ProfileAccessibilityLabels,
  ProfileReview,
  ProfileStatsData,
} from "./profileTypes";
import {
  EmptyState,
  SectionNotice,
  type SectionNoticeProps,
} from "./ProfileSection";
import { defaultAccessibilityLabels } from "./profileShared";

const reviewDateFormatters: Record<SupportedLocale, Intl.DateTimeFormat> = {
  en: new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }),
  th: new Intl.DateTimeFormat("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }),
};

function formatReviewDate(
  value: string,
  locale: SupportedLocale = "en"
): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return reviewDateFormatters[locale].format(date);
}

function ReviewCard({
  review,
  locale,
  reviewerAvatarLabel,
  reviewRatingLabel,
}: {
  review: ProfileReview;
  locale?: SupportedLocale;
  reviewerAvatarLabel: (name: string) => string;
  reviewRatingLabel: (rating: number) => string;
}) {
  return (
    <View className={styles.reviewCard}>
      <View className={styles.reviewHeader}>
        <Avatar
          accessibilityLabel={reviewerAvatarLabel(review.reviewerName)}
          className={styles.reviewAvatarFallback}
          imageClassName={styles.reviewAvatar}
          name={review.reviewerName}
          size={36}
          textClassName={styles.reviewAvatarInitials}
          uri={review.reviewerAvatar}
        />
        <View className={styles.reviewHeaderText}>
          <Text className={styles.itemTitle}>{review.reviewerName}</Text>
          <Text className={styles.itemMeta}>
            {formatReviewDate(review.createdAt, locale)}
          </Text>
        </View>
      </View>
      <View
        accessibilityLabel={reviewRatingLabel(review.rating)}
        className={styles.reviewRating}
      >
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            accessible={false}
            key={star}
            color={
              star <= review.rating ? colors.primaryDark : colors.borderSubtle
            }
            fill={star <= review.rating ? colors.primaryDark : "transparent"}
            size={14}
            strokeWidth={1.8}
          />
        ))}
      </View>
      <Text className={styles.itemDescription}>{review.comment}</Text>
      {review.questTitle ? (
        <Text className={styles.itemMeta}>{review.questTitle}</Text>
      ) : null}
    </View>
  );
}

export function Reviews({
  reviews,
  stats,
  sectionTitle,
  emptyText,
  noMatchingReviewsText = "No reviews match this rating.",
  showAllLabel = "Show all reviews",
  allLabel,
  eligibleReviewsLabel,
  filteredReviewsLabel,
  reviewCountLabel,
  totalQuestsLabel,
  noRatingLabel = "No ratings yet",
  ratingErrorText,
  ratingRetryLabel,
  onRatingRetry,
  accessibilityLabels,
  locale,
  listHeader,
  bottomPadding = 96,
  initialScrollOffset = 0,
  onScroll,
  errorText,
  retryLabel,
  onRetry,
}: {
  reviews: ProfileReview[];
  stats: ProfileStatsData;
  sectionTitle: string;
  emptyText: string;
  noMatchingReviewsText?: string;
  showAllLabel?: string;
  allLabel: string;
  eligibleReviewsLabel: (count: number) => string;
  filteredReviewsLabel: (count: number, rating: number) => string;
  reviewCountLabel: string;
  totalQuestsLabel?: string;
  noRatingLabel?: string;
  ratingErrorText?: string;
  ratingRetryLabel?: string;
  onRatingRetry?: () => void;
  accessibilityLabels?: Pick<
    ProfileAccessibilityLabels,
    | "ratingSummaryLabel"
    | "ratingDistributionLabel"
    | "reviewerAvatarLabel"
    | "reviewFilterLabel"
    | "reviewRatingLabel"
  >;
  locale?: SupportedLocale;
  listHeader?: React.ReactElement | null;
  bottomPadding?: number;
  initialScrollOffset?: number;
  onScroll?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
} & SectionNoticeProps) {
  const { width, fontScale } = useWindowDimensions();
  const metrics = getProfileLayoutMetrics(width, fontScale);
  const [filter, setFilter] = useState<1 | 2 | 3 | 4 | 5 | null>(null);
  const labels = { ...defaultAccessibilityLabels, ...accessibilityLabels };
  const visibleReviews = useMemo(
    () =>
      filter === null
        ? reviews
        : reviews.filter((review) => review.rating === filter),
    [filter, reviews]
  );
  const maxDistribution = Math.max(
    ...([5, 4, 3, 2, 1] as const).map((rating) => stats.distribution[rating]),
    1
  );
  const distribution = (
    <View
      className={styles.ratingDistribution}
      accessibilityLabel={labels.ratingDistributionLabel}
    >
      {([5, 4, 3, 2, 1] as const).map((rating) => (
        <Pressable
          testID={`review-filter-${rating}`}
          key={rating}
          accessibilityRole="button"
          accessibilityLabel={`${labels.reviewFilterLabel(rating)}: ${stats.distribution[rating]} ${reviewCountLabel}`}
          accessibilityState={{ selected: filter === rating }}
          onPress={() =>
            setFilter((current) => (current === rating ? null : rating))
          }
          className={cn(
            styles.ratingDistributionRow,
            filter === rating && styles.ratingDistributionRowSelected
          )}
        >
          <Text className={styles.ratingDistributionLabel}>{rating}</Text>
          <View className={styles.ratingDistributionTrack}>
            <View
              className={styles.ratingDistributionFill}
              style={{
                width: `${(stats.distribution[rating] / maxDistribution) * 100}%`,
              }}
            />
          </View>
          <Text className={styles.ratingDistributionCount}>
            {stats.distribution[rating]}
          </Text>
        </Pressable>
      ))}
    </View>
  );
  const reviewCountText =
    filter === null
      ? eligibleReviewsLabel(stats.ratingCount)
      : filteredReviewsLabel(visibleReviews.length, filter);
  const reviewSummary = (
    <View
      accessibilityLabel={labels.ratingSummaryLabel}
      className={styles.reviewSummary}
      testID="profile-review-summary"
    >
      <View className={styles.reviewScore}>
        {stats.ratingAverage === null ? (
          <Text className={styles.reviewScoreEmpty}>{noRatingLabel}</Text>
        ) : (
          <Text className={styles.reviewScoreValue}>
            {stats.ratingAverage.toFixed(1)}
          </Text>
        )}
        <View accessible={false} className={styles.reviewScoreStars}>
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              color={
                stats.ratingAverage !== null &&
                star <= Math.round(stats.ratingAverage)
                  ? colors.primaryDark
                  : colors.borderSubtle
              }
              fill={
                stats.ratingAverage !== null &&
                star <= Math.round(stats.ratingAverage)
                  ? colors.primaryDark
                  : "transparent"
              }
              size={16}
              strokeWidth={1.8}
            />
          ))}
        </View>
        <Text accessibilityLiveRegion="polite" className={styles.reviewCount}>
          {reviewCountText}
        </Text>
        {totalQuestsLabel ? (
          <Text
            className={styles.reviewTotalQuests}
          >{`${totalQuestsLabel}: ${stats.totalQuests ?? "—"}`}</Text>
        ) : null}
      </View>
      <View className={styles.reviewDistribution}>{distribution}</View>
    </View>
  );
  const emptyState =
    filter === null ? (
      <Text className={styles.emptyText}>{emptyText}</Text>
    ) : (
      <EmptyState
        message={noMatchingReviewsText}
        actionLabel={showAllLabel}
        onAction={() => setFilter(null)}
      />
    );
  const sectionHeader = (
    <>
      {listHeader}
      <View
        testID={`profile-section-${sectionTitle}`}
        className={styles.section}
        style={{ marginTop: metrics.sectionGap, padding: metrics.cardPadding }}
      >
        <Text
          accessibilityRole="header"
          className={styles.sectionTitle}
          maxFontSizeMultiplier={2}
          style={{
            fontSize: metrics.sectionTitleFontSize,
            lineHeight: Math.round(metrics.sectionTitleFontSize * 1.3),
          }}
        >
          {sectionTitle}
        </Text>
        <View className={styles.rule} />
        {errorText ? (
          <SectionNotice
            errorText={errorText}
            retryLabel={retryLabel}
            onRetry={onRetry}
          />
        ) : (
          <>
            {ratingErrorText ? (
              <SectionNotice
                errorText={ratingErrorText}
                retryLabel={ratingRetryLabel}
                onRetry={onRatingRetry}
              />
            ) : (
              <>
                {reviewSummary}
                {filter !== null ? (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={showAllLabel}
                    onPress={() => setFilter(null)}
                    className={styles.showAllReviews}
                  >
                    <Text className={styles.showAllReviewsText}>
                      {showAllLabel}
                    </Text>
                  </Pressable>
                ) : null}
              </>
            )}
          </>
        )}
      </View>
    </>
  );

  return (
    <FlatList
      testID="profile-reviews-list"
      data={errorText ? [] : visibleReviews}
      keyExtractor={(review) => review.id}
      contentContainerClassName={styles.profileListContent}
      contentContainerStyle={{
        paddingBottom: bottomPadding,
        paddingHorizontal: metrics.pagePadding,
        paddingTop: metrics.sectionGap,
      }}
      contentOffset={{ x: 0, y: initialScrollOffset }}
      onScroll={onScroll}
      scrollEventThrottle={16}
      ListHeaderComponent={sectionHeader}
      ListEmptyComponent={errorText ? null : emptyState}
      renderItem={({ item }) => (
        <ReviewCard
          review={item}
          locale={locale}
          reviewerAvatarLabel={labels.reviewerAvatarLabel}
          reviewRatingLabel={labels.reviewRatingLabel}
        />
      )}
      showsVerticalScrollIndicator={false}
    />
  );
}
