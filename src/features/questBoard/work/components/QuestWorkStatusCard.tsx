import React, { useMemo } from "react";
import {
  ArrowRightCircle,
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
import { cn } from "@/tw/cn";
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
  iconColor,
  emphasis = false,
}: {
  icon: React.ComponentType<{ size?: number; color?: string }>;
  label: string;
  value: string;
  iconColor: string;
  emphasis?: boolean;
}) {
  return (
    <View className={cn(styles.row, styles.rowDivider)}>
      <Icon size={18} color={iconColor} />
      <Text className={styles.rowLabel}>{label}</Text>
      <Text
        className={cn(styles.rowValue, emphasis && styles.rowValueEmphasis)}
      >
        {value}
      </Text>
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

  const formattedReward = useMemo(() => {
    const quest = snapshot.quest;
    const rewardBaht =
      "questReward" in quest &&
      typeof quest.questReward === "number" &&
      quest.questReward > 0
        ? quest.questReward
        : "questFundingTotal" in quest &&
            typeof quest.questFundingTotal === "number" &&
            quest.questFundingTotal > 0
          ? quest.questFundingTotal
          : null;
    if (rewardBaht === null) return null;
    return formatSatang(Math.round(rewardBaht * SATANG_PER_BAHT), locale);
  }, [snapshot.quest, locale]);
  const statusTone = isTerminal
    ? "terminal"
    : snapshot.state === QuestStatus.QUEST_IN_PROGRESS
      ? "in_progress"
      : snapshot.state === QuestStatus.QUEST_COMPLETED
        ? "completed"
        : "assigned";
  const StatusIcon =
    statusTone === "in_progress"
      ? Zap
      : statusTone === "completed"
        ? CheckCircle2
        : Clock3;
  const statusIconColor =
    statusTone === "in_progress"
      ? palette.primaryDark
      : statusTone === "completed"
        ? palette.success
        : palette.textSecondary;

  const isCandidateMode = snapshot.mode === QuestCandidateMode.CANDIDATE;
  const modeLabel = isCandidateMode
    ? messages.modeCandidate
    : messages.modeFcfs;

  const isGroup = snapshot.participation === QuestParticipation.GROUP;
  const participationLabel = isGroup
    ? messages.participationTeam
    : messages.participationSolo;

  const proofBadgeText = snapshot.proofRequired
    ? messages.proofRequiredBadge
    : messages.proofFreeBadge;

  const locationLabel = snapshot.quest.locations?.[0]?.label;
  const ParticipationIcon = isGroup ? Users : User;

  return (
    <View className={styles.card}>
      <View className={styles.header}>
        <View className={styles.headerTop}>
          <View className={cn(styles.statusPill, statusPillTone[statusTone])}>
            <StatusIcon size={14} color={statusIconColor} strokeWidth={2.2} />
            <Text className={cn(styles.statusText, statusTextTone[statusTone])}>
              {status}
            </Text>
          </View>
          {snapshot.quest.tag?.name ? (
            <Text className={styles.tag} numberOfLines={1}>
              {snapshot.quest.tag.name}
            </Text>
          ) : null}
        </View>
        <Text accessibilityRole="header" className={styles.title}>
          {snapshot.quest.title}
        </Text>
        <View className={styles.metaRow}>
          <ParticipationIcon size={14} color={palette.textSecondary} />
          <Text className={styles.metaText}>
            {[participationLabel, modeLabel, proofBadgeText].join(" · ")}
          </Text>
        </View>
      </View>

      <View className={styles.statStrip}>
        {formattedReward ? (
          <>
            <View className={styles.statTile}>
              <Text className={styles.statLabel}>{messages.reward}</Text>
              <Text className={styles.rewardValue}>{formattedReward}</Text>
            </View>
            <View className={styles.statDivider} />
          </>
        ) : null}
        <View className={styles.statTile}>
          <View className={styles.statLabelRow}>
            <CalendarClock size={14} color={palette.textSecondary} />
            <Text className={styles.statLabel}>{messages.dueAt}</Text>
          </View>
          <Text className={styles.dueValue}>{countdown}</Text>
          {dueAtDetail ? (
            <Text className={styles.statDetail}>{dueAtDetail}</Text>
          ) : null}
        </View>
      </View>

      <View>
        <DetailRow
          icon={Briefcase}
          iconColor={palette.textSecondary}
          label={messages.assignment}
          value={assignment}
        />
        <DetailRow
          emphasis
          icon={ArrowRightCircle}
          iconColor={palette.primaryDark}
          label={messages.nextAction}
          value={nextAction}
        />
        {locationLabel ? (
          <DetailRow
            icon={MapPin}
            iconColor={palette.textSecondary}
            label={messages.location}
            value={locationLabel}
          />
        ) : null}
      </View>
    </View>
  );
}

const statusPillTone = {
  in_progress: "border-ku-primary-border bg-ku-primary-subtle",
  assigned: "border-ku-border bg-ku-surface-raised",
  completed: "border-ku-border-success bg-ku-surface-success",
  terminal: "border-ku-border bg-ku-surface-raised",
} as const;

const statusTextTone = {
  in_progress: "text-ku-primary-dark",
  assigned: "text-ku-text",
  completed: "text-ku-success",
  terminal: "text-ku-text-muted",
} as const;

const styles = {
  card: "overflow-hidden rounded-ku-card border border-ku-border bg-ku-surface",
  header: "gap-ku-sm p-ku-md",
  headerTop: "flex-row items-center justify-between gap-ku-sm",
  statusPill:
    "flex-row items-center gap-ku-6 rounded-ku-pill border px-ku-10 py-ku-4",
  statusText: "font-ku-semibold text-ku-label",
  tag: "shrink rounded-ku-pill bg-ku-surface-raised px-ku-10 py-ku-4 font-ku-medium text-ku-label text-ku-text-secondary",
  title: "font-ku-bold text-ku-title text-ku-text-strong",
  metaRow: "flex-row items-center gap-ku-6",
  metaText: "flex-1 font-ku-regular text-ku-label text-ku-text-secondary",
  statStrip: "flex-row border-t border-ku-divider bg-ku-surface-raised",
  statTile: "flex-1 gap-ku-2 px-ku-md py-ku-12",
  statDivider: "w-px bg-ku-divider",
  statLabelRow: "flex-row items-center gap-ku-6",
  statLabel: "font-ku-medium text-ku-label text-ku-text-secondary",
  rewardValue: "font-ku-bold text-ku-title-small text-ku-primary-dark",
  dueValue: "font-ku-bold text-ku-body text-ku-text-strong",
  statDetail: "font-ku-regular text-ku-label text-ku-text-secondary",
  row: "min-h-[52px] flex-row items-center gap-ku-12 px-ku-md py-ku-sm",
  rowDivider: "border-t border-ku-divider",
  rowLabel: "flex-1 font-ku-medium text-ku-body-small text-ku-text-secondary",
  rowValue:
    "max-w-[55%] text-right font-ku-semibold text-ku-body-small text-ku-text-strong",
  rowValueEmphasis: "text-ku-primary-dark",
} as const;
