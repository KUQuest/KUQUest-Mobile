import { ActivityIndicator, RefreshControl } from "react-native";
import { BriefcaseBusiness, History } from "lucide-react-native";

import { Pressable, ScrollView, Text, View } from "@/tw";
import { cn } from "@/tw/cn";
import { ScreenLayout } from "@/components/layout/ScreenLayout";
import { WorkerWorkCard } from "@/features/workerWork/components/WorkerWorkCard";
import type { WorkerWorkViewProps } from "@/features/workerWork/workflow/useWorkerWorkController";
import { workerWorkStyles as styles } from "@/features/workerWork/workerWorkStyles";

export function WorkerWorkManagementView({
  frame,
  content,
}: WorkerWorkViewProps) {
  const { bottomPadding, locale, messages, onScroll, palette } = frame;
  const {
    counts,
    hasData,
    isError,
    isRefetching,
    onFindQuests,
    onOpenWork,
    onRefresh,
    onRetry,
    onTabChange,
    projection,
    tab,
    tabs,
  } = content;

  const renderCard = (item: (typeof projection.needsAction)[number]) => (
    <WorkerWorkCard
      item={item}
      key={item.questId}
      locale={locale}
      messages={messages}
      onOpen={() => onOpenWork(item)}
      palette={palette}
    />
  );

  const renderContent = () => {
    if (isError) {
      return (
        <View
          accessibilityRole="alert"
          className={styles.stateBox}
          testID="worker-work-error"
        >
          <Text className={styles.errorTitle}>{messages.loadError}</Text>
          <Pressable
            accessibilityRole="button"
            className={styles.stateAction}
            onPress={onRetry}
            testID="worker-work-retry"
          >
            <Text className={styles.stateActionText}>{messages.retry}</Text>
          </Pressable>
        </View>
      );
    }
    if (!hasData) {
      return (
        <View
          accessibilityLabel={messages.loading}
          accessibilityRole="progressbar"
          className="items-center py-ku-40"
          testID="worker-work-loading"
        >
          <ActivityIndicator color={palette.primary} />
        </View>
      );
    }
    if (tab === "history") {
      if (projection.history.length === 0) {
        return (
          <View className={styles.stateBox} testID="worker-work-history-empty">
            <View className={styles.stateIcon}>
              <History color={palette.primary} size={24} strokeWidth={2} />
            </View>
            <Text className={styles.stateTitle}>
              {messages.emptyHistoryTitle}
            </Text>
            <Text className={styles.stateDescription}>
              {messages.emptyHistoryDescription}
            </Text>
          </View>
        );
      }
      return (
        <View className={styles.sectionList} testID="worker-work-history-list">
          {projection.history.map(renderCard)}
        </View>
      );
    }
    if (projection.activeCount === 0) {
      return (
        <View className={styles.stateBox} testID="worker-work-active-empty">
          <View className={styles.stateIcon}>
            <BriefcaseBusiness
              color={palette.primary}
              size={24}
              strokeWidth={2}
            />
          </View>
          <Text className={styles.stateTitle}>{messages.emptyActiveTitle}</Text>
          <Text className={styles.stateDescription}>
            {messages.emptyActiveDescription}
          </Text>
          <Pressable
            accessibilityRole="button"
            className={styles.stateAction}
            onPress={onFindQuests}
            testID="worker-work-find-quests"
          >
            <Text className={styles.stateActionText}>
              {messages.findQuests}
            </Text>
          </Pressable>
        </View>
      );
    }
    return (
      <>
        {projection.needsAction.length > 0 ? (
          <>
            <Text accessibilityRole="header" className={styles.sectionHeading}>
              {messages.needsActionHeading}
            </Text>
            <View
              className={styles.sectionList}
              testID="worker-work-needs-action-list"
            >
              {projection.needsAction.map(renderCard)}
            </View>
          </>
        ) : null}
        {projection.otherActive.length > 0 ? (
          <>
            {projection.needsAction.length > 0 ? (
              <Text
                accessibilityRole="header"
                className={styles.sectionHeading}
              >
                {messages.otherWorkHeading}
              </Text>
            ) : null}
            <View
              className={styles.sectionList}
              testID="worker-work-active-list"
            >
              {projection.otherActive.map(renderCard)}
            </View>
          </>
        ) : null}
      </>
    );
  };

  return (
    <ScreenLayout edges={["top", "left", "right"]} className="bg-ku-background">
      <ScrollView
        contentContainerStyle={{ paddingBottom: bottomPadding }}
        onScroll={onScroll}
        refreshControl={
          <RefreshControl
            colors={[palette.primary]}
            onRefresh={onRefresh}
            refreshing={isRefetching}
            tintColor={palette.primary}
          />
        }
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        testID="worker-work-scroll"
      >
        <View className={styles.content}>
          <View className={styles.header}>
            <Text accessibilityRole="header" className={styles.title}>
              {messages.title}
            </Text>
            <Text className={styles.subtitle}>{messages.subtitle}</Text>
          </View>

          <View accessibilityRole="tablist" className={styles.tabList}>
            {tabs.map((option) => {
              const selected = option === tab;
              return (
                <Pressable
                  accessibilityLabel={messages.tabCount(
                    messages.tabs[option],
                    counts[option]
                  )}
                  accessibilityRole="tab"
                  accessibilityState={{ selected }}
                  className={cn(styles.tab, selected && styles.tabSelected)}
                  key={option}
                  onPress={() => onTabChange(option)}
                  testID={`worker-work-tab-${option}`}
                >
                  <Text
                    className={cn(
                      styles.tabText,
                      selected && styles.tabTextSelected
                    )}
                  >
                    {messages.tabs[option]}
                  </Text>
                  {hasData ? (
                    <View
                      className={cn(
                        styles.tabBadge,
                        selected && styles.tabBadgeSelected
                      )}
                    >
                      <Text
                        className={cn(
                          styles.tabBadgeText,
                          selected && styles.tabBadgeTextSelected
                        )}
                      >
                        {counts[option]}
                      </Text>
                    </View>
                  ) : null}
                </Pressable>
              );
            })}
          </View>

          {renderContent()}
        </View>
      </ScrollView>
    </ScreenLayout>
  );
}
