import React, { useCallback, useState } from "react";
import { RefreshControl, type ListRenderItemInfo } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Bell, ChevronLeft, ShieldAlert } from "lucide-react-native";

import type { MemberNotification } from "@/api/NotificationApi";
import { Chip } from "@/components/ui/Chip";
import { ScreenLayout } from "@/components/layout/ScreenLayout";
import { StateView } from "@/components/ui/StateView";
import { formatTimestampDateTime } from "@/domain/datetime";
import { useLocale } from "@/features/preferences/localeStore";
import { useAppTheme } from "@/features/workspace/AppThemeProvider";
import { memberNotificationMessages } from "@/locales/memberNotificationMessages";
import { spacing } from "@/theme/spacing";
import { ActivityIndicator, FlatList, Pressable, Text, View } from "@/tw";
import { cn } from "@/tw/cn";
import { goBackOrReplace } from "@/utils/navigation";
import { memberNotificationCopy } from "./memberNotificationCopy";
import {
  useMarkNotificationsReadMutation,
  useNotificationsQuery,
} from "./notificationQueries";

const styles = {
  header: "h-[56px] flex-row items-center px-ku-12",
  backButton: "h-[48px] w-[48px] items-center justify-center",
  headerTitle:
    "ml-ku-xs flex-1 font-ku-bold text-ku-title-small text-ku-text-strong",
  markAll: "min-h-[48px] justify-center px-ku-sm",
  markAllText: "font-ku-semibold text-ku-meta text-ku-primary",
  filters: "flex-row gap-ku-sm px-ku-20 pb-ku-12",
  row: "flex-row gap-ku-12 rounded-[16px] border border-ku-border-subtle bg-ku-card p-ku-md active:bg-ku-surface-muted",
  rowUnread: "border-ku-border-accent bg-ku-surface-accent",
  rowIcon:
    "h-[40px] w-[40px] items-center justify-center rounded-[12px] bg-ku-surface-danger",
  rowIconGeneric: "bg-ku-surface-muted",
  rowContent: "min-w-0 flex-1 gap-ku-2",
  rowTitleLine: "flex-row items-center gap-ku-xs",
  rowTitle: "flex-1 font-ku-semibold text-ku-control text-ku-text-strong",
  unreadDot: "h-[8px] w-[8px] rounded-ku-pill bg-ku-primary",
  rowBody: "font-ku-regular text-ku-body-small text-ku-text-secondary",
  rowTime: "mt-ku-2 font-ku-regular text-ku-meta text-ku-text-muted",
  footer: "min-h-[48px] items-center justify-center py-ku-md",
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
  const time = formatTimestampDateTime(item.createdAt, locale);
  const Icon = copy.known ? ShieldAlert : Bell;
  return (
    <Pressable
      accessibilityHint={unread ? messages.unread : undefined}
      accessibilityLabel={`${copy.title}. ${copy.body}. ${time}`}
      accessibilityRole="button"
      className={cn(styles.row, unread && styles.rowUnread)}
      onPress={() => onPress(item)}
      testID={`notification-row-${item.id}`}
    >
      <View
        className={cn(styles.rowIcon, !copy.known && styles.rowIconGeneric)}
      >
        <Icon
          color={copy.known ? colors.dangerDark : colors.textMuted}
          size={20}
          strokeWidth={2}
        />
      </View>
      <View className={styles.rowContent}>
        <View className={styles.rowTitleLine}>
          <Text className={styles.rowTitle}>{copy.title}</Text>
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
    </Pressable>
  );
}

export function NotificationInboxScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const { locale } = useLocale();
  const messages = memberNotificationMessages[locale];
  const [unreadOnly, setUnreadOnly] = useState(false);
  const query = useNotificationsQuery(unreadOnly);
  const markRead = useMarkNotificationsReadMutation();
  const items = query.data?.pages.flatMap((page) => page.items) ?? [];
  const hasUnread = items.some((item) => item.readAt === null);

  const openRow = useCallback(
    (item: MemberNotification) => {
      if (item.readAt === null) markRead.mutate({ ids: [item.id] });
      if (item.type === "CONDUCT_REPORT_UPHELD" || item.result) {
        router.push("/(tabs)/profile");
      }
    },
    [markRead, router]
  );

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<MemberNotification>) => (
      <NotificationRow item={item} onPress={openRow} />
    ),
    [openRow]
  );

  let body: React.ReactNode;
  if (query.isPending) {
    body = (
      <View className={styles.footer} accessibilityLabel={messages.loading}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  } else if (query.isError && items.length === 0) {
    body = (
      <StateView
        variant="error"
        title={messages.error}
        description={messages.error}
        actionLabel={messages.retry}
        onAction={() => void query.refetch()}
      />
    );
  } else {
    body = (
      <FlatList
        className="flex-1"
        contentContainerStyle={{
          gap: spacing.px12,
          paddingHorizontal: spacing.px20,
          paddingBottom: insets.bottom + spacing.lg,
        }}
        data={items}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <StateView
            variant="empty"
            title={unreadOnly ? messages.emptyUnread : messages.empty}
          />
        }
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
                <Text className={styles.markAllText}>{messages.loadMore}</Text>
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
            <Text className={styles.markAllText}>
              {markRead.isPending
                ? messages.markingAllRead
                : messages.markAllRead}
            </Text>
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
          label={messages.unreadOnly}
          tone="tab"
          selected={unreadOnly}
          onPress={() => setUnreadOnly(true)}
          testID="notifications-filter-unread"
        />
      </View>
      {body}
    </ScreenLayout>
  );
}
