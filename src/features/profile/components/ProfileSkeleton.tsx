import { ScrollView, View } from "@/tw";
import { cn } from "@/tw/cn";
import { getProfileLayoutMetrics } from "../../../theme/profileLayout";
import { spacing } from "../../../theme/spacing";
import {
  LoadingSkeleton,
  SkeletonBlock,
} from "../../../components/ui/LoadingSkeleton";
import styles from "../styles/profileComponentStyles";
import pageStyles from "../styles/profileStyles";

export function ProfileSkeleton({
  activeTab = "about",
  loadingLabel,
  width,
  fontScale,
  profileTopBarHeight = 0,
  bottomPadding = 24,
}: {
  activeTab?: string;
  loadingLabel: string;
  width: number;
  fontScale: number;
  profileTopBarHeight?: number;
  bottomPadding?: number;
}) {
  const metrics = getProfileLayoutMetrics(width, fontScale);
  const section = (key: string, lines = 3) => (
    <View
      key={key}
      className={styles.section}
      style={{ gap: spacing.sm, padding: metrics.cardPadding }}
    >
      <SkeletonBlock height={24} width="42%" borderRadius={5} />
      <SkeletonBlock
        height={1}
        borderRadius={0}
        style={{ marginVertical: spacing.xs }}
      />
      {Array.from({ length: lines }, (_, index) => (
        <SkeletonBlock
          key={index}
          height={16}
          width={index === lines - 1 ? "62%" : index === 1 ? "88%" : "96%"}
          borderRadius={4}
        />
      ))}
    </View>
  );

  return (
    <LoadingSkeleton
      loadingLabel={loadingLabel}
      style={{ flex: 1 }}
      contentStyle={{ flex: 1 }}
      testID="profile-loading-skeleton"
    >
      <ScrollView
        contentContainerClassName={cn(
          pageStyles.content,
          width >= 600 && pageStyles.tabletContent
        )}
        contentContainerStyle={{
          gap: metrics.sectionGap,
          paddingBottom: bottomPadding,
          paddingLeft: metrics.pagePadding,
          paddingRight: metrics.pagePadding,
          paddingTop: profileTopBarHeight + metrics.sectionGap,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View
          className={styles.heroCard}
          style={{ padding: metrics.cardPadding }}
        >
          <SkeletonBlock
            variant="image"
            height={metrics.photoSize}
            width={metrics.photoSize}
            borderRadius={metrics.photoSize / 2}
            testID="profile-skeleton-avatar"
          />
          <View
            style={{ alignItems: "center", gap: spacing.sm, width: "100%" }}
          >
            <SkeletonBlock height={28} width="64%" borderRadius={5} />
            <SkeletonBlock height={16} width="82%" borderRadius={4} />
          </View>
          <View style={{ flexDirection: "row", gap: spacing.sm }}>
            <SkeletonBlock height={28} width={82} borderRadius={15} />
            <SkeletonBlock height={28} width={96} borderRadius={15} />
            <SkeletonBlock height={28} width={72} borderRadius={15} />
          </View>
          <SkeletonBlock height={48} borderRadius={24} />
        </View>
        <View className={styles.statsCard}>
          <View style={{ flexDirection: "row", gap: spacing.sm }}>
            <SkeletonBlock height={42} borderRadius={6} style={{ flex: 1 }} />
            <SkeletonBlock height={42} borderRadius={6} style={{ flex: 1 }} />
            <SkeletonBlock height={42} borderRadius={6} style={{ flex: 1 }} />
          </View>
        </View>
        <View className={cn(styles.tabList, "overflow-hidden")}>
          {[1, 2, 3, 4, 5].map((item) => (
            <SkeletonBlock
              key={item}
              height={48}
              width={96}
              borderRadius={24}
              testID={`profile-skeleton-tab-${item}`}
            />
          ))}
        </View>
        {activeTab === "about" ? (
          section("about", 5)
        ) : activeTab === "experience" ? (
          section("experience", 4)
        ) : activeTab === "works" ? (
          section("works", 3)
        ) : activeTab === "certificates" ? (
          section("certificates", 3)
        ) : (
          <>
            {section("reviews-summary", 4)}
            {[1, 2, 3].map((item) => (
              <View
                key={item}
                className={styles.reviewCard}
                style={{ gap: spacing.sm }}
              >
                <View
                  style={{
                    alignItems: "center",
                    flexDirection: "row",
                    gap: spacing.sm,
                  }}
                >
                  <SkeletonBlock
                    variant="image"
                    height={36}
                    width={36}
                    borderRadius={18}
                  />
                  <SkeletonBlock height={18} width="38%" borderRadius={4} />
                </View>
                <SkeletonBlock height={14} width="32%" borderRadius={4} />
                <SkeletonBlock height={16} width="92%" borderRadius={4} />
                <SkeletonBlock height={16} width="68%" borderRadius={4} />
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </LoadingSkeleton>
  );
}
