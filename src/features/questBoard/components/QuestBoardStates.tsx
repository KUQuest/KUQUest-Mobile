import React from "react";
import { AlertCircle } from "lucide-react-native";
import { cn } from "@/tw/cn";

import { Pressable, View, Text } from "@/tw";
import {
  LoadingSkeleton,
  SkeletonBlock,
} from "@/components/ui/LoadingSkeleton";
import { colors } from "@/theme/colors";
import { spacing } from "@/theme/spacing";
import styles from "../questBoardStyles";

export interface StateViewProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  error?: boolean;
}

export function StateView({
  title,
  description,
  actionLabel,
  onAction,
  error = false,
}: StateViewProps) {
  return (
    <View
      accessibilityRole={error ? "alert" : undefined}
      accessibilityLiveRegion={error ? "assertive" : "polite"}
      className={styles.state}
    >
      <View className={cn(styles.stateIcon, error && styles.alertIcon)}>
        <AlertCircle
          color={error ? colors.dangerDark : colors.textMuted}
          size={34}
          strokeWidth={1.8}
        />
      </View>
      <Text className={styles.stateTitle}>{title}</Text>
      <Text className={styles.stateDescription}>{description}</Text>
      {actionLabel && onAction ? (
        <Pressable
          accessibilityRole="button"
          onPress={onAction}
          className={styles.stateAction}
        >
          <Text className={styles.stateActionText}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export interface QuestBoardSkeletonProps {
  loadingLabel: string;
}

export function QuestBoardSkeleton({ loadingLabel }: QuestBoardSkeletonProps) {
  return (
    <LoadingSkeleton
      loadingLabel={loadingLabel}
      style={{ width: "100%" }}
      contentStyle={{ gap: spacing.sm }}
      testID="quest-board-loading-skeleton"
    >
      {[1, 2, 3].map((item) => (
        <View
          key={item}
          className={styles.skeletonCard}
          testID={`quest-skeleton-${item}`}
        >
          <View
            style={{
              flexDirection: "row",
              gap: spacing.sm,
              justifyContent: "space-between",
            }}
          >
            <View style={{ flex: 1, gap: spacing.sm }}>
              <SkeletonBlock height={20} width="78%" borderRadius={5} />
              <SkeletonBlock height={28} width="38%" borderRadius={16} />
            </View>
            <SkeletonBlock height={58} width={88} borderRadius={14} />
          </View>
          <SkeletonBlock
            height={34}
            width="94%"
            borderRadius={5}
            style={{ marginTop: spacing.md }}
          />
          <SkeletonBlock
            height={1}
            borderRadius={0}
            style={{ marginBottom: spacing.sm, marginTop: spacing.md }}
          />
          {[1, 2, 3, 4].map((row) => (
            <View
              key={row}
              style={{
                alignItems: "center",
                flexDirection: "row",
                gap: spacing.sm,
                marginTop: row === 1 ? 0 : spacing.xs,
                minHeight: 36,
              }}
            >
              <SkeletonBlock height={36} width={36} borderRadius={11} />
              <SkeletonBlock
                height={16}
                width={row === 2 ? "64%" : row === 4 ? "78%" : "52%"}
                borderRadius={4}
                style={{ flex: row === 2 ? 0 : 1 }}
              />
              {row === 2 ? (
                <SkeletonBlock height={30} width={48} borderRadius={12} />
              ) : null}
            </View>
          ))}
          <SkeletonBlock
            height={1}
            borderRadius={0}
            style={{ marginTop: spacing.sm }}
          />
          <View style={{ alignItems: "flex-end", marginTop: spacing.sm }}>
            <SkeletonBlock height={20} width={20} borderRadius={10} />
          </View>
        </View>
      ))}
    </LoadingSkeleton>
  );
}
