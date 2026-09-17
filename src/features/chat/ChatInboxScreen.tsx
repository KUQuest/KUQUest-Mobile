import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useFocusEffect, useRouter, type Href } from "expo-router";
import { MessageCircle, Search } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { RefreshControl, useWindowDimensions } from "react-native";

import { ScreenLayout } from "@/components/layout/ScreenLayout";
import { useNavigationVisibility } from "@/components/navigation/NavigationVisibilityContext";
import { authService } from "@/features/auth/AuthService";
import {
  LoadingSkeleton,
  SkeletonBlock,
} from "@/components/ui/LoadingSkeleton";
import { ScrollView, Pressable, Text, TextInput, View } from "@/tw";
import { useLocale } from "@/locales/LocaleProvider";
import { chatMessages } from "@/locales/chatMessages";
import { colors } from "@/theme/colors";
import { getAppChromeMetrics, getBottomNavigationInset } from "@/theme/layout";
import { spacing } from "@/theme/spacing";
import { getChatRouteParams } from "./chatData";
import type { ChatConversation } from "./chatTypes";
import styles from "./chatStyles";
import { chatApi, serverConversationToChatConversation } from "@/api/ChatApi";
import { useCalmRefresh } from "@/hooks/useCalmRefresh";
import type { ServerCandidateInquiry } from "@/api/ChatApi";

function localizedText(
  value: Record<"en" | "th", string>,
  locale: "en" | "th"
): string {
  return value[locale];
}

function candidateInquiryToConversation(
  inquiry: ServerCandidateInquiry,
  viewerId: string
): ChatConversation {
  const otherParticipant =
    inquiry.participants.find((participant) => participant.id !== viewerId) ??
    inquiry.participants.find((participant) => participant.role === "HIRER");
  const title = { en: inquiry.quest.title, th: inquiry.quest.title };
  const preview = inquiry.latestMessage?.preview ?? "";
  const participantName = otherParticipant?.displayName ?? inquiry.quest.title;
  const latestTime = inquiry.latestMessage?.createdAt
    ? new Date(inquiry.latestMessage.createdAt).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";
  return {
    id: inquiry.id,
    questId: inquiry.quest.id,
    questTitle: title,
    participantName,
    participantRole: "owner",
    initials: participantName.slice(0, 2).toUpperCase(),
    avatarColor: "#208AEF",
    latestMessage: { en: preview, th: preview },
    latestTime,
    unreadCount: inquiry.unreadCount,
    messages: [],
    capability: {
      conversationId: inquiry.id,
      canRead: true,
      canWrite: inquiry.state === "INQUIRY_OPEN",
      readOnly: inquiry.state !== "INQUIRY_OPEN",
    },
  };
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
  candidateInquiries: ChatConversation[];
  inquiryStatus: "pending" | "settled" | "error";
};
export default function ChatInboxScreen({ viewerId }: ChatInboxScreenProps) {
  const router = useRouter();
  const { locale } = useLocale();
  const { width, fontScale } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const messages = chatMessages[locale];
  const chromeMetrics = getAppChromeMetrics(width, fontScale);
  const { handleScroll } = useNavigationVisibility();
  const [query, setQuery] = useState("");
  const [sessionUserId, setSessionUserId] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    void authService
      .getSession()
      .then((session) => {
        if (active && session?.user?.id) setSessionUserId(session.user.id);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);
  const resolvedViewerId = viewerId || sessionUserId || "";
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const [loadState, setLoadState] = useState<InboxLoadState>(() => ({
    viewerId: resolvedViewerId,
    status: "pending",
    conversations: [],
    candidateInquiries: [],
    inquiryStatus: "pending",
  }));
  const resolvedViewerIdRef = useRef(resolvedViewerId);
  useEffect(() => {
    resolvedViewerIdRef.current = resolvedViewerId;
  }, [resolvedViewerId]);
  const loadConversations = useCallback(async () => {
    const [workResult, inquiryResult] = await Promise.allSettled([
      chatApi.listConversations({ limit: 20 }),
      chatApi.listCandidateInquiries({ limit: 20 }),
    ]);
    if (workResult.status === "rejected") {
      if (resolvedViewerIdRef.current === resolvedViewerId) {
        setLoadState((current) =>
          current.viewerId === resolvedViewerId &&
          (current.conversations.length > 0 ||
            current.candidateInquiries.length > 0)
            ? current
            : {
                viewerId: resolvedViewerId,
                status: "error",
                conversations: [],
                candidateInquiries: [],
                inquiryStatus: "error",
              }
        );
      }
      throw workResult.reason;
    }
    const inquiryStatus =
      inquiryResult.status === "fulfilled"
        ? ("settled" as const)
        : ("error" as const);
    const candidateInquiries =
      inquiryResult.status === "fulfilled"
        ? inquiryResult.value.items.map((inquiry) =>
            candidateInquiryToConversation(inquiry, resolvedViewerId)
          )
        : [];
    const workConversations = workResult.value.items.map((conversation) =>
      serverConversationToChatConversation(conversation, resolvedViewerId)
    );
    if (resolvedViewerIdRef.current === resolvedViewerId) {
      setLoadState({
        viewerId: resolvedViewerId,
        status: "settled",
        conversations: workConversations,
        candidateInquiries,
        inquiryStatus,
      });
    }
    return {
      work: workResult.value,
      candidateInquiries,
      inquiryStatus,
    };
  }, [resolvedViewerId, setLoadState]);
  const { refreshing, refresh, refreshOnFocus } =
    useCalmRefresh(loadConversations);
  useEffect(() => {
    void refresh(true).catch(() => undefined);
  }, [refresh, resolvedViewerId]);
  useFocusEffect(
    useCallback(() => {
      refreshOnFocus();
    }, [refreshOnFocus])
  );
  const bottomPadding =
    getBottomNavigationInset(chromeMetrics, insets.bottom) + spacing.lg;
  const loadStateForViewer =
    loadState.viewerId === resolvedViewerId
      ? loadState
      : {
          viewerId: resolvedViewerId,
          status: "pending" as const,
          conversations: [],
          candidateInquiries: [],
          inquiryStatus: "pending" as const,
        };
  const inquiryLoadFailed = loadStateForViewer.inquiryStatus === "error";
  const conversationsPending = loadStateForViewer.status === "pending";
  const conversationsLoadFailed = loadStateForViewer.status === "error";
  const conversations = useMemo(
    () =>
      filterChatConversations(
        loadStateForViewer.conversations,
        normalizedQuery,
        locale
      ),
    [loadStateForViewer.conversations, locale, normalizedQuery]
  );
  const candidateInquiryTitle =
    locale === "th"
      ? "การสอบถามก่อนเริ่มงาน · Inquiry"
      : "Candidate inquiries · Inquiry";
  const candidateInquiries = useMemo(
    () =>
      filterChatConversations(
        loadStateForViewer.candidateInquiries,
        normalizedQuery,
        locale
      ),
    [loadStateForViewer.candidateInquiries, locale, normalizedQuery]
  );

  return (
    <ScreenLayout edges={["top", "left", "right"]} className={styles.safeArea}>
      <ScrollView
        onScroll={handleScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: bottomPadding }}
        refreshControl={
          <RefreshControl
            colors={[colors.primary]}
            onRefresh={() => {
              void refresh(true).catch(() => undefined);
            }}
            refreshing={refreshing}
            tintColor={colors.primary}
          />
        }
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
                  onPress={() => {
                    setLoadState({
                      viewerId: resolvedViewerId,
                      status: "pending",
                      conversations: [],
                      candidateInquiries: [],
                      inquiryStatus: "pending",
                    });
                    void refresh(true).catch(() => undefined);
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
            {inquiryLoadFailed ? (
              <>
                <View className={styles.sectionHeading}>
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
                      setLoadState((current) => ({
                        ...current,
                        inquiryStatus: "pending",
                      }));
                      void refresh(true).catch(() => undefined);
                    }}
                  >
                    <Text className={styles.loadErrorActionText}>
                      {messages.retry}
                    </Text>
                  </Pressable>
                </View>
              </>
            ) : candidateInquiries.length > 0 ? (
              <>
                <View className={styles.sectionHeading}>
                  <Text
                    accessibilityRole="header"
                    className={styles.sectionTitle}
                  >
                    {candidateInquiryTitle}
                  </Text>
                  <Text className={styles.sectionCount}>
                    {messages.conversationCount(candidateInquiries.length)}
                  </Text>
                </View>
                <View className={styles.conversationList}>
                  {candidateInquiries.map((conversation) => (
                    <ConversationRow
                      key={`inquiry-${conversation.id}`}
                      conversation={conversation}
                      locale={locale}
                      onPress={() =>
                        router.push({
                          pathname: "/quest/[id]/inquiry/[conversationId]",
                          params: {
                            id: conversation.questId ?? "",
                            conversationId: conversation.id,
                            viewerId: resolvedViewerId,
                          },
                        } as unknown as Href)
                      }
                    />
                  ))}
                </View>
              </>
            ) : null}
          </View>
        </View>
      </ScrollView>
    </ScreenLayout>
  );
}
