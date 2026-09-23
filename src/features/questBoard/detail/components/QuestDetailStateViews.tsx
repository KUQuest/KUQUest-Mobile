import { Pressable, ScrollView, Text, View } from "@/tw";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  LoadingSkeleton,
  SkeletonBlock,
} from "@/components/ui/LoadingSkeleton";
import { getActionBarPaddingBottom } from "@/theme/layout";
import { spacing } from "@/theme/spacing";
import styles from "../../styles/questDetailStyles";

export function NotFoundState({
  title,
  description,
  actionLabel,
  onAction,
  error = false,
}: {
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
  error?: boolean;
}) {
  return (
    <View
      accessibilityRole="alert"
      className={error ? styles.errorState : styles.section}
      testID={error ? "quest-detail-error-state" : "quest-detail-not-found"}
    >
      <Text className={error ? styles.errorTitle : styles.sectionTitle}>
        {title}
      </Text>
      <Text className={error ? styles.errorDescription : styles.body}>
        {description}
      </Text>
      <Pressable
        accessibilityRole="button"
        onPress={onAction}
        className={error ? styles.errorAction : styles.primaryAction}
      >
        <Text
          className={error ? styles.errorActionText : styles.primaryActionText}
        >
          {actionLabel}
        </Text>
      </Pressable>
    </View>
  );
}

export function QuestDetailSkeleton({
  loadingLabel,
}: {
  loadingLabel: string;
}) {
  const insets = useSafeAreaInsets();
  return (
    <LoadingSkeleton
      loadingLabel={loadingLabel}
      style={{ flex: 1 }}
      contentStyle={{ flex: 1 }}
      testID="quest-detail-loading-skeleton"
    >
      <View style={{ flex: 1 }}>
        <ScrollView
          contentContainerClassName={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View className={styles.header} style={{ gap: spacing.xs }}>
            <SkeletonBlock height={34} width="86%" borderRadius={6} />
            <View
              style={{
                flexDirection: "row",
                gap: spacing.xs,
                marginTop: spacing.xs,
              }}
            >
              <SkeletonBlock height={24} width={64} borderRadius={12} />
              <SkeletonBlock height={24} width={82} borderRadius={12} />
            </View>
            <View
              style={{
                alignItems: "center",
                flexDirection: "row",
                gap: spacing.sm,
                marginTop: spacing.sm,
              }}
            >
              <SkeletonBlock
                variant="image"
                height={32}
                width={32}
                borderRadius={16}
              />
              <View style={{ flex: 1, gap: spacing.xs }}>
                <SkeletonBlock height={14} width="24%" borderRadius={4} />
                <SkeletonBlock height={17} width="58%" borderRadius={4} />
              </View>
            </View>
          </View>
          <View style={{ gap: spacing.sm, marginTop: spacing.md }}>
            <SkeletonBlock
              variant="image"
              height={196}
              borderRadius={16}
              testID="quest-detail-skeleton-featured-image"
            />
            <View style={{ flexDirection: "row", gap: spacing.sm }}>
              <SkeletonBlock
                variant="image"
                height={76}
                borderRadius={16}
                style={{ flex: 1 }}
              />
              <SkeletonBlock
                variant="image"
                height={76}
                borderRadius={16}
                style={{ flex: 1 }}
              />
            </View>
          </View>
          <View className={styles.heroCard} style={{ gap: spacing.md }}>
            <View
              style={{ flexDirection: "row", justifyContent: "space-between" }}
            >
              <View style={{ gap: spacing.xs }}>
                <SkeletonBlock height={14} width={54} borderRadius={4} />
                <SkeletonBlock height={28} width={126} borderRadius={5} />
              </View>
              <SkeletonBlock height={52} width={78} borderRadius={12} />
            </View>
            <View style={{ flexDirection: "row", gap: spacing.sm }}>
              <SkeletonBlock height={58} borderRadius={8} style={{ flex: 1 }} />
              <SkeletonBlock height={58} borderRadius={8} style={{ flex: 1 }} />
            </View>
            <View style={{ flexDirection: "row", gap: spacing.sm }}>
              <SkeletonBlock height={20} width={20} borderRadius={10} />
              <View style={{ flex: 1, gap: spacing.xs }}>
                <SkeletonBlock height={14} width="24%" borderRadius={4} />
                <SkeletonBlock height={18} width="74%" borderRadius={4} />
                <SkeletonBlock height={14} width="38%" borderRadius={4} />
              </View>
            </View>
          </View>
          <View className={styles.scheduleCard} style={{ gap: spacing.md }}>
            <View
              style={{
                alignItems: "center",
                flexDirection: "row",
                gap: spacing.sm,
              }}
            >
              <SkeletonBlock height={36} width={36} borderRadius={18} />
              <View style={{ flex: 1, gap: spacing.xs }}>
                <SkeletonBlock height={20} width="34%" borderRadius={5} />
                <SkeletonBlock height={14} width="58%" borderRadius={4} />
              </View>
            </View>
            <View style={{ flexDirection: "row", gap: spacing.md }}>
              <SkeletonBlock height={132} width={12} borderRadius={6} />
              <View style={{ flex: 1, gap: spacing.sm }}>
                <SkeletonBlock height={18} width="46%" borderRadius={4} />
                <SkeletonBlock height={22} width="64%" borderRadius={5} />
                <SkeletonBlock height={15} width="54%" borderRadius={4} />
                <SkeletonBlock height={18} width="42%" borderRadius={4} />
                <SkeletonBlock height={22} width="58%" borderRadius={5} />
              </View>
            </View>
          </View>
          {[1, 2].map((section) => (
            <View
              key={section}
              style={{ gap: spacing.sm, marginTop: spacing.lg }}
            >
              <SkeletonBlock
                height={22}
                width={section === 1 ? 126 : 112}
                borderRadius={5}
              />
              <View
                className={styles.descriptionCard}
                style={{ gap: spacing.sm }}
              >
                <SkeletonBlock height={16} width="94%" borderRadius={4} />
                <SkeletonBlock height={16} width="78%" borderRadius={4} />
                <SkeletonBlock height={16} width="58%" borderRadius={4} />
              </View>
            </View>
          ))}
        </ScrollView>
        <View
          className={styles.actionBar}
          style={{ paddingBottom: getActionBarPaddingBottom(insets.bottom) }}
          testID="quest-detail-loading-action-bar"
        >
          <SkeletonBlock height={52} borderRadius={26} />
        </View>
      </View>
    </LoadingSkeleton>
  );
}
