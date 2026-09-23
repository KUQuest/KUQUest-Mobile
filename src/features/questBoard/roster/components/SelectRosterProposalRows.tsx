import { CircleUserRound } from "lucide-react-native";
import { Image, Pressable, Text, View } from "@/tw";
import type { QuestV2Application, QuestV2Team } from "@/api/questV2Contracts";
import type { SupportedLocale } from "@/locales/locale";
import type { ThemeColors } from "@/theme/colors";
import { getApplicationSubmissionDetail } from "../selectRosterSelectors";
import { useSelectRosterMemberProfile } from "../useSelectRosterMemberProfile";
import type { SelectRosterMemberProfile } from "../useSelectRosterMemberProfile";

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
      className="mr-ku-12 h-12 w-12 items-center justify-center overflow-hidden rounded-full"
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
  identity: SelectRosterMemberProfile | undefined;
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
      className="mb-ku-12 rounded-2xl border p-ku-md"
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
        <View className="flex-1 pr-ku-sm">
          <Text
            className="font-ku-bold"
            style={{ color: colors.textStrong }}
            numberOfLines={1}
          >
            {identity?.displayName ?? "…"}
          </Text>
          {detail ? (
            <Text
              className="mt-ku-2 text-ku-label"
              style={{ color: colors.textSecondary }}
              numberOfLines={1}
            >
              {detail}
            </Text>
          ) : null}
        </View>
      </View>
      {canSelect || canReject ? (
        <View className="mt-ku-12 flex-row gap-ku-sm">
          {canSelect ? (
            <Pressable
              accessibilityRole="button"
              className="flex-1 items-center rounded-xl p-ku-12"
              style={{ backgroundColor: colors.primary }}
              onPress={onSelect}
              testID={`${testID}-select`}
            >
              <Text className="font-ku-bold text-ku-on-primary">
                {selectLabel}
              </Text>
            </Pressable>
          ) : null}
          {canReject ? (
            <Pressable
              accessibilityRole="button"
              className="flex-1 items-center rounded-xl border p-ku-12"
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

export function CandidateRow(props: {
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
  const identity = useSelectRosterMemberProfile(props.application.memberId);
  const detail = getApplicationSubmissionDetail(
    props.application.appliedAt,
    props.locale,
    props.submittedLabel
  );
  return (
    <ProposalRow
      identity={identity}
      detail={detail}
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

export function TeamRow(props: {
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
  const identity = useSelectRosterMemberProfile(props.team.leaderId);
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
