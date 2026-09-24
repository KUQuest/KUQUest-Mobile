import React from "react";
import { Pressable, Text, View } from "@/tw";
import {
  BriefcaseBusiness,
  CalendarCheck,
  CalendarClock,
  Check,
  CircleX,
  Clock3,
  Coins,
  Globe,
  MapPin,
  Pencil,
  Settings2,
  Star,
  TriangleAlert,
  UsersRound,
  type LucideIcon,
} from "lucide-react-native";
import type { MyQuestMessages } from "@/locales/myQuestMessages";
import { type ThemeColors } from "@/theme/colors";
import {
  type QuestCardAction,
  type QuestSummary,
  type StatusTone,
} from "../myQuestTypes";

export interface MyQuestSummaryCardProps {
  messages: MyQuestMessages;
  palette: ThemeColors;
  quest: QuestSummary;
  cancelling: boolean;
  onOpen: () => void;
  onAction: (action: QuestCardAction) => void;
  onCancel: () => void;
}

function toneForeground(tone: StatusTone, palette: ThemeColors): string {
  if (tone === "success") return palette.success;
  if (tone === "danger") return palette.dangerDark;
  if (tone === "warning") return palette.warningDark;
  return palette.textSecondary;
}

function statusClasses(tone: StatusTone) {
  if (tone === "success") {
    return "border-ku-border-success bg-ku-surface-success text-ku-success";
  }
  if (tone === "danger") {
    return "border-ku-border-danger bg-ku-surface-danger text-ku-danger-dark";
  }
  if (tone === "warning") {
    return "border-ku-border-warning bg-ku-surface-warning text-ku-warning-dark";
  }
  return "border-ku-border bg-ku-surface-muted text-ku-text-secondary";
}

const ACTION_ICONS: Record<QuestCardAction, LucideIcon> = {
  edit: Pencil,
  manage: Settings2,
  review: Star,
  dispute: TriangleAlert,
};

const ACTION_MESSAGE_KEYS = {
  edit: "edit",
  manage: "manage",
  review: "review",
  dispute: "fileDispute",
} as const satisfies Record<QuestCardAction, keyof MyQuestMessages>;

function InfoRow({
  icon: Icon,
  label,
  value,
  palette,
  emphasis = false,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  palette: ThemeColors;
  emphasis?: boolean;
}) {
  return (
    <View
      accessible
      accessibilityLabel={`${label}: ${value}`}
      className="min-w-0 flex-row items-center gap-ku-sm"
    >
      <Icon color={palette.primary} size={16} strokeWidth={2} />
      <Text
        className={
          emphasis
            ? "flex-shrink font-ku-bold text-ku-body-small leading-[20px] text-ku-primary"
            : "flex-shrink font-ku-medium text-ku-body-small leading-[20px] text-ku-text-secondary"
        }
      >
        {value}
      </Text>
    </View>
  );
}

export function MyQuestSummaryCard({
  messages,
  palette,
  quest,
  cancelling,
  onOpen,
  onAction,
  onCancel,
}: MyQuestSummaryCardProps) {
  const description = quest.description.trim();
  const StatusIcon =
    quest.statusTone === "success"
      ? Check
      : quest.statusTone === "danger"
        ? CircleX
        : Clock3;
  const PrimaryIcon = ACTION_ICONS[quest.primaryAction];
  const primaryLabel = messages[ACTION_MESSAGE_KEYS[quest.primaryAction]];
  const secondaryAction = quest.secondaryAction;
  const SecondaryIcon = secondaryAction ? ACTION_ICONS[secondaryAction] : null;
  const secondaryLabel = secondaryAction
    ? messages[ACTION_MESSAGE_KEYS[secondaryAction]]
    : "";
  return (
    <View
      className="overflow-hidden rounded-[16px] border border-ku-border-accent"
      style={{ backgroundColor: palette.surface }}
    >
      <Pressable
        accessibilityHint={messages.listHint}
        accessibilityLabel={`${quest.title}. ${quest.status}`}
        accessibilityRole="button"
        className="p-ku-md"
        onPress={onOpen}
        style={({ pressed }) =>
          pressed ? { backgroundColor: palette.surfaceAccent } : undefined
        }
        testID={`my-quest-list-card-${quest.id}`}
      >
        <View className="flex-row items-center justify-between gap-ku-sm">
          <View className="min-h-[28px] flex-shrink flex-row items-center rounded-ku-pill bg-ku-surface-accent px-ku-sm">
            <BriefcaseBusiness
              color={palette.primary}
              size={14}
              strokeWidth={2}
            />
            <Text
              className="ml-ku-xs flex-shrink font-ku-semibold text-ku-label leading-[18px] text-ku-primary"
              numberOfLines={1}
            >
              {quest.tag}
            </Text>
          </View>
          <View
            className={`min-h-[28px] flex-shrink-0 flex-row items-center justify-center gap-ku-xs rounded-ku-pill border px-ku-9 ${statusClasses(quest.statusTone)}`}
          >
            <StatusIcon
              color={toneForeground(quest.statusTone, palette)}
              size={14}
              strokeWidth={2.2}
            />
            <Text className="font-ku-semibold text-ku-label leading-[18px]">
              {quest.status}
            </Text>
          </View>
        </View>
        <Text
          className="mt-ku-sm font-ku-bold text-ku-title-small leading-[24px] text-ku-text-strong"
          numberOfLines={2}
        >
          {quest.title}
        </Text>
        {description ? (
          <Text
            className="mt-ku-xs font-ku-regular text-ku-body-small leading-[21px] text-ku-text-secondary"
            numberOfLines={2}
          >
            {description}
          </Text>
        ) : null}
        <View className="mt-ku-12 gap-ku-sm rounded-[12px] bg-ku-surface-muted p-ku-12">
          {(
            [
              [CalendarClock, messages.startLabel, quest.startsAt],
              [CalendarCheck, messages.endLabel, quest.endsAt],
            ] as const
          ).map(([Icon, label, value]) => (
            <View
              key={label}
              accessible
              accessibilityLabel={`${label}: ${value}`}
              className="flex-row items-center gap-ku-sm"
            >
              <Icon color={palette.primary} size={16} strokeWidth={2} />
              <Text className="min-w-[48px] font-ku-regular text-ku-body-small leading-[20px] text-ku-text-muted">
                {label}
              </Text>
              <Text className="flex-1 font-ku-medium text-ku-body-small leading-[20px] text-ku-text-secondary">
                {value}
              </Text>
            </View>
          ))}
          <InfoRow
            icon={quest.online ? Globe : MapPin}
            label={messages.locationLabel}
            palette={palette}
            value={quest.online ? messages.online : quest.location}
          />
          <View className="flex-row flex-wrap items-center justify-between gap-ku-sm">
            <InfoRow
              icon={UsersRound}
              label={messages.workerLabel}
              palette={palette}
              value={`${messages.peopleCount(quest.teamSize)} · ${quest.mode}`}
            />
            <InfoRow
              emphasis
              icon={Coins}
              label={messages.rewardLabel}
              palette={palette}
              value={messages.rewardPerPerson(quest.reward)}
            />
          </View>
        </View>
      </Pressable>
      <View className="flex-row flex-wrap items-center gap-ku-sm border-t border-ku-border-subtle px-ku-md py-ku-12">
        {quest.cancelFromCard ? (
          <Pressable
            accessibilityLabel={`${messages.cancelQuest}: ${quest.title}`}
            accessibilityRole="button"
            accessibilityState={{ disabled: cancelling, busy: cancelling }}
            className={`min-h-[48px] flex-row items-center justify-center gap-ku-xs rounded-ku-pill border border-ku-border-danger px-ku-14 ${cancelling ? "opacity-[0.5]" : ""}`}
            disabled={cancelling}
            onPress={onCancel}
            testID={`my-quest-list-cancel-${quest.id}`}
          >
            <CircleX color={palette.dangerDark} size={16} strokeWidth={2.2} />
            <Text className="font-ku-semibold text-ku-meta leading-[18px] text-ku-danger-dark">
              {messages.cancelQuest}
            </Text>
          </Pressable>
        ) : null}
        {secondaryAction && SecondaryIcon ? (
          <Pressable
            accessibilityLabel={`${secondaryLabel}: ${quest.title}`}
            accessibilityRole="button"
            className="min-h-[48px] flex-row items-center justify-center gap-ku-xs rounded-ku-pill border border-ku-border px-ku-14"
            onPress={() => onAction(secondaryAction)}
            testID={`my-quest-list-secondary-${quest.id}`}
          >
            <SecondaryIcon
              color={palette.textStrong}
              size={16}
              strokeWidth={2.2}
            />
            <Text className="font-ku-semibold text-ku-meta leading-[18px] text-ku-text-strong">
              {secondaryLabel}
            </Text>
          </Pressable>
        ) : null}
        <Pressable
          accessibilityLabel={`${primaryLabel}: ${quest.title}`}
          accessibilityRole="button"
          className="ml-auto min-h-[48px] flex-row items-center justify-center gap-ku-xs rounded-ku-pill bg-ku-primary px-ku-md"
          onPress={() => onAction(quest.primaryAction)}
          style={({ pressed }) =>
            pressed ? { backgroundColor: palette.primaryDark } : undefined
          }
          testID={`my-quest-list-action-${quest.id}`}
        >
          <PrimaryIcon color={palette.onPrimary} size={16} strokeWidth={2.2} />
          <Text className="font-ku-semibold text-ku-meta leading-[18px] text-ku-on-primary">
            {primaryLabel}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
