import { ScrollView, View } from "@/tw";
import {
  LoadingSkeleton,
  SkeletonBlock,
} from "@/components/ui/LoadingSkeleton";
import { cn } from "@/tw/cn";
import { spacing } from "@/theme/spacing";
import styles from "../createQuestStyles";
import type { Step } from "../createQuestTypes";

export function CreateQuestSkeleton({
  step,
  loadingLabel,
  horizontalPadding,
  contentMaxWidth,
  stackedActions,
}: {
  step: Step;
  loadingLabel: string;
  horizontalPadding: number;
  contentMaxWidth: number | "100%";
  stackedActions: boolean;
}) {
  const field = (key: string, height = 48) => (
    <View key={key} style={{ gap: 4 }}>
      <SkeletonBlock height={14} width="42%" borderRadius={4} />
      <SkeletonBlock height={height} borderRadius={10} />
    </View>
  );
  const body =
    step === 1 ? (
      <View className={styles.sectionCard} style={{ gap: spacing.md }}>
        <View
          style={{
            alignItems: "center",
            flexDirection: "row",
            gap: spacing.sm,
          }}
        >
          <SkeletonBlock height={36} width={36} borderRadius={10} />
          <View style={{ flex: 1, gap: spacing.xs }}>
            <SkeletonBlock height={22} width="48%" borderRadius={5} />
            <SkeletonBlock height={15} width="72%" borderRadius={4} />
          </View>
        </View>
        {["title", "tag"].map((key) => field(key))}
        {field("description", 112)}
        {field("conditions", 112)}
        <SkeletonBlock height={48} borderRadius={12} />
      </View>
    ) : step === 2 ? (
      <>
        <View className={styles.sectionCard} style={{ gap: spacing.md }}>
          <View
            style={{
              alignItems: "center",
              flexDirection: "row",
              gap: spacing.sm,
            }}
          >
            <SkeletonBlock height={36} width={36} borderRadius={10} />
            <View style={{ flex: 1, gap: spacing.xs }}>
              <SkeletonBlock height={22} width="58%" borderRadius={5} />
              <SkeletonBlock height={15} width="82%" borderRadius={4} />
            </View>
          </View>
          <View style={{ flexDirection: "row", gap: spacing.sm }}>
            <SkeletonBlock height={104} borderRadius={14} style={{ flex: 1 }} />
            <SkeletonBlock height={104} borderRadius={14} style={{ flex: 1 }} />
          </View>
          <SkeletonBlock
            height={1}
            borderRadius={0}
            style={{ marginVertical: spacing.sm }}
          />
          <View
            style={{
              alignItems: "center",
              flexDirection: "row",
              gap: spacing.sm,
            }}
          >
            <SkeletonBlock height={36} width={36} borderRadius={10} />
            <View style={{ flex: 1, gap: spacing.xs }}>
              <SkeletonBlock height={22} width="64%" borderRadius={5} />
              <SkeletonBlock height={15} width="76%" borderRadius={4} />
            </View>
          </View>
          <SkeletonBlock height={88} borderRadius={14} />
          <SkeletonBlock height={68} borderRadius={14} />
          {field("headcount")}
          {field("reward")}
        </View>
        <View className={styles.sectionCard} style={{ gap: spacing.md }}>
          <View
            style={{
              alignItems: "center",
              flexDirection: "row",
              gap: spacing.sm,
            }}
          >
            <SkeletonBlock height={36} width={36} borderRadius={10} />
            <View style={{ flex: 1, gap: spacing.xs }}>
              <SkeletonBlock height={22} width="42%" borderRadius={5} />
              <SkeletonBlock height={15} width="72%" borderRadius={4} />
            </View>
            <SkeletonBlock height={22} width={22} borderRadius={11} />
          </View>
          <SkeletonBlock height={48} borderRadius={12} />
          <SkeletonBlock height={48} borderRadius={12} />
          <SkeletonBlock height={64} borderRadius={12} />
          <SkeletonBlock variant="image" height={128} borderRadius={12} />
        </View>
      </>
    ) : (
      <>
        <View className={styles.setupCard} style={{ gap: spacing.md }}>
          <SkeletonBlock height={22} width="46%" borderRadius={5} />
          <View style={{ flexDirection: "row", gap: spacing.sm }}>
            <SkeletonBlock height={58} borderRadius={8} style={{ flex: 1 }} />
            <SkeletonBlock height={58} borderRadius={8} style={{ flex: 1 }} />
            <SkeletonBlock height={58} borderRadius={8} style={{ flex: 1 }} />
          </View>
          <SkeletonBlock height={16} width="84%" borderRadius={4} />
        </View>
        <View className={styles.sectionCard} style={{ gap: spacing.md }}>
          <View
            style={{
              alignItems: "center",
              flexDirection: "row",
              gap: spacing.sm,
            }}
          >
            <SkeletonBlock height={36} width={36} borderRadius={10} />
            <View style={{ flex: 1, gap: spacing.xs }}>
              <SkeletonBlock height={22} width="36%" borderRadius={5} />
              <SkeletonBlock height={15} width="74%" borderRadius={4} />
            </View>
          </View>
          <View style={{ gap: spacing.sm }}>
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <View
                key={item}
                style={{ flexDirection: "row", gap: spacing.sm }}
              >
                <SkeletonBlock height={15} width="28%" borderRadius={4} />
                <SkeletonBlock height={15} width="56%" borderRadius={4} />
              </View>
            ))}
          </View>
          <SkeletonBlock height={142} borderRadius={14} />
        </View>
      </>
    );

  return (
    <LoadingSkeleton
      loadingLabel={loadingLabel}
      style={{ flex: 1 }}
      contentStyle={{ flex: 1 }}
      testID="create-quest-loading-skeleton"
    >
      <View style={{ flex: 1 }}>
        <ScrollView
          className="flex-1"
          contentContainerStyle={{
            paddingBottom: spacing.xl,
            paddingHorizontal: horizontalPadding,
            paddingTop: spacing.lg,
          }}
          showsVerticalScrollIndicator={false}
        >
          <View
            style={{
              alignSelf: "center",
              gap: spacing.sm,
              width: contentMaxWidth,
            }}
          >
            {body}
          </View>
        </ScrollView>
        <View
          className={cn(
            styles.loadingActionBar,
            stackedActions && styles.actionBarStacked
          )}
          style={{ flexDirection: stackedActions ? "column" : "row" }}
        >
          <SkeletonBlock
            height={56}
            borderRadius={14}
            style={{ flex: 1, width: stackedActions ? "100%" : undefined }}
            testID="create-quest-loading-action"
          />
          {step === 3 ? (
            <SkeletonBlock
              height={56}
              borderRadius={14}
              style={{ flex: 1, width: stackedActions ? "100%" : undefined }}
            />
          ) : null}
        </View>
      </View>
    </LoadingSkeleton>
  );
}
