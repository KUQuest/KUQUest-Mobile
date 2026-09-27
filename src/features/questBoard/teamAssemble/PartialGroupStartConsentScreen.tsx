import { Text, View } from "@/tw";
import { ScreenLayout } from "@/components/layout/ScreenLayout";
import { TopBar } from "@/components/ui/TopBar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  NotFoundState,
  QuestDetailSkeleton,
} from "../detail/components/QuestDetailStateViews";
import { useQuestDetailFeature } from "../detail/useQuestDetailFeature";
import type { QuestDetailScreenProps } from "../detail/questDetailRoute";
import { groupQuestMessages } from "@/locales/groupQuestMessages";
import { useLocale } from "@/features/preferences/localeStore";
import { PartialGroupStartConsentContent } from "./components/PartialGroupStartConsentContent";

export default function PartialGroupStartConsentScreen(
  props: QuestDetailScreenProps
) {
  const insets = useSafeAreaInsets();
  const { locale } = useLocale();
  const groupMessages = groupQuestMessages[locale];
  const view = useQuestDetailFeature({ ...props, bottomInset: insets.bottom });

  if (view.state === "loading") {
    return (
      <ScreenLayout
        edges={["top", "left", "right"]}
        className="flex-1 bg-ku-background"
      >
        <TopBar
          backLabel={view.messages.back}
          onBackPress={view.handleBack}
          title={groupMessages.partialConsentTitle}
          variant="detail"
        />
        <QuestDetailSkeleton loadingLabel={view.messages.loading} />
      </ScreenLayout>
    );
  }

  if (view.state === "error" || view.state === "missing" || !view.quest) {
    const isError = view.state === "error";
    return (
      <ScreenLayout
        edges={["top", "left", "right"]}
        className="flex-1 bg-ku-background"
      >
        <TopBar
          backLabel={view.messages.back}
          onBackPress={view.handleBack}
          title={groupMessages.partialConsentTitle}
          variant="detail"
        />
        <NotFoundState
          title={
            isError ? view.messages.errorTitle : view.messages.questNotFound
          }
          description={
            isError
              ? view.messages.errorDescription
              : view.messages.questNotFoundDescription
          }
          actionLabel={isError ? view.messages.retry : view.messages.back}
          onAction={isError ? view.onRetry : view.handleBack}
          error={isError}
        />
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout
      edges={["top", "left", "right"]}
      className="flex-1 bg-ku-background"
    >
      <TopBar
        backLabel={view.messages.back}
        onBackPress={view.handleBack}
        title={groupMessages.partialConsentTitle}
        variant="detail"
      />
      <View className="flex-1 px-ku-20">
        <Text className="mt-ku-sm text-ku-body-small text-ku-text-secondary">
          {groupMessages.partialConsentSubtitle}
        </Text>
        <PartialGroupStartConsentContent {...view.partialStartConsent} />
      </View>
    </ScreenLayout>
  );
}
