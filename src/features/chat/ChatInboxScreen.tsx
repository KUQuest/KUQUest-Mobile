import { useCallback, useMemo, useState } from "react";
import { useRouter, type Href } from "expo-router";
import { MessageCircle, Search, X } from "lucide-react-native";
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
import { SkeletonBlock } from "@/components/ui/LoadingSkeleton";
import { Pressable, Text, TextInput, View } from "@/tw";
import { useLocale } from "@/features/preferences/localeStore";
import { chatMessages } from "@/locales/chatMessages";
import { colors } from "@/theme/colors";
import { getAppChromeMetrics, getBottomNavigationInset } from "@/theme/layout";

import { spacing } from "@/theme/spacing";
import { getChatRouteParams } from "./chatData";
import { ChatInboxSkeleton } from "./components/ChatInboxSkeleton";
import { ConversationRow } from "./components/ConversationRow";
import type { ChatConversation } from "./chatTypes";
import styles from "./chatStyles";
import {
  useListCandidateInquiriesQuery,
  useListConversationsQuery,
} from "./api/chatQueries";

function filterChatConversations(
  items: ChatConversation[],
  query: string,
  locale: "en" | "th"
): ChatConversation[] {
  return items.filter((conversation) => {
    if (!query) return true;
    return [
      conversation.questTitle[locale],
      conversation.participantName,
      conversation.latestMessage[locale],
    ].some((value) => value.toLocaleLowerCase().includes(query));
  });
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
            {query ? (
              <Pressable
                accessibilityLabel={messages.clearSearch}
                accessibilityRole="button"
                className={styles.clearSearch}
                onPress={() => setQuery("")}
              >
                <X color={colors.textSecondary} size={20} strokeWidth={2.2} />
              </Pressable>
            ) : null}
          </View>
        </View>
        <View className={styles.sectionHeading}>
          <Text accessibilityRole="header" className={styles.sectionTitle}>
            {messages.recentConversations}
          </Text>
          {conversationsPending ? (
            <SkeletonBlock
              height={spacing.px16}
              width={spacing.px78}
              borderRadius={spacing.px4}
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
              className={styles.loadErrorAction}
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
    ({ item }: ListRenderItemInfo<ChatInboxListItem>) => {
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
            <View className={styles.inquiryHeading}>
              <View className={styles.inquiryIcon}>
                <MessageCircle
                  color={colors.support}
                  size={22}
                  strokeWidth={2}
                />
              </View>
              <Text accessibilityRole="header" className={styles.inquiryTitle}>
                {messages.candidateInquiries}
              </Text>
              <Text className={styles.inquiryCount}>
                {messages.conversationCount(item.count)}
              </Text>
            </View>
          );
        case "inquiry-error":
          return (
            <>
              <View className={styles.inquiryHeading}>
                <View className={styles.inquiryIcon}>
                  <MessageCircle
                    color={colors.support}
                    size={22}
                    strokeWidth={2}
                  />
                </View>
                <Text
                  accessibilityRole="header"
                  className={styles.inquiryTitle}
                >
                  {messages.candidateInquiries}
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
                  className={styles.loadErrorAction}
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
              inquiry
              locale={locale}
              onOpenProfile={handleOpenProfile}
              onPress={handleInquiryPress}
            />
          );
      }
    },
    [
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
            paddingHorizontal: spacing.md,
          }}
          data={listItems}
          ItemSeparatorComponent={ChatInboxItemSeparator}
          keyExtractor={getChatInboxItemKey}
          keyboardShouldPersistTaps="handled"
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
