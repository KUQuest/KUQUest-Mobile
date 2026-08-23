import React, { useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { MessageCircle, Search } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useWindowDimensions } from 'react-native';

import { ScrollView, Pressable, SafeAreaView, Text, TextInput, View } from '@/tw';
import { useLocale } from '@/locales/LocaleProvider';
import { chatMessages } from '@/locales/chatMessages';
import { colors } from '@/theme/colors';
import { getAppChromeMetrics } from '@/theme/layout';
import { spacing } from '@/theme/spacing';
import { mockChatConversations, type ChatConversation } from './chatData';
import styles from './chatStyles';

function localizedText(value: Record<'en' | 'th', string>, locale: 'en' | 'th'): string {
  return value[locale];
}

function ConversationAvatar({ conversation }: { conversation: ChatConversation }) {
  return (
    <View accessible accessibilityLabel={conversation.participantName} className={styles.avatar} style={{ backgroundColor: conversation.avatarColor }}>
      <Text className={styles.avatarText}>{conversation.initials}</Text>
    </View>
  );
}

function ConversationRow({ conversation, locale, onPress }: { conversation: ChatConversation; locale: 'en' | 'th'; onPress: () => void }) {
  const messages = chatMessages[locale];
  const role = conversation.participantRole === 'owner' ? messages.questOwner : messages.questMember;
  const accessibilityLabel = [
    localizedText(conversation.questTitle, locale),
    conversation.participantName,
    role,
    localizedText(conversation.latestMessage, locale),
    conversation.unreadCount > 0 ? messages.unreadCount(conversation.unreadCount) : undefined,
  ].filter(Boolean).join('. ');

  return (
    <Pressable accessibilityLabel={accessibilityLabel} accessibilityRole="button" className={styles.conversationRow} onPress={onPress} testID={`chat-conversation-${conversation.id}`}>
      <ConversationAvatar conversation={conversation} />
      <View className={styles.rowCopy}>
        <Text className={styles.questTitle} numberOfLines={1}>{localizedText(conversation.questTitle, locale)}</Text>
        <Text className={styles.participant} numberOfLines={1}>{conversation.participantName} · {role}</Text>
        <Text className={styles.latestMessage} numberOfLines={1}>{localizedText(conversation.latestMessage, locale)}</Text>
      </View>
      <View className={styles.rowMeta}>
        <Text className={styles.rowTime}>{conversation.latestTime}</Text>
        {conversation.unreadCount > 0 ? <View accessibilityLabel={messages.unreadCount(conversation.unreadCount)} className={styles.unreadBadge}><Text className={styles.unreadText}>{conversation.unreadCount}</Text></View> : null}
      </View>
    </Pressable>
  );
}

export default function ChatInboxScreen() {
  const router = useRouter();
  const { locale } = useLocale();
  const { width, fontScale } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const messages = chatMessages[locale];
  const chromeMetrics = getAppChromeMetrics(width, fontScale);
  const [query, setQuery] = useState('');
  const bottomPadding = (chromeMetrics.isTablet ? 0 : chromeMetrics.navHeight + insets.bottom) + spacing.lg;
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const conversations = useMemo(() => mockChatConversations.filter((conversation) => {
    if (!normalizedQuery) return true;
    return [
      localizedText(conversation.questTitle, locale),
      conversation.participantName,
      localizedText(conversation.latestMessage, locale),
    ].some((value) => value.toLocaleLowerCase().includes(normalizedQuery));
  }), [locale, normalizedQuery]);

  return (
    <SafeAreaView edges={['top', 'left', 'right']} className={styles.safeArea}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: bottomPadding }}>
        <View className={styles.content}>
          <View className={styles.listContent}>
            <View className={styles.intro}>
              <Text accessibilityRole="header" className={styles.title}>{messages.title}</Text>
              <Text className={styles.subtitle}>{messages.subtitle}</Text>
              <View className={styles.searchField}>
                <View className={styles.searchIcon}><Search color={colors.textSecondary} size={21} strokeWidth={2.2} /></View>
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
              <Text accessibilityRole="header" className={styles.sectionTitle}>{messages.recentConversations}</Text>
              <Text className={styles.sectionCount}>{messages.conversationCount(conversations.length)}</Text>
            </View>
            {conversations.length > 0 ? (
              <View className={styles.conversationList}>
                {conversations.map((conversation) => (
                  <ConversationRow
                    key={conversation.id}
                    conversation={conversation}
                    locale={locale}
                    onPress={() => router.push({ pathname: '/chat/[id]', params: { id: conversation.id } })}
                  />
                ))}
              </View>
            ) : (
              <View className={styles.emptyState}>
                <View className={styles.emptyIcon}><MessageCircle color={colors.primary} size={30} strokeWidth={1.9} /></View>
                <Text className={styles.emptyTitle}>{normalizedQuery ? messages.noSearchResults : messages.noConversations}</Text>
                <Text className={styles.emptyDescription}>{messages.subtitle}</Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
