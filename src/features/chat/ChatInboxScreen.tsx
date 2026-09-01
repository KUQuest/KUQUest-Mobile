import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "expo-router";
import { MessageCircle, Search } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useWindowDimensions } from "react-native";

import { useNavigationVisibility } from "@/components/navigation/NavigationVisibilityContext";
import { useAuthEnvironment } from "@/features/auth/authEnvironment";
import {
  LoadingSkeleton,
  SkeletonBlock,
} from "@/components/ui/LoadingSkeleton";
import {
  DEFAULT_PROTOTYPE_VIEWER_ID,
  questWorkflow,
} from "@/features/questBoard/questWorkflow";
import {
  ScrollView,
  Pressable,
  SafeAreaView,
  Text,
  TextInput,
  View,
} from "@/tw";
import { useLocale } from "@/locales/LocaleProvider";
import { chatMessages } from "@/locales/chatMessages";
import { colors } from "@/theme/colors";
import { getAppChromeMetrics } from "@/theme/layout";
import { spacing } from "@/theme/spacing";
import { getChatRouteParams } from "./chatData";
import type { ChatConversation } from "./chatTypes";
import styles from "./chatStyles";

function localizedText(
  value: Record<"en" | "th", string>,
  locale: "en" | "th"
): string {
  return value[locale];
}

function ConversationAvatar({
  conversation,
}: {
  conversation: ChatConversation;
}) {
  return (
    <View
      accessible
      accessibilityLabel={conversation.participantName}
      className={styles.avatar}
      style={{ backgroundColor: conversation.avatarColor }}
    >
      <Text className={styles.avatarText}>{conversation.initials}</Text>
    </View>
  );
}

function ConversationRow({
  conversation,
  locale,
  onPress,
}: {
  conversation: ChatConversation;
  locale: "en" | "th";
  onPress: () => void;
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
      onPress={onPress}
      testID={`chat-conversation-${conversation.id}`}
    >
      <ConversationAvatar conversation={conversation} />
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
}

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

type InboxLoadState = {
  viewerId: string;
  status: "pending" | "settled" | "error";
  conversations: ChatConversation[];
};

export default function ChatInboxScreen({ viewerId }: ChatInboxScreenProps) {
  const router = useRouter();
  const { locale } = useLocale();
  const { activePersonaId } = useAuthEnvironment();
  const { width, fontScale } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const messages = chatMessages[locale];
  const chromeMetrics = getAppChromeMetrics(width, fontScale);
  const { handleScroll } = useNavigationVisibility();
  const [query, setQuery] = useState("");
  const resolvedViewerId =
    viewerId?.trim() || activePersonaId || DEFAULT_PROTOTYPE_VIEWER_ID;
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [loadState, setLoadState] = useState<InboxLoadState>(() => ({
    viewerId: resolvedViewerId,
    status: "pending",
    conversations: [],
  }));
  useEffect(() => {
    let active = true;
    const loadConversations = () => {
      try {
        const nextConversations =
          questWorkflow.listConversations(resolvedViewerId);
        if (active)
          setLoadState({
            viewerId: resolvedViewerId,
            status: "settled",
            conversations: nextConversations,
          });
      } catch {
        if (active)
          setLoadState({
            viewerId: resolvedViewerId,
            status: "error",
            conversations: [],
          });
      }
    };
    loadConversations();
    const unsubscribe = questWorkflow.subscribe(loadConversations);
    return () => {
      active = false;
      unsubscribe();
    };
  }, [loadAttempt, resolvedViewerId]);
  const bottomPadding =
    (chromeMetrics.isTablet ? 0 : chromeMetrics.navHeight + insets.bottom) +
    spacing.lg;
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const loadStateForViewer =
    loadState.viewerId === resolvedViewerId
      ? loadState
      : {
          viewerId: resolvedViewerId,
          status: "pending" as const,
          conversations: [],
        };
  const conversationsPending = loadStateForViewer.status === "pending";
  const conversationsLoadFailed = loadStateForViewer.status === "error";
  const conversations = useMemo(
    () =>
      loadStateForViewer.conversations.filter((conversation) => {
        if (!normalizedQuery) return true;
        return [
          localizedText(conversation.questTitle, locale),
          conversation.participantName,
          localizedText(conversation.latestMessage, locale),
        ].some((value) => value.toLocaleLowerCase().includes(normalizedQuery));
      }),
    [loadStateForViewer.conversations, locale, normalizedQuery]
  );

  return (
    <SafeAreaView edges={["top", "left", "right"]} className={styles.safeArea}>
      <ScrollView
        onScroll={handleScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: bottomPadding }}
      >
        <View className={styles.content}>
          <View className={styles.listContent}>
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
                <Text className={styles.loadErrorTitle}>
                  {messages.loadError}
                </Text>
                <Pressable
                  accessibilityRole="button"
                  className={styles.loadErrorAction}
                  onPress={() => {
                    setLoadState({
                      viewerId: resolvedViewerId,
                      status: "pending",
                      conversations: [],
                    });
                    setLoadAttempt((attempt) => attempt + 1);
                  }}
                >
                  <Text className={styles.loadErrorActionText}>
                    {messages.retry}
                  </Text>
                </Pressable>
              </View>
            ) : conversationsPending ? (
              <ChatInboxSkeleton loadingLabel={messages.loading} />
            ) : conversations.length > 0 ? (
              <View className={styles.conversationList}>
                {conversations.map((conversation) => (
                  <ConversationRow
                    key={conversation.id}
                    conversation={conversation}
                    locale={locale}
                    onPress={() =>
                      router.push({
                        pathname: "/chat/[id]",
                        params: getChatRouteParams({
                          conversationId: conversation.id,
                          questId: conversation.questId,
                          viewerId: resolvedViewerId,
                        }),
                      })
                    }
                  />
                ))}
              </View>
            ) : (
              <View className={styles.emptyState}>
                <View className={styles.emptyIcon}>
                  <MessageCircle
                    color={colors.primary}
                    size={30}
                    strokeWidth={1.9}
                  />
                </View>
                <Text className={styles.emptyTitle}>
                  {normalizedQuery
                    ? messages.noSearchResults
                    : messages.noConversations}
                </Text>
                <Text className={styles.emptyDescription}>
                  {messages.subtitle}
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
