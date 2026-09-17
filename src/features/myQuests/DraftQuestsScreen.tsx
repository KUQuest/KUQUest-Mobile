import React, { useCallback, useState } from "react";
import {
  RefreshControl,
  StyleSheet,
  useColorScheme,
  useWindowDimensions,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ArrowLeft,
  BriefcaseBusiness,
  CalendarDays,
  MapPin,
  Pencil,
  Plus,
} from "lucide-react-native";

import { FlatList, Pressable, Text, View } from "@/tw";
import { ScreenLayout } from "@/components/layout/ScreenLayout";
import { useNavigationVisibility } from "@/components/navigation/NavigationVisibilityContext";
import { useCalmRefresh } from "@/hooks/useCalmRefresh";
import { useLocale, type SupportedLocale } from "@/locales/LocaleProvider";
import { formatSatang } from "@/domain/satang";
import { getThemeColors, type ThemeColors } from "@/theme/colors";
import { getAppChromeMetrics, getBottomNavigationInset } from "@/theme/layout";
import { fontFamily } from "@/theme/typography";
import type { QuestV2CanonicalQuest } from "@/api/questV2Contracts";
import { formatQuestDate, myQuestService } from "./myQuestService";

type DraftCopy = {
  title: string;
  subtitle: string;
  countLabel: string;
  listTitle: string;
  listHint: string;
  statusLabel: string;
  editLabel: string;
  createLabel: string;
  updatedLabel: (value: string) => string;
  scheduleLabel: string;
  locationLabel: string;
  budgetLabel: string;
  teamLabel: string;
  noSchedule: string;
  noLocation: string;
  emptyTitle: string;
  emptyDescription: string;
  backLabel: string;
  loadError: string;
  retryLabel: string;
  untagged: string;
};

const copy: Record<SupportedLocale, DraftCopy> = {
  th: {
    title: "ฉบับร่างเควสต์",
    subtitle: "กลับมาแก้ไขและเตรียมเควสต์ให้พร้อมเผยแพร่",
    countLabel: "ฉบับร่าง",
    listTitle: "เควสต์ที่บันทึกไว้",
    listHint: "แตะการ์ดหรือปุ่มแก้ไขเพื่อทำต่อ",
    statusLabel: "ฉบับร่าง",
    editLabel: "แก้ไขเควสต์",
    createLabel: "สร้างเควสต์ใหม่",
    updatedLabel: (value) => `แก้ไขล่าสุด ${value}`,
    scheduleLabel: "กำหนดการ",
    locationLabel: "สถานที่",
    budgetLabel: "งบประมาณ",
    teamLabel: "ผู้ทำงาน",
    noSchedule: "ยังไม่ได้กำหนดเวลา",
    noLocation: "ยังไม่ได้กำหนดสถานที่",
    emptyTitle: "ยังไม่มีฉบับร่าง",
    emptyDescription: "เริ่มสร้างเควสต์ แล้วกลับมาแก้ไขต่อได้ทุกเมื่อ",
    backLabel: "ย้อนกลับ",
    loadError: "ไม่สามารถโหลดฉบับร่างได้",
    retryLabel: "ลองอีกครั้ง",
    untagged: "ไม่มีแท็ก",
  },
  en: {
    title: "Quest drafts",
    subtitle: "Pick up where you left off and get ready to publish",
    countLabel: "drafts",
    listTitle: "Saved Quests",
    listHint: "Tap a card or the edit button to continue",
    statusLabel: "Draft",
    editLabel: "Edit Quest",
    createLabel: "Create Quest",
    updatedLabel: (value) => `Last edited ${value}`,
    scheduleLabel: "Schedule",
    locationLabel: "Location",
    budgetLabel: "Budget",
    teamLabel: "Workers",
    noSchedule: "Schedule not set",
    noLocation: "Location not set",
    emptyTitle: "No Quest drafts yet",
    emptyDescription:
      "Start a Quest and come back to finish it whenever you are ready",
    backLabel: "Go back",
    loadError: "We couldn't load your Quest drafts",
    retryLabel: "Try again",
    untagged: "No tag",
  },
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    borderBottomWidth: 1,
    paddingBottom: 18,
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  headerRow: { alignItems: "center", flexDirection: "row", gap: 12 },
  headerCopy: { flex: 1, minWidth: 0 },
  backButton: {
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    height: 48,
    justifyContent: "center",
    width: 48,
  },
  title: { fontFamily: fontFamily.bold, fontSize: 24, lineHeight: 30 },
  subtitle: {
    fontFamily: fontFamily.regular,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 2,
  },
  countRow: {
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    marginTop: 16,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  countNumber: { fontFamily: fontFamily.bold, fontSize: 20, lineHeight: 24 },
  countLabel: { fontFamily: fontFamily.semiBold, fontSize: 12, lineHeight: 18 },
  list: { flex: 1, paddingHorizontal: 16 },
  listHeader: { paddingBottom: 12, paddingTop: 20 },
  listTitle: { fontFamily: fontFamily.bold, fontSize: 16, lineHeight: 24 },
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
    borderRadius: 9999,
    borderWidth: 1,
    flexShrink: 0,
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
  details: {
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
    gap: 12,
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  updated: {
    flex: 1,
    fontFamily: fontFamily.regular,
    fontSize: 10,
    lineHeight: 14,
  },
  editButton: {
    alignItems: "center",
    borderRadius: 9999,
    flexDirection: "row",
    gap: 5,
    justifyContent: "center",
    minHeight: 40,
    paddingHorizontal: 14,
  },
  editText: { fontFamily: fontFamily.semiBold, fontSize: 12, lineHeight: 18 },
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
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 230,
    paddingHorizontal: 24,
    paddingVertical: 28,
  },
  errorText: {
    fontFamily: fontFamily.semiBold,
    fontSize: 16,
    lineHeight: 24,
    textAlign: "center",
  },
});

function sortDrafts(quests: QuestV2CanonicalQuest[]) {
  return quests
    .filter((quest) => quest.state === "QUEST_DRAFT")
    .sort((left, right) => {
      const leftTime = Date.parse(left.updatedAt);
      const rightTime = Date.parse(right.updatedAt);
      return (
        (Number.isNaN(rightTime) ? 0 : rightTime) -
        (Number.isNaN(leftTime) ? 0 : leftTime)
      );
    });
}

function DraftQuestCard({
  quest,
  messages,
  locale,
  palette,
  onEdit,
}: {
  quest: QuestV2CanonicalQuest;
  messages: DraftCopy;
  locale: SupportedLocale;
  palette: ThemeColors;
  onEdit: () => void;
}) {
  const schedule = quest.startTime
    ? `${formatQuestDate(quest.startTime, locale)}${
        quest.dueAt ? ` → ${formatQuestDate(quest.dueAt, locale)}` : ""
      }`
    : messages.noSchedule;
  const location = quest.locations[0]?.label ?? messages.noLocation;
  const description = quest.description?.trim();
  const budget = formatSatang(
    Math.round(quest.questFundingTotal * 100),
    locale
  );

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: palette.white, borderColor: palette.borderAccent },
      ]}
    >
      <Pressable
        accessibilityHint={messages.listHint}
        accessibilityLabel={`${quest.title}, ${messages.editLabel}`}
        accessibilityRole="button"
        onPress={onEdit}
        style={({ pressed }) => [
          styles.cardBody,
          pressed && { backgroundColor: palette.surfaceAccent },
        ]}
        testID={`draft-quest-card-${quest.id}`}
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
              {quest.tag?.name ?? messages.untagged}
            </Text>
          </View>
          <View
            style={[
              styles.status,
              {
                backgroundColor: palette.surfaceMuted,
                borderColor: palette.borderSubtle,
              },
            ]}
          >
            <Text style={[styles.statusText, { color: palette.textSecondary }]}>
              {messages.statusLabel}
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
                {schedule}
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
                {location}
              </Text>
            </View>
          </View>
        </View>
        <View
          style={[styles.details, { borderTopColor: palette.borderSubtle }]}
        >
          <View style={styles.detail}>
            <Text style={[styles.detailLabel, { color: palette.textMuted }]}>
              {messages.budgetLabel}
            </Text>
            <Text style={[styles.detailValue, { color: palette.textStrong }]}>
              {budget}
            </Text>
          </View>
          <View style={styles.detail}>
            <Text style={[styles.detailLabel, { color: palette.textMuted }]}>
              {messages.teamLabel}
            </Text>
            <Text style={[styles.detailValue, { color: palette.textStrong }]}>
              {quest.headcount}
            </Text>
          </View>
        </View>
      </Pressable>
      <View style={[styles.footer, { backgroundColor: palette.surface }]}>
        <Text
          numberOfLines={1}
          style={[styles.updated, { color: palette.textMuted }]}
        >
          {messages.updatedLabel(formatQuestDate(quest.updatedAt, locale))}
        </Text>
        <Pressable
          accessibilityLabel={`${messages.editLabel}: ${quest.title}`}
          accessibilityRole="button"
          onPress={onEdit}
          style={({ pressed }) => [
            styles.editButton,
            { backgroundColor: palette.primary },
            pressed && { backgroundColor: palette.primaryDark },
          ]}
          testID={`draft-quest-edit-${quest.id}`}
        >
          <Pencil color={palette.white} size={16} strokeWidth={2.2} />
          <Text style={[styles.editText, { color: palette.white }]}>
            {messages.editLabel}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function DraftQuestsScreen() {
  const router = useRouter();
  const { locale } = useLocale();
  const messages = copy[locale];
  const palette = getThemeColors(useColorScheme());
  const { width, fontScale } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { handleScroll } = useNavigationVisibility();
  const chromeMetrics = getAppChromeMetrics(width, fontScale);
  const [drafts, setDrafts] = useState<QuestV2CanonicalQuest[] | null>(null);
  const [loadError, setLoadError] = useState(false);

  const loadDrafts = useCallback(async () => {
    setLoadError(false);
    try {
      const quests = await myQuestService.listAllMyHirerQuests();
      const nextDrafts = sortDrafts(quests);
      setDrafts(nextDrafts);
      return nextDrafts;
    } catch (error) {
      setLoadError(true);
      throw error;
    }
  }, []);
  const { refreshing, refresh, refreshOnFocus } = useCalmRefresh(loadDrafts);

  useFocusEffect(
    useCallback(() => {
      refreshOnFocus();
      return undefined;
    }, [refreshOnFocus])
  );

  const bottomPadding =
    getBottomNavigationInset(chromeMetrics, insets.bottom) + 24;
  const draftItems = drafts ?? [];
  const renderItem = useCallback(
    ({ item }: { item: QuestV2CanonicalQuest }) => (
      <DraftQuestCard
        locale={locale}
        messages={messages}
        onEdit={() =>
          router.push({ pathname: "/create", params: { editQuestId: item.id } })
        }
        palette={palette}
        quest={item}
      />
    ),
    [locale, messages, palette, router]
  );
  const keyExtractor = useCallback(
    (item: QuestV2CanonicalQuest) => item.id,
    []
  );
  const listHeader = (
    <View style={styles.listHeader}>
      <Text style={[styles.listTitle, { color: palette.textStrong }]}>
        {messages.listTitle}
      </Text>
      <Text style={[styles.listHint, { color: palette.textSecondary }]}>
        {messages.listHint}
      </Text>
    </View>
  );

  return (
    <ScreenLayout
      className="bg-ku-background flex-1"
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
              accessibilityLabel={messages.backLabel}
              accessibilityRole="button"
              onPress={() => router.back()}
              style={({ pressed }) => [
                styles.backButton,
                { borderColor: palette.borderAccent },
                pressed && { backgroundColor: palette.surfaceMuted },
              ]}
              testID="draft-quests-back"
            >
              <ArrowLeft color={palette.primary} size={24} strokeWidth={2.2} />
            </Pressable>
            <View style={styles.headerCopy}>
              <Text
                numberOfLines={1}
                style={[styles.title, { color: palette.textStrong }]}
              >
                {messages.title}
              </Text>
              <Text
                numberOfLines={2}
                style={[styles.subtitle, { color: palette.textSecondary }]}
              >
                {messages.subtitle}
              </Text>
            </View>
          </View>
          <View
            accessibilityLabel={`${draftItems.length} ${messages.countLabel}`}
            style={[
              styles.countRow,
              {
                backgroundColor: palette.surfaceSuccess,
                borderColor: palette.borderSuccess,
              },
            ]}
          >
            <Text style={[styles.countNumber, { color: palette.primaryDeep }]}>
              {draftItems.length}
            </Text>
            <Text style={[styles.countLabel, { color: palette.textSecondary }]}>
              {messages.countLabel}
            </Text>
          </View>
        </View>
        {drafts === null && !loadError ? (
          <View style={styles.error}>
            <Text style={[styles.errorText, { color: palette.textSecondary }]}>
              {messages.subtitle}
            </Text>
          </View>
        ) : drafts === null && loadError ? (
          <View style={styles.error}>
            <Text style={[styles.errorText, { color: palette.dangerDark }]}>
              {messages.loadError}
            </Text>
            <Pressable
              accessibilityLabel={messages.retryLabel}
              accessibilityRole="button"
              onPress={() => void refresh(true).catch(() => undefined)}
              style={[styles.emptyAction, { backgroundColor: palette.primary }]}
              testID="draft-quests-retry"
            >
              <Text style={[styles.emptyActionText, { color: palette.white }]}>
                {messages.retryLabel}
              </Text>
            </Pressable>
          </View>
        ) : (
          <FlatList
            style={styles.list}
            contentContainerStyle={{
              flexGrow: 1,
              paddingBottom: bottomPadding,
            }}
            data={draftItems}
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
                  <Plus color={palette.primary} size={24} strokeWidth={2.1} />
                </View>
                <Text
                  style={[styles.emptyTitle, { color: palette.textStrong }]}
                >
                  {messages.emptyTitle}
                </Text>
                <Text
                  style={[
                    styles.emptyDescription,
                    { color: palette.textSecondary },
                  ]}
                >
                  {messages.emptyDescription}
                </Text>
                <Pressable
                  accessibilityLabel={messages.createLabel}
                  accessibilityRole="button"
                  onPress={() => router.push("/create")}
                  style={[
                    styles.emptyAction,
                    { backgroundColor: palette.primary },
                  ]}
                  testID="draft-quests-create-empty"
                >
                  <Text
                    style={[styles.emptyActionText, { color: palette.white }]}
                  >
                    {messages.createLabel}
                  </Text>
                </Pressable>
              </View>
            }
            ListHeaderComponent={listHeader}
            onScroll={handleScroll}
            refreshControl={
              <RefreshControl
                onRefresh={() => void refresh(true).catch(() => undefined)}
                refreshing={refreshing}
                tintColor={palette.primary}
              />
            }
            renderItem={renderItem}
            showsVerticalScrollIndicator={false}
            testID="draft-quests-list"
          />
        )}
      </View>
    </ScreenLayout>
  );
}
