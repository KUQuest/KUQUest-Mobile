import { KeyboardAvoidingView, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { View } from "@/tw";
import { ScreenLayout } from "@/components/layout/ScreenLayout";
import { TopBar } from "@/components/ui/TopBar";
import { groupQuestMessages } from "@/locales/groupQuestMessages";
import { useLocale } from "@/features/preferences/localeStore";
import type { QuestDetailScreenProps } from "../detail/questDetailRoute";
import { useQuestDetailFeature } from "../detail/useQuestDetailFeature";
import { TeamAssembleEmptyState } from "./components/TeamAssembleEmptyState";
import { TeamAssembleErrorState } from "./components/TeamAssembleErrorState";
import { TeamAssembleLoadingState } from "./components/TeamAssembleLoadingState";
import { TeamAssembleView } from "./components/TeamAssembleView";
import styles from "./groupQuestStyles";

/**
 * Quest Team route for a Worker on a GROUP + CANDIDATE Quest. It reads the same
 * live snapshot as Quest Detail, so Quest and Candidate roster WebSocket
 * invalidations refresh this screen while it is open.
 */
export default function TeamAssembleScreen({
  initialInvite,
  ...props
}: QuestDetailScreenProps & { initialInvite?: string }) {
  const insets = useSafeAreaInsets();
  const { locale } = useLocale();
  const messages = groupQuestMessages[locale];
  const view = useQuestDetailFeature({ ...props, bottomInset: insets.bottom });

  return (
    <ScreenLayout
      edges={["top", "left", "right"]}
      className={styles.screen}
      testID="team-assemble-screen"
    >
      <TopBar
        backLabel={view.messages.back}
        onBackPress={view.handleBack}
        title={messages.teamTitle}
        variant="detail"
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <View className={styles.screenBody}>
          {view.state === "ready" && view.team ? (
            <TeamAssembleView {...view.team} initialInvite={initialInvite} />
          ) : (
            <View className={styles.sheetContent}>
              {view.state === "loading" ? (
                <TeamAssembleLoadingState label={messages.loading} />
              ) : view.state === "error" ? (
                <TeamAssembleErrorState
                  message={messages.errorTitle}
                  onRetry={view.onRetry}
                  retryLabel={messages.retry}
                />
              ) : (
                <TeamAssembleEmptyState
                  createLabel={messages.createTeam}
                  description={messages.noTeamDescription}
                  title={messages.noTeamTitle}
                />
              )}
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </ScreenLayout>
  );
}
