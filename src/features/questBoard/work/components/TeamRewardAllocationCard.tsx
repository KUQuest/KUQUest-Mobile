import { useState } from "react";

import type { QuestV2RewardAllocation } from "@/api/questV2Contracts";
import { showConfirmModal } from "@/components/ui/SweetAlert";
import { formatSatang } from "@/domain/satang";
import { formatTimestamp } from "@/domain/datetime";
import type { QuestWorkMessages } from "@/locales/questWorkMessages";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Text, View } from "@/tw";
import { useLocale } from "@/features/preferences/localeStore";
import { equalTeamPercentages, teamRewardPreview } from "../teamRewardPreview";

export default function TeamRewardAllocationCard({
  allocation,
  messages,
  submitting,
  onSubmit,
}: {
  allocation: QuestV2RewardAllocation;
  messages: QuestWorkMessages;
  submitting: boolean;
  onSubmit: (
    shares: { memberId: string; percentageBasisPoints: number }[]
  ) => Promise<void>;
}) {
  const { locale } = useLocale();
  const teammates = allocation.members.filter(({ isLeader }) => !isLeader);
  const equalPercentages = equalTeamPercentages(allocation.members);
  const [percentages, setPercentages] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      teammates.map((member) => [
        member.memberId,
        member.percentageBasisPoints === null
          ? equalPercentages[member.memberId]
          : (member.percentageBasisPoints / 100).toFixed(2),
      ])
    )
  );
  const parsed = teammates.map((member) => {
    const text = percentages[member.memberId] ?? "0";
    const validFormat = /^\d{1,3}(?:\.\d{0,2})?$/.test(text);
    const value = validFormat ? Number(text) : Number.NaN;
    return { member, value, basisPoints: Math.round(value * 100) };
  });
  const teammateBasisPoints = parsed.reduce(
    (sum, row) =>
      sum +
      (Number.isFinite(row.value) && row.value <= 100 ? row.basisPoints : 0),
    0
  );
  const valid =
    parsed.every(
      ({ value }) => Number.isFinite(value) && value >= 0 && value <= 100
    ) && teammateBasisPoints <= 10_000;
  const remainingBasisPoints = Math.max(0, 10_000 - teammateBasisPoints);
  const previewAmounts = valid
    ? teamRewardPreview(
        allocation.totalRewardSatang,
        allocation.members.map((member) =>
          member.isLeader
            ? remainingBasisPoints
            : (parsed.find((row) => row.member.memberId === member.memberId)
                ?.basisPoints ?? 0)
        )
      )
    : null;
  const remainingAmount =
    previewAmounts?.[
      allocation.members.findIndex((member) => member.isLeader)
    ] ?? 0;
  const pending = allocation.status === "PENDING";
  const deadlineLabel = formatTimestamp(allocation.deadlineAt, locale, "");
  const submit = () => {
    if (!valid || submitting) return;
    const shares = parsed.map(({ member, basisPoints }) => ({
      memberId: member.memberId,
      percentageBasisPoints: basisPoints,
    }));
    showConfirmModal({
      title: messages.allocationTitle,
      message: allocation.members
        .map(
          (member, index) =>
            `${member.displayName}: ${((member.isLeader ? remainingBasisPoints : parsed.find((row) => row.member.memberId === member.memberId)!.basisPoints) / 100).toFixed(2)}% · ${formatSatang(previewAmounts![index], locale, "exact")}`
        )
        .join("\n"),
      confirmLabel: messages.allocationSubmit,
      cancelLabel: messages.allocationCancel,
      onConfirm: () => void onSubmit(shares),
    });
  };

  return (
    <View
      className="gap-ku-md rounded-ku-card border border-ku-border bg-ku-surface p-ku-md"
      testID="team-reward-allocation"
    >
      <Text
        accessibilityRole="header"
        className="font-ku-bold text-ku-title-small text-ku-text-strong"
      >
        {messages.allocationTitle}
      </Text>
      <Text className="font-ku-regular text-ku-body-small text-ku-text-secondary">
        {messages.allocationDescription}
      </Text>
      {pending ? (
        <>
          <Text
            accessibilityLiveRegion="polite"
            className="font-ku-bold text-ku-body text-ku-text-strong"
          >
            {valid
              ? messages.allocationTotal
              : teammateBasisPoints > 10_000
                ? messages.allocationOverBudget(
                    ((teammateBasisPoints - 10_000) / 100).toFixed(2)
                  )
                : messages.allocationInvalid}
          </Text>
          <Button
            variant="secondary"
            disabled={submitting}
            onPress={() => setPercentages(equalPercentages)}
            testID="team-reward-equal"
          >
            {messages.allocationEqual}
          </Button>
        </>
      ) : null}
      {pending
        ? teammates.map(({ memberId, displayName }) => {
            const row = parsed.find(
              ({ member }) => member.memberId === memberId
            );
            const estimatedAmount =
              previewAmounts?.[
                allocation.members.findIndex(
                  (member) => member.memberId === memberId
                )
              ];
            const available = Math.max(
              0,
              10_000 -
                teammateBasisPoints +
                (row &&
                Number.isFinite(row.basisPoints) &&
                row.basisPoints <= 10_000
                  ? row.basisPoints
                  : 0)
            );
            return (
              <View key={memberId} className="gap-ku-xs">
                <Input
                  label={`${displayName} · ${messages.allocationPercent}`}
                  accessibilityLabel={`${displayName} ${messages.allocationPercent}`}
                  value={percentages[memberId] ?? equalPercentages[memberId]}
                  onChangeText={(value) =>
                    setPercentages((current) => ({
                      ...current,
                      [memberId]: value,
                    }))
                  }
                  keyboardType="decimal-pad"
                  inputMode="decimal"
                  editable={!submitting}
                  testID={`team-reward-percent-${memberId}`}
                />
                <Text className="font-ku-regular text-ku-body-small text-ku-text-secondary">
                  {messages.allocationAvailable((available / 100).toFixed(2))}
                </Text>
                <Text className="font-ku-regular text-ku-body-small text-ku-text-secondary">
                  {messages.allocationEstimate}:{" "}
                  {estimatedAmount === undefined
                    ? "—"
                    : formatSatang(estimatedAmount, locale, "exact")}
                </Text>
              </View>
            );
          })
        : null}
      <View className="gap-ku-xs rounded-ku-control bg-ku-surface-raised p-ku-sm">
        <Text className="font-ku-medium text-ku-label text-ku-text-secondary">
          {messages.allocationLeaderShare}:{" "}
          {(
            (pending
              ? remainingBasisPoints
              : (allocation.members.find(({ isLeader }) => isLeader)
                  ?.percentageBasisPoints ?? 0)) / 100
          ).toFixed(2)}
          %
        </Text>
        <Text className="font-ku-bold text-ku-title-small text-ku-primary-dark">
          {formatSatang(
            pending
              ? remainingAmount
              : (allocation.members.find(({ isLeader }) => isLeader)
                  ?.rewardSatang ?? 0),
            locale,
            "exact"
          )}
        </Text>
      </View>
      {pending ? (
        <>
          <Text className="font-ku-regular text-ku-body-small text-ku-text-secondary">
            {messages.allocationDeadline}: {deadlineLabel}
          </Text>
          {!valid && teammateBasisPoints > 10_000 ? (
            <Text
              accessibilityRole="alert"
              className="font-ku-medium text-ku-body-small text-ku-danger-dark"
            >
              {messages.allocationInvalid}
            </Text>
          ) : null}
          <Button
            onPress={submit}
            disabled={!valid || submitting}
            accessibilityLabel={messages.allocationSubmit}
            accessibilityState={{
              disabled: !valid || submitting,
              busy: submitting,
            }}
            testID="team-reward-submit"
          >
            {submitting
              ? messages.allocationSubmitting
              : messages.allocationSubmit}
          </Button>
        </>
      ) : (
        <>
          <Text
            accessibilityLiveRegion="polite"
            className="font-ku-medium text-ku-body-small text-ku-text-secondary"
          >
            {messages.allocationSaved}
          </Text>
          {allocation.members.map((member) => (
            <Text
              key={member.memberId}
              className="font-ku-regular text-ku-body-small text-ku-text-secondary"
            >
              {member.displayName}:{" "}
              {((member.percentageBasisPoints ?? 0) / 100).toFixed(2)}% ·{" "}
              {formatSatang(member.rewardSatang ?? 0, locale, "exact")}
            </Text>
          ))}
        </>
      )}
    </View>
  );
}
