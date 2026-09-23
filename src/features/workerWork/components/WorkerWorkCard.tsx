import {
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  CircleX,
  Clock3,
} from "lucide-react-native";

import { Pressable, Text, View } from "@/tw";
import { cn } from "@/tw/cn";
import { formatTimestampDateTime } from "@/domain/datetime";
import type { SupportedLocale } from "@/locales/locale";
import type { WorkerWorkMessages } from "@/locales/workerWorkMessages";
import type { ThemeColors } from "@/theme/colors";
import type { WorkerWorkItem, WorkerWorkTone } from "../workerWorkTypes";
import { workerWorkStyles as styles } from "../workerWorkStyles";

export interface WorkerWorkCardProps {
  item: WorkerWorkItem;
  locale: SupportedLocale;
  messages: WorkerWorkMessages;
  palette: ThemeColors;
  onOpen: () => void;
}

const toneClasses: Record<WorkerWorkTone, { pill: string; text: string }> = {
  action: {
    pill: "border-ku-border-warning bg-ku-surface-warning",
    text: "text-ku-warning-dark",
  },
  progress: {
    pill: "border-ku-border-accent bg-ku-surface-accent",
    text: "text-ku-primary-deep",
  },
  success: {
    pill: "border-ku-border-success bg-ku-surface-success",
    text: "text-ku-success",
  },
  danger: {
    pill: "border-ku-border-danger bg-ku-surface-danger",
    text: "text-ku-danger-dark",
  },
  neutral: {
    pill: "border-ku-border-subtle bg-ku-surface-muted",
    text: "text-ku-text-secondary",
  },
};

function toneColor(tone: WorkerWorkTone, palette: ThemeColors): string {
  if (tone === "action") return palette.warningDark;
  if (tone === "progress") return palette.primaryDeep;
  if (tone === "success") return palette.success;
  if (tone === "danger") return palette.dangerDark;
  return palette.textSecondary;
}

function ToneIcon({ tone, color }: { tone: WorkerWorkTone; color: string }) {
  const Icon =
    tone === "action"
      ? CircleAlert
      : tone === "success"
        ? CheckCircle2
        : tone === "danger"
          ? CircleX
          : Clock3;
  return <Icon color={color} size={14} strokeWidth={2.2} />;
}

export function WorkerWorkCard({
  item,
  locale,
  messages,
  palette,
  onOpen,
}: WorkerWorkCardProps) {
  const tone = toneClasses[item.tone];
  const statusLabel = messages.status[item.status];
  const awaitingStart =
    item.questState === "QUEST_OPEN" || item.questState === "QUEST_ASSIGNED";
  const timeLabel = awaitingStart ? messages.startsLabel : messages.dueLabel;
  const timeValue = awaitingStart
    ? formatTimestampDateTime(item.startTime, locale)
    : item.dueAt
      ? formatTimestampDateTime(item.dueAt, locale)
      : messages.noDueAt;

  return (
    <Pressable
      accessibilityHint={messages.openWork(item.title)}
      accessibilityLabel={`${item.title}, ${statusLabel}, ${timeLabel} ${timeValue}`}
      accessibilityRole="button"
      className={styles.card}
      onPress={onOpen}
      testID={`worker-work-open-${item.questId}`}
    >
      <View className={styles.cardCopy}>
        <View className={cn(styles.statusPill, tone.pill)}>
          <ToneIcon color={toneColor(item.tone, palette)} tone={item.tone} />
          <Text className={cn(styles.statusText, tone.text)}>
            {statusLabel}
          </Text>
        </View>
        <Text className={styles.cardTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <View className={styles.metaRow}>
          <CalendarClock
            color={palette.textSecondary}
            size={15}
            strokeWidth={2}
          />
          <Text className={styles.metaText} numberOfLines={1}>
            {timeLabel} · {timeValue}
          </Text>
        </View>
      </View>
      <ChevronRight color={palette.textSecondary} size={20} strokeWidth={2} />
    </Pressable>
  );
}
