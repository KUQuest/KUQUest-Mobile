import React, { useCallback } from "react";
import { useColorScheme, useWindowDimensions } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowRightLeft } from "lucide-react-native";

import { Pressable, ScrollView, Text, View } from "@/tw";
import { useRoleWorkspace } from "@/components/navigation/RoleWorkspaceContext";
import WorkerHomeScreen from "@/features/workerHome/WorkerHomeScreen";

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
  const { workspace, switchWorkspace } = useRoleWorkspace();
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

  if (workspace === "worker") {
    return <WorkerHomeScreen />;
  }
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
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 8,
              }}
            >
              <View
                style={[
                  styles.prototypeNotice,
                  {
                    marginBottom: 0,
                    backgroundColor: themeColors.surfaceMuted,
                    borderColor: themeColors.borderSubtle,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.prototypeNoticeText,
                    { color: themeColors.primaryDeep },
                  ]}
                >
                  {locale === "th" ? "ผู้จ้างวาน" : "Hirer"}
                </Text>
              </View>
              <Pressable
                accessibilityHint="Switches workspace to Worker"
                accessibilityLabel={
                  locale === "th"
                    ? "สลับไปพื้นที่ทำงานผู้รับงาน"
                    : "Switch to Worker Workspace"
                }
                accessibilityRole="button"
                onPress={() => void switchWorkspace("worker")}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 9999,
                  borderWidth: 1,
                  borderColor: themeColors.borderSubtle,
                  backgroundColor: themeColors.surface,
                }}
                testID="switch-to-worker-button"
              >
                <ArrowRightLeft size={12} color={themeColors.primaryDeep} />
                <Text
                  style={{
                    fontSize: 12,
                    color: themeColors.primaryDeep,
                    fontWeight: "500",
                  }}
                >
                  {locale === "th" ? "สลับไปผู้รับงาน" : "Switch to Worker"}
                </Text>
              </Pressable>
            </View>
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
                title={quest.title[locale]}
                worker={{
                  avatarUri: quest.worker.avatarUri,
                  displayName: quest.worker.displayName[locale],
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
        </View>
      </ScrollView>
    </ScreenLayout>
  );
}
