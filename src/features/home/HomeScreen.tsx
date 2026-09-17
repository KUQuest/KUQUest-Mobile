import React, { useCallback } from "react";
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
import { isPrototypeDemoEnabled } from "@/features/auth/authEnvironment";
import { useNavigationVisibility } from "@/components/navigation/NavigationVisibilityContext";
import { useLocale } from "@/locales/LocaleProvider";
import { getAppChromeMetrics, getBottomNavigationInset } from "@/theme/layout";
import { getThemeColors } from "@/theme/colors";
import { spacing } from "@/theme/spacing";

import { HirerQuestProgressCard } from "./components/HirerQuestProgressCard";
import { hirerHomeQuestFixture } from "./hirerHomeData";
import { hirerHomeMessages } from "./hirerHomeMessages";
import { hirerHomeStyles as styles } from "./hirerHomeStyles";

export default function HomeScreen() {
  const router = useRouter();
  const { locale } = useLocale();
  const { width, fontScale } = useWindowDimensions();
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const { handleScroll } = useNavigationVisibility();
  const metrics = getAppChromeMetrics(width, fontScale);
  const themeColors = getThemeColors(colorScheme);
  const messages = hirerHomeMessages[locale];
  const quest = hirerHomeQuestFixture;
  const isPrototypeDemo = isPrototypeDemoEnabled();

  const handleOpenDetails = useCallback(() => {
    router.push({
      pathname: "/quest/[id]",
      params: {
        id: quest.id,
        mode: "post",
        preview: "populated",
        studentId: "demo-hirer",
      },
    });
  }, [quest.id, router]);

  const handleOpenWorkerProfile = useCallback(() => {
    router.push(`/profile/${quest.worker.id}`);
  }, [quest.worker.id, router]);

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
              <View
                accessibilityRole="text"
                style={[
                  styles.prototypeNotice,
                  {
                    backgroundColor: themeColors.surfaceSuccess,
                    borderColor: themeColors.borderSuccess,
                  },
                ]}
                testID="hirer-home-prototype-notice"
              >
                <Text
                  style={[
                    styles.prototypeNoticeText,
                    { color: themeColors.success },
                  ]}
                >
                  {messages.prototypeLabel}
                </Text>
              </View>
              <Text
                style={[styles.sectionTitle, { color: themeColors.textStrong }]}
              >
                {messages.activeQuestTitle}
              </Text>
              <HirerQuestProgressCard
                dueAt={quest.dueAt}
                onOpenDetails={handleOpenDetails}
                onOpenWorkerProfile={handleOpenWorkerProfile}
                questId={quest.id}
                status={quest.status}
                tag={quest.tag?.[locale]}
                title={quest.title[locale]}
                worker={{
                  avatarUri: quest.worker.avatarUri,
                  displayName: quest.worker.displayName[locale],
                  faculty: quest.worker.faculty?.[locale],
                  id: quest.worker.id,
                }}
              />
            </>
          ) : (
            <View
              accessibilityRole="text"
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
