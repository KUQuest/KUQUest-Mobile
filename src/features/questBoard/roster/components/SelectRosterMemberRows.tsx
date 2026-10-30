import { ActivityIndicator } from "react-native";
import { ChevronRight } from "lucide-react-native";

import { Avatar } from "@/components/ui/Avatar";
import { useAppTheme } from "@/features/workspace/AppThemeProvider";
import { Pressable, Text, View } from "@/tw";
import { cn } from "@/tw/cn";
import type { RosterProposal } from "../selectRosterViewModel";
import type { PendingRosterAction } from "../useSelectRosterActions";
import {
  type SelectRosterMemberProfile,
  useSelectRosterMemberProfile,
} from "../useSelectRosterMemberProfile";
import styles from "./selectRosterStyles";

interface ProfileLinkProps {
  openProfileLabel: (name: string) => string;
  onOpenProfile: (memberId: string) => void;
}

function MemberIdentity({
  memberId,
  identity,
  detail,
  openProfileLabel,
  onOpenProfile,
  testID,
}: ProfileLinkProps & {
  memberId: string;
  identity: SelectRosterMemberProfile | undefined;
  detail?: string;
  testID: string;
}) {
  const { colors } = useAppTheme();
  const name = identity?.displayName ?? "…";
  const academicDetail = [identity?.faculty, identity?.department]
    .filter(Boolean)
    .join(" · ");
  const profileLabel = [
    openProfileLabel(name),
    identity?.ratingAverage != null
      ? `${identity.ratingAverage.toFixed(1)}/5`
      : "",
    academicDetail,
  ]
    .filter(Boolean)
    .join(". ");

  return (
    <Pressable
      accessibilityLabel={profileLabel}
      accessibilityRole="button"
      className={styles.memberRow}
      onPress={() => onOpenProfile(memberId)}
      testID={testID}
    >
      <Avatar
        className={styles.avatar}
        name={name}
        textClassName={styles.avatarText}
        cacheKey={identity?.avatarCacheKey}
        uri={identity?.avatarUri}
      />
      <View className={styles.memberText}>
        <View className={styles.memberIdentity}>
          <Text className={styles.memberName} numberOfLines={2}>
            {name}
          </Text>
          {identity?.ratingAverage != null ? (
            <Text
              accessibilityLabel={`${identity.ratingAverage.toFixed(1)}/5`}
              className={styles.memberRating}
              testID={`${testID}-rating`}
            >
              ★ {identity.ratingAverage.toFixed(1)}
            </Text>
          ) : null}
        </View>
        {academicDetail ? (
          <Text className={styles.memberDetail} numberOfLines={2}>
            {academicDetail}
          </Text>
        ) : null}
        {detail ? (
          <Text className={styles.memberDetail} numberOfLines={2}>
            {detail}
          </Text>
        ) : null}
      </View>
      <ChevronRight color={colors.textSecondary} size={20} />
    </Pressable>
  );
}

export function WorkerRow({
  workerId,
  ...profileLink
}: ProfileLinkProps & { workerId: string }) {
  const identity = useSelectRosterMemberProfile(workerId);
  return (
    <MemberIdentity
      {...profileLink}
      identity={identity}
      memberId={workerId}
      testID={`select-roster-worker-${workerId}`}
    />
  );
}

export function ProposalCard({
  proposal,
  canSelect,
  selectLabel,
  pendingAction,
  ...profileLink
}: ProfileLinkProps & {
  proposal: RosterProposal;
  canSelect: boolean;
  selectLabel: string;
  pendingAction: PendingRosterAction | null;
}) {
  const { colors } = useAppTheme();
  const identity = useSelectRosterMemberProfile(proposal.memberId);
  const name = identity?.displayName ?? "…";
  const disabled = pendingAction !== null;
  const busyKind =
    pendingAction?.proposalId === proposal.id ? pendingAction.kind : null;

  return (
    <View className={styles.proposalCard} testID={proposal.testID}>
      <MemberIdentity
        {...profileLink}
        detail={proposal.detail}
        identity={identity}
        memberId={proposal.memberId}
        testID={`${proposal.testID}-profile`}
      />
      {canSelect ? (
        <View className={styles.actions}>
          {canSelect ? (
            <Pressable
              accessibilityLabel={`${selectLabel}: ${name}`}
              accessibilityRole="button"
              accessibilityState={{ disabled, busy: busyKind === "select" }}
              className={cn(
                styles.actionBase,
                styles.selectAction,
                disabled && styles.disabled
              )}
              disabled={disabled}
              onPress={proposal.onSelect}
              testID={`${proposal.testID}-select`}
            >
              {busyKind === "select" ? (
                <ActivityIndicator color={colors.onPrimary} size="small" />
              ) : null}
              <Text className={styles.selectText}>{selectLabel}</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}
