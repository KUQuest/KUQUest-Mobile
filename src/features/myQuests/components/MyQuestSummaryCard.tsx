import React from "react";
import { Pressable, Text, View } from "@/tw";
import {
  BriefcaseBusiness,
  CalendarDays,
  Check,
  CircleX,
  Clock3,
  MapPin,
  Pencil,
  Star,
} from "lucide-react-native";
import type { MyQuestMessages } from "@/locales/myQuestMessages";
import { type ThemeColors } from "@/theme/colors";
import { type QuestSummary, type StatusTone } from "../myQuestService";

export interface MyQuestSummaryCardProps {
  messages: MyQuestMessages;
  onOpen: () => void;
  palette: ThemeColors;
  quest: QuestSummary;
}

type StatusPalette = {
  foreground: string;
};

function toneColors(tone: StatusTone, palette: ThemeColors): StatusPalette {
  if (tone === "success") return { foreground: palette.success };
  if (tone === "danger") return { foreground: palette.dangerDark };
  if (tone === "warning") return { foreground: palette.warningDark };
  return { foreground: palette.textSecondary };
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

function StatusIcon({ tone, color }: { tone: StatusTone; color: string }) {
  const Icon =
    tone === "success" ? Check : tone === "danger" ? CircleX : Clock3;
  return <Icon color={color} size={14} strokeWidth={2.2} />;
}

export function MyQuestSummaryCard({
  messages,
  onOpen,
  palette,
  quest,
}: MyQuestSummaryCardProps) {
  const status = toneColors(quest.statusTone, palette);
  const description = quest.description.trim();
  return (
    <View
      className="overflow-hidden rounded-[16px] border border-ku-border-accent"
      style={{ backgroundColor: palette.surface }}
    >
      <Pressable
        accessibilityHint={messages.listHint}
        accessibilityLabel={`${quest.title}. ${quest.status}. ${messages.detail}`}
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
              className="ml-ku-xs flex-shrink font-ku-semibold leading-[18px] text-ku-primary"
              numberOfLines={1}
            >
              {quest.tag}
            </Text>
          </View>
          <View
            className={`min-h-[28px] flex-shrink-0 flex-row items-center justify-center gap-ku-xs rounded-ku-pill border px-[9px] ${statusClasses(quest.statusTone)}`}
          >
            <StatusIcon color={status.foreground} tone={quest.statusTone} />
            <Text className="font-ku-semibold text-ku-label leading-[18px]">
              {quest.status}
            </Text>
          </View>
        </View>
        <Text
          className="mt-ku-sm font-ku-bold text-ku-title-small leading-[24px]"
          numberOfLines={2}
        >
          {quest.title}
        </Text>
        {description ? (
          <Text
            className="mt-ku-xs font-ku-regular text-ku-body-small leading-[21px]"
            numberOfLines={2}
          >
            {description}
          </Text>
        ) : null}
        <View className="mt-[14px] gap-ku-sm">
          <View className="min-h-[28px] flex-row items-center gap-ku-sm">
            <View className="h-[28px] w-[28px] items-center justify-center rounded-ku-pill bg-ku-surface-accent">
              <CalendarDays color={palette.primary} size={15} strokeWidth={2} />
            </View>
            <View className="min-w-0 flex-1">
              <Text className="font-ku-regular text-[10px] leading-[14px] text-ku-text-muted">
                {messages.scheduleLabel}
              </Text>
              <Text
                className="mt-[1px] flex-shrink font-ku-semibold text-ku-body-small leading-[18px] text-ku-text-secondary"
                numberOfLines={1}
              >
                {quest.date}
              </Text>
            </View>
          </View>
          <View className="min-h-[28px] flex-row items-center gap-ku-sm">
            <View className="h-[28px] w-[28px] items-center justify-center rounded-ku-pill bg-ku-surface-accent">
              <MapPin color={palette.primary} size={15} strokeWidth={2} />
            </View>
            <View className="min-w-0 flex-1">
              <Text className="font-ku-regular text-[10px] leading-[14px] text-ku-text-muted">
                {messages.locationLabel}
              </Text>
              <Text
                className="mt-[1px] flex-shrink font-ku-semibold text-ku-body-small leading-[18px] text-ku-text-secondary"
                numberOfLines={1}
              >
                {quest.location}
              </Text>
            </View>
          </View>
        </View>
        <View className="mt-[14px] flex-row gap-ku-sm border-t border-ku-border-subtle pt-ku-sm">
          <View className="min-w-0 flex-1">
            <Text className="font-ku-regular text-[10px] leading-[14px] text-ku-text-muted">
              {messages.workerLabel}
            </Text>
            <Text className="mt-[2px] flex-shrink font-ku-bold text-ku-meta leading-[18px] text-ku-text-strong">
              {quest.teamSize}
            </Text>
          </View>
          <View className="min-w-0 flex-1">
            <Text className="font-ku-regular text-[10px] leading-[14px] text-ku-text-muted">
              {messages.statusLabel}
            </Text>
            <Text
              className="mt-[2px] flex-shrink font-ku-bold text-ku-meta leading-[18px] text-ku-text-strong"
              numberOfLines={1}
            >
              {quest.status}
            </Text>
          </View>
        </View>
      </Pressable>
      <View
        className="flex-row items-center justify-end px-ku-md py-[10px]"
        style={{ backgroundColor: palette.surface }}
      >
        <Pressable
          accessibilityLabel={`${quest.action}: ${quest.title}`}
          accessibilityRole="button"
          className="min-h-[40px] flex-row items-center justify-center gap-[5px] rounded-ku-pill bg-ku-primary px-[14px]"
          onPress={onOpen}
          style={({ pressed }) =>
            pressed ? { backgroundColor: palette.primaryDark } : undefined
          }
          testID={`my-quest-list-action-${quest.id}`}
        >
          {quest.actionType === "edit" ? (
            <Pencil color={palette.onPrimary} size={16} strokeWidth={2.2} />
          ) : quest.actionType === "review" ? (
            <Star color={palette.onPrimary} size={16} strokeWidth={2.2} />
          ) : null}
          <Text className="font-ku-semibold text-ku-label leading-[18px] text-ku-on-primary">
            {quest.actionType === "edit"
              ? messages.edit
              : quest.actionType === "review"
                ? messages.review
                : quest.action}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
