import { useCallback, useMemo, useRef } from "react";
import {
  RefreshControl,
  type ListRenderItemInfo,
  type FlatList as NativeFlatList,
} from "react-native";

import { showErrorAlert } from "@/components/ui/SweetAlert";
import {
  Camera,
  ChevronLeft,
  CircleAlert,
  ClipboardCheck,
  Download,
  FileText,
  Paperclip,
  Search,
  Send,
  X,
} from "lucide-react-native";

import {
  FlatList,
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "@/tw";
import { useAppTheme } from "@/features/workspace/AppThemeProvider";
import { spacing } from "@/theme/spacing";
import styles from "./chatStyles";
import { cn } from "@/tw/cn";
import { ScreenLayout } from "@/components/layout/ScreenLayout";
import { ImageViewerModal } from "@/components/ui/ImageViewerModal";
import {
  ChatAvatar,
  ChatConversationSkeleton,
  localizedText,
} from "./components/ChatConversationPresentation";
import { MessageBubble } from "./components/MessageBubble";
import { PendingAttachmentsBar } from "./components/PendingAttachmentsBar";
import type { DisplayChatMessage } from "./domain/conversationModule";
import {
  MAX_MESSAGE_LENGTH,
  useChatConversationController,
} from "./workflow/useChatConversationController";
import type { ConversationMode } from "./workflow/useChatConversationController";

export interface ChatConversationScreenProps {
  conversationType?: ConversationMode;
}

export default function ChatConversationScreen({
  conversationType = "WORK",
}: ChatConversationScreenProps = {}) {
  const { colors } = useAppTheme();
  const controller = useChatConversationController(conversationType);
  const {
    router,
    locale,
    messages,
    viewerId,
    conversationPending,
    conversationLoadFailed,
    conversation,
    refreshing,
    refresh,
    retryLoad,
    conversationKind,
    canWrite,
    readOnlyDescription,
    messagePlaceholder,
    canReportConversation,
    handleReportConversation,
    searchOpen,
    setSearchOpen,
    searchScope,
    setSearchScope,
    searchQuery,
    setSearchQuery,
    searchedMessages,
    files,
    draft,
    setDraft,
    pendingAttachments,
    pendingAttachmentIds,
    handleRemovePendingAttachment,
    openAttachmentMenu,
    sendMessage,
    viewerState,
    setViewerState,
    handleImagePress,
    openFile,
  } = controller;
  const messageListRef = useRef<NativeFlatList<DisplayChatMessage>>(null);
  const lastMessageIdRef = useRef<string | null>(null);
  const handleMessageListContentSizeChange = useCallback(() => {
    if (searchOpen) return;
    const latestMessageId = searchedMessages.at(-1)?.id;
    if (!latestMessageId || latestMessageId === lastMessageIdRef.current) {
      return;
    }
    const animated = lastMessageIdRef.current !== null;
    lastMessageIdRef.current = latestMessageId;
    messageListRef.current?.scrollToEnd({ animated });
  }, [searchOpen, searchedMessages]);
  const participantId = conversation?.participantId;
  const openParticipantProfile = useMemo(
    () =>
      participantId
        ? () => router.push(`/profile/${participantId}`)
        : undefined,
    [participantId, router]
  );
  const renderMessage = useCallback(
    ({ item }: ListRenderItemInfo<DisplayChatMessage>) => {
      if (!conversation) return null;
      return (
        <MessageBubble
          message={item}
          conversation={conversation}
          locale={locale}
          messages={messages}
          onFilePress={openFile}
          onImagePress={handleImagePress}
          onProfilePress={openParticipantProfile}
          isCandidateInquiry={conversationType === "CANDIDATE_INQUIRY"}
        />
      );
    },
    [
      conversation,
      conversationType,
      handleImagePress,
      locale,
      messages,
      openFile,
      openParticipantProfile,
    ]
  );

  if (conversationPending) {
    return (
      <ChatConversationSkeleton
        loadingLabel={messages.loading}
        backLabel={messages.backToChat}
        onBack={() => router.back()}
      />
    );
  }

  if (conversationLoadFailed) {
    return (
      <ScreenLayout
        edges={["top", "left", "right", "bottom"]}
        className={styles.safeArea}
      >
        <View className={styles.detailHeader}>
          <View className={styles.brandRow}>
            <Pressable
              accessibilityLabel={messages.backToChat}
              accessibilityRole="button"
              className={styles.backButton}
              onPress={() => router.back()}
            >
              <ChevronLeft
                color={colors.primaryDeep}
                size={24}
                strokeWidth={2.5}
              />
            </Pressable>
          </View>
        </View>
        <View accessibilityRole="alert" className={styles.emptyState}>
          <Text className={styles.emptyTitle}>{messages.loadError}</Text>
          <Pressable
            accessibilityRole="button"
            className={styles.loadErrorAction}
            onPress={retryLoad}
          >
            <Text className={styles.loadErrorActionText}>{messages.retry}</Text>
          </Pressable>
        </View>
      </ScreenLayout>
    );
  }

  if (!conversation) {
    return (
      <ScreenLayout
        edges={["top", "left", "right", "bottom"]}
        className={styles.safeArea}
      >
        <View className={styles.emptyState}>
          <Text className={styles.emptyTitle}>
            {messages.conversationNotFound}
          </Text>
          <Pressable
            accessibilityRole="button"
            className="mt-ku-md min-h-[48px] justify-center rounded-ku-pill bg-ku-primary px-ku-20"
            onPress={() => router.replace("/chat")}
          >
            <Text className="font-ku-semibold text-ku-body-small text-ku-on-primary">
              {messages.backToChat}
            </Text>
          </Pressable>
        </View>
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout
      edges={["top", "left", "right", "bottom"]}
      className={styles.safeArea}
    >
      <KeyboardAvoidingView className="flex-1" behavior="padding">
        <View className={styles.detailHeader}>
          <View className={styles.brandRow}>
            <Pressable
              accessibilityLabel={messages.backToChat}
              accessibilityRole="button"
              className={styles.backButton}
              onPress={() => router.back()}
            >
              <ChevronLeft
                color={colors.primaryDeep}
                size={24}
                strokeWidth={2.5}
              />
            </Pressable>
            <ChatAvatar
              initials={conversation.initials}
              color={conversation.avatarColor}
              name={conversation.participantName}
              profileId={conversation.participantId}
              avatarUrl={conversation.participantAvatarUrl}
              avatarFileId={conversation.participantAvatarFileId}
              onPress={openParticipantProfile}
            />
            <View className={styles.identityCopy}>
              <Text className={styles.identityTitle} numberOfLines={1}>
                {localizedText(conversation.questTitle, locale)}
              </Text>
              <Text className={styles.identityMeta} numberOfLines={1}>
                {conversation.participantName}
              </Text>
            </View>
          </View>
        </View>

        <Pressable
          accessibilityLabel={messages.viewQuest}
          accessibilityRole="button"
          className={styles.contextCard}
          onPress={() => {
            if (!conversation.questId) {
              showErrorAlert(
                messages.viewQuest,
                locale === "th"
                  ? "ไม่พบบริบทเควสต์สำหรับการนำทาง"
                  : "Quest context is unavailable for navigation."
              );
              return;
            }
            router.push(
              conversationType === "CANDIDATE_INQUIRY"
                ? {
                    pathname: "/quest/[id]",
                    params: { id: conversation.questId },
                  }
                : {
                    pathname: "/quest/[id]/work",
                    params: { id: conversation.questId, viewerId },
                  }
            );
          }}
        >
          <View className={styles.contextIcon}>
            <ClipboardCheck
              color={colors.primary}
              size={21}
              strokeWidth={2.1}
            />
          </View>
          <View className={styles.contextCopy}>
            <Text className={styles.contextLabel}>
              {conversationKind} · {messages.questTeam}
            </Text>
            <Text className={styles.contextTitle} numberOfLines={1}>
              {localizedText(conversation.questTitle, locale)}
            </Text>
          </View>
          <View className={styles.contextAction}>
            <Text className={styles.contextActionText}>
              {messages.viewQuest}
            </Text>
          </View>
        </Pressable>
        {canReportConversation ? (
          <Pressable
            accessibilityLabel={messages.reportConversation}
            accessibilityRole="button"
            className={styles.reportAction}
            onPress={handleReportConversation}
            testID="chat-report-button"
          >
            <View className={styles.reportActionIcon}>
              <CircleAlert color={colors.danger} size={20} strokeWidth={2.2} />
            </View>
            <View className={styles.reportActionCopy}>
              <Text className={styles.reportActionText}>
                {messages.reportConversation}
              </Text>
              <Text className={styles.reportActionDescription}>
                {messages.reportConversationDescription}
              </Text>
            </View>
          </Pressable>
        ) : null}
        {!canWrite ? (
          <View
            accessibilityRole="alert"
            className={styles.readOnlyBanner}
            testID="conversation-read-only-banner"
          >
            <Text className={styles.readOnlyBannerTitle}>
              {messages.conversationReadOnly}
            </Text>
            <Text className={styles.readOnlyBannerText}>
              {readOnlyDescription}
            </Text>
          </View>
        ) : null}

        {searchOpen ? (
          <View className={styles.searchPanel}>
            <View className={styles.compactSearchField}>
              <Search
                color={colors.textSecondary}
                size={20}
                strokeWidth={2.2}
              />
              <TextInput
                accessibilityLabel={messages.searchInConversation}
                autoFocus
                className={styles.compactSearchInput}
                onChangeText={setSearchQuery}
                placeholder={messages.searchInConversation}
                placeholderTextColor={colors.textFaint}
                value={searchQuery}
              />
              <Pressable
                accessibilityLabel={messages.closeSearch}
                accessibilityRole="button"
                className={styles.headerAction}
                onPress={() => {
                  setSearchOpen(false);
                  setSearchQuery("");
                }}
              >
                <X color={colors.textStrong} size={19} strokeWidth={2.3} />
              </Pressable>
            </View>
            <View className={styles.scopeSwitch}>
              {(["messages", "files"] as const).map((scope) => {
                const active = searchScope === scope;
                return (
                  <Pressable
                    key={scope}
                    accessibilityRole="tab"
                    accessibilityState={{ selected: active }}
                    className={cn(
                      styles.scopeItem,
                      active && styles.scopeItemActive
                    )}
                    onPress={() => setSearchScope(scope)}
                  >
                    <Text
                      className={cn(
                        styles.scopeText,
                        active && styles.scopeTextActive
                      )}
                    >
                      {scope === "messages"
                        ? messages.searchMessages
                        : messages.searchFiles}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ) : null}

        {searchOpen ? (
          <Text className={styles.resultMeta}>
            {messages.searchResultCount(
              searchScope === "messages"
                ? searchedMessages.length
                : files.length,
              searchScope
            )}
          </Text>
        ) : null}
        {searchOpen && searchScope === "files" ? (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: spacing.md }}
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
          >
            {files.length > 0 ? (
              <View className={styles.fileList}>
                {files.map((file) => (
                  <Pressable
                    key={`${file.name}-${file.time}`}
                    accessibilityLabel={`${messages.openFile}: ${file.name}`}
                    accessibilityRole="button"
                    className={styles.fileRow}
                    onPress={() => openFile(file)}
                  >
                    <View
                      className={cn(
                        styles.fileType,
                        file.kind === "pdf"
                          ? styles.fileTypePdf
                          : styles.fileTypeImage
                      )}
                    >
                      <FileText
                        color={
                          file.kind === "pdf"
                            ? colors.dangerIcon
                            : colors.primary
                        }
                        size={21}
                        strokeWidth={2.1}
                      />
                    </View>
                    <View className={styles.fileCopy}>
                      <Text className={styles.fileName} numberOfLines={1}>
                        {file.name}
                      </Text>
                      <Text className={styles.fileMeta}>
                        {file.meta} · {file.time}
                      </Text>
                    </View>
                    <Download
                      color={colors.textSubtle}
                      size={18}
                      strokeWidth={2}
                    />
                  </Pressable>
                ))}
              </View>
            ) : (
              <View className={styles.searchEmpty}>
                <Text className={styles.searchEmptyText}>
                  {messages.noFileResults}
                </Text>
              </View>
            )}
          </ScrollView>
        ) : (
          <FlatList
            ref={messageListRef}
            testID="chat-message-list"
            contentContainerClassName={
              searchOpen && searchedMessages.length === 0
                ? "pb-ku-md"
                : styles.messageContent
            }
            data={searchedMessages}
            onContentSizeChange={handleMessageListContentSizeChange}
            onLayout={() => {
              // Keyboard show/hide resizes the list; keep the newest message in view.
              if (!searchOpen) messageListRef.current?.scrollToEnd();
            }}
            keyExtractor={(message) => message.id}
            ListEmptyComponent={
              searchOpen ? (
                <View className={styles.searchEmpty}>
                  <Text className={styles.searchEmptyText}>
                    {messages.noMessageResults}
                  </Text>
                </View>
              ) : null
            }
            ListHeaderComponent={
              !searchOpen ? (
                <View className={styles.dateSeparator}>
                  <Text className={styles.dateText}>{messages.today}</Text>
                </View>
              ) : null
            }
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
            renderItem={renderMessage}
            showsVerticalScrollIndicator={false}
          />
        )}

        {!searchOpen && canWrite ? (
          <View className="bg-ku-background">
            <PendingAttachmentsBar
              attachments={pendingAttachments}
              onRemove={handleRemovePendingAttachment}
            />
            <View
              className={cn(
                styles.composerWrap,
                pendingAttachments.length > 0 && "border-t-0 pt-ku-xs"
              )}
            >
              <View className={styles.composer}>
                <Pressable
                  accessibilityLabel={messages.addAttachment}
                  accessibilityRole="button"
                  className={styles.composerButton}
                  onPress={openAttachmentMenu}
                >
                  <Paperclip
                    color={colors.primary}
                    size={21}
                    strokeWidth={2.2}
                  />
                </Pressable>
                <TextInput
                  accessibilityLabel={messagePlaceholder}
                  className={styles.composerInput}
                  multiline
                  onChangeText={setDraft}
                  onSubmitEditing={sendMessage}
                  placeholder={messagePlaceholder}
                  placeholderTextColor={colors.textFaint}
                  returnKeyType="send"
                  value={draft}
                />
                <Text
                  accessibilityLiveRegion="polite"
                  className={styles.composerCounter}
                  style={{
                    color:
                      draft.length > MAX_MESSAGE_LENGTH
                        ? colors.danger
                        : colors.textSubtle,
                  }}
                >
                  {draft.length}/{MAX_MESSAGE_LENGTH}
                </Text>
                {draft.trim() ||
                pendingAttachmentIds.length > 0 ||
                pendingAttachments.length > 0 ? (
                  <Pressable
                    accessibilityLabel={messages.send}
                    accessibilityRole="button"
                    className={styles.sendButton}
                    onPress={sendMessage}
                  >
                    <Send
                      color={colors.onPrimary}
                      size={19}
                      strokeWidth={2.3}
                    />
                  </Pressable>
                ) : (
                  <Pressable
                    accessibilityLabel={messages.addAttachment}
                    accessibilityRole="button"
                    className={styles.composerButton}
                    onPress={openAttachmentMenu}
                  >
                    <Camera
                      color={colors.textStrong}
                      size={21}
                      strokeWidth={2.1}
                    />
                  </Pressable>
                )}
              </View>
            </View>
          </View>
        ) : null}
      </KeyboardAvoidingView>
      <ImageViewerModal
        visible={viewerState.visible}
        closeLabel={messages.close}
        imageAccessibilityLabel={viewerState.name ?? messages.attachment}
        imageUrl={viewerState.url}
        fileName={viewerState.name}
        timestamp={viewerState.timestamp}
        onClose={() => setViewerState({ visible: false, url: null })}
      />
    </ScreenLayout>
  );
}
