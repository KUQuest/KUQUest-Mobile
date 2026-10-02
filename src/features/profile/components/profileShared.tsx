import React, { useEffect, useState } from "react";
import {
  AccessibilityInfo,
  useWindowDimensions,
  type ImageSourcePropType,
} from "react-native";
import { View } from "@/tw";
import { getProfileLayoutMetrics } from "../../../theme/profileLayout";
import type {
  ProfileAccessibilityLabels,
  ProfileImageSource,
} from "./profileTypes";
import styles from "../styles/profileComponentStyles";

export const defaultAccessibilityLabels: ProfileAccessibilityLabels = {
  profileImageLabel: (name) => `${name} profile image`,
  questCategoriesLabel: "Most frequent Quest categories",
  sectionsLabel: "Profile sections",
  statisticsLabel: "Profile statistics",
  ratingSummaryLabel: "Rating summary",
  ratingDistributionLabel: "Rating distribution",
  reviewRatingLabel: (rating) => `${rating} out of 5 stars`,
  certificatePreviewLabel: (title) => `${title} preview`,
  certificateImageLabel: (title) => `${title} certificate`,
  workImageLabel: (title) => `${title} image`,
  reviewerAvatarLabel: (name) => `${name} avatar`,
  reviewFilterLabel: (rating) => `${rating} stars`,
};

export function useReducedMotionPreference(): boolean {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    let mounted = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (mounted) setReduceMotion(enabled);
    });
    const subscription = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      setReduceMotion
    );
    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  return reduceMotion;
}

export function imageSource(
  uri: string | ImageSourcePropType | ProfileImageSource,
  source?: ImageSourcePropType
): ImageSourcePropType | ProfileImageSource | undefined {
  if (source) return source;
  if (typeof uri === "string") return uri ? { uri } : undefined;
  return uri;
}

export function GridRows<T>({
  items,
  renderItem,
}: {
  items: T[];
  renderItem: (item: T) => React.ReactNode;
}) {
  const { width, fontScale } = useWindowDimensions();
  const columns = getProfileLayoutMetrics(width, fontScale).gridColumns;
  const rows: T[][] = [];
  for (let index = 0; index < items.length; index += columns)
    rows.push(items.slice(index, index + columns));
  return (
    <View className={styles.grid}>
      {rows.map((row, rowIndex) => (
        <View key={rowIndex} className={styles.gridRow}>
          {row.map((item) => renderItem(item))}
          {columns === 2 && row.length === 1 ? (
            <View className={styles.gridSpacer} />
          ) : null}
        </View>
      ))}
    </View>
  );
}
