import { useCallback, useMemo, useState } from "react";
import {
  RefreshControl,
  StyleSheet,
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
import { fontFamily } from "@/theme/typography";
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

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    borderBottomWidth: 1,
    paddingBottom: 16,
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  headerRow: { alignItems: "center", flexDirection: "row", gap: 12 },
  backButton: {
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    height: 48,
    justifyContent: "center",
    width: 48,
  },
  headerCopy: { flex: 1, minWidth: 0 },
  title: { fontFamily: fontFamily.bold, fontSize: 24, lineHeight: 30 },
  subtitle: {
    fontFamily: fontFamily.regular,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 2,
  },
  tabRow: { flexDirection: "row", gap: 8, marginTop: 12 },
  tabButton: {
    alignItems: "center",
    borderRadius: 9999,
    borderWidth: 1,
    flex: 1,
    justifyContent: "center",
    minHeight: 48,
    paddingHorizontal: 6,
  },
  tabButtonText: {
    fontFamily: fontFamily.semiBold,
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
  },
  list: { flex: 1, paddingHorizontal: 16 },
  listHeader: { paddingBottom: 12, paddingTop: 20 },
  listTitle: { fontFamily: fontFamily.bold, fontSize: 18, lineHeight: 24 },
  listHint: {
    fontFamily: fontFamily.regular,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 2,
  },
  empty: {
    alignItems: "center",
    borderRadius: 16,
    borderStyle: "dashed",
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 230,
    paddingHorizontal: 24,
    paddingVertical: 28,
  },
  emptyIcon: {
    alignItems: "center",
    borderRadius: 9999,
    height: 48,
    justifyContent: "center",
    marginBottom: 10,
    width: 48,
  },
  emptyTitle: {
    fontFamily: fontFamily.semiBold,
    fontSize: 16,
    lineHeight: 24,
    textAlign: "center",
  },
  emptyDescription: {
    fontFamily: fontFamily.regular,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 4,
    textAlign: "center",
  },
  emptyAction: {
    alignItems: "center",
    borderRadius: 9999,
    justifyContent: "center",
    marginTop: 16,
    minHeight: 48,
    paddingHorizontal: 20,
  },
  emptyActionText: {
    fontFamily: fontFamily.semiBold,
    fontSize: 14,
    lineHeight: 21,
  },
  error: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  errorText: {
    fontFamily: fontFamily.semiBold,
    fontSize: 16,
    lineHeight: 24,
    textAlign: "center",
  },
});

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
  return <View style={{ height: spacing.sm }} />;
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
      <View style={[styles.root, { backgroundColor: palette.background }]}>
        <View
          style={[
            styles.header,
            {
              backgroundColor: palette.surface,
              borderBottomColor: palette.borderSubtle,
            },
          ]}
        >
          <View style={styles.headerRow}>
            <Pressable
              accessibilityLabel={messages.back}
              accessibilityRole="button"
              onPress={() => router.back()}
              style={({ pressed }) => [
                styles.backButton,
                { borderColor: palette.borderAccent },
                pressed && { backgroundColor: palette.surfaceMuted },
              ]}
              testID="my-quest-list-back"
            >
              <ArrowLeft color={palette.primary} size={24} strokeWidth={2.2} />
            </Pressable>
            <View style={styles.headerCopy}>
              <Text
                numberOfLines={1}
                style={[styles.title, { color: palette.textStrong }]}
              >
                {messages.title[role]}
              </Text>
              <Text
                numberOfLines={2}
                style={[styles.subtitle, { color: palette.textSecondary }]}
              >
                {messages.subtitle[role]}
              </Text>
            </View>
          </View>
          <View accessibilityRole="tablist" style={styles.tabRow}>
            {tabs.map((option) => {
              const selected = option === tab;
              return (
                <Pressable
                  accessibilityLabel={tabLabel(messages, role, option)}
                  accessibilityRole="tab"
                  accessibilityState={{ selected }}
                  key={option}
                  onPress={() => setTab(option)}
                  style={[
                    styles.tabButton,
                    {
                      backgroundColor: selected
                        ? palette.surfaceSuccess
                        : palette.surface,
                      borderColor: selected
                        ? palette.primary
                        : palette.borderAccent,
                    },
                  ]}
                  testID={`my-quest-list-tab-${option}`}
                >
                  <Text
                    style={[
                      styles.tabButtonText,
                      {
                        color: selected
                          ? palette.primary
                          : palette.textSecondary,
                      },
                    ]}
                  >
                    {tabLabel(messages, role, option)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
        {isLoading ? (
          <View style={styles.error}>
            <Text style={[styles.emptyTitle, { color: palette.textSecondary }]}>
              {messages.loading}
            </Text>
          </View>
        ) : (role === "hirer" ? hirerQuery.isError : workerQuery.isError) ? (
          <View style={styles.error}>
            <Text style={[styles.errorText, { color: palette.dangerDark }]}>
              {messages.error}
            </Text>
            <Pressable
              accessibilityLabel={messages.retry}
              accessibilityRole="button"
              onPress={onRefresh}
              style={[styles.emptyAction, { backgroundColor: palette.primary }]}
              testID="my-quest-list-retry"
            >
              <Text style={[styles.emptyActionText, { color: palette.white }]}>
                {messages.retry}
              </Text>
            </Pressable>
          </View>
        ) : (
          <QuestList
            accessibilityLabel={`${selectedTabLabel} ${messages.listTitle}`}
            style={styles.list}
            contentContainerStyle={{
              flexGrow: 1,
              paddingBottom: bottomPadding,
            }}
            data={items}
            ItemSeparatorComponent={Separator}
            keyExtractor={keyExtractor}
            ListEmptyComponent={
              <View
                style={[
                  styles.empty,
                  {
                    backgroundColor: palette.surfaceMuted,
                    borderColor: palette.borderSubtle,
                  },
                ]}
              >
                <View
                  style={[
                    styles.emptyIcon,
                    { backgroundColor: palette.surfaceSuccess },
                  ]}
                >
                  <Clock3 color={palette.primary} size={24} strokeWidth={2.1} />
                </View>
                <Text
                  style={[styles.emptyTitle, { color: palette.textStrong }]}
                >
                  {emptyLabel(messages, role, tab)}
                </Text>
                <Text
                  style={[
                    styles.emptyDescription,
                    { color: palette.textSecondary },
                  ]}
                >
                  {messages.emptyDescription[role]}
                </Text>
              </View>
            }
            ListHeaderComponent={
              <View style={styles.listHeader}>
                <Text style={[styles.listTitle, { color: palette.textStrong }]}>
                  {messages.listTitle}
                </Text>
                <Text
                  style={[styles.listHint, { color: palette.textSecondary }]}
                >
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
