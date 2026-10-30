import React, { useCallback, useMemo, useState } from "react";
import {
  RefreshControl,
  SectionList,
  type SectionListRenderItemInfo,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Bell,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
} from "lucide-react-native";

import type { MemberNotification } from "@/api/NotificationApi";
import { Chip } from "@/components/ui/Chip";
import { ScreenLayout } from "@/components/layout/ScreenLayout";
import { StateView } from "@/components/ui/StateView";
import {
  formatTimeInBangkok,
  formatTimestampDateTime,
} from "@/domain/datetime";
import { useLocale } from "@/features/preferences/localeStore";
import { DisputeRespondSheet } from "@/features/questBoard/dispute/DisputeRespondSheet";
import { useAppTheme } from "@/features/workspace/AppThemeProvider";
import { memberNotificationMessages } from "@/locales/memberNotificationMessages";
import { spacing } from "@/theme/spacing";
import { ActivityIndicator, Pressable, Text, View } from "@/tw";
import { cn } from "@/tw/cn";
import { goBackOrReplace } from "@/utils/navigation";
import {
  groupNotificationsByDay,
  type NotificationDaySection,
} from "./groupNotificationsByDay";
import { memberNotificationCopy } from "./memberNotificationCopy";
import {
  notificationOpensProfile,
  notificationOpensQuest,
  notificationOpensRespondForm,
  notificationPresentation,
  notificationToneStyle,
} from "./notificationPresentation";
import {
  useMarkNotificationsReadMutation,
  useNotificationsQuery,
  useUnreadNotificationCountQuery,
} from "./notificationQueries";

const styles = {
  header: "h-[56px] flex-row items-center px-ku-12",
  backButton: "h-[48px] w-[48px] items-center justify-center",
  headerTitle:
    "ml-ku-xs flex-1 font-ku-bold text-ku-title-small text-ku-text-strong",
  markAll: "min-h-[48px] justify-center",
  markAllPill:
    "flex-row items-center gap-ku-xs rounded-ku-pill bg-ku-primary-subtle px-ku-md py-ku-sm",
  markAllText: "font-ku-semibold text-ku-meta text-ku-primary",
  filters: "flex-row gap-ku-sm px-ku-20 pb-ku-sm",
  sectionHeader: "bg-ku-background px-ku-20 pb-ku-xs pt-ku-md",
  sectionTitle: "font-ku-semibold text-ku-label text-ku-text-secondary",
  row: "min-h-[64px] flex-row items-center gap-ku-12 bg-ku-surface px-ku-20 py-ku-12 active:bg-ku-surface-muted",
  rowUnread: "bg-ku-primary-subtle",
  rowIcon: "h-[44px] w-[44px] items-center justify-center rounded-ku-control",
  rowContent: "min-w-0 flex-1 gap-ku-2",
  rowTitleLine: "flex-row items-center gap-ku-xs",
  rowTitle: "flex-1 font-ku-regular text-ku-control text-ku-text-secondary",
  rowTitleUnread: "font-ku-semibold text-ku-text-strong",
  unreadDot: "h-[8px] w-[8px] rounded-ku-pill bg-ku-primary",
  rowBody: "font-ku-regular text-ku-body-small text-ku-text-secondary",
  rowTime: "mt-ku-2 font-ku-regular text-ku-meta text-ku-text-muted",
  separator: "ml-[76px] h-px bg-ku-divider",
  loading: "flex-1 items-center justify-center gap-ku-sm",
  loadingText: "font-ku-regular text-ku-body-small text-ku-text-secondary",
  empty: "items-center px-ku-lg pt-ku-xl",
  emptyIcon:
    "mb-ku-md h-[64px] w-[64px] items-center justify-center rounded-ku-pill bg-ku-primary-subtle",
  emptyTitle:
    "text-center font-ku-semibold text-ku-emphasis-large text-ku-text-strong",
  emptyDescription:
    "mt-ku-xs text-center font-ku-regular text-ku-body-small text-ku-text-secondary",
  footer: "min-h-[48px] items-center justify-center py-ku-md",
  footerText: "font-ku-semibold text-ku-meta text-ku-primary",
} as const;

function NotificationRow({
  item,
  onPress,
}: {
  item: MemberNotification;
  onPress: (item: MemberNotification) => void;
}) {
  const { locale } = useLocale();
  const { colors } = useAppTheme();
  const messages = memberNotificationMessages[locale];
  const copy = memberNotificationCopy(item, locale);
  const unread = item.readAt === null;
  const opensProfile = notificationOpensProfile(item);
  const opensRespondForm = notificationOpensRespondForm(item);
  const opensQuest = notificationOpensQuest(item);
  const { icon: Icon, tone } = notificationPresentation(item);
  const toneStyle = notificationToneStyle[tone];
  const time = formatTimeInBangkok(item.createdAt);
  const hint = [
    unread ? messages.unread : null,
    opensProfile ? messages.opensProfile : null,
    opensRespondForm ? messages.opensRespondForm : null,
    opensQuest ? messages.opensQuest : null,
  ]
    .filter(Boolean)
    .join(". ");
  return (
    <Pressable
      accessibilityHint={hint || undefined}
      accessibilityLabel={`${copy.title}. ${copy.body}. ${formatTimestampDateTime(item.createdAt, locale)}`}
      accessibilityRole="button"
      className={cn(styles.row, unread && styles.rowUnread)}
      onPress={() => onPress(item)}
      testID={`notification-row-${item.id}`}
    >
      <View className={cn(styles.rowIcon, toneStyle.tile)}>
        <Icon color={colors[toneStyle.iconColor]} size={22} strokeWidth={2} />
      </View>
      <View className={styles.rowContent}>
        <View className={styles.rowTitleLine}>
          <Text
            className={cn(styles.rowTitle, unread && styles.rowTitleUnread)}
          >
            {copy.title}
          </Text>
          {unread ? (
            <View
              className={styles.unreadDot}
              testID={`notification-unread-${item.id}`}
            />
          ) : null}
        </View>
        <Text className={styles.rowBody}>{copy.body}</Text>
        <Text className={styles.rowTime}>{time}</Text>
      </View>
      {opensProfile || opensRespondForm || opensQuest ? (
        <ChevronRight
          color={colors.textMuted}
          size={20}
          strokeWidth={2}
          testID={`notification-chevron-${item.id}`}
        />
      ) : null}
    </Pressable>
  );
}

function RowSeparator() {
  return <View className={styles.separator} />;
}

function InboxEmpty({ unreadOnly }: { unreadOnly: boolean }) {
  const { locale } = useLocale();
  const { colors } = useAppTheme();
  const messages = memberNotificationMessages[locale];
  const Icon = unreadOnly ? CheckCheck : Bell;
  return (
    <View
      accessibilityLiveRegion="polite"
      className={styles.empty}
      testID="notifications-empty"
    >
      <View className={styles.emptyIcon}>
        <Icon color={colors.primary} size={28} strokeWidth={1.8} />
      </View>
      <Text className={styles.emptyTitle}>
        {unreadOnly ? messages.emptyUnread : messages.empty}
      </Text>
      <Text className={styles.emptyDescription}>
        {unreadOnly
          ? messages.emptyUnreadDescription
          : messages.emptyDescription}
      </Text>
    </View>
  );
}

export function NotificationInboxScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const { locale } = useLocale();
  const messages = memberNotificationMessages[locale];
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [respondingTo, setRespondingTo] = useState<string | null>(null);
  const query = useNotificationsQuery(unreadOnly);
  const markRead = useMarkNotificationsReadMutation();
  const pages = query.data?.pages;
  const items = useMemo(
    () => pages?.flatMap((page) => page.items) ?? [],
    [pages]
  );
  const sections = useMemo(
    () => groupNotificationsByDay(items, new Date(), locale),
    [items, locale]
  );
  // The badge count covers pages not loaded yet.
  const unreadCount = useUnreadNotificationCountQuery().data ?? 0;
  const hasUnread =
    unreadCount > 0 || items.some((item) => item.readAt === null);

  const openRow = useCallback(
    (item: MemberNotification) => {
      if (item.readAt === null) markRead.mutate({ ids: [item.id] });
      if (notificationOpensProfile(item)) {
        router.push("/(tabs)/profile");
      } else if (notificationOpensRespondForm(item) && item.disputeCaseId) {
        setRespondingTo(item.disputeCaseId);
      } else if (notificationOpensQuest(item) && item.questId) {
        router.push({ pathname: "/quest/[id]", params: { id: item.questId } });
      }
    },
    [markRead, router]
  );

  const renderItem = useCallback(
    ({
      item,
    }: SectionListRenderItemInfo<
      MemberNotification,
      NotificationDaySection
    >) => <NotificationRow item={item} onPress={openRow} />,
    [openRow]
  );

  const renderSectionHeader = useCallback(
    ({ section }: { section: NotificationDaySection }) => (
      <View className={styles.sectionHeader}>
        <Text accessibilityRole="header" className={styles.sectionTitle}>
          {section.title}
        </Text>
      </View>
    ),
    []
  );

  let body: React.ReactNode;
  if (query.isPending) {
    body = (
      <View
        accessibilityLabel={messages.loading}
        accessibilityLiveRegion="polite"
        className={styles.loading}
      >
        <ActivityIndicator color={colors.primary} />
        <Text className={styles.loadingText}>{messages.loading}</Text>
      </View>
    );
  } else if (query.isError && items.length === 0) {
    body = (
      <StateView
        variant="error"
        title={messages.error}
        description={messages.errorDescription}
        actionLabel={messages.retry}
        onAction={() => void query.refetch()}
      />
    );
  } else {
    body = (
      <SectionList<MemberNotification, NotificationDaySection>
        contentContainerStyle={{
          paddingBottom: insets.bottom + spacing.lg,
        }}
        ItemSeparatorComponent={RowSeparator}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<InboxEmpty unreadOnly={unreadOnly} />}
        ListFooterComponent={
          query.hasNextPage ? (
            <Pressable
              accessibilityRole="button"
              className={styles.footer}
              disabled={query.isFetchingNextPage}
              onPress={() => void query.fetchNextPage()}
              testID="notifications-load-more"
            >
              {query.isFetchingNextPage ? (
                <ActivityIndicator color={colors.primary} />
              ) : (
                <Text className={styles.footerText}>{messages.loadMore}</Text>
              )}
            </Pressable>
          ) : null
        }
        onEndReached={() => {
          if (query.hasNextPage && !query.isFetchingNextPage) {
            void query.fetchNextPage();
          }
        }}
        onEndReachedThreshold={0.4}
        refreshControl={
          <RefreshControl
            onRefresh={() => void query.refetch()}
            refreshing={query.isRefetching && !query.isFetchingNextPage}
            tintColor={colors.primary}
          />
        }
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
        sections={sections}
        stickySectionHeadersEnabled={false}
        style={{ flex: 1 }}
        testID="notifications-list"
      />
    );
  }

  return (
    <ScreenLayout
      edges={["top", "left", "right"]}
      className="flex-1 bg-ku-background"
    >
      <View className={styles.header}>
        <Pressable
          accessibilityLabel={messages.back}
          accessibilityRole="button"
          className={styles.backButton}
          onPress={() => goBackOrReplace(router, "/(tabs)/profile")}
          testID="notifications-back"
        >
          <ChevronLeft color={colors.primaryDeep} size={26} strokeWidth={2.3} />
        </Pressable>
        <Text accessibilityRole="header" className={styles.headerTitle}>
          {messages.title}
        </Text>
        {hasUnread ? (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: markRead.isPending }}
            className={styles.markAll}
            disabled={markRead.isPending}
            onPress={() => markRead.mutate({ all: true })}
            testID="notifications-mark-all-read"
          >
            <View className={styles.markAllPill}>
              <CheckCheck color={colors.primary} size={16} strokeWidth={2.2} />
              <Text className={styles.markAllText}>
                {markRead.isPending
                  ? messages.markingAllRead
                  : messages.markAllRead}
              </Text>
            </View>
          </Pressable>
        ) : null}
      </View>
      <View className={styles.filters} accessibilityRole="tablist">
        <Chip
          label={messages.all}
          tone="tab"
          selected={!unreadOnly}
          onPress={() => setUnreadOnly(false)}
          testID="notifications-filter-all"
        />
        <Chip
          label={messages.unreadOnly(unreadCount)}
          tone="tab"
          selected={unreadOnly}
          onPress={() => setUnreadOnly(true)}
          testID="notifications-filter-unread"
        />
      </View>
      {body}
      {respondingTo ? (
        <DisputeRespondSheet
          disputeCaseId={respondingTo}
          onClose={() => setRespondingTo(null)}
        />
      ) : null}
    </ScreenLayout>
  );
}
