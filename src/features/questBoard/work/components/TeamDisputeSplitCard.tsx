import type {
  QuestV2DisputeTeamSplit,
  QuestV2RewardAllocation,
} from "@/api/questV2Contracts";
import { formatTimestamp } from "@/domain/datetime";
import { formatSatang } from "@/domain/satang";
import { useLocale } from "@/features/preferences/localeStore";
import { disputeMessages } from "@/locales/disputeMessages";
import type { QuestWorkMessages } from "@/locales/questWorkMessages";
import { Text, View } from "@/tw";
import TeamRewardAllocationCard from "./TeamRewardAllocationCard";

type Share = { memberId: string; percentageBasisPoints: number };

function editableAllocation(
  split: QuestV2DisputeTeamSplit
): QuestV2RewardAllocation {
  return {
    status: "PENDING",
    leaderId: split.members.find(({ isLeader }) => isLeader)?.memberId ?? "",
    totalRewardSatang: split.approvedAmountSatang,
    deadlineAt: split.deadlineAt,
    settledAt: null,
    viewerIsLeader: split.viewerIsLeader,
    members: split.members.map(
      ({ memberId, displayName, isLeader, percentageBasisPoints }) => ({
        memberId,
        displayName,
        isLeader,
        percentageBasisPoints,
        rewardSatang: null,
      })
    ),
  };
}

/** The Admin-approved Team Dispute amount: the Leader splits it, every member reads it. */
export default function TeamDisputeSplitCard({
  split,
  messages,
  submitting,
  onSubmit,
}: {
  split: QuestV2DisputeTeamSplit;
  messages: QuestWorkMessages;
  submitting: boolean;
  onSubmit: (shares: Share[]) => Promise<void>;
}) {
  const { locale } = useLocale();
  const copy = disputeMessages[locale];
  const amount = formatSatang(split.approvedAmountSatang, locale, "exact");

  if (split.canSubmitSplit) {
    const leader = split.members.find(({ isLeader }) => isLeader);
    return (
      <TeamRewardAllocationCard
        allocation={editableAllocation(split)}
        messages={messages}
        submitting={submitting}
        title={copy.teamSplitTitle}
        description={copy.teamSplitDescription(amount)}
        // The Server needs every member's share; the card leaves the Leader the remainder.
        onSubmit={(teammateShares) =>
          onSubmit([
            ...teammateShares,
            {
              memberId: leader?.memberId ?? "",
              percentageBasisPoints:
                10_000 -
                teammateShares.reduce(
                  (sum, share) => sum + share.percentageBasisPoints,
                  0
                ),
            },
          ])
        }
      />
    );
  }

  const status =
    split.status === "PAID"
      ? copy.teamSplitPaid
      : split.status === "SPLIT_CONFIRMED"
        ? copy.teamSplitPaying
        : copy.teamSplitAwaiting(formatTimestamp(split.deadlineAt, locale, ""));
  return (
    <View
      className="gap-ku-sm rounded-ku-card border border-ku-border bg-ku-surface p-ku-md"
      testID="team-dispute-split"
    >
      <Text
        accessibilityRole="header"
        className="font-ku-bold text-ku-title-small text-ku-text-strong"
      >
        {copy.teamSplitTitle}
      </Text>
      <Text className="font-ku-regular text-ku-body-small text-ku-text-secondary">
        {copy.teamSplitApproved(amount)}
      </Text>
      <Text className="font-ku-regular text-ku-body-small text-ku-text-secondary">
        {status}
      </Text>
      {split.members.map((member) =>
        member.amountSatang === null ||
        member.percentageBasisPoints === null ? null : (
          <Text
            key={member.memberId}
            className="font-ku-medium text-ku-label text-ku-text-strong"
          >
            {member.displayName}:{" "}
            {(member.percentageBasisPoints / 100).toFixed(2)}% ·{" "}
            {formatSatang(member.amountSatang, locale, "exact")}
          </Text>
        )
      )}
    </View>
  );
}
