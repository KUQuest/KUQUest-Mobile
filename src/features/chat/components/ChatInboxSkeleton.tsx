import {
  LoadingSkeleton,
  SkeletonBlock,
} from "@/components/ui/LoadingSkeleton";
import { spacing } from "@/theme/spacing";
import { View } from "@/tw";
import styles from "../chatStyles";

export function ChatInboxSkeleton({ loadingLabel }: { loadingLabel: string }) {
  return (
    <LoadingSkeleton
      loadingLabel={loadingLabel}
      style={{ width: "100%" }}
      contentStyle={{ gap: spacing.sm }}
      testID="chat-inbox-loading-skeleton"
    >
      {[1, 2, 3, 4].map((item) => (
        <View
          key={item}
          className={styles.conversationRow}
          testID={`chat-skeleton-${item}`}
        >
          <SkeletonBlock
            variant="image"
            height={spacing.px48}
            width={spacing.px48}
            borderRadius={spacing.px24}
          />
          <View style={{ flex: 1, gap: spacing.xs, marginLeft: spacing.md }}>
            <SkeletonBlock
              height={spacing.px18}
              width="76%"
              borderRadius={spacing.px4}
            />
            <SkeletonBlock
              height={spacing.px16}
              width="58%"
              borderRadius={spacing.px4}
            />
            <SkeletonBlock
              height={spacing.px14}
              width="88%"
              borderRadius={spacing.px4}
              style={{ marginTop: spacing.xs }}
            />
          </View>
          <View
            style={{
              alignItems: "flex-end",
              gap: spacing.sm,
              marginLeft: spacing.sm,
            }}
          >
            <SkeletonBlock
              height={spacing.px13}
              width={spacing.px34}
              borderRadius={spacing.px4}
            />
            <SkeletonBlock
              height={spacing.px22}
              width={spacing.px22}
              borderRadius={spacing.px11}
            />
          </View>
        </View>
      ))}
    </LoadingSkeleton>
  );
}
