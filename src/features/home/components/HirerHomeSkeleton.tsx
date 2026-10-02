import {
  LoadingSkeleton,
  SkeletonBlock,
} from "@/components/ui/LoadingSkeleton";
import { spacing } from "@/theme/spacing";
import { View } from "@/tw";

export function HirerHomeSkeleton({ loadingLabel }: { loadingLabel: string }) {
  return (
    <LoadingSkeleton
      contentStyle={{ gap: spacing.md }}
      loadingLabel={loadingLabel}
      testID="hirer-home-loading-skeleton"
    >
      {[0, 1].map((item) => (
        <View
          className="rounded-ku-card border border-ku-border-subtle bg-ku-surface p-ku-md"
          key={item}
        >
          <SkeletonBlock height={20} width="68%" />
          <SkeletonBlock
            height={14}
            width="42%"
            style={{ marginTop: spacing.md }}
          />
          <SkeletonBlock height={72} style={{ marginTop: spacing.md }} />
        </View>
      ))}
    </LoadingSkeleton>
  );
}
