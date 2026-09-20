import React from "react";
import { StyleSheet } from "react-native";
import { Pressable, Text, View } from "@/tw";
import {
  BriefcaseBusiness,
  CalendarDays,
  Check,
  CircleX,
  MapPin,
  Pencil,
  Clock3,
} from "lucide-react-native";
import type { MyQuestMessages } from "@/locales/myQuestMessages";
import { fontFamily } from "@/theme/typography";
import { type ThemeColors } from "@/theme/colors";
import { type QuestSummary, type StatusTone } from "../myQuestService";

export interface MyQuestSummaryCardProps {
  messages: MyQuestMessages;
  onOpen: () => void;
  palette: ThemeColors;
  quest: QuestSummary;
}

type StatusPalette = {
  background: string;
  border: string;
  foreground: string;
};

function toneColors(tone: StatusTone, palette: ThemeColors): StatusPalette {
  if (tone === "success") {
    return {
      background: palette.surfaceSuccess,
      border: palette.borderSuccess,
      foreground: palette.success,
    };
  }
  if (tone === "danger") {
    return {
      background: palette.surfaceDanger,
      border: palette.borderDanger,
      foreground: palette.dangerDark,
    };
  }
  if (tone === "warning") {
    return {
      background: palette.surfaceWarning,
      border: palette.borderWarning,
      foreground: palette.warningDark,
    };
  }
  return {
    background: palette.surfaceMuted,
    border: palette.border,
    foreground: palette.textSecondary,
  };
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
      style={[
        styles.card,
        { backgroundColor: palette.white, borderColor: palette.borderAccent },
      ]}
    >
      <Pressable
        accessibilityHint={messages.listHint}
        accessibilityLabel={`${quest.title}. ${quest.status}. ${messages.detail}`}
        accessibilityRole="button"
        onPress={onOpen}
        style={({ pressed }) => [
          styles.cardBody,
          pressed && { backgroundColor: palette.surfaceAccent },
        ]}
        testID={`my-quest-list-card-${quest.id}`}
      >
        <View style={styles.cardTop}>
          <View
            style={[styles.tag, { backgroundColor: palette.surfaceAccent }]}
          >
            <BriefcaseBusiness
              color={palette.primary}
              size={14}
              strokeWidth={2}
            />
            <Text
              numberOfLines={1}
              style={[styles.tagText, { color: palette.primary }]}
            >
              {quest.tag}
            </Text>
          </View>
          <View
            style={[
              styles.status,
              {
                backgroundColor: status.background,
                borderColor: status.border,
              },
            ]}
          >
            <StatusIcon color={status.foreground} tone={quest.statusTone} />
            <Text style={[styles.statusText, { color: status.foreground }]}>
              {quest.status}
            </Text>
          </View>
        </View>
        <Text
          numberOfLines={2}
          style={[styles.cardTitle, { color: palette.textStrong }]}
        >
          {quest.title}
        </Text>
        {description ? (
          <Text
            numberOfLines={2}
            style={[styles.description, { color: palette.textSecondary }]}
          >
            {description}
          </Text>
        ) : null}
        <View style={styles.metaList}>
          <View style={styles.metaRow}>
            <View
              style={[
                styles.metaIcon,
                { backgroundColor: palette.surfaceAccent },
              ]}
            >
              <CalendarDays color={palette.primary} size={15} strokeWidth={2} />
            </View>
            <View style={styles.metaCopy}>
              <Text style={[styles.metaLabel, { color: palette.textMuted }]}>
                {messages.scheduleLabel}
              </Text>
              <Text
                numberOfLines={1}
                style={[styles.metaValue, { color: palette.textSecondary }]}
              >
                {quest.date}
              </Text>
            </View>
          </View>
          <View style={styles.metaRow}>
            <View
              style={[
                styles.metaIcon,
                { backgroundColor: palette.surfaceAccent },
              ]}
            >
              <MapPin color={palette.primary} size={15} strokeWidth={2} />
            </View>
            <View style={styles.metaCopy}>
              <Text style={[styles.metaLabel, { color: palette.textMuted }]}>
                {messages.locationLabel}
              </Text>
              <Text
                numberOfLines={1}
                style={[styles.metaValue, { color: palette.textSecondary }]}
              >
                {quest.location}
              </Text>
            </View>
          </View>
        </View>
        <View
          style={[styles.detailRow, { borderTopColor: palette.borderSubtle }]}
        >
          <View style={styles.detail}>
            <Text style={[styles.detailLabel, { color: palette.textMuted }]}>
              {messages.workerLabel}
            </Text>
            <Text style={[styles.detailValue, { color: palette.textStrong }]}>
              {quest.teamSize}
            </Text>
          </View>
          <View style={styles.detail}>
            <Text style={[styles.detailLabel, { color: palette.textMuted }]}>
              {messages.statusLabel}
            </Text>
            <Text
              numberOfLines={1}
              style={[styles.detailValue, { color: palette.textStrong }]}
            >
              {quest.status}
            </Text>
          </View>
        </View>
      </Pressable>
      <View style={[styles.footer, { backgroundColor: palette.surface }]}>
        <Pressable
          accessibilityLabel={`${quest.action}: ${quest.title}`}
          accessibilityRole="button"
          onPress={onOpen}
          style={({ pressed }) => [
            styles.actionButton,
            { backgroundColor: palette.primary },
            pressed && { backgroundColor: palette.primaryDark },
          ]}
          testID={`my-quest-list-action-${quest.id}`}
        >
          {quest.actionType === "edit" ? (
            <Pencil color={palette.white} size={16} strokeWidth={2.2} />
          ) : null}
          <Text style={[styles.actionText, { color: palette.white }]}>
            {quest.actionType === "edit" ? messages.edit : quest.action}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 16, borderWidth: 1, overflow: "hidden" },
  cardBody: { padding: 16 },
  cardTop: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    justifyContent: "space-between",
  },
  tag: {
    alignItems: "center",
    borderRadius: 9999,
    flexDirection: "row",
    flexShrink: 1,
    minHeight: 28,
    paddingHorizontal: 8,
  },
  tagText: {
    flexShrink: 1,
    fontFamily: fontFamily.semiBold,
    fontSize: 12,
    lineHeight: 18,
    marginLeft: 4,
  },
  status: {
    alignItems: "center",
    borderRadius: 9999,
    borderWidth: 1,
    flexDirection: "row",
    flexShrink: 0,
    gap: 4,
    minHeight: 28,
    justifyContent: "center",
    paddingHorizontal: 9,
  },
  statusText: { fontFamily: fontFamily.semiBold, fontSize: 12, lineHeight: 18 },
  cardTitle: {
    fontFamily: fontFamily.bold,
    fontSize: 18,
    lineHeight: 24,
    marginTop: 12,
  },
  description: {
    fontFamily: fontFamily.regular,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 4,
  },
  metaList: { gap: 8, marginTop: 14 },
  metaRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    minHeight: 28,
  },
  metaIcon: {
    alignItems: "center",
    borderRadius: 9999,
    height: 28,
    justifyContent: "center",
    width: 28,
  },
  metaCopy: { flex: 1, minWidth: 0 },
  metaLabel: { fontFamily: fontFamily.regular, fontSize: 10, lineHeight: 14 },
  metaValue: {
    flexShrink: 1,
    fontFamily: fontFamily.semiBold,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 1,
  },
  detailRow: {
    borderTopWidth: 1,
    flexDirection: "row",
    gap: 8,
    marginTop: 14,
    paddingTop: 12,
  },
  detail: { flex: 1, flexShrink: 1, minWidth: 0 },
  detailLabel: { fontFamily: fontFamily.regular, fontSize: 10, lineHeight: 14 },
  detailValue: {
    flexShrink: 1,
    fontFamily: fontFamily.bold,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 2,
  },
  footer: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  actionButton: {
    alignItems: "center",
    borderRadius: 9999,
    flexDirection: "row",
    gap: 5,
    justifyContent: "center",
    minHeight: 40,
    paddingHorizontal: 14,
  },
  actionText: { fontFamily: fontFamily.semiBold, fontSize: 12, lineHeight: 18 },
});
