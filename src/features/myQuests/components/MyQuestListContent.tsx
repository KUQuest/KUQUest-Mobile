import { useCallback, type ReactNode } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  type ListRenderItemInfo,
} from "react-native";
import { BriefcaseBusiness } from "lucide-react-native";
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
  header,
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
  header: ReactNode;
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
      <View className="w-full max-w-[720px] self-center px-ku-lg">
        <MyQuestSummaryCard
          messages={messages}
          palette={palette}
          quest={item}
          cancelling={cancellingQuestId === item.id}
          onOpen={() => onOpenQuest(item)}
          onAction={(action) => onQuestAction(item, action)}
          onCancel={() => onCancelQuest(item)}
        />
      </View>
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

  return (
    <QuestList
      accessibilityLabel={`${projection.selectedTabLabel} ${messages.listTitle}`}
      className={styles.list}
      contentContainerStyle={{ paddingBottom: bottomPadding }}
      data={isLoading || isError ? [] : projection.items}
      ItemSeparatorComponent={Separator}
      keyExtractor={keyExtractor}
      ListEmptyComponent={
        <View className="w-full max-w-[720px] self-center px-ku-lg py-ku-48">
          {isLoading ? (
            <View className="items-center">
              <ActivityIndicator
                accessibilityLabel={messages.loading}
                color={palette.primary}
              />
              <Text className="mt-ku-md font-ku-medium text-ku-body-small text-ku-text-secondary">
                {messages.loading}
              </Text>
            </View>
          ) : isError ? (
            <View className="items-center">
              <Text
                accessibilityRole="alert"
                className={`${styles.errorText} text-ku-danger-dark`}
              >
                {messages.error}
              </Text>
              <Pressable
                accessibilityLabel={messages.retry}
                accessibilityRole="button"
                className={`${styles.emptyAction} bg-ku-primary`}
                onPress={onRefresh}
                testID="my-quest-list-retry"
              >
                <Text
                  className={`${styles.emptyActionText} text-ku-on-primary`}
                >
                  {messages.retry}
                </Text>
              </Pressable>
            </View>
          ) : (
            <>
              <BriefcaseBusiness
                color={palette.primary}
                size={36}
                strokeWidth={1.5}
              />
              <Text className="mt-ku-lg font-ku-semibold text-ku-subtitle text-ku-text-strong">
                {projection.emptyTitle}
              </Text>
            </>
          )}
        </View>
      }
      ListHeaderComponent={
        <View>
          {header}
          {!isLoading && !isError ? (
            <View className="w-full max-w-[720px] self-center">
              <View className={styles.listHeader}>
                <View className="flex-row flex-wrap items-baseline justify-between gap-ku-sm">
                  <Text accessibilityRole="header" className={styles.listTitle}>
                    {projection.selectedTabLabel}
                  </Text>
                  <Text className="font-ku-medium text-ku-label text-ku-text-secondary">
                    {messages.questCount(projection.items.length)}
                  </Text>
                </View>
              </View>
            </View>
          ) : null}
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
