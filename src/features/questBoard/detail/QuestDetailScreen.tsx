import { Pressable, Text, View } from "@/tw";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LogOut, MessageCircle, Pencil, Star } from "lucide-react-native";
import { cn } from "@/tw/cn";
import { ScreenLayout } from "@/components/layout/ScreenLayout";
import { TopBar } from "@/components/ui/TopBar";
import { useAppTheme } from "@/features/workspace/AppThemeProvider";
import { getActionBarPaddingBottom } from "@/theme/layout";
import styles from "../styles/questDetailStyles";
import { useQuestDetailFeature } from "./useQuestDetailFeature";
import type { QuestDetailScreenProps } from "./questDetailRoute";
import { QuestDetailBody } from "./components/QuestDetailBody";
import {
  NotFoundState,
  QuestDetailSkeleton,
} from "./components/QuestDetailStateViews";
import { QuestDetailSheets } from "./components/QuestDetailSheets";

export type { QuestDetailScreenProps } from "./questDetailRoute";

export default function QuestDetailScreen(props: QuestDetailScreenProps) {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const view = useQuestDetailFeature({
    ...props,
    bottomInset: insets.bottom,
  });
  const {
    handleBack,
    messages,
    state,
    quest,
    bodyProps,
    sheets,
    onRetry,
    actionBar,
  } = view;

  if (state === "loading") {
    return (
      <ScreenLayout
        edges={["top", "left", "right"]}
        className={styles.safeArea}
      >
        <TopBar
          backLabel={messages.back}
          onBackPress={handleBack}
          title={messages.details}
          variant="detail"
        />
        <QuestDetailSkeleton loadingLabel={messages.loading} />
      </ScreenLayout>
    );
  }

  if (state === "error" || state === "missing" || !quest || !bodyProps) {
    const errorState = state === "error";
    return (
      <ScreenLayout
        edges={["top", "left", "right"]}
        className={styles.safeArea}
      >
        <TopBar
          backLabel={messages.back}
          onBackPress={handleBack}
          title={messages.details}
          variant="detail"
        />
        <NotFoundState
          title={errorState ? messages.errorTitle : messages.questNotFound}
          description={
            errorState
              ? messages.errorDescription
              : messages.questNotFoundDescription
          }
          actionLabel={errorState ? messages.retry : messages.back}
          onAction={errorState ? onRetry : handleBack}
          error={errorState}
        />
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout edges={["top", "left", "right"]} className={styles.safeArea}>
      <TopBar
        backLabel={messages.back}
        onBackPress={handleBack}
        title={messages.details}
        variant="detail"
      />
      <QuestDetailBody {...bodyProps} />
      <QuestDetailSheets {...sheets} />
      {actionBar?.isPostView && actionBar.canEditPost ? (
        <View
          className={styles.actionBar}
          style={{ paddingBottom: getActionBarPaddingBottom(insets.bottom) }}
        >
          <Pressable
            accessibilityRole="button"
            onPress={actionBar.onEditPost}
            className={styles.primaryAction}
            testID="quest-edit-post-button"
          >
            <Pencil color={colors.onPrimary} size={19} strokeWidth={2.2} />
            <Text className={styles.primaryActionText}>
              {messages.editPost}
            </Text>
          </Pressable>
        </View>
      ) : actionBar?.isPostView && actionBar.canReview ? (
        <View
          className={styles.actionBar}
          style={{ paddingBottom: getActionBarPaddingBottom(insets.bottom) }}
        >
          <Pressable
            accessibilityRole="button"
            onPress={actionBar.onOpenReview}
            className={styles.primaryAction}
            testID="quest-review-button"
          >
            <Star color={colors.onPrimary} size={19} strokeWidth={2.2} />
            <Text className={styles.primaryActionText}>
              {messages.reviewQuest}
            </Text>
          </Pressable>
        </View>
      ) : actionBar &&
        (actionBar.canMessageOwner || actionBar.canShowWithdraw) ? (
        <View
          className={styles.actionBar}
          style={{ paddingBottom: getActionBarPaddingBottom(insets.bottom) }}
          testID="quest-action-bar"
        >
          <View className={styles.actionRow}>
            {actionBar.canMessageOwner ? (
              <Pressable
                accessibilityLabel={messages.messageOwner}
                accessibilityRole="button"
                className={styles.messageOwnerAction}
                onPress={actionBar.onMessageOwner}
                testID="quest-message-owner-button"
              >
                <MessageCircle
                  color={colors.primary}
                  size={18}
                  strokeWidth={2.2}
                />
                <Text className={styles.prototypeActionText} numberOfLines={1}>
                  {messages.messageOwnerShort}
                </Text>
              </Pressable>
            ) : null}
            {actionBar.canShowWithdraw ? (
              <Pressable
                accessibilityRole="button"
                disabled={actionBar.busy}
                onPress={actionBar.onLeaveQuest}
                className={cn(
                  styles.leaveAction,
                  actionBar.busy && styles.leaveActionDisabled
                )}
                testID="quest-leave-button"
              >
                <LogOut color={colors.dangerDark} size={19} strokeWidth={2.2} />
                <Text className={styles.leaveActionText}>
                  {messages.withdrawApplication}
                </Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      ) : null}
    </ScreenLayout>
  );
}
