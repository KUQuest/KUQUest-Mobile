import React, { useCallback, useEffect, useState } from "react";
import { Alert, useColorScheme } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { CircleUserRound, Users } from "lucide-react-native";

import { FlatList, Image, Pressable, Text, View } from "@/tw";
import { ScreenLayout } from "@/components/layout/ScreenLayout";
import { TopBar } from "@/components/ui/TopBar";
import { authService } from "@/features/auth/AuthService";
import { createQuestIdempotencyKey } from "@/api/QuestApi";
import type { QuestV2Application, QuestV2Team } from "@/api/questV2Contracts";
import { usePublicProfileQuery } from "@/features/profile/api/profileQueries";
import {
  liveQuestService,
  type LiveQuestSnapshot,
} from "@/features/questBoard/liveQuestService";
import { useLocale } from "@/features/preferences/localeStore";
import type { SupportedLocale } from "@/locales/locale";
import { hirerHomeMessages } from "@/features/home/hirerHomeMessages";
import { groupQuestMessages } from "@/locales/groupQuestMessages";
import { getThemeColors, type ThemeColors } from "@/theme/colors";

function routeValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function formatDate(
  value: string | undefined,
  locale: SupportedLocale
): string | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return new Intl.DateTimeFormat(locale === "th" ? "th-TH" : "en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

interface MemberProfile {
  displayName: string;
  avatarUri?: string;
  faculty?: string;
}

function useMemberProfile(memberId: string): MemberProfile | undefined {
  const { data, error } = usePublicProfileQuery(memberId);
  if (!data) {
    return error ? { displayName: "KU Student" } : undefined;
  }
  const name = [data.firstName, data.lastName].filter(Boolean).join(" ");
  return {
    displayName: name || "KU Student",
    avatarUri: data.avatar?.url,
    faculty: data.department?.faculty?.name,
  };
}

function MemberAvatar({
  avatarUri,
  iconColor,
  backgroundColor,
}: {
  avatarUri?: string;
  iconColor: string;
  backgroundColor: string;
}) {
  return (
    <View
      className="mr-3 h-12 w-12 items-center justify-center overflow-hidden rounded-full"
      style={{ backgroundColor }}
    >
      {avatarUri ? (
        <Image
          source={{ uri: avatarUri }}
          className="h-full w-full"
          contentFit="cover"
        />
      ) : (
        <CircleUserRound size={26} color={iconColor} />
      )}
    </View>
  );
}
function ProposalRow({
  identity,
  detail,
  canSelect,
  canReject,
  selectLabel,
  rejectLabel,
  colors,
  onSelect,
  onReject,
  testID,
}: {
  identity: MemberProfile | undefined;
  detail?: string;
  canSelect: boolean;
  canReject: boolean;
  selectLabel: string;
  rejectLabel: string;
  colors: ThemeColors;
  onSelect: () => void;
  onReject: () => void;
  testID: string;
}) {
  return (
    <View
      className="mb-3 rounded-2xl border p-4"
      style={{
        backgroundColor: colors.surfaceMuted,
        borderColor: colors.borderSubtle,
      }}
      testID={testID}
    >
      <View className="flex-row items-center">
        <MemberAvatar
          avatarUri={identity?.avatarUri}
          iconColor={colors.primary}
          backgroundColor={colors.surfaceAccent}
        />
        <View className="flex-1 pr-2">
          <Text
            className="font-ku-bold"
            style={{ color: colors.textStrong }}
            numberOfLines={1}
          >
            {identity?.displayName ?? "…"}
          </Text>
          {detail ? (
            <Text
              className="mt-0.5 text-xs"
              style={{ color: colors.textSecondary }}
              numberOfLines={1}
            >
              {detail}
            </Text>
          ) : null}
        </View>
      </View>
      {canSelect || canReject ? (
        <View className="mt-3 flex-row gap-2">
          {canSelect ? (
            <Pressable
              accessibilityRole="button"
              className="flex-1 items-center rounded-xl p-3"
              style={{ backgroundColor: colors.primary }}
              onPress={onSelect}
              testID={`${testID}-select`}
            >
              <Text className="font-ku-bold text-white">{selectLabel}</Text>
            </Pressable>
          ) : null}
          {canReject ? (
            <Pressable
              accessibilityRole="button"
              className="flex-1 items-center rounded-xl border p-3"
              style={{ borderColor: colors.borderDanger }}
              onPress={onReject}
              testID={`${testID}-reject`}
            >
              <Text
                style={{ color: colors.dangerDark }}
                className="font-ku-bold"
              >
                {rejectLabel}
              </Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

function CandidateRow(props: {
  application: QuestV2Application;
  canSelect: boolean;
  canReject: boolean;
  locale: SupportedLocale;
  colors: ThemeColors;
  selectLabel: string;
  rejectLabel: string;
  submittedLabel: string;
  onSelect: (application: QuestV2Application) => void;
  onReject: (application: QuestV2Application) => void;
}) {
  const identity = useMemberProfile(props.application.memberId);
  const appliedAt = formatDate(props.application.appliedAt, props.locale);
  return (
    <ProposalRow
      identity={identity}
      detail={
        appliedAt
          ? `${props.submittedLabel} · ${appliedAt}`
          : props.submittedLabel
      }
      canSelect={props.canSelect}
      canReject={props.canReject}
      selectLabel={props.selectLabel}
      rejectLabel={props.rejectLabel}
      colors={props.colors}
      onSelect={() => props.onSelect(props.application)}
      onReject={() => props.onReject(props.application)}
      testID={`select-roster-candidate-${props.application.id}`}
    />
  );
}

function TeamRow(props: {
  team: QuestV2Team;
  canSelect: boolean;
  canReject: boolean;
  locale: SupportedLocale;
  colors: ThemeColors;
  selectLabel: string;
  rejectLabel: string;
  teamProposalLabel: string;
  memberCount: (count: number) => string;
  onSelect: (team: QuestV2Team) => void;
  onReject: (team: QuestV2Team) => void;
}) {
  const identity = useMemberProfile(props.team.leaderId);
  return (
    <ProposalRow
      identity={identity}
      detail={`${props.teamProposalLabel} · ${props.memberCount(props.team.members.length)}`}
      canSelect={props.canSelect}
      canReject={props.canReject}
      selectLabel={props.selectLabel}
      rejectLabel={props.rejectLabel}
      colors={props.colors}
      onSelect={() => props.onSelect(props.team)}
      onReject={() => props.onReject(props.team)}
      testID={`select-roster-team-${props.team.id}`}
    />
  );
}

export default function SelectRosterRoute() {
  const router = useRouter();
  const { locale } = useLocale();
  const colorScheme = useColorScheme();
  const colors = getThemeColors(colorScheme);
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const questId = routeValue(params.id);
  const messages = hirerHomeMessages[locale];
  const groupMessages = groupQuestMessages[locale];

  const [viewerId, setViewerId] = useState<string>();
  const [snapshot, setSnapshot] = useState<LiveQuestSnapshot>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string>();

  useEffect(() => {
    void authService
      .getSession()
      .then((session) => setViewerId(session?.user.id))
      .catch(() => undefined);
  }, []);

  const load = useCallback(
    async (background = false) => {
      if (!questId || !viewerId) return;
      if (background) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      try {
        const next = await liveQuestService.getLiveSnapshot(questId, viewerId);
        setSnapshot(next);
        setError(undefined);
      } catch (caught) {
        setError(
          caught instanceof Error ? caught.message : groupMessages.errorTitle
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [questId, viewerId, groupMessages.errorTitle]
  );

  useEffect(() => {
    let mounted = true;
    if (questId && viewerId) {
      void (async () => {
        try {
          const next = await liveQuestService.getLiveSnapshot(
            questId,
            viewerId
          );
          if (mounted) {
            setSnapshot(next);
            setError(undefined);
            setLoading(false);
          }
        } catch (caught) {
          if (mounted) {
            setError(
              caught instanceof Error
                ? caught.message
                : groupMessages.errorTitle
            );
            setLoading(false);
          }
        }
      })();
    }
    return () => {
      mounted = false;
    };
  }, [questId, viewerId, groupMessages.errorTitle]);

  const performSelect = useCallback(
    async (run: (key: string) => Promise<unknown>) => {
      try {
        await run(createQuestIdempotencyKey());
        router.back();
      } catch (caught) {
        Alert.alert(
          messages.actionFailedTitle,
          caught instanceof Error ? caught.message : messages.actionFailedTitle
        );
      }
    },
    [router, messages.actionFailedTitle]
  );

  const performReject = useCallback(
    async (run: (key: string) => Promise<unknown>) => {
      try {
        await run(createQuestIdempotencyKey());
      } catch (caught) {
        Alert.alert(
          messages.actionFailedTitle,
          caught instanceof Error ? caught.message : messages.actionFailedTitle
        );
      } finally {
        await load(true);
      }
    },
    [load, messages.actionFailedTitle]
  );

  const handleSelectApplication = useCallback(
    (application: QuestV2Application) => {
      Alert.alert(
        messages.confirmSelectCandidateTitle,
        messages.confirmSelectCandidateMessage,
        [
          { text: groupMessages.cancel, style: "cancel" },
          {
            text: groupMessages.selectProposal,
            onPress: () =>
              void performSelect((key) =>
                liveQuestService.selectApplication(
                  questId!,
                  application.id,
                  key
                )
              ),
          },
        ]
      );
    },
    [messages, groupMessages, questId, performSelect]
  );

  const handleRejectApplication = useCallback(
    (application: QuestV2Application) => {
      Alert.alert(
        messages.confirmRejectCandidateTitle,
        messages.confirmRejectMessage,
        [
          { text: groupMessages.cancel, style: "cancel" },
          {
            text: groupMessages.reject,
            style: "destructive",
            onPress: () =>
              void performReject((key) =>
                liveQuestService.rejectApplication(
                  questId!,
                  application.id,
                  key
                )
              ),
          },
        ]
      );
    },
    [messages, groupMessages, questId, performReject]
  );

  const handleSelectTeam = useCallback(
    (team: QuestV2Team) => {
      Alert.alert(
        messages.confirmSelectTeamTitle,
        messages.confirmSelectTeamMessage,
        [
          { text: groupMessages.cancel, style: "cancel" },
          {
            text: groupMessages.selectProposal,
            onPress: () =>
              void performSelect((key) =>
                liveQuestService.selectCandidateTeam(questId!, team.id, key)
              ),
          },
        ]
      );
    },
    [messages, groupMessages, questId, performSelect]
  );

  const handleRejectTeam = useCallback(
    (team: QuestV2Team) => {
      Alert.alert(
        messages.confirmRejectTeamTitle,
        messages.confirmRejectMessage,
        [
          { text: groupMessages.cancel, style: "cancel" },
          {
            text: groupMessages.reject,
            style: "destructive",
            onPress: () =>
              void performReject((key) =>
                liveQuestService.rejectCandidateTeam(questId!, team.id, key)
              ),
          },
        ]
      );
    },
    [messages, groupMessages, questId, performReject]
  );

  if (loading) {
    return (
      <ScreenLayout className="bg-ku-bg flex-1">
        <TopBar
          title={messages.selectRosterTitle}
          onBackPress={() => router.back()}
        />
        <View className="p-6">
          <Text style={{ color: colors.textSecondary }}>
            {groupMessages.loading}
          </Text>
        </View>
      </ScreenLayout>
    );
  }

  if (error || !snapshot) {
    return (
      <ScreenLayout className="bg-ku-bg flex-1">
        <TopBar
          title={messages.selectRosterTitle}
          onBackPress={() => router.back()}
        />
        <View className="p-6">
          <Text style={{ color: colors.textStrong }} className="font-ku-bold">
            {groupMessages.errorTitle}
          </Text>
          <Text className="mt-1" style={{ color: colors.textSecondary }}>
            {error ?? groupMessages.errorDescription}
          </Text>
          <Pressable
            className="mt-4 rounded-xl p-4"
            style={{ backgroundColor: colors.primary }}
            onPress={() => void load()}
          >
            <Text className="text-center font-ku-bold text-white">
              {groupMessages.retry}
            </Text>
          </Pressable>
        </View>
      </ScreenLayout>
    );
  }

  const quest = snapshot.quest;
  const isGroup = snapshot.participation === "GROUP";
  const canSelect = isGroup
    ? snapshot.capabilities.canSelectTeam
    : snapshot.capabilities.canSelectCandidate;
  const canReject = isGroup
    ? snapshot.capabilities.canRejectTeam
    : snapshot.capabilities.canRejectCandidate;

  if (snapshot.mode !== "CANDIDATE") {
    return (
      <ScreenLayout className="bg-ku-bg flex-1">
        <TopBar
          title={messages.selectRosterTitle}
          onBackPress={() => router.back()}
        />
        <View className="items-center justify-center p-8">
          <Users size={36} color={colors.textSecondary} />
          <Text
            className="mt-3 text-center font-ku-medium"
            style={{ color: colors.textSecondary }}
          >
            {messages.noSelectionNeeded}
          </Text>
        </View>
      </ScreenLayout>
    );
  }

  const pendingApplications = snapshot.applications.filter(
    (application) => application.state === "APPLICATION_APPLIED"
  );
  const pendingTeams = snapshot.teams.filter(
    (team) => team.state === "TEAM_SUBMITTED"
  );
  const pendingCount = isGroup
    ? pendingTeams.length
    : pendingApplications.length;

  const header = (
    <View className="mb-4">
      <Text
        accessibilityRole="header"
        className="font-ku-bold text-2xl"
        style={{ color: colors.textStrong }}
      >
        {quest.title}
      </Text>
      <Text className="mt-2" style={{ color: colors.textSecondary }}>
        {groupMessages.candidateReviewSubtitle}
      </Text>
      <View
        className="mt-4 flex-row justify-between rounded-2xl p-4"
        style={{ backgroundColor: colors.surfaceMuted }}
      >
        <View>
          <Text className="text-xs" style={{ color: colors.textSecondary }}>
            {groupMessages.requestedHeadcount}
          </Text>
          <Text
            className="mt-1 font-ku-bold"
            style={{ color: colors.textStrong }}
          >
            {quest.headcount}
          </Text>
        </View>
        <View>
          <Text className="text-xs" style={{ color: colors.textSecondary }}>
            {groupMessages.actualHeadcount}
          </Text>
          <Text
            className="mt-1 font-ku-bold"
            style={{ color: colors.textStrong }}
          >
            {snapshot.assignments.length}
          </Text>
        </View>
        <View>
          <Text className="text-xs" style={{ color: colors.textSecondary }}>
            {groupMessages.proposalCount(pendingCount)}
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <ScreenLayout edges={["top", "left", "right"]} className="bg-ku-bg flex-1">
      <TopBar
        title={messages.selectRosterTitle}
        onBackPress={() => router.back()}
      />
      {isGroup ? (
        <FlatList
          data={pendingTeams}
          keyExtractor={(team) => team.id}
          refreshing={refreshing}
          onRefresh={() => void load(true)}
          ListHeaderComponent={header}
          ListEmptyComponent={
            <Text
              className="text-center"
              style={{ color: colors.textSecondary }}
            >
              {groupMessages.noProposals}
            </Text>
          }
          renderItem={({ item }) => (
            <TeamRow
              team={item}
              canSelect={canSelect}
              canReject={canReject}
              locale={locale}
              colors={colors}
              selectLabel={groupMessages.selectProposal}
              rejectLabel={groupMessages.reject}
              teamProposalLabel={groupMessages.teamProposal}
              memberCount={groupMessages.memberCount}
              onSelect={handleSelectTeam}
              onReject={handleRejectTeam}
            />
          )}
          contentContainerClassName="p-5 pb-12"
          initialNumToRender={12}
          windowSize={7}
          removeClippedSubviews
        />
      ) : (
        <FlatList
          data={pendingApplications}
          keyExtractor={(application) => application.id}
          refreshing={refreshing}
          onRefresh={() => void load(true)}
          ListHeaderComponent={header}
          ListEmptyComponent={
            <Text
              className="text-center"
              style={{ color: colors.textSecondary }}
            >
              {groupMessages.noProposals}
            </Text>
          }
          renderItem={({ item }) => (
            <CandidateRow
              application={item}
              canSelect={canSelect}
              canReject={canReject}
              locale={locale}
              colors={colors}
              selectLabel={groupMessages.selectProposal}
              rejectLabel={groupMessages.reject}
              submittedLabel={groupMessages.submittedLabel}
              onSelect={handleSelectApplication}
              onReject={handleRejectApplication}
            />
          )}
          contentContainerClassName="p-5 pb-12"
          initialNumToRender={12}
          windowSize={7}
          removeClippedSubviews
        />
      )}
    </ScreenLayout>
  );
}
