import { useCallback, useMemo, useState } from "react";
import {
  RefreshControl,
  type ListRenderItemInfo,
  useColorScheme,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeft, Clock3 } from "lucide-react-native";
import { Pressable, Text, View } from "@/tw";

import { QuestList } from "@/components/ui/QuestList";
import { ScreenLayout } from "@/components/layout/ScreenLayout";
import { useSessionQuery } from "@/features/auth/sessionQueries";
import { useLocale } from "@/features/preferences/localeStore";
import {
  myQuestMessages,
  type MyQuestMessages,
} from "@/locales/myQuestMessages";
import { getThemeColors } from "@/theme/colors";
import { spacing } from "@/theme/spacing";
import { MyQuestSummaryCard } from "./components/MyQuestSummaryCard";
import {
  useMyHirerQuestsQuery,
  useMyWorkerQuestSnapshotsQuery,
} from "./api/myQuestsQueries";
import {
  getLiveHirerItems,
  getLiveWorkerItems,
  type HirerTab,
  type QuestSummary,
  type WorkerTab,
} from "./myQuestService";

export type MyQuestRole = "worker" | "hirer";
export type MyQuestTab = WorkerTab | HirerTab;

export interface MyQuestListScreenProps {
  initialRole?: MyQuestRole;
  initialTab?: string;
}

const workerTabs: WorkerTab[] = ["pending", "accepted", "history"];
const hirerTabs: HirerTab[] = ["active", "draft", "completed"];

const styles = {
  root: "flex-1",
  header: "border-b border-ku-border-subtle px-ku-lg pb-ku-md pt-ku-sm",
  headerRow: "flex-row items-center gap-ku-sm",
  backButton:
    "h-[48px] w-[48px] items-center justify-center rounded-[14px] border border-ku-border",
  headerCopy: "min-w-0 flex-1",
  title: "font-ku-bold text-ku-title leading-[30px]",
  subtitle: "mt-[2px] font-ku-regular text-ku-body-small leading-[21px]",
  tabRow: "mt-ku-sm flex-row gap-ku-sm",
  tabButton:
    "min-h-[48px] flex-1 items-center justify-center rounded-ku-pill border border-ku-border px-[6px]",
  tabButtonText: "font-ku-semibold text-ku-label text-center leading-[18px]",
  list: "flex-1 px-ku-md",
  listHeader: "pb-ku-sm pt-ku-md",
  listTitle: "font-ku-bold text-ku-subtitle leading-[24px]",
  listHint: "mt-[2px] font-ku-regular text-ku-label leading-[18px]",
  empty:
    "min-h-[230px] items-center justify-center rounded-[16px] border border-dashed border-ku-border px-ku-lg py-[28px]",
  emptyIcon:
    "mb-[10px] h-[48px] w-[48px] items-center justify-center rounded-ku-pill",
  emptyTitle: "font-ku-semibold text-ku-body text-center leading-[24px]",
  emptyDescription:
    "mt-[4px] font-ku-regular text-ku-body-small text-center leading-[21px]",
  emptyAction:
    "mt-ku-md min-h-[48px] items-center justify-center rounded-ku-pill px-ku-md",
  emptyActionText: "font-ku-semibold text-ku-body-small leading-[21px]",
  error: "flex-1 items-center justify-center px-ku-lg",
  errorText: "font-ku-semibold text-ku-body text-center leading-[24px]",
} as const;

function tabLabel(
  messages: MyQuestMessages,
  role: MyQuestRole,
  tab: MyQuestTab
): string {
  return role === "hirer"
    ? messages.tabs.hirer[tab as HirerTab]
    : messages.tabs.worker[tab as WorkerTab];
}

function emptyLabel(
  messages: MyQuestMessages,
  role: MyQuestRole,
  tab: MyQuestTab
): string {
  return role === "hirer"
    ? messages.emptyTitle.hirer[tab as HirerTab]
    : messages.emptyTitle.worker[tab as WorkerTab];
}

function initialTabForRole(
  role: MyQuestRole,
  value: string | undefined
): MyQuestTab {
  if (role === "hirer") {
    return value === "draft" || value === "completed" ? value : "active";
  }
  return value === "accepted" || value === "history" ? value : "pending";
}

function Separator() {
  return <View className="h-ku-sm" />;
}

export default function MyQuestListScreen({
  initialRole = "hirer",
  initialTab,
}: MyQuestListScreenProps = {}) {
  const router = useRouter();
  const { locale } = useLocale();
  const messages = myQuestMessages[locale];
  const palette = getThemeColors(useColorScheme());
  const insets = useSafeAreaInsets();
  const role = initialRole;
  const [tab, setTab] = useState<MyQuestTab>(() =>
    initialTabForRole(initialRole, initialTab)
  );
  const sessionQuery = useSessionQuery();
  const sessionUserId = sessionQuery.data?.user.id ?? null;
  const hirerQuery = useMyHirerQuestsQuery(role === "hirer");
  const workerQuery = useMyWorkerQuestSnapshotsQuery(
    role === "worker" ? sessionUserId : null
  );
  const hirerQuests = hirerQuery.data ?? null;
  const workerSnapshots = workerQuery.data ?? null;

  const items = useMemo(() => {
    if (role === "hirer") {
      return hirerQuests
        ? getLiveHirerItems(hirerQuests, tab as HirerTab, locale)
        : [];
    }
    return workerSnapshots
      ? getLiveWorkerItems(
          workerSnapshots,
          tab as WorkerTab,
          locale,
          sessionUserId ?? ""
        )
      : [];
  }, [hirerQuests, locale, role, sessionUserId, tab, workerSnapshots]);
  const tabs = role === "hirer" ? hirerTabs : workerTabs;
  const isLoading =
    role === "hirer" ? hirerQuery.isPending : workerQuery.isPending;
  const refreshing =
    role === "hirer" ? hirerQuery.isRefetching : workerQuery.isRefetching;
  const bottomPadding = insets.bottom + spacing.xl;

  const openQuest = useCallback(
    (quest: QuestSummary) => {
      if (role === "worker") {
        if (!sessionUserId) return;
        router.push({
          pathname: `../quest/${quest.id}/work`,
          params: { viewerId: sessionUserId, studentId: sessionUserId },
        });
        return;
      }
      if (quest.actionType === "edit") {
        router.push({ pathname: "/create", params: { editQuestId: quest.id } });
        return;
      }
      router.push({
        pathname: "/quest/[id]",
        params: { id: quest.id, mode: "post" },
      });
    },
    [role, router, sessionUserId]
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
    void (
      role === "hirer" ? hirerQuery.refetch() : workerQuery.refetch()
    ).catch(() => undefined);
  }, [hirerQuery, role, workerQuery]);
  const selectedTabLabel = tabLabel(messages, role, tab);

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
                {messages.title[role]}
              </Text>
              <Text
                className={`${styles.subtitle} text-ku-text-secondary`}
                numberOfLines={2}
              >
                {messages.subtitle[role]}
              </Text>
            </View>
          </View>
          <View accessibilityRole="tablist" className={styles.tabRow}>
            {tabs.map((option) => {
              const selected = option === tab;
              return (
                <Pressable
                  accessibilityLabel={tabLabel(messages, role, option)}
                  accessibilityRole="tab"
                  accessibilityState={{ selected }}
                  className={`${styles.tabButton} ${
                    selected
                      ? "border-ku-primary bg-ku-surface-success"
                      : "border-ku-border-accent bg-ku-surface"
                  }`}
                  key={option}
                  onPress={() => setTab(option)}
                  testID={`my-quest-list-tab-${option}`}
                >
                  <Text
                    className={`${styles.tabButtonText} ${
                      selected ? "text-ku-primary" : "text-ku-text-secondary"
                    }`}
                  >
                    {tabLabel(messages, role, option)}
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
        ) : (role === "hirer" ? hirerQuery.isError : workerQuery.isError) ? (
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
            accessibilityLabel={`${selectedTabLabel} ${messages.listTitle}`}
            className={styles.list}
            contentContainerClassName="grow"
            contentContainerStyle={{ paddingBottom: bottomPadding }}
            data={items}
            ItemSeparatorComponent={Separator}
            keyExtractor={keyExtractor}
            ListEmptyComponent={
              <View className="min-h-[230px] items-center justify-center rounded-[16px] border border-dashed border-ku-border-subtle bg-ku-surface-muted px-ku-lg py-[28px]">
                <View className="mb-[10px] h-[48px] w-[48px] items-center justify-center rounded-ku-pill bg-ku-surface-success">
                  <Clock3 color={palette.primary} size={24} strokeWidth={2.1} />
                </View>
                <Text className={`${styles.emptyTitle} text-ku-text-strong`}>
                  {emptyLabel(messages, role, tab)}
                </Text>
                <Text
                  className={`${styles.emptyDescription} text-ku-text-secondary`}
                >
                  {messages.emptyDescription[role]}
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
