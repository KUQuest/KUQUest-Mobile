import { useState } from "react";
import { KeyboardAvoidingView, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ApiError } from "@/api/ApiClient";
import { createQuestIdempotencyKey } from "@/api/QuestApi";
import { ScreenLayout } from "@/components/layout/ScreenLayout";
import { TopBar } from "@/components/ui/TopBar";
import { useJoinCandidateTeamMutation } from "@/features/questBoard/api/questBoardQueries";
import { useLocale } from "@/features/preferences/localeStore";
import { groupQuestMessages } from "@/locales/groupQuestMessages";
import { View } from "@/tw";
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
  const joinMutation = useJoinCandidateTeamMutation();
  const [joinError, setJoinError] = useState<string | null>(null);

  const joinByCode = async (teamId: string, joinCode: string) => {
    if (!props.questId) {
      view.team?.onJoinTeam?.(teamId, joinCode);
      return;
    }
    setJoinError(null);
    try {
      await joinMutation.mutateAsync({
        questId: props.questId,
        joinCode: joinCode.trim(),
        viewerId: view.team?.viewerId,
        idempotencyKey: createQuestIdempotencyKey(),
      });
    } catch (error) {
      setJoinError(
        error instanceof ApiError &&
          (error.status === 400 || error.status === 404)
          ? messages.joinCodeInvalid
          : error instanceof ApiError && error.status === 409
            ? messages.joinTeamFull
            : messages.joinTeamFailed
      );
    }
  };

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
            <TeamAssembleView
              {...view.team}
              initialInvite={initialInvite}
              joinError={joinError}
              onJoinTeam={view.team.onJoinTeam ? joinByCode : undefined}
              submitting={view.team.submitting || joinMutation.isPending}
            />
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
