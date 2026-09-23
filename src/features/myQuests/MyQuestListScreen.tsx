import { useCallback, useMemo, useState } from "react";
import { RefreshControl, type ListRenderItemInfo } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeft, Clock3 } from "lucide-react-native";
import { Pressable, Text, View } from "@/tw";

import { QuestList } from "@/components/ui/QuestList";
import { ScreenLayout } from "@/components/layout/ScreenLayout";
import { useLocale } from "@/features/preferences/localeStore";
import { myQuestMessages } from "@/locales/myQuestMessages";
import { useAppTheme } from "@/features/workspace/AppThemeProvider";
import { spacing } from "@/theme/spacing";
import { MyQuestSummaryCard } from "./components/MyQuestSummaryCard";
import { useMyHirerQuestsQuery } from "./api/myQuestsQueries";
import {
  projectMyQuestWorkspace,
  type MyQuestTab,
} from "./myQuestWorkspaceProjection";
import type { QuestSummary } from "./myQuestTypes";

export type { MyQuestTab };

export interface MyQuestListScreenProps {
  initialTab?: string;
}

const styles = {
  root: "flex-1",
  header: "border-b border-ku-border-subtle px-ku-lg pb-ku-md pt-ku-sm",
  headerRow: "flex-row items-center gap-ku-sm",
  backButton:
    "h-[48px] w-[48px] items-center justify-center rounded-[14px] border border-ku-border",
  headerCopy: "min-w-0 flex-1",
  title: "font-ku-bold text-ku-title leading-[30px]",
  subtitle: "mt-ku-2 font-ku-regular text-ku-body-small leading-[21px]",
  tabRow: "mt-ku-sm flex-row gap-ku-sm",
  tabButton:
    "min-h-[48px] flex-1 items-center justify-center rounded-ku-pill border border-ku-border px-ku-6",
  tabButtonText: "font-ku-semibold text-ku-label text-center leading-[18px]",
  list: "flex-1 px-ku-md",
  listHeader: "pb-ku-sm pt-ku-md",
  listTitle: "font-ku-bold text-ku-subtitle leading-[24px]",
  listHint: "mt-ku-2 font-ku-regular text-ku-label leading-[18px]",
  empty:
    "min-h-[230px] items-center justify-center rounded-[16px] border border-dashed border-ku-border px-ku-lg py-ku-28",
  emptyIcon:
    "mb-ku-10 h-[48px] w-[48px] items-center justify-center rounded-ku-pill",
  emptyTitle: "font-ku-semibold text-ku-body text-center leading-[24px]",
  emptyDescription:
    "mt-ku-xs font-ku-regular text-ku-body-small text-center leading-[21px]",
  emptyAction:
    "mt-ku-md min-h-[48px] items-center justify-center rounded-ku-pill px-ku-md",
  emptyActionText: "font-ku-semibold text-ku-body-small leading-[21px]",
  error: "flex-1 items-center justify-center px-ku-lg",
  errorText: "font-ku-semibold text-ku-body text-center leading-[24px]",
} as const;

function Separator() {
  return <View className="h-ku-sm" />;
}

/** Hirer Work Management; the Worker workspace uses `WorkerWorkManagementScreen`. */
export default function MyQuestListScreen({
  initialTab,
}: MyQuestListScreenProps = {}) {
  const router = useRouter();
  const { locale } = useLocale();
  const messages = myQuestMessages[locale];
  const { colors: palette } = useAppTheme();
  const insets = useSafeAreaInsets();
  const [requestedTab, setRequestedTab] = useState<string | undefined>(
    initialTab
  );
  const hirerQuery = useMyHirerQuestsQuery();
  const hirerQuests = hirerQuery.data ?? null;

  const projection = useMemo(
    () => projectMyQuestWorkspace({ requestedTab, locale, hirerQuests }),
    [hirerQuests, locale, requestedTab]
  );
  const { items, selectedTab: tab, tabs } = projection;
  const isLoading = hirerQuery.isPending;
  const refreshing = hirerQuery.isRefetching;
  const bottomPadding = insets.bottom + spacing.xl;

  const openQuest = useCallback(
    (quest: QuestSummary) => {
      if (quest.actionType === "review") {
        router.push({
          pathname: "/quest/[id]/review",
          params: { id: quest.id },
        });
        return;
      }
      if (quest.actionType === "edit") {
        router.push({
          pathname: "/quest/[id]/edit",
          params: { id: quest.id },
        });
        return;
      }
      router.push({
        pathname: "/quest/[id]",
        params: { id: quest.id, mode: "post" },
      });
    },
    [router]
  );
  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<QuestSummary>) => (
      <MyQuestSummaryCard
        messages={messages}
        onOpen={() => openQuest(item)}
        palette={palette}
        quest={item}
      />
    ),
    [messages, openQuest, palette]
  );
  const keyExtractor = useCallback((item: QuestSummary) => item.id, []);
  const onRefresh = useCallback(() => {
    void hirerQuery.refetch().catch(() => undefined);
  }, [hirerQuery]);

  return (
    <ScreenLayout
      className="flex-1 bg-ku-background"
      edges={["top", "left", "right"]}
    >
      <View className="flex-1 bg-ku-background">
        <View className="border-b border-ku-border-subtle bg-ku-surface px-ku-lg pt-ku-sm pb-ku-md">
          <View className={styles.headerRow}>
            <Pressable
              accessibilityLabel={messages.back}
              accessibilityRole="button"
              className={`${styles.backButton} border-ku-border-accent`}
              onPress={() => router.back()}
              style={({ pressed }) =>
                pressed ? { backgroundColor: palette.surfaceMuted } : undefined
              }
              testID="my-quest-list-back"
            >
              <ArrowLeft color={palette.primary} size={24} strokeWidth={2.2} />
            </Pressable>
            <View className={styles.headerCopy}>
              <Text
                className={`${styles.title} text-ku-text-strong`}
                numberOfLines={1}
              >
                {messages.title}
              </Text>
              <Text
                className={`${styles.subtitle} text-ku-text-secondary`}
                numberOfLines={2}
              >
                {messages.subtitle}
              </Text>
            </View>
          </View>
          <View accessibilityRole="tablist" className={styles.tabRow}>
            {tabs.map((option) => {
              const selected = option === tab;
              return (
                <Pressable
                  accessibilityLabel={projection.tabLabels[option]}
                  accessibilityRole="tab"
                  accessibilityState={{ selected }}
                  className={`${styles.tabButton} ${
                    selected
                      ? "border-ku-primary bg-ku-surface-success"
                      : "border-ku-border-accent bg-ku-surface"
                  }`}
                  key={option}
                  onPress={() => setRequestedTab(option)}
                  testID={`my-quest-list-tab-${option}`}
                >
                  <Text
                    className={`${styles.tabButtonText} ${
                      selected ? "text-ku-primary" : "text-ku-text-secondary"
                    }`}
                  >
                    {projection.tabLabels[option]}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
        {isLoading ? (
          <View className={styles.error}>
            <Text className={`${styles.emptyTitle} text-ku-text-secondary`}>
              {messages.loading}
            </Text>
          </View>
        ) : hirerQuery.isError ? (
          <View className={styles.error}>
            <Text className={`${styles.errorText} text-ku-danger-dark`}>
              {messages.error}
            </Text>
            <Pressable
              accessibilityLabel={messages.retry}
              accessibilityRole="button"
              className={`${styles.emptyAction} bg-ku-primary`}
              onPress={onRefresh}
              testID="my-quest-list-retry"
            >
              <Text className={`${styles.emptyActionText} text-ku-on-primary`}>
                {messages.retry}
              </Text>
            </Pressable>
          </View>
        ) : (
          <QuestList
            accessibilityLabel={`${projection.selectedTabLabel} ${messages.listTitle}`}
            className={styles.list}
            contentContainerClassName="grow"
            contentContainerStyle={{ paddingBottom: bottomPadding }}
            data={items}
            ItemSeparatorComponent={Separator}
            keyExtractor={keyExtractor}
            ListEmptyComponent={
              <View className="min-h-[230px] items-center justify-center rounded-[16px] border border-dashed border-ku-border-subtle bg-ku-surface-muted px-ku-lg py-ku-28">
                <View className="mb-ku-10 h-[48px] w-[48px] items-center justify-center rounded-ku-pill bg-ku-surface-success">
                  <Clock3 color={palette.primary} size={24} strokeWidth={2.1} />
                </View>
                <Text className={`${styles.emptyTitle} text-ku-text-strong`}>
                  {projection.emptyTitle}
                </Text>
                <Text
                  className={`${styles.emptyDescription} text-ku-text-secondary`}
                >
                  {projection.emptyDescription}
                </Text>
              </View>
            }
            ListHeaderComponent={
              <View className={styles.listHeader}>
                <Text className={`${styles.listTitle} text-ku-text-strong`}>
                  {messages.listTitle}
                </Text>
                <Text className={`${styles.listHint} text-ku-text-secondary`}>
                  {messages.listHint}
                </Text>
              </View>
            }
            refreshControl={
              <RefreshControl
                onRefresh={onRefresh}
                refreshing={refreshing}
                tintColor={palette.primary}
              />
            }
            renderItem={renderItem}
            testID="my-quest-list"
          />
        )}
      </View>
    </ScreenLayout>
  );
}
