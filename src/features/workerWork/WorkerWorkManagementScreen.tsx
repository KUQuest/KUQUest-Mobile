import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  useWindowDimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BriefcaseBusiness, History } from "lucide-react-native";

import { Pressable, ScrollView, Text, View } from "@/tw";
import { cn } from "@/tw/cn";
import { ScreenLayout } from "@/components/layout/ScreenLayout";
import { useSessionQuery } from "@/features/auth/sessionQueries";
import { useMyWorkerQuestSnapshotsQuery } from "@/features/myQuests/api/myQuestsQueries";
import { handleNavigationScroll } from "@/features/navigation/navigationUiStore";
import { useLocale } from "@/features/preferences/localeStore";
import { useAppTheme } from "@/features/workspace/AppThemeProvider";
import {
  workerWorkMessages,
  type WorkerWorkTab,
} from "@/locales/workerWorkMessages";
import { getAppChromeMetrics, getBottomNavigationInset } from "@/theme/layout";
import { spacing } from "@/theme/spacing";
import { WorkerWorkCard } from "./components/WorkerWorkCard";
import { projectWorkerWork } from "./workerWorkProjection";
import type { WorkerWorkItem } from "./workerWorkTypes";
import { workerWorkStyles as styles } from "./workerWorkStyles";

export interface WorkerWorkManagementScreenProps {
  initialTab?: string;
}

const TABS: readonly WorkerWorkTab[] = ["active", "history"];

export default function WorkerWorkManagementScreen({
  initialTab,
}: WorkerWorkManagementScreenProps = {}) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width, fontScale } = useWindowDimensions();
  const { colors: palette } = useAppTheme();
  const { locale } = useLocale();
  const messages = workerWorkMessages[locale];
  const [tab, setTab] = useState<WorkerWorkTab>(
    initialTab === "history" ? "history" : "active"
  );

  const sessionQuery = useSessionQuery();
  const viewerId = sessionQuery.data?.user.id ?? null;
  const snapshotsQuery = useMyWorkerQuestSnapshotsQuery(viewerId);
  const projection = useMemo(
    () => projectWorkerWork(snapshotsQuery.data ?? []),
    [snapshotsQuery.data]
  );
  const counts: Record<WorkerWorkTab, number> = {
    active: projection.activeCount,
    history: projection.history.length,
  };

  const metrics = getAppChromeMetrics(width, fontScale);
  const bottomPadding =
    getBottomNavigationInset(metrics, insets.bottom) + spacing.xl;

  const openWork = useCallback(
    (item: WorkerWorkItem) => {
      // Underfilled-start consent and still-open Quests live on Quest Detail;
      // everything else, including proof submission, is in the Work Hub.
      if (
        item.questState === "QUEST_OPEN" ||
        item.action === "consentUnderfilled"
      ) {
        router.push({ pathname: "/quest/[id]", params: { id: item.questId } });
        return;
      }
      router.push({
        pathname: "/quest/[id]/work",
        params: { id: item.questId, ...(viewerId ? { viewerId } : {}) },
      });
    },
    [router, viewerId]
  );

  const renderCard = (item: WorkerWorkItem) => (
    <WorkerWorkCard
      item={item}
      key={item.questId}
      locale={locale}
      messages={messages}
      onOpen={() => openWork(item)}
      palette={palette}
    />
  );

  const renderContent = () => {
    if (snapshotsQuery.isError) {
      return (
        <View
          accessibilityRole="alert"
          className={styles.stateBox}
          testID="worker-work-error"
        >
          <Text className={styles.errorTitle}>{messages.loadError}</Text>
          <Pressable
            accessibilityRole="button"
            className={styles.stateAction}
            onPress={() => void snapshotsQuery.refetch()}
            testID="worker-work-retry"
          >
            <Text className={styles.stateActionText}>{messages.retry}</Text>
          </Pressable>
        </View>
      );
    }
    if (!snapshotsQuery.data) {
      return (
        <View
          accessibilityLabel={messages.loading}
          accessibilityRole="progressbar"
          className="items-center py-ku-40"
          testID="worker-work-loading"
        >
          <ActivityIndicator color={palette.primary} />
        </View>
      );
    }
    if (tab === "history") {
      if (projection.history.length === 0) {
        return (
          <View className={styles.stateBox} testID="worker-work-history-empty">
            <View className={styles.stateIcon}>
              <History color={palette.primary} size={24} strokeWidth={2} />
            </View>
            <Text className={styles.stateTitle}>
              {messages.emptyHistoryTitle}
            </Text>
            <Text className={styles.stateDescription}>
              {messages.emptyHistoryDescription}
            </Text>
          </View>
        );
      }
      return (
        <View className={styles.sectionList} testID="worker-work-history-list">
          {projection.history.map(renderCard)}
        </View>
      );
    }
    if (projection.activeCount === 0) {
      return (
        <View className={styles.stateBox} testID="worker-work-active-empty">
          <View className={styles.stateIcon}>
            <BriefcaseBusiness
              color={palette.primary}
              size={24}
              strokeWidth={2}
            />
          </View>
          <Text className={styles.stateTitle}>{messages.emptyActiveTitle}</Text>
          <Text className={styles.stateDescription}>
            {messages.emptyActiveDescription}
          </Text>
          <Pressable
            accessibilityRole="button"
            className={styles.stateAction}
            onPress={() => router.replace("/(tabs)")}
            testID="worker-work-find-quests"
          >
            <Text className={styles.stateActionText}>
              {messages.findQuests}
            </Text>
          </Pressable>
        </View>
      );
    }
    return (
      <>
        {projection.needsAction.length > 0 ? (
          <>
            <Text accessibilityRole="header" className={styles.sectionHeading}>
              {messages.needsActionHeading}
            </Text>
            <View
              className={styles.sectionList}
              testID="worker-work-needs-action-list"
            >
              {projection.needsAction.map(renderCard)}
            </View>
          </>
        ) : null}
        {projection.otherActive.length > 0 ? (
          <>
            {projection.needsAction.length > 0 ? (
              <Text
                accessibilityRole="header"
                className={styles.sectionHeading}
              >
                {messages.otherWorkHeading}
              </Text>
            ) : null}
            <View
              className={styles.sectionList}
              testID="worker-work-active-list"
            >
              {projection.otherActive.map(renderCard)}
            </View>
          </>
        ) : null}
      </>
    );
  };

  return (
    <ScreenLayout edges={["top", "left", "right"]} className="bg-ku-background">
      <ScrollView
        contentContainerStyle={{ paddingBottom: bottomPadding }}
        onScroll={handleNavigationScroll}
        refreshControl={
          <RefreshControl
            colors={[palette.primary]}
            onRefresh={() => void snapshotsQuery.refetch()}
            refreshing={snapshotsQuery.isRefetching}
            tintColor={palette.primary}
          />
        }
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        testID="worker-work-scroll"
      >
        <View className={styles.content}>
          <View className={styles.header}>
            <Text accessibilityRole="header" className={styles.title}>
              {messages.title}
            </Text>
            <Text className={styles.subtitle}>{messages.subtitle}</Text>
          </View>

          <View accessibilityRole="tablist" className={styles.tabList}>
            {TABS.map((option) => {
              const selected = option === tab;
              return (
                <Pressable
                  accessibilityLabel={messages.tabCount(
                    messages.tabs[option],
                    counts[option]
                  )}
                  accessibilityRole="tab"
                  accessibilityState={{ selected }}
                  className={cn(styles.tab, selected && styles.tabSelected)}
                  key={option}
                  onPress={() => setTab(option)}
                  testID={`worker-work-tab-${option}`}
                >
                  <Text
                    className={cn(
                      styles.tabText,
                      selected && styles.tabTextSelected
                    )}
                  >
                    {messages.tabs[option]}
                  </Text>
                  {snapshotsQuery.data ? (
                    <View
                      className={cn(
                        styles.tabBadge,
                        selected && styles.tabBadgeSelected
                      )}
                    >
                      <Text
                        className={cn(
                          styles.tabBadgeText,
                          selected && styles.tabBadgeTextSelected
                        )}
                      >
                        {counts[option]}
                      </Text>
                    </View>
                  ) : null}
                </Pressable>
              );
            })}
          </View>

          {renderContent()}
        </View>
      </ScrollView>
    </ScreenLayout>
  );
}
