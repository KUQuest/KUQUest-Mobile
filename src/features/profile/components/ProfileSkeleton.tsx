import { ScrollView, Text, View } from "@/tw";
import { cn } from "@/tw/cn";
import { getProfileLayoutMetrics } from "../../../theme/profileLayout";
import { colors } from "../../../theme/colors";
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
          style={{ gap: spacing.md, padding: metrics.cardPadding }}
        >
          <View
            style={{
              alignItems: "flex-start",
              flexDirection: "row",
              gap: spacing.md,
            }}
          >
            <SkeletonBlock
              variant="image"
              height={metrics.photoSize}
              width={metrics.photoSize}
              borderRadius={metrics.photoSize / 2}
              testID="profile-skeleton-avatar"
            />
            <View style={{ flex: 1, gap: spacing.sm, paddingTop: spacing.xs }}>
              <SkeletonBlock height={28} width="76%" borderRadius={5} />
              <SkeletonBlock height={16} width="58%" borderRadius={4} />
              <SkeletonBlock height={16} width="72%" borderRadius={4} />
              <SkeletonBlock height={16} width="64%" borderRadius={4} />
            </View>
          </View>
          <View style={{ gap: spacing.sm }}>
            <SkeletonBlock height={14} width="54%" borderRadius={4} />
            <View style={{ flexDirection: "row", gap: spacing.sm }}>
              <SkeletonBlock height={28} width={82} borderRadius={15} />
              <SkeletonBlock height={28} width={96} borderRadius={15} />
              <SkeletonBlock height={28} width={72} borderRadius={15} />
            </View>
          </View>
        </View>
        <View
          className={styles.statsCard}
          style={{
            backgroundColor: colors.surfaceMuted,
            borderColor: colors.borderSubtle,
            gap: spacing.sm,
          }}
        >
          <View style={{ flexDirection: "row", gap: spacing.sm }}>
            <SkeletonBlock height={42} borderRadius={6} style={{ flex: 1 }} />
            <SkeletonBlock height={42} borderRadius={6} style={{ flex: 1 }} />
            <SkeletonBlock height={42} borderRadius={6} style={{ flex: 1 }} />
          </View>
        </View>
        <View
          className={styles.tabList}
          style={{
            backgroundColor: colors.surfaceMuted,
            borderColor: colors.borderSubtle,
            borderRadius: 16,
            flexDirection: "row",
            gap: spacing.xs,
            padding: spacing.xs,
          }}
        >
          {[1, 2, 3, 4, 5].map((item) => (
            <SkeletonBlock
              key={item}
              height={64}
              borderRadius={10}
              style={{ flex: 1 }}
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
