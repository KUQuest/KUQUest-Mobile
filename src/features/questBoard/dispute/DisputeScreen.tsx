import { AlertCircle, AlertTriangle, CheckCircle2 } from "lucide-react-native";

import { ScreenLayout } from "@/components/layout/ScreenLayout";
import { Button } from "@/components/ui/Button";
import { TopBar } from "@/components/ui/TopBar";
import { useAppTheme } from "@/features/workspace/AppThemeProvider";
import { ScrollView, Text, View } from "@/tw";

import { useQuestDisputeFeature } from "./useQuestDisputeFeature";

/** Files the viewer's Dispute Case on a failed Quest (admin-dispute-case-contract.md). */
export default function DisputeScreen({
  questId,
}: {
  questId: string | undefined;
}) {
  const { colors } = useAppTheme();
  const {
    router,
    messages,
    canSubmit,
    confirmAndFile,
    errorMessage,
    filedCase,
    submitting,
  } = useQuestDisputeFeature(questId);

  return (
    <ScreenLayout
      edges={["top", "left", "right", "bottom"]}
      className="flex-1 bg-ku-background"
    >
      <TopBar
        title={messages.title}
        onBackPress={() => router.back()}
        backLabel={messages.back}
      />
      <ScrollView contentContainerClassName="gap-ku-md px-ku-20 pt-ku-md pb-ku-48">
        {filedCase ? (
          <>
            <View
              accessibilityLiveRegion="polite"
              className="gap-ku-sm rounded-2xl border border-ku-border-success bg-ku-surface-success p-ku-md"
              testID="dispute-filed"
            >
              <View className="flex-row items-center gap-ku-sm">
                <CheckCircle2 color={colors.primary} size={20} />
                <Text
                  accessibilityRole="header"
                  className="flex-1 font-ku-bold text-ku-body text-ku-text-strong"
                >
                  {messages.successTitle}
                </Text>
              </View>
              <Text className="text-ku-body-small text-ku-text-strong">
                {messages.successDescription(filedCase.displayId)}
              </Text>
            </View>
            <Button onPress={() => router.back()}>{messages.done}</Button>
          </>
        ) : (
          <>
            <View className="gap-ku-sm rounded-2xl border border-ku-border-warning bg-ku-surface-warning p-ku-md">
              <View className="flex-row items-center gap-ku-sm">
                <AlertTriangle color={colors.warningDark} size={20} />
                <Text
                  accessibilityRole="header"
                  className="flex-1 font-ku-bold text-ku-body text-ku-warning-dark"
                >
                  {messages.rulesTitle}
                </Text>
              </View>
              <Text className="text-ku-body-small text-ku-warning-dark">
                {messages.intro}
              </Text>
              {messages.rules.map((rule) => (
                <Text
                  className="text-ku-body-small text-ku-warning-dark"
                  key={rule}
                >
                  {`• ${rule}`}
                </Text>
              ))}
            </View>
            {errorMessage ? (
              <View
                accessibilityRole="alert"
                className="flex-row gap-ku-sm rounded-xl border border-ku-border-danger bg-ku-surface-danger p-ku-12"
                testID="dispute-error"
              >
                <AlertCircle color={colors.danger} size={18} />
                <View className="flex-1 gap-ku-xs">
                  <Text className="font-ku-semibold text-ku-label text-ku-danger-dark">
                    {messages.errorTitle}
                  </Text>
                  <Text className="text-ku-label text-ku-danger-dark">
                    {errorMessage}
                  </Text>
                </View>
              </View>
            ) : null}
            <Button
              accessibilityState={{ disabled: !canSubmit, busy: submitting }}
              disabled={!canSubmit}
              onPress={confirmAndFile}
              testID="dispute-submit"
            >
              {submitting ? messages.submitting : messages.submit}
            </Button>
          </>
        )}
      </ScrollView>
    </ScreenLayout>
  );
}
