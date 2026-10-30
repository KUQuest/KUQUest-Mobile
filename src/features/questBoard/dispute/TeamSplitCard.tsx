import { useState } from "react";
import { Users } from "lucide-react-native";

import type { TeamSplit } from "@/api/DisputeApi";
import {
  showConfirmModal,
  showSweetAlert,
  SweetAlertVariant,
} from "@/components/ui/SweetAlert";
import { formatTimestamp } from "@/domain/datetime";
import { formatSatang } from "@/domain/satang";
import { useLocale } from "@/features/preferences/localeStore";
import { useAppTheme } from "@/features/workspace/AppThemeProvider";
import { teamSplitMessages } from "@/locales/teamSplitMessages";
import { ActivityIndicator, Pressable, Text, TextInput, View } from "@/tw";
import { cn } from "@/tw/cn";

import { useServerCountdown } from "../shared/useServerCountdown";
import {
  basisPointsToPercent,
  equalPercentDraft,
  validateTeamSplitDraft,
} from "./teamSplitForm";
import {
  teamSplitErrorMessage,
  useSubmitTeamSplit,
} from "./useSubmitTeamSplit";

const styles = {
  card: "gap-ku-md rounded-ku-card border border-ku-border bg-ku-surface p-ku-md",
  headerRow: "flex-row items-start gap-ku-12",
  headerIcon:
    "h-[40px] w-[40px] items-center justify-center rounded-ku-pill bg-ku-primary-subtle",
  headerCopy: "min-w-0 flex-1 gap-ku-xs",
  title: "font-ku-bold text-ku-body text-ku-text-strong",
  bodyText: "font-ku-regular text-ku-body-small text-ku-text-secondary",
  noteText: "font-ku-medium text-ku-body-small text-ku-warning-dark",
  memberList: "overflow-hidden rounded-ku-field border border-ku-border",
  memberRow: "min-h-[56px] flex-row items-center gap-ku-12 px-ku-12 py-ku-sm",
  rowDivider: "border-t border-ku-divider",
  memberCopy: "min-w-0 flex-1 gap-ku-2",
  memberName: "font-ku-semibold text-ku-body-small text-ku-text-strong",
  memberMeta: "font-ku-regular text-ku-label text-ku-text-secondary",
  memberAmount: "font-ku-semibold text-ku-body-small text-ku-text-strong",
  percentField: "flex-row items-center gap-ku-xs",
  percentInput:
    "min-h-[48px] w-[88px] rounded-ku-field border border-ku-border bg-ku-surface px-ku-12 text-right font-ku-medium text-ku-body text-ku-text-strong",
  percentInputError: "border-ku-danger",
  percentSuffix: "font-ku-medium text-ku-body-small text-ku-text-secondary",
  totalRow: "flex-row items-center justify-between gap-ku-sm",
  totalText: "font-ku-semibold text-ku-body-small text-ku-text-strong",
  errorText: "font-ku-regular text-ku-label text-ku-danger",
  linkButton: "min-h-[48px] justify-center px-ku-xs",
  linkText: "font-ku-semibold text-ku-body-small text-ku-primary",
  primaryButton:
    "min-h-[48px] flex-row items-center justify-center gap-ku-sm rounded-ku-pill bg-ku-primary px-ku-md active:bg-ku-primary-dark disabled:opacity-50",
  primaryButtonText:
    "text-center font-ku-semibold text-ku-body-small text-ku-on-primary",
} as const;

/**
 * The won Candidate Team Dispute Case amount: the Team Leader's split form
 * while `canSubmitSplit`, otherwise the read-only shares and payment state.
 */
export function TeamSplitCard({
  questId,
  viewerId,
  split,
}: {
  questId: string;
  viewerId: string | null;
  split: TeamSplit;
}) {
  const { locale } = useLocale();
  const { colors } = useAppTheme();
  const messages = teamSplitMessages[locale];
  const remaining = useServerCountdown(
    split.status === "AWAITING_SPLIT" ? split.deadlineAt : null
  );
  const editable =
    split.status === "AWAITING_SPLIT" &&
    split.viewerIsLeader &&
    split.canSubmitSplit &&
    remaining !== null;
  const minutes = remaining ? Math.floor(remaining / 60_000) : 0;

  return (
    <View className={styles.card} testID="team-split-card">
      <View className={styles.headerRow}>
        <View className={styles.headerIcon}>
          <Users color={colors.primaryDark} size={20} />
        </View>
        <View className={styles.headerCopy}>
          <Text accessibilityRole="header" className={styles.title}>
            {messages.title}
          </Text>
          <Text className={styles.bodyText}>
            {messages.approvedAmount(
              formatSatang(split.approvedAmountSatang, locale, "exact")
            )}
          </Text>
          {split.status === "AWAITING_SPLIT" ? (
            <>
              <Text className={styles.bodyText} testID="team-split-deadline">
                {remaining
                  ? messages.deadlineIn(Math.floor(minutes / 60), minutes % 60)
                  : messages.deadlinePassed}
              </Text>
              {remaining ? (
                <Text className={styles.bodyText}>
                  {messages.deadlineAt(
                    formatTimestamp(split.deadlineAt, locale, "")
                  )}
                </Text>
              ) : null}
            </>
          ) : null}
        </View>
      </View>

      {split.status === "AWAITING_SPLIT" && !split.viewerIsLeader ? (
        <Text className={styles.bodyText}>{messages.waitingForLeader}</Text>
      ) : null}
      {split.splitSource === "AUTO_EQUAL" ? (
        <Text className={styles.bodyText} testID="team-split-auto-equal">
          {messages.autoEqual}
        </Text>
      ) : split.splitSource === "LEADER" && !split.viewerIsLeader ? (
        <Text className={styles.bodyText}>{messages.confirmedByLeader}</Text>
      ) : null}
      {split.paymentPending ? (
        <Text
          accessibilityLiveRegion="polite"
          className={styles.noteText}
          testID="team-split-payment-pending"
        >
          {messages.paymentPending}
        </Text>
      ) : null}

      {editable ? (
        <TeamSplitForm questId={questId} viewerId={viewerId} split={split} />
      ) : (
        <TeamSplitShares split={split} viewerId={viewerId} />
      )}
    </View>
  );
}

function TeamSplitShares({
  split,
  viewerId,
}: {
  split: TeamSplit;
  viewerId: string | null;
}) {
  const { locale } = useLocale();
  const messages = teamSplitMessages[locale];
  // Before the split every share is null; a paid Member sees their own row.
  if (split.status === "AWAITING_SPLIT") return null;
  const members =
    split.status === "PAID" && !split.viewerIsLeader
      ? split.members.filter((member) => member.memberId === viewerId)
      : split.members;

  return (
    <View className={styles.memberList}>
      {members.map((member, index) => {
        const meta = [
          member.isLeader ? messages.leaderBadge : null,
          member.percentageBasisPoints === null
            ? null
            : `${basisPointsToPercent(member.percentageBasisPoints)}%`,
          split.status === "PAID"
            ? member.paidAt
              ? messages.paidAt(formatTimestamp(member.paidAt, locale, ""))
              : messages.notPaidYet
            : null,
        ].filter(Boolean);
        return (
          <View
            key={member.memberId}
            className={cn(styles.memberRow, index > 0 && styles.rowDivider)}
            testID={`team-split-member-${member.memberId}`}
          >
            <View className={styles.memberCopy}>
              <Text className={styles.memberName}>
                {member.memberId === viewerId
                  ? `${member.displayName} (${messages.you})`
                  : member.displayName}
              </Text>
              {meta.length ? (
                <Text className={styles.memberMeta}>{meta.join(" · ")}</Text>
              ) : null}
            </View>
            {member.amountSatang === null ? null : (
              <Text className={styles.memberAmount}>
                {formatSatang(member.amountSatang, locale, "exact")}
              </Text>
            )}
          </View>
        );
      })}
    </View>
  );
}

function TeamSplitForm({
  questId,
  viewerId,
  split,
}: {
  questId: string;
  viewerId: string | null;
  split: TeamSplit;
}) {
  const { locale } = useLocale();
  const { colors } = useAppTheme();
  const messages = teamSplitMessages[locale];
  const memberIds = split.members.map((member) => member.memberId);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [showErrors, setShowErrors] = useState(false);
  const submit = useSubmitTeamSplit(questId, viewerId);
  const result = validateTeamSplitDraft(memberIds, draft);
  const invalid = new Set(result.ok ? [] : result.invalidMemberIds);

  const onSubmit = () => {
    setShowErrors(true);
    if (!result.ok || submit.isPending) return;
    const { shares } = result;
    showConfirmModal({
      title: messages.confirmTitle,
      message: messages.confirmBody,
      confirmLabel: messages.confirm,
      cancelLabel: messages.cancel,
      onConfirm: () =>
        submit.mutate(shares, {
          onSuccess: () =>
            showSweetAlert({
              title: messages.successTitle,
              message: "",
              variant: SweetAlertVariant.Success,
            }),
          onError: (error) =>
            showSweetAlert({
              title: messages.errorTitle,
              message: teamSplitErrorMessage(error, messages),
              variant: SweetAlertVariant.Error,
            }),
        }),
    });
  };

  return (
    <View className="gap-ku-12" testID="team-split-form">
      <Text className={styles.bodyText}>{messages.leaderInstruction}</Text>
      <View className={styles.memberList}>
        {split.members.map((member, index) => {
          const hasError = showErrors && invalid.has(member.memberId);
          return (
            <View
              key={member.memberId}
              className={cn(styles.memberRow, index > 0 && styles.rowDivider)}
            >
              <View className={styles.memberCopy}>
                <Text className={styles.memberName}>
                  {member.memberId === viewerId
                    ? `${member.displayName} (${messages.you})`
                    : member.displayName}
                </Text>
                {member.isLeader ? (
                  <Text className={styles.memberMeta}>
                    {messages.leaderBadge}
                  </Text>
                ) : null}
              </View>
              <View className={styles.percentField}>
                <TextInput
                  accessibilityLabel={messages.percentLabel(member.displayName)}
                  accessibilityHint={
                    hasError ? messages.invalidPercent : undefined
                  }
                  className={cn(
                    styles.percentInput,
                    hasError && styles.percentInputError
                  )}
                  editable={!submit.isPending}
                  inputMode="decimal"
                  keyboardType="decimal-pad"
                  maxLength={6}
                  onChangeText={(text) =>
                    setDraft((current) => ({
                      ...current,
                      [member.memberId]: text.replace(",", "."),
                    }))
                  }
                  placeholder="0"
                  placeholderTextColor={colors.textFaint}
                  testID={`team-split-percent-${member.memberId}`}
                  value={draft[member.memberId] ?? ""}
                />
                <Text className={styles.percentSuffix}>
                  {messages.percentSuffix}
                </Text>
              </View>
            </View>
          );
        })}
      </View>
      <View className={styles.totalRow}>
        <Text
          accessibilityLiveRegion="polite"
          className={styles.totalText}
          testID="team-split-total"
        >
          {messages.total(basisPointsToPercent(result.totalBasisPoints))}
        </Text>
        <Pressable
          accessibilityRole="button"
          className={styles.linkButton}
          disabled={submit.isPending}
          onPress={() => setDraft(equalPercentDraft(memberIds))}
          testID="team-split-equal"
        >
          <Text className={styles.linkText}>{messages.splitEqually}</Text>
        </Pressable>
      </View>
      {showErrors && !result.ok ? (
        <Text accessibilityRole="alert" className={styles.errorText}>
          {invalid.size > 0 ? messages.invalidPercent : messages.totalMustBe100}
        </Text>
      ) : null}
      <Pressable
        accessibilityRole="button"
        accessibilityState={{
          disabled: submit.isPending,
          busy: submit.isPending,
        }}
        className={styles.primaryButton}
        disabled={submit.isPending}
        onPress={onSubmit}
        testID="team-split-submit"
      >
        {submit.isPending ? (
          <ActivityIndicator color={colors.onPrimary} />
        ) : null}
        <Text className={styles.primaryButtonText}>
          {submit.isPending ? messages.submitting : messages.submit}
        </Text>
      </Pressable>
    </View>
  );
}
