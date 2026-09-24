import React, { useMemo } from "react";
import {
  Briefcase,
  CalendarClock,
  CheckCircle2,
  Clock3,
  MapPin,
  User,
  Users,
  Zap,
} from "lucide-react-native";

import { Text, View } from "@/tw";
import { colors } from "@/theme/colors";
import { formatSatang, SATANG_PER_BAHT } from "@/domain/satang";
import { useLocale } from "@/features/preferences/localeStore";
import { useAppTheme } from "@/features/workspace/AppThemeProvider";
import {
  QuestCandidateMode,
  QuestParticipation,
  QuestStatus,
} from "@/features/questBoard/domain/types";
import { type QuestWorkMessages } from "@/locales/questWorkMessages";
import type { LiveQuestSnapshot } from "../../live/liveQuestService";

export interface QuestWorkStatusCardProps {
  snapshot: LiveQuestSnapshot;
  status: string;
  assignment: string;
  nextAction: string;
  countdown: string;
  dueAtDetail?: string;
  isTerminal: boolean;
  messages: QuestWorkMessages;
}

function DetailRow({
  icon: Icon,
  label,
  value,
  detail,
  iconColor,
  iconBg,
}: {
  icon: React.ComponentType<{ size?: number; color?: string }>;
  label: string;
  value: string;
  detail?: string;
  iconColor?: string;
  iconBg?: string;
}) {
  return (
    <View className="flex-row items-start justify-between gap-ku-12 border-b border-ku-border/30 py-ku-10 last:border-b-0">
      <View className="flex-1 flex-row items-center gap-ku-sm">
        <View
          className={`h-7 w-7 items-center justify-center rounded-lg ${iconBg ?? "bg-ku-surface-raised"}`}
        >
          <Icon size={15} color={iconColor ?? colors.textSecondary} />
        </View>
        <Text className="font-ku-medium text-ku-body-small text-ku-text-secondary">
          {label}
        </Text>
      </View>
      <View className="flex-1 items-end">
        <Text className="text-right font-ku-semibold text-ku-body-small text-ku-text-strong">
          {value}
        </Text>
        {detail ? (
          <Text className="mt-ku-xs text-right text-ku-label text-ku-text-subtle">
            {detail}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

export default function QuestWorkStatusCard({
  snapshot,
  status,
  assignment,
  nextAction,
  countdown,
  dueAtDetail,
  isTerminal,
  messages,
}: QuestWorkStatusCardProps) {
  const { colors: palette } = useAppTheme();
  const { locale } = useLocale();

  const rewardBaht = useMemo(() => {
    if (
      "questReward" in snapshot.quest &&
      typeof snapshot.quest.questReward === "number" &&
      snapshot.quest.questReward > 0
    ) {
      return snapshot.quest.questReward;
    }
    if (
      "questFundingTotal" in snapshot.quest &&
      typeof snapshot.quest.questFundingTotal === "number" &&
      snapshot.quest.questFundingTotal > 0
    ) {
      return snapshot.quest.questFundingTotal;
    }
    return null;
  }, [snapshot.quest]);

  const formattedReward = useMemo(() => {
    if (rewardBaht === null) return null;
    const satang = Math.round(rewardBaht * SATANG_PER_BAHT);
    return formatSatang(satang, locale);
  }, [rewardBaht, locale]);
  const statusTone = useMemo(() => {
    if (isTerminal) return "terminal";
    if (snapshot.state === QuestStatus.QUEST_IN_PROGRESS) return "in_progress";
    if (snapshot.state === QuestStatus.QUEST_COMPLETED) return "completed";
    return "assigned";
  }, [isTerminal, snapshot.state]);

  const isCandidateMode = snapshot.mode === QuestCandidateMode.CANDIDATE;
  const modeLabel = isCandidateMode
    ? locale === "th"
      ? "คัดเลือกผู้สมัคร"
      : "Candidate"
    : locale === "th"
      ? "รับทันที (FCFS)"
      : "FCFS";

  const isGroup = snapshot.participation === QuestParticipation.GROUP;
  const participationLabel = isGroup
    ? locale === "th"
      ? "งานกลุ่ม"
      : "Team"
    : locale === "th"
      ? "งานเดี่ยว"
      : "Solo";

  const proofBadgeText = snapshot.proofRequired
    ? locale === "th"
      ? "ต้องส่งหลักฐาน"
      : "Proof required"
    : locale === "th"
      ? "ไม่ต้องส่งหลักฐาน"
      : "Proof-free";

  const locationLabel = snapshot.quest.locations?.[0]?.label;

  return (
    <View className="rounded-[20px] border border-ku-border/60 bg-ku-surface p-ku-16 shadow-sm dark:bg-ku-card">
      {/* Header: Status Pill and Reward Amount */}
      <View className="flex-row items-center justify-between gap-ku-12">
        <View
          className={`flex-row items-center gap-1.5 rounded-full border px-ku-10 py-1 ${
            statusTone === "in_progress"
              ? "border-ku-primary-border/60 bg-ku-primary-subtle"
              : statusTone === "assigned"
                ? "border-ku-terracotta/40 bg-ku-surface-terracotta"
                : statusTone === "completed"
                  ? "border-ku-border-accent bg-ku-surface-accent"
                  : "border-ku-border bg-ku-surface-muted"
          }`}
        >
          {statusTone === "in_progress" ? (
            <Zap size={14} color={palette.primary ?? colors.primary} />
          ) : statusTone === "assigned" ? (
            <Clock3 size={14} color={palette.terracotta ?? colors.terracotta} />
          ) : statusTone === "completed" ? (
            <CheckCircle2 size={14} color={palette.success ?? colors.success} />
          ) : (
            <Clock3 size={14} color={palette.textMuted} />
          )}
          <Text
            className={`font-ku-semibold text-ku-label ${
              statusTone === "in_progress"
                ? "text-ku-primary-dark dark:text-ku-primary"
                : statusTone === "assigned"
                  ? "text-ku-terracotta-dark dark:text-ku-terracotta"
                  : statusTone === "completed"
                    ? "text-ku-success-dark"
                    : "text-ku-text-muted"
            }`}
          >
            {status}
          </Text>
        </View>

        {formattedReward ? (
          <View className="items-end">
            <Text className="font-ku-bold text-ku-title-small text-ku-terracotta-dark dark:text-ku-terracotta">
              {formattedReward}
            </Text>
            <Text className="font-ku-medium text-[11px] text-ku-text-subtle">
              {locale === "th" ? "ค่าตอบแทน" : "Reward"}
            </Text>
          </View>
        ) : null}
      </View>

      {/* Quest Title */}
      <Text className="mt-ku-12 font-ku-bold text-[20px] leading-[26px] text-ku-text-strong">
        {snapshot.quest.title}
      </Text>

      {/* Metadata Chips */}
      <View className="mt-ku-10 flex-row flex-wrap gap-1.5">
        <View className="flex-row items-center gap-1 rounded-full border border-ku-border/50 bg-ku-surface-raised px-ku-sm py-0.5">
          {snapshot.participation === "GROUP" ? (
            <Users size={12} color={palette.textSecondary} />
          ) : (
            <User size={12} color={palette.textSecondary} />
          )}
          <Text className="font-ku-medium text-[11px] text-ku-text-secondary">
            {participationLabel}
          </Text>
        </View>

        <View className="rounded-full border border-ku-border/50 bg-ku-surface-raised px-ku-sm py-0.5">
          <Text className="font-ku-medium text-[11px] text-ku-text-secondary">
            {modeLabel}
          </Text>
        </View>

        <View className="rounded-full border border-ku-border/50 bg-ku-surface-raised px-ku-sm py-0.5">
          <Text className="font-ku-medium text-[11px] text-ku-text-secondary">
            {proofBadgeText}
          </Text>
        </View>

        {snapshot.quest.tag?.name ? (
          <View className="rounded-full border border-ku-border/50 bg-ku-surface-raised px-ku-sm py-0.5">
            <Text className="font-ku-medium text-[11px] text-ku-text-secondary">
              {snapshot.quest.tag.name}
            </Text>
          </View>
        ) : null}
      </View>

      {/* Divider */}
      <View className="mt-ku-14 mb-ku-6 border-t border-ku-border/50" />

      {/* Structured Details */}
      <View>
        <DetailRow
          icon={CalendarClock}
          iconColor={palette.primary}
          iconBg="bg-ku-primary-subtle"
          label={messages.dueAt}
          value={countdown}
          detail={dueAtDetail}
        />
        <DetailRow
          icon={Briefcase}
          iconColor={palette.terracotta}
          iconBg="bg-ku-surface-terracotta"
          label={messages.assignment}
          value={assignment}
        />
        <DetailRow
          icon={CheckCircle2}
          iconColor={palette.primaryDeep}
          iconBg="bg-ku-surface-accent"
          label={messages.nextAction}
          value={nextAction}
        />
        {locationLabel ? (
          <DetailRow
            icon={MapPin}
            iconColor={palette.textSecondary}
            label={locale === "th" ? "สถานที่" : "Location"}
            value={locationLabel}
          />
        ) : null}
      </View>
    </View>
  );
}
