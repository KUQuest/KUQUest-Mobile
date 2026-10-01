import { useEffect, useMemo, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";

import { ActivityIndicator, Pressable, Text, View } from "@/tw";
import { ScreenLayout } from "@/components/layout/ScreenLayout";
import { TopBar } from "@/components/ui/TopBar";
import {
  useRegistrationDestinationQuery,
  useSessionQuery,
} from "@/features/auth/sessionQueries";
import { useLocale } from "@/features/preferences/localeStore";
import { authMessages } from "@/locales/authMessages";
import { groupQuestMessages } from "@/locales/groupQuestMessages";
import { parseSingleRouteParam } from "@/features/questBoard/detail/questDetailRoute";
import TeamAssembleScreen from "./TeamAssembleScreen";
import { createTeamInviteLink } from "./teamInvite";
import { storePendingTeamInvite } from "./pendingTeamInvite";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const joinCodePattern = /^[A-Z0-9]{8}$/i;

interface ParsedInvite {
  questId: string;
  teamId: string;
  joinCode: string;
}

function parseInviteParams(params: {
  questId?: string | string[];
  teamId?: string | string[];
  code?: string | string[];
}): ParsedInvite | null {
  const questId = parseSingleRouteParam(params.questId);
  const teamId = parseSingleRouteParam(params.teamId);
  const joinCode = parseSingleRouteParam(params.code)?.toUpperCase();
  if (
    !questId ||
    !uuidPattern.test(questId) ||
    !teamId ||
    !uuidPattern.test(teamId) ||
    !joinCode ||
    !joinCodePattern.test(joinCode)
  ) {
    return null;
  }
  return { questId, teamId, joinCode };
}

type SaveState = "idle" | "saving" | "saved" | "error";

export default function TeamInviteLandingScreen() {
  const params = useLocalSearchParams<{
    questId?: string | string[];
    teamId?: string | string[];
    code?: string | string[];
  }>();
  const questIdParam = parseSingleRouteParam(params.questId);
  const teamIdParam = parseSingleRouteParam(params.teamId);
  const codeParam = parseSingleRouteParam(params.code);
  const router = useRouter();
  const { locale } = useLocale();
  const sessionQuery = useSessionQuery();
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [saveAttempt, setSaveAttempt] = useState(0);
  const invite = useMemo(
    () =>
      parseInviteParams({
        questId: questIdParam,
        teamId: teamIdParam,
        code: codeParam,
      }),
    [codeParam, questIdParam, teamIdParam]
  );
  const registrationQuery = useRegistrationDestinationQuery({
    enabled: Boolean(sessionQuery.data && invite),
  });
  const inviteLink = invite
    ? createTeamInviteLink(invite.questId, invite.teamId, invite.joinCode)
    : undefined;
  const messages = groupQuestMessages[locale];
  const authText = authMessages[locale];

  const onboardingRequired = registrationQuery.data?.type === "ONBOARDING";
  const authRoutingInProgress = Boolean(
    sessionQuery.data &&
    invite &&
    (registrationQuery.isPending ||
      registrationQuery.isFetching ||
      (onboardingRequired && saveState !== "error"))
  );

  const handleSignIn = () => {
    if (!invite) return;
    setSaveState("saving");
    void storePendingTeamInvite(invite)
      .then(() => router.replace("/"))
      .catch(() => setSaveState("error"));
  };

  useEffect(() => {
    if (
      !invite ||
      !sessionQuery.data ||
      !onboardingRequired ||
      sessionQuery.isPending ||
      sessionQuery.isFetching ||
      sessionQuery.isError ||
      registrationQuery.isPending ||
      registrationQuery.isFetching ||
      registrationQuery.isError
    ) {
      return;
    }
    let active = true;
    void storePendingTeamInvite(invite)
      .then(() => {
        if (active) {
          setSaveState("saved");
          router.replace("/");
        }
      })
      .catch(() => {
        if (active) setSaveState("error");
      });
    return () => {
      active = false;
    };
  }, [
    invite,
    onboardingRequired,
    registrationQuery.isError,
    registrationQuery.isFetching,
    registrationQuery.isPending,
    router,
    saveAttempt,
    sessionQuery.data,
    sessionQuery.isError,
    sessionQuery.isFetching,
    sessionQuery.isPending,
  ]);

  if (
    sessionQuery.data &&
    registrationQuery.data?.type === "HOME" &&
    inviteLink &&
    invite
  ) {
    return (
      <TeamAssembleScreen questId={invite.questId} initialInvite={inviteLink} />
    );
  }

  return (
    <ScreenLayout edges={["top", "left", "right"]} className="flex-1">
      <TopBar
        backLabel={messages.close}
        onBackPress={() => router.back()}
        title={messages.teamTitle}
        variant="detail"
      />
      <View className="flex-1 justify-center gap-4 p-6">
        {sessionQuery.isPending ||
        sessionQuery.isFetching ||
        authRoutingInProgress ||
        saveState === "saving" ? (
          <ActivityIndicator accessibilityLabel={authText.loadingAuth} />
        ) : sessionQuery.isError || registrationQuery.isError ? (
          <>
            <Text accessibilityRole="header" className="text-xl font-semibold">
              {authText.sessionLoadTitle}
            </Text>
            <Text>{authText.sessionLoadDescription}</Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                if (sessionQuery.isError) void sessionQuery.refetch();
                else void registrationQuery.refetch();
              }}
              className="items-center rounded-xl bg-ku-primary px-5 py-3"
            >
              <Text className="font-semibold text-white">
                {authText.retryButton}
              </Text>
            </Pressable>
          </>
        ) : !invite ? (
          <Text accessibilityRole="alert">{messages.joinCodeInvalid}</Text>
        ) : saveState === "error" ? (
          <>
            <Text accessibilityRole="alert">{messages.joinTeamFailed}</Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                if (onboardingRequired) {
                  setSaveState("idle");
                  setSaveAttempt((attempt) => attempt + 1);
                } else {
                  handleSignIn();
                }
              }}
              className="items-center rounded-xl bg-ku-primary px-5 py-3"
            >
              <Text className="font-semibold text-white">
                {authText.retryButton}
              </Text>
            </Pressable>
          </>
        ) : (
          <>
            <Text accessibilityRole="header" className="text-xl font-semibold">
              {messages.joinTeamTitle}
            </Text>
            <Text>
              {authText.noticeTextPrefix} {authText.noticeEmailDomain}{" "}
              {authText.noticeTextSuffix}
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={handleSignIn}
              className="items-center rounded-xl bg-ku-primary px-5 py-3"
            >
              <Text className="font-semibold text-white">
                {authText.signInWithGoogle}
              </Text>
            </Pressable>
          </>
        )}
      </View>
    </ScreenLayout>
  );
}
