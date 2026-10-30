import { useState } from "react";

import type { QuestV2RewardAllocation } from "@/api/questV2Contracts";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { showConfirmModal } from "@/components/ui/SweetAlert";
import { formatTimestamp } from "@/domain/datetime";
import { formatSatang } from "@/domain/satang";
import { useLocale } from "@/features/preferences/localeStore";
import type { QuestWorkMessages } from "@/locales/questWorkMessages";
import { Text, TouchableOpacity, View } from "@/tw";
import {
  amountSharesToBasisPoints,
  equalTeamPercentages,
  teamRewardPreview,
} from "../teamRewardPreview";

type AllocationMode = "percent" | "baht";

function parseBahtInput(text: string, totalRewardSatang: number) {
  const match = /^(\d+)(?:\.(\d{0,2}))?$/.exec(text);
  const wholeBaht = match ? Number(match[1]) : Number.NaN;
  const fractionalSatang = match ? Number((match[2] ?? "").padEnd(2, "0")) : 0;
  const parsedSatang = wholeBaht * 100 + fractionalSatang;
  const safe = Number.isSafeInteger(parsedSatang);
  const satang = safe ? parsedSatang : 0;

  return {
    satang,
    validFormat: Boolean(match) && safe,
    valid: Boolean(match) && safe && satang <= totalRewardSatang,
  };
}

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
  const [mode, setMode] = useState<AllocationMode>("percent");
  const [modeSwitchError, setModeSwitchError] = useState(false);
  const [amountDrafts, setAmountDrafts] = useState<Record<string, string>>({});
  const [amountEdited, setAmountEdited] = useState(false);
  const percentageRows = teammates.map((member) => {
    const text = percentages[member.memberId] ?? "0";
    const validFormat = /^\d{1,3}(?:\.\d{0,2})?$/.test(text);
    const value = validFormat ? Number(text) : Number.NaN;
    const valid = Number.isFinite(value) && value >= 0 && value <= 100;
    return {
      member,
      value,
      basisPoints: Math.round(value * 100),
      valid: validFormat && valid,
    };
  });
  const amountRows = teammates.map((member) => {
    const text = amountDrafts[member.memberId] ?? "";
    return {
      member,
      text,
      ...parseBahtInput(text, allocation.totalRewardSatang),
    };
  });
  const amountSatangTotal = amountRows.reduce(
    (sum, row) => sum + row.satang,
    0
  );
  const amountOverBudgetSatang = Math.max(
    0,
    amountSatangTotal - allocation.totalRewardSatang
  );
  const amountBasisPoints = amountSharesToBasisPoints(
    amountRows.map((row) => row.satang),
    allocation.totalRewardSatang
  );
  const parsed =
    mode === "percent"
      ? percentageRows
      : amountRows.map((row, index) => ({
          ...row,
          value: row.satang / 100,
          basisPoints: amountEdited
            ? (amountBasisPoints[index] ?? 0)
            : (percentageRows[index]?.basisPoints ?? 0),
        }));
  const teammateBasisPoints = parsed.reduce(
    (sum, row) => sum + (row.valid ? row.basisPoints : 0),
    0
  );
  const overBudgetBasisPoints = Math.max(0, teammateBasisPoints - 10_000);
  const valid =
    mode === "percent"
      ? parsed.every(({ valid }) => valid) && overBudgetBasisPoints === 0
      : amountRows.every(({ valid }) => valid) &&
        amountOverBudgetSatang === 0 &&
        overBudgetBasisPoints === 0;
  const remainingBasisPoints = valid ? 10_000 - teammateBasisPoints : 0;
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
  const remainingAmount = valid
    ? (previewAmounts?.[
        allocation.members.findIndex((member) => member.isLeader)
      ] ?? 0)
    : null;
  const teammateTotalAmount = previewAmounts
    ? allocation.members.reduce(
        (sum, member, index) =>
          sum + (member.isLeader ? 0 : (previewAmounts[index] ?? 0)),
        0
      )
    : null;
  const pending = allocation.status === "PENDING";
  const deadlineLabel = formatTimestamp(allocation.deadlineAt, locale, "");
  const showModeSwitchError =
    modeSwitchError && percentageRows.some(({ valid }) => !valid);
  const switchMode = (nextMode: AllocationMode) => {
    if (nextMode === "baht" && mode !== "baht") {
      if (!percentageRows.every(({ valid }) => valid)) {
        setModeSwitchError(true);
        return;
      }

      const nextAmounts = Object.fromEntries(
        teammates.map((member) => {
          const row = percentageRows.find(
            ({ member: candidate }) => candidate.memberId === member.memberId
          );
          const memberIndex = allocation.members.findIndex(
            (candidate) => candidate.memberId === member.memberId
          );
          const estimatedSatang =
            previewAmounts?.[memberIndex] ??
            Math.round(
              (allocation.totalRewardSatang *
                (row?.valid ? row.basisPoints : 0)) /
                10_000
            );
          return [member.memberId, (estimatedSatang / 100).toFixed(2)];
        })
      );
      setAmountDrafts(nextAmounts);
      setAmountEdited(false);
      setModeSwitchError(false);
    } else if (nextMode === "percent") {
      setModeSwitchError(false);
    }
    setMode(nextMode);
  };
  const resetEqual = () => {
    setPercentages(equalPercentages);
    if (mode === "baht") {
      const equalAmounts = teamRewardPreview(
        allocation.totalRewardSatang,
        allocation.members.map(
          (member) => (Number(equalPercentages[member.memberId]) || 0) * 100
        )
      );
      setAmountDrafts(
        Object.fromEntries(
          teammates.map((member) => {
            const index = allocation.members.findIndex(
              (candidate) => candidate.memberId === member.memberId
            );
            return [
              member.memberId,
              ((equalAmounts[index] ?? 0) / 100).toFixed(2),
            ];
          })
        )
      );
      setAmountEdited(false);
    }
  };
  const updateBahtAmount = (memberId: string, text: string) => {
    const nextDrafts = { ...amountDrafts, [memberId]: text };
    setAmountDrafts(nextDrafts);
    setAmountEdited(true);
    const nextRows = teammates.map((member) =>
      parseBahtInput(
        nextDrafts[member.memberId] ?? "",
        allocation.totalRewardSatang
      )
    );
    if (!nextRows.every(({ valid }) => valid)) return;
    const basisPoints = amountSharesToBasisPoints(
      nextRows.map(({ satang }) => satang),
      allocation.totalRewardSatang
    );
    setPercentages(
      Object.fromEntries(
        teammates.map((member, index) => [
          member.memberId,
          ((basisPoints[index] ?? 0) / 100).toFixed(2),
        ])
      )
    );
  };
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
      <View className="gap-ku-xs">
        <View className="flex-row items-center justify-between gap-ku-sm">
          <Text
            accessibilityRole="header"
            className="flex-1 font-ku-bold text-ku-title-small text-ku-text-strong"
          >
            {messages.allocationTitle}
          </Text>
          {pending ? (
            <Button
              variant="secondary"
              className="w-auto shrink-0 px-ku-sm py-ku-xs"
              disabled={submitting}
              onPress={resetEqual}
              testID="team-reward-equal"
            >
              {messages.allocationEqual}
            </Button>
          ) : null}
        </View>
        <Text className="font-ku-regular text-ku-body-small text-ku-text-secondary">
          {messages.allocationDescription}
        </Text>
      </View>

      {pending ? (
        <>
          <View className="flex-row items-center justify-between gap-ku-sm border-b border-ku-divider pb-ku-md">
            <Text className="font-ku-medium text-ku-body-small text-ku-text-secondary">
              {messages.allocationPool}
            </Text>
            <Text className="font-ku-bold text-ku-title-small text-ku-primary-dark">
              {formatSatang(allocation.totalRewardSatang, locale, "exact")}
            </Text>
          </View>
          <View
            accessibilityRole="radiogroup"
            className="flex-row rounded-ku-control bg-ku-surface-raised p-ku-xs"
          >
            {(
              [
                ["percent", messages.allocationModePercent],
                ["baht", messages.allocationModeBaht],
              ] as const
            ).map(([value, label]) => {
              const selected = mode === value;
              return (
                <TouchableOpacity
                  key={value}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  className={`min-h-[48px] flex-1 items-center justify-center rounded-ku-control px-ku-sm ${selected ? "bg-ku-primary" : ""}`}
                  onPress={() => switchMode(value)}
                  testID={`team-reward-mode-${value}`}
                >
                  <Text
                    className={`font-ku-medium text-ku-body-small ${selected ? "text-ku-on-primary" : "text-ku-text-secondary"}`}
                  >
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          {showModeSwitchError ? (
            <Text
              accessibilityRole="alert"
              className="font-ku-medium text-ku-body-small text-ku-danger"
            >
              {messages.allocationFixPercentBeforeBaht}
            </Text>
          ) : null}
          {mode === "baht" ? (
            <Text className="font-ku-regular text-ku-label text-ku-text-secondary">
              {messages.allocationBahtRoundingHint}
            </Text>
          ) : null}
          <Text
            accessibilityLiveRegion="polite"
            accessibilityRole={valid ? undefined : "alert"}
            className={`font-ku-medium text-ku-body-small ${valid ? "text-ku-primary-dark" : "text-ku-danger"}`}
          >
            {valid
              ? messages.allocationTotal
              : mode === "baht"
                ? amountOverBudgetSatang > 0
                  ? messages.allocationAmountOverBudget(
                      formatSatang(amountOverBudgetSatang, locale, "exact")
                    )
                  : messages.allocationInvalidAmountInput
                : overBudgetBasisPoints > 0
                  ? messages.allocationOverBudget(
                      (overBudgetBasisPoints / 100).toFixed(2)
                    )
                  : messages.allocationInvalid}
          </Text>
          <View className="gap-ku-md">
            {teammates.map(({ memberId, displayName }, teammateIndex) => {
              const row = parsed.find(
                ({ member }) => member.memberId === memberId
              );
              const amountRow = amountRows.find(
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
                  parsed.reduce(
                    (sum, other) =>
                      other.member.memberId !== memberId && other.valid
                        ? sum + other.basisPoints
                        : sum,
                    0
                  )
              );
              const availablePercent = (available / 100).toFixed(2);
              const amountAvailableSatang = Math.max(
                0,
                allocation.totalRewardSatang -
                  amountRows.reduce(
                    (sum, other) =>
                      other.member.memberId !== memberId && other.validFormat
                        ? sum + other.satang
                        : sum,
                    0
                  )
              );
              const fieldError =
                mode === "percent"
                  ? row
                    ? !row.valid
                      ? messages.allocationInvalidInput
                      : row.basisPoints > available
                        ? messages.allocationFieldOverBudget(availablePercent)
                        : undefined
                    : messages.allocationInvalidInput
                  : amountRow
                    ? !amountRow.validFormat
                      ? messages.allocationInvalidAmountInput
                      : amountRow.satang > amountAvailableSatang
                        ? messages.allocationFieldOverBudgetAmount(
                            formatSatang(amountAvailableSatang, locale, "exact")
                          )
                        : undefined
                    : messages.allocationInvalidAmountInput;
              const availableLabel =
                mode === "percent"
                  ? messages.allocationAvailable(availablePercent)
                  : messages.allocationAvailableAmount(
                      formatSatang(amountAvailableSatang, locale, "exact")
                    );
              const estimateHint =
                estimatedAmount === undefined
                  ? messages.allocationLeaderShareUnavailable
                  : `${messages.allocationEstimate}: ${formatSatang(estimatedAmount, locale, "exact")}`;
              return (
                <View
                  key={memberId}
                  className={`flex-row items-center gap-ku-sm ${teammateIndex < teammates.length - 1 ? "border-b border-ku-divider pb-ku-sm" : ""}`}
                >
                  <View className="flex-1 gap-ku-xs">
                    <Text className="font-ku-medium text-ku-body-small text-ku-text-strong">
                      {displayName}
                    </Text>
                    <Text className="font-ku-regular text-ku-label text-ku-text-secondary">
                      {availableLabel}
                    </Text>
                    <Text className="font-ku-regular text-ku-label text-ku-text-secondary">
                      {messages.allocationEstimate}:{" "}
                      {estimatedAmount === undefined
                        ? "—"
                        : formatSatang(estimatedAmount, locale, "exact")}
                    </Text>
                  </View>
                  <View className="w-40 shrink-0">
                    <Input
                      label={
                        mode === "percent"
                          ? messages.allocationPercent
                          : messages.allocationAmountLabel
                      }
                      accessibilityLabel={`${displayName} ${mode === "percent" ? messages.allocationPercent : messages.allocationAmountLabel}`}
                      accessibilityHint={`${availableLabel}. ${mode === "baht" ? messages.allocationBahtRoundingHint : estimateHint}`}
                      value={
                        mode === "percent"
                          ? (percentages[memberId] ??
                            equalPercentages[memberId])
                          : (amountDrafts[memberId] ?? "")
                      }
                      error={fieldError}
                      onChangeText={(value) =>
                        mode === "percent"
                          ? setPercentages((current) => ({
                              ...current,
                              [memberId]: value,
                            }))
                          : updateBahtAmount(memberId, value)
                      }
                      keyboardType="decimal-pad"
                      inputMode="decimal"
                      editable={!submitting}
                      testID={`team-reward-percent-${memberId}`}
                    />
                  </View>
                </View>
              );
            })}
          </View>
          <View className="gap-ku-sm border-t border-ku-divider pt-ku-md">
            <Text className="font-ku-medium text-ku-label text-ku-text-secondary">
              {messages.allocationSummary}
            </Text>
            <View className="flex-row items-baseline justify-between gap-ku-sm">
              <Text className="flex-1 font-ku-regular text-ku-body-small text-ku-text-secondary">
                {messages.allocationTeamShares}
              </Text>
              <Text className="font-ku-medium text-ku-body-small text-ku-text-strong">
                {valid
                  ? `${(teammateBasisPoints / 100).toFixed(2)}% · ${formatSatang(teammateTotalAmount ?? 0, locale, "exact")}`
                  : "—"}
              </Text>
            </View>
            <View className="flex-row items-baseline justify-between gap-ku-sm">
              <Text className="flex-1 font-ku-regular text-ku-body-small text-ku-text-secondary">
                {messages.allocationLeaderShare}
              </Text>
              <Text className="font-ku-bold text-ku-body text-ku-primary-dark">
                {valid
                  ? `${(remainingBasisPoints / 100).toFixed(2)}% · ${formatSatang(remainingAmount ?? 0, locale, "exact")}`
                  : "—"}
              </Text>
            </View>
            {!valid ? (
              <Text className="font-ku-regular text-ku-body-small text-ku-text-secondary">
                {messages.allocationLeaderShareUnavailable}
              </Text>
            ) : null}
          </View>
          <View className="gap-ku-sm border-t border-ku-divider pt-ku-md">
            <Text className="font-ku-regular text-ku-body-small text-ku-text-secondary">
              {messages.allocationDeadline}: {deadlineLabel}
            </Text>
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
          </View>
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
