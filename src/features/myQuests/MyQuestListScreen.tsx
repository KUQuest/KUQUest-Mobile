import { useCallback, useEffect, useMemo, useState } from "react";
import {
  RefreshControl,
  StyleSheet,
  type ListRenderItemInfo,
  useColorScheme,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ArrowLeft,
  BriefcaseBusiness,
  CalendarDays,
  Check,
  CircleX,
  Clock3,
  MapPin,
  Pencil,
} from "lucide-react-native";
import { Pressable, Text, View } from "@/tw";

import { QuestList } from "@/components/ui/QuestList";
import { ScreenLayout } from "@/components/layout/ScreenLayout";
import { authService } from "@/features/auth/AuthService";
import { useLocale } from "@/features/preferences/localeStore";
import {
  useMyHirerQuestsQuery,
  useMyWorkerQuestSnapshotsQuery,
} from "./api/myQuestsQueries";
import type { SupportedLocale } from "@/locales/locale";
import { getThemeColors, type ThemeColors } from "@/theme/colors";
import { spacing } from "@/theme/spacing";
import { fontFamily } from "@/theme/typography";
import {
  getLiveHirerItems,
  getLiveWorkerItems,
  type HirerTab,
  type QuestSummary,
  type StatusTone,
  type WorkerTab,
} from "./myQuestService";

export type MyQuestRole = "worker" | "hirer";
export type MyQuestTab = WorkerTab | HirerTab;

export interface MyQuestListScreenProps {
  initialRole?: MyQuestRole;
  initialTab?: string;
}

type ScreenCopy = {
  back: string;
  title: Record<MyQuestRole, string>;
  subtitle: Record<MyQuestRole, string>;
  tabs: {
    hirer: Record<HirerTab, string>;
    worker: Record<WorkerTab, string>;
  };
  listTitle: string;
  listHint: string;
  loading: string;
  error: string;
  retry: string;
  emptyTitle: {
    hirer: Record<HirerTab, string>;
    worker: Record<WorkerTab, string>;
  };
  emptyDescription: Record<MyQuestRole, string>;
  edit: string;
  detail: string;
  statusLabel: string;
  workerLabel: string;
  locationLabel: string;
  scheduleLabel: string;
};

const screenCopy: Record<SupportedLocale, ScreenCopy> = {
  th: {
    back: "ย้อนกลับ",
    title: { hirer: "เควสต์ของฉัน", worker: "เควสต์ที่ฉันเข้าร่วม" },
    subtitle: {
      hirer: "จัดการเควสต์ทั้งหมดที่คุณสร้างไว้",
      worker: "ติดตามเควสต์ที่คุณเข้าร่วม",
    },
    tabs: {
      hirer: {
        active: "กำลังดำเนินการ",
        draft: "ฉบับร่าง",
        completed: "ประวัติ",
      },
      worker: {
        pending: "รอตรวจสอบ",
        accepted: "กำลังทำ",
        history: "ประวัติ",
      },
    },
    listTitle: "รายการเควสต์",
    listHint: "เลือกเควสต์เพื่อดูรายละเอียดหรือทำงานต่อ",
    loading: "กำลังโหลดเควสต์…",
    error: "ไม่สามารถโหลดเควสต์ได้",
    retry: "ลองอีกครั้ง",
    emptyTitle: {
      hirer: {
        active: "ยังไม่มีเควสต์ที่กำลังดำเนินการ",
        draft: "ยังไม่มีฉบับร่าง",
        completed: "ยังไม่มีเควสต์ที่จบแล้ว",
      },
      worker: {
        pending: "ยังไม่มีเควสต์ที่รอตรวจสอบ",
        accepted: "ยังไม่มีเควสต์ที่กำลังทำ",
        history: "ยังไม่มีประวัติเควสต์ที่จบแล้ว",
      },
    },
    emptyDescription: {
      hirer: "เควสต์ที่ตรงกับสถานะนี้จะแสดงที่นี่",
      worker: "เควสต์ที่ตรงกับสถานะนี้จะแสดงที่นี่",
    },
    edit: "แก้ไข",
    detail: "ดูรายละเอียด",
    statusLabel: "สถานะ",
    workerLabel: "ผู้ทำงาน",
    locationLabel: "สถานที่",
    scheduleLabel: "กำหนดการ",
  },
  en: {
    back: "Go back",
    title: { hirer: "My Quests", worker: "Quests I joined" },
    subtitle: {
      hirer: "Manage every Quest you have created",
      worker: "Track the Quests you have joined",
    },
    tabs: {
      hirer: { active: "Active", draft: "Drafts", completed: "History" },
      worker: {
        pending: "Pending",
        accepted: "In progress",
        history: "History",
      },
    },
    listTitle: "Quest list",
    listHint: "Choose a Quest to view details or continue working",
    loading: "Loading Quests…",
    error: "We couldn't load your Quests",
    retry: "Try again",
    emptyTitle: {
      hirer: {
        active: "No active Quests",
        draft: "No Quest drafts",
        completed: "No completed Quests",
      },
      worker: {
        pending: "No pending Quests",
        accepted: "No Quests in progress",
        history: "No completed Quest history",
      },
    },
    emptyDescription: {
      hirer: "Quests in this status will appear here",
      worker: "Quests in this status will appear here",
    },
    edit: "Edit",
    detail: "View details",
    statusLabel: "Status",
    workerLabel: "Workers",
    locationLabel: "Location",
    scheduleLabel: "Schedule",
  },
};

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
  card: { borderRadius: 16, borderWidth: 1, overflow: "hidden" },
  cardBody: { padding: 16 },
  cardTop: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    justifyContent: "space-between",
  },
  tag: {
    alignItems: "center",
    borderRadius: 9999,
    flexDirection: "row",
    flexShrink: 1,
    minHeight: 28,
    paddingHorizontal: 8,
  },
  tagText: {
    flexShrink: 1,
    fontFamily: fontFamily.semiBold,
    fontSize: 12,
    lineHeight: 18,
    marginLeft: 4,
  },
  status: {
    alignItems: "center",
    borderRadius: 9999,
    borderWidth: 1,
    flexDirection: "row",
    flexShrink: 0,
    gap: 4,
    minHeight: 28,
    justifyContent: "center",
    paddingHorizontal: 9,
  },
  statusText: { fontFamily: fontFamily.semiBold, fontSize: 12, lineHeight: 18 },
  cardTitle: {
    fontFamily: fontFamily.bold,
    fontSize: 18,
    lineHeight: 24,
    marginTop: 12,
  },
  description: {
    fontFamily: fontFamily.regular,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 4,
  },
  metaList: { gap: 8, marginTop: 14 },
  metaRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    minHeight: 28,
  },
  metaIcon: {
    alignItems: "center",
    borderRadius: 9999,
    height: 28,
    justifyContent: "center",
    width: 28,
  },
  metaCopy: { flex: 1, minWidth: 0 },
  metaLabel: { fontFamily: fontFamily.regular, fontSize: 10, lineHeight: 14 },
  metaValue: {
    fontFamily: fontFamily.semiBold,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 1,
  },
  detailRow: {
    borderTopWidth: 1,
    flexDirection: "row",
    gap: 8,
    marginTop: 14,
    paddingTop: 12,
  },
  detail: { flex: 1, flexShrink: 1, minWidth: 0 },
  detailLabel: { fontFamily: fontFamily.regular, fontSize: 10, lineHeight: 14 },
  detailValue: {
    flexShrink: 1,
    fontFamily: fontFamily.bold,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 2,
  },
  footer: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  actionButton: {
    alignItems: "center",
    borderRadius: 9999,
    flexDirection: "row",
    gap: 5,
    justifyContent: "center",
    minHeight: 40,
    paddingHorizontal: 14,
  },
  actionText: { fontFamily: fontFamily.semiBold, fontSize: 12, lineHeight: 18 },
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
  messages: ScreenCopy,
  role: MyQuestRole,
  tab: MyQuestTab
): string {
  return role === "hirer"
    ? messages.tabs.hirer[tab as HirerTab]
    : messages.tabs.worker[tab as WorkerTab];
}

function emptyLabel(
  messages: ScreenCopy,
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

function toneColors(tone: StatusTone, palette: ThemeColors) {
  if (tone === "success") {
    return {
      background: palette.surfaceSuccess,
      border: palette.borderSuccess,
      foreground: palette.success,
    };
  }
  if (tone === "danger") {
    return {
      background: palette.surfaceDanger,
      border: palette.borderDanger,
      foreground: palette.dangerDark,
    };
  }
  if (tone === "warning") {
    return {
      background: "#FFF4D9",
      border: "#F2D18A",
      foreground: "#B86B00",
    };
  }
  return {
    background: palette.surfaceMuted,
    border: palette.border,
    foreground: palette.textSecondary,
  };
}

function StatusIcon({ tone, color }: { tone: StatusTone; color: string }) {
  const Icon =
    tone === "success" ? Check : tone === "danger" ? CircleX : Clock3;
  return <Icon color={color} size={14} strokeWidth={2.2} />;
}

function QuestSummaryCard({
  quest,
  messages,
  palette,
  onOpen,
}: {
  quest: QuestSummary;
  messages: ScreenCopy;
  palette: ThemeColors;
  onOpen: () => void;
}) {
  const status = toneColors(quest.statusTone, palette);
  const description = quest.description.trim();
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: palette.white, borderColor: palette.borderAccent },
      ]}
    >
      <Pressable
        accessibilityHint={messages.listHint}
        accessibilityLabel={`${quest.title}. ${quest.status}. ${messages.detail}`}
        accessibilityRole="button"
        onPress={onOpen}
        style={({ pressed }) => [
          styles.cardBody,
          pressed && { backgroundColor: palette.surfaceAccent },
        ]}
        testID={`my-quest-list-card-${quest.id}`}
      >
        <View style={styles.cardTop}>
          <View
            style={[styles.tag, { backgroundColor: palette.surfaceAccent }]}
          >
            <BriefcaseBusiness
              color={palette.primary}
              size={14}
              strokeWidth={2}
            />
            <Text
              numberOfLines={1}
              style={[styles.tagText, { color: palette.primary }]}
            >
              {quest.tag}
            </Text>
          </View>
          <View
            style={[
              styles.status,
              {
                backgroundColor: status.background,
                borderColor: status.border,
              },
            ]}
          >
            <StatusIcon color={status.foreground} tone={quest.statusTone} />
            <Text style={[styles.statusText, { color: status.foreground }]}>
              {quest.status}
            </Text>
          </View>
        </View>
        <Text
          numberOfLines={2}
          style={[styles.cardTitle, { color: palette.textStrong }]}
        >
          {quest.title}
        </Text>
        {description ? (
          <Text
            numberOfLines={2}
            style={[styles.description, { color: palette.textSecondary }]}
          >
            {description}
          </Text>
        ) : null}
        <View style={styles.metaList}>
          <View style={styles.metaRow}>
            <View
              style={[
                styles.metaIcon,
                { backgroundColor: palette.surfaceAccent },
              ]}
            >
              <CalendarDays color={palette.primary} size={15} strokeWidth={2} />
            </View>
            <View style={styles.metaCopy}>
              <Text style={[styles.metaLabel, { color: palette.textMuted }]}>
                {messages.scheduleLabel}
              </Text>
              <Text
                numberOfLines={1}
                style={[styles.metaValue, { color: palette.textSecondary }]}
              >
                {quest.date}
              </Text>
            </View>
          </View>
          <View style={styles.metaRow}>
            <View
              style={[
                styles.metaIcon,
                { backgroundColor: palette.surfaceAccent },
              ]}
            >
              <MapPin color={palette.primary} size={15} strokeWidth={2} />
            </View>
            <View style={styles.metaCopy}>
              <Text style={[styles.metaLabel, { color: palette.textMuted }]}>
                {messages.locationLabel}
              </Text>
              <Text
                numberOfLines={1}
                style={[styles.metaValue, { color: palette.textSecondary }]}
              >
                {quest.location}
              </Text>
            </View>
          </View>
        </View>
        <View
          style={[styles.detailRow, { borderTopColor: palette.borderSubtle }]}
        >
          <View style={styles.detail}>
            <Text style={[styles.detailLabel, { color: palette.textMuted }]}>
              {messages.workerLabel}
            </Text>
            <Text style={[styles.detailValue, { color: palette.textStrong }]}>
              {quest.teamSize}
            </Text>
          </View>
          <View style={styles.detail}>
            <Text style={[styles.detailLabel, { color: palette.textMuted }]}>
              {messages.statusLabel}
            </Text>
            <Text
              numberOfLines={1}
              style={[styles.detailValue, { color: palette.textStrong }]}
            >
              {quest.status}
            </Text>
          </View>
        </View>
      </Pressable>
      <View style={[styles.footer, { backgroundColor: palette.surface }]}>
        <Pressable
          accessibilityLabel={`${quest.action}: ${quest.title}`}
          accessibilityRole="button"
          onPress={onOpen}
          style={({ pressed }) => [
            styles.actionButton,
            { backgroundColor: palette.primary },
            pressed && { backgroundColor: palette.primaryDark },
          ]}
          testID={`my-quest-list-action-${quest.id}`}
        >
          {quest.actionType === "edit" ? (
            <Pencil color={palette.white} size={16} strokeWidth={2.2} />
          ) : null}
          <Text style={[styles.actionText, { color: palette.white }]}>
            {quest.actionType === "edit" ? messages.edit : quest.action}
          </Text>
        </Pressable>
      </View>
    </View>
  );
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
  const messages = screenCopy[locale];
  const palette = getThemeColors(useColorScheme());
  const insets = useSafeAreaInsets();
  const role = initialRole;
  const [tab, setTab] = useState<MyQuestTab>(() =>
    initialTabForRole(initialRole, initialTab)
  );
  const [sessionUserId, setSessionUserId] = useState<string | null>(null);

  useEffect(() => {
    void authService
      .getSession()
      .then((session) => {
        if (session?.user?.id) setSessionUserId(session.user.id);
      })
      .catch(() => undefined);
  }, []);

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
      <QuestSummaryCard
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
