import { Pressable, Text, View } from "@/tw";
import { cn } from "@/tw/cn";
import {
  CalendarCheck,
  CalendarClock,
  Check,
  CircleX,
  Clock3,
  Globe,
  MapPin,
  Pencil,
  Settings2,
  ShieldCheck,
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
  if (tone === "success") return palette.primary;
  if (tone === "danger") return palette.dangerDark;
  if (tone === "warning") return palette.warningDark;
  return palette.textSecondary;
}

function statusClasses(tone: StatusTone) {
  if (tone === "success") {
    return "border-ku-border-success bg-ku-surface-success";
  }
  if (tone === "danger") {
    return "border-ku-border-danger bg-ku-surface-danger";
  }
  if (tone === "warning") {
    return "border-ku-border-warning bg-ku-surface-warning";
  }
  return "border-ku-border bg-ku-surface-muted";
}

const ACTION_ICONS: Record<QuestCardAction, LucideIcon> = {
  edit: Pencil,
  manage: Settings2,
  review: Star,
  proofReview: ShieldCheck,
  dispute: TriangleAlert,
};

const ACTION_MESSAGE_KEYS = {
  edit: "edit",
  manage: "manage",
  review: "review",
  proofReview: "proofReview",
  dispute: "fileDispute",
} as const satisfies Record<QuestCardAction, keyof MyQuestMessages>;

function InfoRow({
  icon: Icon,
  label,
  value,
  palette,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  palette: ThemeColors;
}) {
  return (
    <View
      accessible
      accessibilityLabel={`${label}: ${value}`}
      className="min-w-0 flex-row items-center gap-ku-sm"
    >
      <Icon color={palette.primary} size={16} strokeWidth={2} />
      <Text className="min-w-0 flex-shrink font-ku-medium text-ku-body-small text-ku-text-secondary">
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
    <View className="overflow-hidden rounded-ku-card border border-ku-border bg-ku-surface">
      <Pressable
        accessibilityHint={messages.listHint}
        accessibilityLabel={`${quest.title}. ${quest.status}. ${quest.tag}. ${description}. ${messages.rewardPerPerson(quest.reward)}. ${messages.workerLabel}: ${messages.peopleCount(quest.teamSize)}. ${quest.mode}. ${messages.startLabel}: ${quest.startsAt}. ${messages.endLabel}: ${quest.endsAt}. ${quest.online ? messages.online : quest.location}`}
        accessibilityRole="button"
        className="p-ku-md active:bg-ku-surface-muted"
        onPress={onOpen}
        testID={`my-quest-list-card-${quest.id}`}
      >
        <View className="flex-row flex-wrap items-center justify-between gap-ku-sm">
          <View
            className={cn(
              "min-h-[28px] flex-row items-center gap-ku-xs rounded-ku-pill border px-ku-sm py-ku-xs",
              statusClasses(quest.statusTone)
            )}
          >
            <StatusIcon
              color={toneForeground(quest.statusTone, palette)}
              size={14}
              strokeWidth={2}
            />
            <Text className="font-ku-semibold text-ku-label text-ku-text-strong">
              {quest.status}
            </Text>
          </View>
          <Text className="shrink font-ku-medium text-ku-label text-ku-text-secondary">
            {quest.tag}
          </Text>
        </View>
        <Text className="mt-ku-12 font-ku-semibold text-ku-subtitle text-ku-text-strong">
          {quest.title}
        </Text>
        {description ? (
          <Text
            className="mt-ku-xs font-ku-regular text-ku-body-small text-ku-text-secondary"
            numberOfLines={2}
          >
            {description}
          </Text>
        ) : null}
        <View className="mt-ku-md flex-row flex-wrap items-center justify-between gap-ku-12">
          <View>
            <Text className="font-ku-regular text-ku-label text-ku-text-secondary">
              {messages.rewardLabel}
            </Text>
            <Text className="font-ku-semibold text-ku-subtitle text-ku-primary">
              {messages.rewardPerPerson(quest.reward)}
            </Text>
          </View>
          <View className="min-w-0 shrink gap-ku-xs">
            <InfoRow
              icon={UsersRound}
              label={messages.workerLabel}
              palette={palette}
              value={messages.peopleCount(quest.teamSize)}
            />
            <Text className="font-ku-regular text-ku-label text-ku-text-secondary">
              {quest.mode}
            </Text>
          </View>
        </View>
        <View className="mt-ku-md gap-ku-sm border-t border-ku-divider pt-ku-12">
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
              <Text className="min-w-[48px] font-ku-regular text-ku-body-small text-ku-text-secondary">
                {label}
              </Text>
              <Text className="min-w-0 flex-1 font-ku-medium text-ku-body-small text-ku-text-strong">
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
        </View>
      </Pressable>
      <View className="flex-row flex-wrap items-center gap-ku-sm border-t border-ku-divider px-ku-md py-ku-12">
        {quest.cancelFromCard ? (
          <Pressable
            accessibilityLabel={`${messages.cancelQuest}: ${quest.title}`}
            accessibilityRole="button"
            accessibilityState={{ disabled: cancelling, busy: cancelling }}
            className={cn(
              "min-h-[48px] flex-row items-center justify-center gap-ku-xs rounded-ku-pill px-ku-sm active:bg-ku-surface-danger",
              cancelling && "opacity-50"
            )}
            disabled={cancelling}
            onPress={onCancel}
            testID={`my-quest-list-cancel-${quest.id}`}
          >
            <CircleX color={palette.dangerDark} size={16} strokeWidth={2.2} />
            <Text className="shrink font-ku-medium text-ku-body-small text-ku-danger-dark">
              {messages.cancelQuest}
            </Text>
          </Pressable>
        ) : null}
        {quest.canReviewProof ? (
          <Pressable
            accessibilityLabel={`${messages.proofReview}: ${quest.title}`}
            accessibilityRole="button"
            className="min-h-[48px] flex-row items-center justify-center gap-ku-xs rounded-ku-pill border border-ku-border px-ku-12 active:bg-ku-surface-muted"
            onPress={() => onAction("proofReview")}
            testID={`my-quest-list-proof-review-${quest.id}`}
          >
            <ShieldCheck
              color={palette.textStrong}
              size={16}
              strokeWidth={2.2}
            />
            <Text className="shrink font-ku-medium text-ku-body-small text-ku-text-strong">
              {messages.proofReview}
            </Text>
          </Pressable>
        ) : null}
        {secondaryAction && SecondaryIcon ? (
          <Pressable
            accessibilityLabel={`${secondaryLabel}: ${quest.title}`}
            accessibilityRole="button"
            className="min-h-[48px] flex-row items-center justify-center gap-ku-xs rounded-ku-pill border border-ku-border px-ku-12 active:bg-ku-surface-muted"
            onPress={() => onAction(secondaryAction)}
            testID={`my-quest-list-secondary-${quest.id}`}
          >
            <SecondaryIcon
              color={palette.textStrong}
              size={16}
              strokeWidth={2.2}
            />
            <Text className="shrink font-ku-medium text-ku-body-small text-ku-text-strong">
              {secondaryLabel}
            </Text>
          </Pressable>
        ) : null}
        <Pressable
          accessibilityLabel={`${primaryLabel}: ${quest.title}`}
          accessibilityRole="button"
          className="ml-auto min-h-[48px] flex-row items-center justify-center gap-ku-sm rounded-ku-pill bg-ku-primary px-ku-20 active:opacity-80"
          onPress={() => onAction(quest.primaryAction)}
          testID={`my-quest-list-action-${quest.id}`}
        >
          <PrimaryIcon color={palette.onPrimary} size={16} strokeWidth={2.2} />
          <Text className="shrink font-ku-semibold text-ku-body-small text-ku-on-primary">
            {primaryLabel}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
