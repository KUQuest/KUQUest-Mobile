import React, { useMemo, useState } from 'react';
import { Alert, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Camera, ChevronLeft, ClipboardCheck, Download, FileText, ImagePlus, MoreHorizontal, Paperclip, Search, Send, X } from 'lucide-react-native';

import { KeyboardAvoidingView, Pressable, SafeAreaView, ScrollView, Text, TextInput, View } from '@/tw';
import { useLocale } from '@/locales/LocaleProvider';
import { chatMessages, type ChatMessages } from '@/locales/chatMessages';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { getChatConversation, type ChatAttachment, type ChatMessage } from './chatData';
import styles from './chatStyles';
import { cn } from '@/tw/cn';

function localizedText(value: Record<'en' | 'th', string>, locale: 'en' | 'th'): string {
  return value[locale];
}

function ChatAvatar({ initials, color, name, small = false }: { initials: string; color: string; name: string; small?: boolean }) {
  return (
    <View accessible accessibilityLabel={name} className={cn(styles.avatar, small && styles.avatarSmall)} style={{ backgroundColor: color }}>
      <Text className={small ? styles.avatarSmallText : styles.avatarText}>{initials}</Text>
    </View>
  );
}

function AttachmentRow({ attachment, mine, messages, onPress }: { attachment: ChatAttachment; mine: boolean; messages: ChatMessages; onPress: () => void }) {
  return (
    <Pressable accessibilityLabel={`${messages.openFile}: ${attachment.name}`} accessibilityRole="button" className={cn(styles.attachmentBubble, !mine && styles.attachmentBubbleOther)} onPress={onPress}>
      <View className={styles.attachmentIcon}>
        {attachment.kind === 'pdf' ? <FileText color={colors.primary} size={21} strokeWidth={2.1} /> : <ImagePlus color={colors.primary} size={21} strokeWidth={2.1} />}
      </View>
      <View className={styles.attachmentCopy}>
        <Text className={styles.attachmentName} numberOfLines={1}>{attachment.name}</Text>
        <Text className={styles.attachmentMeta}>{attachment.meta}</Text>
      </View>
      <Download color={colors.primaryDeep} size={18} strokeWidth={2.1} />
    </Pressable>
  );
}

function MessageBubble({ message, conversation, locale, messages, onFilePress }: { message: ChatMessage; conversation: NonNullable<ReturnType<typeof getChatConversation>>; locale: 'en' | 'th'; messages: ChatMessages; onFilePress: (attachment: ChatAttachment) => void }) {
  const mine = message.sender === 'me';
  const text = message.text ? localizedText(message.text, locale) : undefined;
  return (
    <View className={cn(styles.messageRow, mine && styles.messageRowMe)}>
      {!mine ? <ChatAvatar initials={conversation.initials} color={conversation.avatarColor} name={conversation.participantName} small /> : null}
      <View className={cn(styles.messageStack, mine && styles.messageStackMe)}>
        {text ? <View className={cn(styles.messageBubble, mine && styles.messageBubbleMe)}><Text className={styles.messageText}>{text}</Text></View> : null}
        {message.attachment ? <AttachmentRow attachment={message.attachment} messages={messages} mine={mine} onPress={() => onFilePress(message.attachment as ChatAttachment)} /> : null}
        <Text className={styles.messageMeta}>{message.time}</Text>
      </View>
    </View>
  );
}

export default function ChatConversationScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const { locale } = useLocale();
  const insets = useSafeAreaInsets();
  const messages = chatMessages[locale];
  const conversation = getChatConversation(typeof params.id === 'string' ? params.id : undefined);
  const [conversationMessages, setConversationMessages] = useState<ChatMessage[]>(conversation?.messages ?? []);
  const [draft, setDraft] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchScope, setSearchScope] = useState<'messages' | 'files'>('messages');
  const [searchQuery, setSearchQuery] = useState('');

  const normalizedQuery = searchQuery.trim().toLocaleLowerCase();
  const searchedMessages = useMemo(() => conversationMessages.filter((message) => {
    if (!normalizedQuery) return true;
    const text = message.text ? localizedText(message.text, locale) : '';
    return `${text} ${message.attachment?.name ?? ''}`.toLocaleLowerCase().includes(normalizedQuery);
  }), [conversationMessages, locale, normalizedQuery]);
  const files = useMemo(() => conversationMessages.flatMap((message) => message.attachment ? [{ ...message.attachment, time: message.time }] : []).filter((file) => !normalizedQuery || `${file.name} ${file.meta}`.toLocaleLowerCase().includes(normalizedQuery)), [conversationMessages, normalizedQuery]);

  if (!conversation) {
    return (
      <SafeAreaView edges={['top', 'left', 'right', 'bottom']} className={styles.safeArea}>
        <View className={styles.emptyState}>
          <Text className={styles.emptyTitle}>{messages.conversationNotFound}</Text>
          <Pressable accessibilityRole="button" className="bg-ku-primary rounded-ku-pill mt-[16px] min-h-[48px] justify-center px-[20px]" onPress={() => router.replace('/chat')}>
            <Text className="text-ku-white font-ku-semibold text-ku-body-small">{messages.backToChat}</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const role = conversation.participantRole === 'owner' ? messages.questOwner : messages.questMember;
  const openAttachmentMenu = () => Alert.alert(messages.addAttachment, messages.mockAttachmentDescription, [
    { text: messages.takePhoto, onPress: () => undefined },
    { text: messages.choosePhoto, onPress: () => undefined },
    { text: messages.chooseFile, onPress: () => undefined },
    { text: messages.cancel, style: 'cancel' },
  ]);
  const sendMessage = () => {
    const value = draft.trim();
    if (!value) return;
    setConversationMessages((current) => [...current, { id: `local-${Date.now()}`, sender: 'me', text: { en: value, th: value }, time: 'Now' }]);
    setDraft('');
  };
  const openFile = (attachment: ChatAttachment) => Alert.alert(messages.openFile, `${attachment.name}\n${attachment.meta}`);

  return (
    <SafeAreaView edges={['top', 'left', 'right', 'bottom']} className={styles.safeArea}>
      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View className={styles.detailHeader}>
          <View className={styles.brandRow}>
            <Pressable accessibilityLabel={messages.backToChat} accessibilityRole="button" className={styles.backButton} onPress={() => router.back()}>
              <ChevronLeft color={colors.primaryDeep} size={24} strokeWidth={2.5} />
            </Pressable>
          </View>
          <View className={styles.identityRow}>
            <ChatAvatar initials={conversation.initials} color={conversation.avatarColor} name={conversation.participantName} />
            <View className={styles.identityCopy}>
              <Text className={styles.identityTitle} numberOfLines={1}>{localizedText(conversation.questTitle, locale)}</Text>
              <Text className={styles.identityMeta} numberOfLines={1}>{conversation.participantName} · {role}</Text>
            </View>
            <View className={styles.headerActions}>
              <Pressable accessibilityLabel={messages.search} accessibilityRole="button" className={styles.headerAction} onPress={() => { setSearchOpen(true); setSearchScope('messages'); }}>
                <Search color={colors.textStrong} size={21} strokeWidth={2.2} />
              </Pressable>
              <Pressable accessibilityLabel={messages.searchFiles} accessibilityRole="button" className={styles.headerAction} onPress={() => { setSearchOpen(true); setSearchScope('files'); }}>
                <FileText color={colors.textStrong} size={20} strokeWidth={2.1} />
              </Pressable>
              <Pressable accessibilityLabel={messages.moreOptions} accessibilityRole="button" className={styles.headerAction} onPress={() => Alert.alert(messages.moreOptions)}>
                <MoreHorizontal color={colors.textStrong} size={21} strokeWidth={2.2} />
              </Pressable>
            </View>
          </View>
        </View>

        <Pressable accessibilityLabel={messages.viewQuest} accessibilityRole="button" className={styles.contextCard} onPress={() => Alert.alert(messages.viewQuest, localizedText(conversation.questTitle, locale))}>
          <View className={styles.contextIcon}><ClipboardCheck color={colors.primary} size={21} strokeWidth={2.1} /></View>
          <View className={styles.contextCopy}>
            <Text className={styles.contextLabel}>{messages.questTeam}</Text>
            <Text className={styles.contextTitle} numberOfLines={1}>{localizedText(conversation.questTitle, locale)}</Text>
          </View>
          <View className={styles.contextAction}><Text className={styles.contextActionText}>{messages.viewQuest}</Text></View>
        </Pressable>

        {searchOpen ? (
          <View className={styles.searchPanel}>
            <View className={styles.compactSearchField}>
              <Search color={colors.textSecondary} size={20} strokeWidth={2.2} />
              <TextInput
                accessibilityLabel={messages.searchInConversation}
                autoFocus
                className={styles.compactSearchInput}
                onChangeText={setSearchQuery}
                placeholder={messages.searchInConversation}
                placeholderTextColor={colors.textFaint}
                value={searchQuery}
              />
              <Pressable accessibilityLabel={messages.closeSearch} accessibilityRole="button" className={styles.headerAction} onPress={() => { setSearchOpen(false); setSearchQuery(''); }}>
                <X color={colors.textStrong} size={19} strokeWidth={2.3} />
              </Pressable>
            </View>
            <View className={styles.scopeSwitch}>
              {(['messages', 'files'] as const).map((scope) => {
                const active = searchScope === scope;
                return <Pressable key={scope} accessibilityRole="tab" accessibilityState={{ selected: active }} className={cn(styles.scopeItem, active && styles.scopeItemActive)} onPress={() => setSearchScope(scope)}><Text className={cn(styles.scopeText, active && styles.scopeTextActive)}>{scope === 'messages' ? messages.searchMessages : messages.searchFiles}</Text></Pressable>;
              })}
            </View>
          </View>
        ) : null}

        {searchOpen ? <Text className={styles.resultMeta}>{messages.searchResultCount(searchScope === 'messages' ? searchedMessages.length : files.length, searchScope)}</Text> : null}
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: spacing.md }}>
          {searchOpen && searchScope === 'files' ? (
            files.length > 0 ? <View className={styles.fileList}>{files.map((file) => <Pressable key={`${file.name}-${file.time}`} accessibilityLabel={`${messages.openFile}: ${file.name}`} accessibilityRole="button" className={styles.fileRow} onPress={() => openFile(file)}><View className={cn(styles.fileType, file.kind === 'pdf' ? styles.fileTypePdf : styles.fileTypeImage)}><FileText color={file.kind === 'pdf' ? colors.dangerIcon : colors.primary} size={21} strokeWidth={2.1} /></View><View className={styles.fileCopy}><Text className={styles.fileName} numberOfLines={1}>{file.name}</Text><Text className={styles.fileMeta}>{file.meta} · {file.time}</Text></View><Download color={colors.textSubtle} size={18} strokeWidth={2} /></Pressable>)}</View> : <View className={styles.searchEmpty}><Text className={styles.searchEmptyText}>{messages.noFileResults}</Text></View>
          ) : searchOpen && searchedMessages.length === 0 ? (
            <View className={styles.searchEmpty}><Text className={styles.searchEmptyText}>{messages.noMessageResults}</Text></View>
          ) : (
            <View className={styles.messageContent}>
              {!searchOpen ? <View className={styles.dateSeparator}><Text className={styles.dateText}>{messages.today}</Text></View> : null}
              {searchedMessages.map((message) => <MessageBubble key={message.id} message={message} conversation={conversation} locale={locale} messages={messages} onFilePress={openFile} />)}
            </View>
          )}
        </ScrollView>

        {!searchOpen ? <View className={styles.composerWrap} style={{ paddingBottom: Math.max(insets.bottom, 8) }}>
          <View className={styles.composer}>
            <Pressable accessibilityLabel={messages.addAttachment} accessibilityRole="button" className={styles.composerButton} onPress={openAttachmentMenu}>
              <Paperclip color={colors.primary} size={21} strokeWidth={2.2} />
            </Pressable>
            <TextInput
              accessibilityLabel={messages.typeMessage}
              className={styles.composerInput}
              multiline
              onChangeText={setDraft}
              onSubmitEditing={sendMessage}
              placeholder={messages.typeMessage}
              placeholderTextColor={colors.textFaint}
              returnKeyType="send"
              value={draft}
            />
            {draft.trim() ? <Pressable accessibilityLabel={messages.send} accessibilityRole="button" className={styles.sendButton} onPress={sendMessage}><Send color={colors.white} size={19} strokeWidth={2.3} /></Pressable> : <Pressable accessibilityLabel={messages.addAttachment} accessibilityRole="button" className={styles.composerButton} onPress={openAttachmentMenu}><Camera color={colors.textStrong} size={21} strokeWidth={2.1} /></Pressable>}
          </View>
        </View> : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
