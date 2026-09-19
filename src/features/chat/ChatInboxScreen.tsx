import { memo, useCallback, useMemo, useState } from "react";
import { useRouter, type Href } from "expo-router";
import { MessageCircle, Search } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  FlatList,
  type ListRenderItemInfo,
  RefreshControl,
  useWindowDimensions,
} from "react-native";

import { ScreenLayout } from "@/components/layout/ScreenLayout";
import { handleNavigationScroll } from "@/features/navigation/navigationUiStore";
import { useSessionQuery } from "@/features/auth/sessionQueries";
import {
  LoadingSkeleton,
  SkeletonBlock,
} from "@/components/ui/LoadingSkeleton";
import { Image, Pressable, Text, TextInput, View } from "@/tw";
import { useLocale } from "@/features/preferences/localeStore";
import { chatMessages } from "@/locales/chatMessages";
import { colors } from "@/theme/colors";
import { getAppChromeMetrics, getBottomNavigationInset } from "@/theme/layout";
import { spacing } from "@/theme/spacing";
import { getChatRouteParams } from "./chatData";
import type { ChatConversation } from "./chatTypes";
import styles from "./chatStyles";
import {
  useListCandidateInquiriesQuery,
  useListConversationsQuery,
} from "./api/chatQueries";

function localizedText(
  value: Record<"en" | "th", string>,
  locale: "en" | "th"
): string {
  return value[locale];
}

function filterChatConversations(
  items: ChatConversation[],
  query: string,
  locale: "en" | "th"
): ChatConversation[] {
  return items.filter((conversation) => {
    if (!query) return true;
    return [
      localizedText(conversation.questTitle, locale),
      conversation.participantName,
      localizedText(conversation.latestMessage, locale),
    ].some((value) => value.toLocaleLowerCase().includes(query));
  });
}

function ConversationAvatar({
  conversation,
  onPress,
}: {
  conversation: ChatConversation;
  onPress?: (participantId: string) => void;
}) {
  const avatar = (
    <View
      accessible={!onPress || !conversation.participantId}
      accessibilityLabel={conversation.participantName}
      className={styles.avatar}
      style={{ backgroundColor: conversation.avatarColor }}
    >
      {conversation.participantAvatarUrl ? (
        <Image
          accessibilityLabel={conversation.participantName}
          cachePolicy="memory-disk"
          contentFit="cover"
          source={{ uri: conversation.participantAvatarUrl }}
          style={{ height: "100%", width: "100%" }}
          testID={`chat-avatar-image-${conversation.participantId ?? conversation.id}`}
        />
      ) : (
        <Text className={styles.avatarText}>{conversation.initials}</Text>
      )}
    </View>
  );
  const participantId = conversation.participantId;
  if (!onPress || !participantId) return avatar;
  return (
    <Pressable
      accessibilityLabel={`View profile of ${conversation.participantName}`}
      accessibilityRole="button"
      onPress={(event) => {
        event.stopPropagation();
        onPress(participantId);
      }}
      testID={`chat-avatar-${conversation.participantId ?? conversation.id}`}
    >
      {avatar}
    </Pressable>
  );
}

const ConversationRow = memo(function ConversationRow({
  conversation,
  locale,
  onPress,
  onOpenProfile,
}: {
  conversation: ChatConversation;
  locale: "en" | "th";
  onPress: (conversation: ChatConversation) => void;
  onOpenProfile?: (participantId: string) => void;
}) {
  const messages = chatMessages[locale];
  const role =
    conversation.participantRole === "owner"
      ? messages.questOwner
      : messages.questMember;
  const accessibilityLabel = [
    localizedText(conversation.questTitle, locale),
    conversation.participantName,
    role,
    localizedText(conversation.latestMessage, locale),
    conversation.unreadCount > 0
      ? messages.unreadCount(conversation.unreadCount)
      : undefined,
  ]
    .filter(Boolean)
    .join(". ");

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      className={styles.conversationRow}
      onPress={() => onPress(conversation)}
      testID={`chat-conversation-${conversation.id}`}
    >
      <ConversationAvatar conversation={conversation} onPress={onOpenProfile} />
      <View className={styles.rowCopy}>
        <Text className={styles.questTitle} numberOfLines={1}>
          {localizedText(conversation.questTitle, locale)}
        </Text>
        <Text className={styles.participant} numberOfLines={1}>
          {conversation.participantName} · {role}
        </Text>
        <Text className={styles.latestMessage} numberOfLines={1}>
          {localizedText(conversation.latestMessage, locale)}
        </Text>
      </View>
      <View className={styles.rowMeta}>
        <Text className={styles.rowTime}>{conversation.latestTime}</Text>
        {conversation.unreadCount > 0 ? (
          <View
            accessibilityLabel={messages.unreadCount(conversation.unreadCount)}
            className={styles.unreadBadge}
          >
            <Text className={styles.unreadText}>
              {conversation.unreadCount}
            </Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
});

function ChatInboxSkeleton({ loadingLabel }: { loadingLabel: string }) {
  return (
    <LoadingSkeleton
      loadingLabel={loadingLabel}
      style={{ width: "100%" }}
      contentStyle={{ gap: spacing.sm }}
      testID="chat-inbox-loading-skeleton"
    >
      {[1, 2, 3, 4].map((item) => (
        <View
          key={item}
          className={styles.conversationRow}
          testID={`chat-skeleton-${item}`}
        >
          <SkeletonBlock
            variant="image"
            height={48}
            width={48}
            borderRadius={24}
          />
          <View style={{ flex: 1, gap: spacing.xs, marginLeft: spacing.md }}>
            <SkeletonBlock height={18} width="76%" borderRadius={4} />
            <SkeletonBlock height={16} width="58%" borderRadius={4} />
            <SkeletonBlock
              height={14}
              width="88%"
              borderRadius={4}
              style={{ marginTop: spacing.xs }}
            />
          </View>
          <View
            style={{
              alignItems: "flex-end",
              gap: spacing.sm,
              marginLeft: spacing.sm,
            }}
          >
            <SkeletonBlock height={13} width={34} borderRadius={4} />
            <SkeletonBlock height={22} width={22} borderRadius={11} />
          </View>
        </View>
      ))}
    </LoadingSkeleton>
  );
}

export interface ChatInboxScreenProps {
  viewerId?: string;
}

type ChatInboxListItem =
  | {
      type: "conversation";
      conversation: ChatConversation;
    }
  | {
      type: "conversation-empty";
    }
  | {
      type: "inquiry-heading";
      count: number;
    }
  | {
      type: "inquiry-error";
    }
  | {
      type: "inquiry";
      conversation: ChatConversation;
    };

function getChatInboxItemKey(item: ChatInboxListItem): string {
  switch (item.type) {
    case "conversation":
      return `conversation-${item.conversation.id}`;
    case "inquiry":
      return `inquiry-${item.conversation.id}`;
    case "conversation-empty":
      return "conversation-empty";
    case "inquiry-heading":
      return "inquiry-heading";
    case "inquiry-error":
      return "inquiry-error";
  }
}

function ChatInboxItemSeparator() {
  return <View style={{ height: spacing.sm }} />;
}

export default function ChatInboxScreen({ viewerId }: ChatInboxScreenProps) {
  const router = useRouter();
  const { locale } = useLocale();
  const { width, fontScale } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const messages = chatMessages[locale];
  const chromeMetrics = getAppChromeMetrics(width, fontScale);
  const [query, setQuery] = useState("");
  const sessionQuery = useSessionQuery();
  const resolvedViewerId = viewerId || sessionQuery.data?.user.id || "";
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const conversationsQuery = useListConversationsQuery(resolvedViewerId);
  const candidateInquiriesQuery =
    useListCandidateInquiriesQuery(resolvedViewerId);
  const refreshing =
    conversationsQuery.isRefetching || candidateInquiriesQuery.isRefetching;
  const refresh = useCallback(async () => {
    await Promise.all([
      conversationsQuery.refetch(),
      candidateInquiriesQuery.refetch(),
    ]);
  }, [candidateInquiriesQuery, conversationsQuery]);
  const bottomPadding =
    getBottomNavigationInset(chromeMetrics, insets.bottom) + spacing.lg;
  const inquiryLoadFailed =
    Boolean(resolvedViewerId) && candidateInquiriesQuery.isError;
  const conversationsPending =
    !resolvedViewerId || conversationsQuery.isPending;
  const conversationsLoadFailed =
    Boolean(resolvedViewerId) && conversationsQuery.isError;
  const conversations = useMemo(
    () =>
      filterChatConversations(
        conversationsQuery.data ?? [],
        normalizedQuery,
        locale
      ),
    [conversationsQuery.data, locale, normalizedQuery]
  );
  const candidateInquiryTitle =
    locale === "th"
      ? "การสอบถามก่อนเริ่มงาน · Inquiry"
      : "Candidate inquiries · Inquiry";
  const candidateInquiries = useMemo(
    () =>
      filterChatConversations(
        candidateInquiriesQuery.data ?? [],
        normalizedQuery,
        locale
      ),
    [candidateInquiriesQuery.data, locale, normalizedQuery]
  );
  const handleConversationPress = useCallback(
    (conversation: ChatConversation) => {
      router.push({
        pathname: "/chat/[id]",
        params: getChatRouteParams({
          conversationId: conversation.id,
          questId: conversation.questId,
          viewerId: resolvedViewerId,
        }),
      });
    },
    [resolvedViewerId, router]
  );
  const handleInquiryPress = useCallback(
    (conversation: ChatConversation) => {
      router.push({
        pathname: "/quest/[id]/inquiry/[conversationId]",
        params: {
          id: conversation.questId ?? "",
          conversationId: conversation.id,
          viewerId: resolvedViewerId,
        },
      } as unknown as Href);
    },
    [resolvedViewerId, router]
  );
  const handleOpenProfile = useCallback(
    (participantId: string) => {
      router.push(`/profile/${participantId}`);
    },
    [router]
  );
  const renderEmptyState = useCallback(() => {
    if (conversationsPending || conversationsLoadFailed) return null;
    return (
      <View className={styles.emptyState}>
        <View className={styles.emptyIcon}>
          <MessageCircle color={colors.primary} size={30} strokeWidth={1.9} />
        </View>
        <Text className={styles.emptyTitle}>
          {normalizedQuery
            ? messages.noSearchResults
            : messages.noConversations}
        </Text>
        <Text className={styles.emptyDescription}>{messages.subtitle}</Text>
      </View>
    );
  }, [
    conversationsLoadFailed,
    conversationsPending,
    messages,
    normalizedQuery,
  ]);
  const listItems = useMemo<ChatInboxListItem[]>(() => {
    const items: ChatInboxListItem[] = [];
    if (
      !conversationsLoadFailed &&
      !conversationsPending &&
      conversations.length === 0 &&
      (candidateInquiries.length > 0 || inquiryLoadFailed)
    ) {
      items.push({ type: "conversation-empty" });
    } else {
      for (const conversation of conversations) {
        items.push({
          type: "conversation",
          conversation,
        });
      }
    }
    if (inquiryLoadFailed) {
      items.push({ type: "inquiry-error" });
    } else if (candidateInquiries.length > 0) {
      items.push({
        type: "inquiry-heading",
        count: candidateInquiries.length,
      });
      for (const conversation of candidateInquiries) {
        items.push({
          type: "inquiry",
          conversation,
        });
      }
    }
    return items;
  }, [
    candidateInquiries,
    conversations,
    conversationsLoadFailed,
    conversationsPending,
    inquiryLoadFailed,
  ]);
  const listHeader = useMemo(
    () => (
      <View>
        <View className={styles.intro}>
          <Text accessibilityRole="header" className={styles.title}>
            {messages.title}
          </Text>
          <Text className={styles.subtitle}>{messages.subtitle}</Text>
          <View className={styles.searchField}>
            <View className={styles.searchIcon}>
              <Search
                color={colors.textSecondary}
                size={21}
                strokeWidth={2.2}
              />
            </View>
            <TextInput
              accessibilityLabel={messages.searchConversations}
              className={styles.searchInput}
              onChangeText={setQuery}
              placeholder={messages.searchConversations}
              placeholderTextColor={colors.textFaint}
              returnKeyType="search"
              value={query}
            />
          </View>
        </View>
        <View className={styles.sectionHeading}>
          <Text accessibilityRole="header" className={styles.sectionTitle}>
            {messages.recentConversations}
          </Text>
          {conversationsPending ? (
            <SkeletonBlock
              height={16}
              width={78}
              borderRadius={4}
              testID="chat-inbox-loading-count"
            />
          ) : (
            <Text className={styles.sectionCount}>
              {messages.conversationCount(conversations.length)}
            </Text>
          )}
        </View>
        {conversationsLoadFailed ? (
          <View
            accessibilityRole="alert"
            accessibilityLiveRegion="assertive"
            className={styles.loadErrorState}
          >
            <Text className={styles.loadErrorTitle}>{messages.loadError}</Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                void refresh().catch(() => undefined);
              }}
            >
              <Text className={styles.loadErrorActionText}>
                {messages.retry}
              </Text>
            </Pressable>
          </View>
        ) : conversationsPending ? (
          <ChatInboxSkeleton loadingLabel={messages.loading} />
        ) : null}
      </View>
    ),
    [
      conversations,
      conversationsLoadFailed,
      conversationsPending,
      messages,
      query,
      setQuery,
      refresh,
    ]
  );
  const renderItem = useCallback(
    ({ item, index }: ListRenderItemInfo<ChatInboxListItem>) => {
      switch (item.type) {
        case "conversation":
          return (
            <ConversationRow
              conversation={item.conversation}
              locale={locale}
              onOpenProfile={handleOpenProfile}
              onPress={handleConversationPress}
            />
          );
        case "conversation-empty":
          return renderEmptyState();
        case "inquiry-heading":
          return (
            <View
              className={styles.sectionHeading}
              style={
                index === 0
                  ? { marginBottom: 0 }
                  : { marginBottom: 0, marginTop: 0 }
              }
            >
              <Text accessibilityRole="header" className={styles.sectionTitle}>
                {candidateInquiryTitle}
              </Text>
              <Text className={styles.sectionCount}>
                {messages.conversationCount(item.count)}
              </Text>
            </View>
          );
        case "inquiry-error":
          return (
            <>
              <View
                className={styles.sectionHeading}
                style={index === 0 ? undefined : { marginTop: 0 }}
              >
                <Text
                  accessibilityRole="header"
                  className={styles.sectionTitle}
                >
                  {candidateInquiryTitle}
                </Text>
              </View>
              <View
                accessibilityRole="alert"
                accessibilityLiveRegion="assertive"
                className={styles.loadErrorState}
              >
                <Text className={styles.loadErrorTitle}>
                  {locale === "th"
                    ? "ไม่สามารถโหลด Inquiry ได้"
                    : "Candidate inquiries could not be loaded."}
                </Text>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => {
                    void refresh().catch(() => undefined);
                  }}
                >
                  <Text className={styles.loadErrorActionText}>
                    {messages.retry}
                  </Text>
                </Pressable>
              </View>
            </>
          );
        case "inquiry":
          return (
            <ConversationRow
              conversation={item.conversation}
              locale={locale}
              onOpenProfile={handleOpenProfile}
              onPress={handleInquiryPress}
            />
          );
      }
    },
    [
      candidateInquiryTitle,
      handleConversationPress,
      handleInquiryPress,
      handleOpenProfile,
      locale,
      messages,
      refresh,
      renderEmptyState,
    ]
  );

  return (
    <ScreenLayout edges={["top", "left", "right"]} className={styles.safeArea}>
      <View className={`${styles.content} flex-1`}>
        <FlatList
          contentContainerStyle={{
            paddingBottom: bottomPadding + spacing.lg,
            paddingHorizontal: spacing.lg,
          }}
          data={listItems}
          ItemSeparatorComponent={ChatInboxItemSeparator}
          keyExtractor={getChatInboxItemKey}
          keyboardShouldPersistTaps="never"
          ListEmptyComponent={renderEmptyState}
          ListHeaderComponent={listHeader}
          onScroll={handleNavigationScroll}
          refreshControl={
            <RefreshControl
              colors={[colors.primary]}
              onRefresh={() => {
                void refresh().catch(() => undefined);
              }}
              refreshing={refreshing}
              tintColor={colors.primary}
            />
          }
          renderItem={renderItem}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </ScreenLayout>
  );
}
