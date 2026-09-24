import { useCallback } from "react";
import { RefreshControl, type ListRenderItemInfo } from "react-native";
import { Clock3 } from "lucide-react-native";
import { Pressable, Text, View } from "@/tw";

import { QuestList } from "@/components/ui/QuestList";
import type { MyQuestMessages } from "@/locales/myQuestMessages";
import type { ThemeColors } from "@/theme/colors";
import type { QuestCardAction, QuestSummary } from "../myQuestTypes";
import type { MyQuestWorkspaceProjection } from "../myQuestWorkspaceProjection";
import { MyQuestSummaryCard } from "./MyQuestSummaryCard";
import styles from "./myQuestListStyles";

function Separator() {
  return <View className="h-ku-sm" />;
}

export function MyQuestListContent({
  messages,
  palette,
  projection,
  isLoading,
  isError,
  refreshing,
  bottomPadding,
  onRefresh,
  onOpenQuest,
  onQuestAction,
  onCancelQuest,
  cancellingQuestId,
}: {
  messages: MyQuestMessages;
  palette: ThemeColors;
  projection: MyQuestWorkspaceProjection;
  isLoading: boolean;
  isError: boolean;
  refreshing: boolean;
  bottomPadding: number;
  onRefresh: () => void;
  onOpenQuest: (quest: QuestSummary) => void;
  onQuestAction: (quest: QuestSummary, action: QuestCardAction) => void;
  onCancelQuest: (quest: QuestSummary) => void;
  cancellingQuestId: string | null;
}) {
  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<QuestSummary>) => (
      <MyQuestSummaryCard
        messages={messages}
        palette={palette}
        quest={item}
        cancelling={cancellingQuestId === item.id}
        onOpen={() => onOpenQuest(item)}
        onAction={(action) => onQuestAction(item, action)}
        onCancel={() => onCancelQuest(item)}
      />
    ),
    [
      cancellingQuestId,
      messages,
      onCancelQuest,
      onOpenQuest,
      onQuestAction,
      palette,
    ]
  );
  const keyExtractor = useCallback((item: QuestSummary) => item.id, []);

  if (isLoading) {
    return (
      <View className={styles.error}>
        <Text className={`${styles.emptyTitle} text-ku-text-secondary`}>
          {messages.loading}
        </Text>
      </View>
    );
  }

  if (isError) {
    return (
      <View className={styles.error}>
        <Text className={`${styles.errorText} text-ku-danger-dark`}>
          {messages.error}
        </Text>
        <Pressable
          accessibilityLabel={messages.retry}
          accessibilityRole="button"
          className={`${styles.emptyAction} bg-ku-primary`}
          onPress={onRefresh}
          testID="my-quest-list-retry"
        >
          <Text className={`${styles.emptyActionText} text-ku-on-primary`}>
            {messages.retry}
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <QuestList
      accessibilityLabel={`${projection.selectedTabLabel} ${messages.listTitle}`}
      className={styles.list}
      contentContainerStyle={{ paddingBottom: bottomPadding }}
      data={projection.items}
      ItemSeparatorComponent={Separator}
      keyExtractor={keyExtractor}
      ListEmptyComponent={
        <View className="min-h-[230px] items-center justify-center rounded-[16px] border border-dashed border-ku-border-subtle bg-ku-surface-muted px-ku-lg py-ku-28">
          <View className="mb-ku-10 h-[48px] w-[48px] items-center justify-center rounded-ku-pill bg-ku-surface-success">
            <Clock3 color={palette.primary} size={24} strokeWidth={2.1} />
          </View>
          <Text className={`${styles.emptyTitle} text-ku-text-strong`}>
            {projection.emptyTitle}
          </Text>
          <Text className={`${styles.emptyDescription} text-ku-text-secondary`}>
            {projection.emptyDescription}
          </Text>
        </View>
      }
      ListHeaderComponent={
        <View className={styles.listHeader}>
          <Text className={`${styles.listTitle} text-ku-text-strong`}>
            {messages.listTitle}
          </Text>
          <Text className={`${styles.listHint} text-ku-text-secondary`}>
            {messages.listHint}
          </Text>
        </View>
      }
      refreshControl={
        <RefreshControl
          onRefresh={onRefresh}
          refreshing={refreshing}
          tintColor={palette.primary}
        />
      }
      renderItem={renderItem}
      testID="my-quest-list"
    />
  );
}
