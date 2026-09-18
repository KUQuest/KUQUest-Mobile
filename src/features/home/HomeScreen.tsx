import React, { useCallback, useState } from "react";
import { useColorScheme, useWindowDimensions } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Pressable, ScrollView, Text, View } from "@/tw";
import {
  Clock3,
  FileText,
  History,
  LayoutDashboard,
  WalletCards,
} from "lucide-react-native";

import { ScreenLayout } from "@/components/layout/ScreenLayout";
import { useRoleWorkspace } from "@/components/navigation/RoleWorkspaceContext";
import WorkerHomeScreen from "@/features/workerHome/WorkerHomeScreen";
import { isPrototypeDemoEnabled } from "@/features/auth/authEnvironment";
import { useNavigationVisibility } from "@/components/navigation/NavigationVisibilityContext";
import { useLocale } from "@/locales/LocaleProvider";
import { getAppChromeMetrics, getBottomNavigationInset } from "@/theme/layout";
import { getThemeColors } from "@/theme/colors";
import { spacing } from "@/theme/spacing";

import { HirerQuestProgressCard } from "./components/HirerQuestProgressCard";
import { hirerHomeQuestFixture, hirerHomeQuestFixtures } from "./hirerHomeData";
import { hirerHomeMessages } from "./hirerHomeMessages";
import { hirerHomeStyles as styles } from "./hirerHomeStyles";
export default function HomeScreen() {
  const { workspace } = useRoleWorkspace();
  const router = useRouter();
  const { locale } = useLocale();
  const { width, fontScale } = useWindowDimensions();
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const { handleScroll } = useNavigationVisibility();
  const metrics = getAppChromeMetrics(width, fontScale);
  const themeColors = getThemeColors(colorScheme);
  const messages = hirerHomeMessages[locale];
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const quests = hirerHomeQuestFixtures;
  const cardWidth = Math.min(width - 32, 640);
  const isPrototypeDemo = isPrototypeDemoEnabled();
  const handleOpenDetails = useCallback(
    (questId: string) => {
      router.push({
        pathname: "/quest/[id]",
        params: {
          id: questId,
          mode: "post",
          preview: "populated",
          studentId: "demo-hirer",
        },
      });
    },
    [router]
  );

  const handleOpenWorkerProfile = useCallback(
    (workerId: string) => {
      router.push(`/profile/${workerId}`);
    },
    [router]
  );
  if (workspace === "worker") return <WorkerHomeScreen />;
  return (
    <ScreenLayout edges={["top", "left", "right"]} className="bg-ku-background">
      <ScrollView
        contentContainerStyle={{
          paddingBottom:
            getBottomNavigationInset(metrics, insets.bottom) + spacing.xl,
        }}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        testID="hirer-home-scroll"
      >
        <View style={styles.screenContent}>
          <View style={styles.screenHeader}>
            <Text
              accessibilityRole="header"
              style={[styles.screenTitle, { color: themeColors.textStrong }]}
              testID="hirer-home-title"
            >
              {messages.title}
            </Text>
            <Text
              style={[
                styles.screenSubtitle,
                { color: themeColors.textSecondary },
              ]}
            >
              {messages.subtitle}
            </Text>
          </View>

          {isPrototypeDemo ? (
            <>
              <View style={styles.sectionHeaderRow}>
                <Text
                  style={[
                    styles.sectionTitle,
                    { color: themeColors.textStrong },
                  ]}
                >
                  {messages.activeQuestTitle}
                </Text>
                {quests.length > 1 ? (
                  <View
                    style={[
                      styles.sectionCounterBadge,
                      {
                        backgroundColor: themeColors.surfaceAccent,
                        borderColor: themeColors.borderAccent,
                      },
                    ]}
                    testID="hirer-quest-counter"
                  >
                    <Text
                      style={[
                        styles.sectionCounterText,
                        { color: themeColors.primary },
                      ]}
                    >
                      {messages.activeQuestCounter(
                        activeCardIndex + 1,
                        quests.length
                      )}
                    </Text>
                  </View>
                ) : null}
              </View>

              <View style={styles.carouselContainer}>
                <ScrollView
                  contentContainerStyle={{ gap: 12 }}
                  decelerationRate="fast"
                  horizontal
                  onMomentumScrollEnd={(event) => {
                    const offsetX = event.nativeEvent.contentOffset.x;
                    const nextIndex = Math.round(offsetX / (cardWidth + 12));
                    setActiveCardIndex(
                      Math.max(0, Math.min(nextIndex, quests.length - 1))
                    );
                  }}
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                  snapToAlignment="start"
                  snapToInterval={cardWidth + 12}
                  testID="hirer-quest-carousel"
                >
                  {quests.map((item) => (
                    <View key={item.id} style={{ width: cardWidth }}>
                      <HirerQuestProgressCard
                        dueAt={item.dueAt}
                        onOpenDetails={() => handleOpenDetails(item.id)}
                        onOpenWorkerProfile={() =>
                          handleOpenWorkerProfile(item.worker.id)
                        }
                        questId={item.id}
                        status={item.status}
                        tag={item.tag?.[locale]}
                        title={item.title[locale]}
                        worker={{
                          avatarUri: item.worker.avatarUri,
                          displayName: item.worker.displayName[locale],
                          faculty: item.worker.faculty?.[locale],
                          id: item.worker.id,
                        }}
                      />
                    </View>
                  ))}
                </ScrollView>

                {quests.length > 1 ? (
                  <View
                    accessibilityLabel={messages.activeQuestCounter(
                      activeCardIndex + 1,
                      quests.length
                    )}
                    accessibilityRole="progressbar"
                    style={styles.carouselPagination}
                    testID="hirer-quest-carousel-dots"
                  >
                    {quests.map((item, index) => (
                      <View
                        key={item.id}
                        style={[
                          styles.paginationDot,
                          index === activeCardIndex
                            ? [
                                styles.paginationDotActive,
                                { backgroundColor: themeColors.primary },
                              ]
                            : [
                                styles.paginationDotInactive,
                                { backgroundColor: themeColors.borderSubtle },
                              ],
                        ]}
                        testID={`hirer-carousel-dot-${index}`}
                      />
                    ))}
                  </View>
                ) : null}
              </View>
            </>
          ) : (
            <View
              style={[
                styles.emptyState,
                {
                  backgroundColor: themeColors.surfaceMuted,
                  borderColor: themeColors.borderSubtle,
                },
              ]}
              testID="hirer-home-empty"
            >
              <Text
                style={[styles.emptyTitle, { color: themeColors.textStrong }]}
              >
                {messages.emptyTitle}
              </Text>
              <Text
                style={[
                  styles.emptyDescription,
                  { color: themeColors.textSecondary },
                ]}
              >
                {messages.emptyDescription}
              </Text>
            </View>
          )}

          {/* Quick Access Section */}
          <View
            style={styles.quickAccessSection}
            testID="hirer-home-quick-access"
          >
            <Text
              accessibilityRole="header"
              style={[
                styles.quickAccessTitle,
                { color: themeColors.textStrong },
              ]}
            >
              {messages.quickAccessTitle}
            </Text>

            <View style={styles.quickAccessGrid}>
              <Pressable
                accessibilityLabel={`${messages.quickActiveTitle}: ${messages.quickActiveDesc}`}
                accessibilityRole="button"
                onPress={() =>
                  router.push({
                    pathname: "/my-quests",
                    params: { role: "hirer", tab: "active" },
                  })
                }
                style={[
                  styles.quickAccessCard,
                  {
                    backgroundColor: themeColors.surface,
                    borderColor: themeColors.borderSubtle,
                  },
                ]}
                testID="hirer-quick-access-active"
              >
                <View
                  style={[
                    styles.quickAccessIconBox,
                    { backgroundColor: themeColors.surfaceAccent },
                  ]}
                >
                  <Clock3
                    color={themeColors.primary}
                    size={22}
                    strokeWidth={2.2}
                  />
                </View>
                <View style={styles.quickAccessCopy}>
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.quickAccessItemTitle,
                      { color: themeColors.textStrong },
                    ]}
                  >
                    {messages.quickActiveTitle}
                  </Text>
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.quickAccessItemDesc,
                      { color: themeColors.textSecondary },
                    ]}
                  >
                    {messages.quickActiveDesc}
                  </Text>
                </View>
              </Pressable>

              <Pressable
                accessibilityLabel={`${messages.quickDraftTitle}: ${messages.quickDraftDesc}`}
                accessibilityRole="button"
                onPress={() =>
                  router.push({
                    pathname: "/my-quests",
                    params: { role: "hirer", tab: "draft" },
                  })
                }
                style={[
                  styles.quickAccessCard,
                  {
                    backgroundColor: themeColors.surface,
                    borderColor: themeColors.borderSubtle,
                  },
                ]}
                testID="hirer-quick-access-draft"
              >
                <View
                  style={[
                    styles.quickAccessIconBox,
                    { backgroundColor: themeColors.surfaceAccent },
                  ]}
                >
                  <FileText
                    color={themeColors.primary}
                    size={22}
                    strokeWidth={2.2}
                  />
                </View>
                <View style={styles.quickAccessCopy}>
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.quickAccessItemTitle,
                      { color: themeColors.textStrong },
                    ]}
                  >
                    {messages.quickDraftTitle}
                  </Text>
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.quickAccessItemDesc,
                      { color: themeColors.textSecondary },
                    ]}
                  >
                    {messages.quickDraftDesc}
                  </Text>
                </View>
              </Pressable>

              <Pressable
                accessibilityLabel={`${messages.quickHistoryTitle}: ${messages.quickHistoryDesc}`}
                accessibilityRole="button"
                onPress={() =>
                  router.push({
                    pathname: "/my-quests",
                    params: { role: "hirer", tab: "completed" },
                  })
                }
                style={[
                  styles.quickAccessCard,
                  {
                    backgroundColor: themeColors.surface,
                    borderColor: themeColors.borderSubtle,
                  },
                ]}
                testID="hirer-quick-access-history"
              >
                <View
                  style={[
                    styles.quickAccessIconBox,
                    { backgroundColor: themeColors.surfaceAccent },
                  ]}
                >
                  <History
                    color={themeColors.primary}
                    size={22}
                    strokeWidth={2.2}
                  />
                </View>
                <View style={styles.quickAccessCopy}>
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.quickAccessItemTitle,
                      { color: themeColors.textStrong },
                    ]}
                  >
                    {messages.quickHistoryTitle}
                  </Text>
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.quickAccessItemDesc,
                      { color: themeColors.textSecondary },
                    ]}
                  >
                    {messages.quickHistoryDesc}
                  </Text>
                </View>
              </Pressable>

              <Pressable
                accessibilityLabel={`${messages.quickBoardTitle}: ${messages.quickBoardDesc}`}
                accessibilityRole="button"
                onPress={() => router.push("/quest-board")}
                style={[
                  styles.quickAccessCard,
                  {
                    backgroundColor: themeColors.surface,
                    borderColor: themeColors.borderSubtle,
                  },
                ]}
                testID="hirer-quick-access-board"
              >
                <View
                  style={[
                    styles.quickAccessIconBox,
                    { backgroundColor: themeColors.surfaceAccent },
                  ]}
                >
                  <LayoutDashboard
                    color={themeColors.primary}
                    size={22}
                    strokeWidth={2.2}
                  />
                </View>
                <View style={styles.quickAccessCopy}>
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.quickAccessItemTitle,
                      { color: themeColors.textStrong },
                    ]}
                  >
                    {messages.quickBoardTitle}
                  </Text>
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.quickAccessItemDesc,
                      { color: themeColors.textSecondary },
                    ]}
                  >
                    {messages.quickBoardDesc}
                  </Text>
                </View>
              </Pressable>

              <Pressable
                accessibilityLabel={`${messages.quickTopUpTitle}: ${messages.quickTopUpDesc}`}
                accessibilityRole="button"
                onPress={() => router.push("/money")}
                style={[
                  styles.quickAccessCard,
                  {
                    backgroundColor: themeColors.surface,
                    borderColor: themeColors.borderSubtle,
                  },
                ]}
                testID="hirer-quick-access-topup"
              >
                <View
                  style={[
                    styles.quickAccessIconBox,
                    { backgroundColor: themeColors.surfaceAccent },
                  ]}
                >
                  <WalletCards
                    color={themeColors.primary}
                    size={22}
                    strokeWidth={2.2}
                  />
                </View>
                <View style={styles.quickAccessCopy}>
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.quickAccessItemTitle,
                      { color: themeColors.textStrong },
                    ]}
                  >
                    {messages.quickTopUpTitle}
                  </Text>
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.quickAccessItemDesc,
                      { color: themeColors.textSecondary },
                    ]}
                  >
                    {messages.quickTopUpDesc}
                  </Text>
                </View>
              </Pressable>
            </View>
          </View>
        </View>
      </ScrollView>
    </ScreenLayout>
  );
}
