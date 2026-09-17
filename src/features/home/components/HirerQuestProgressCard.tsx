import React, { useMemo } from "react";
import { Image, Pressable, Text, View } from "@/tw";
import { ChevronRight, CircleUserRound } from "lucide-react-native";
import { useColorScheme, useWindowDimensions } from "react-native";

import { useLocale } from "@/locales/LocaleProvider";

import {
  formatHirerDueAt,
  getQuestProgressStages,
  type CanonicalHirerQuestStatus,
} from "../hirerHomeData";
import { hirerHomeMessages } from "../hirerHomeMessages";
import {
  hirerHomePalette,
  hirerHomeStyles as styles,
} from "../hirerHomeStyles";

export interface HirerQuestProgressCardProps {
  questId: string;
  title: string;
  status: CanonicalHirerQuestStatus;
  worker: {
    id: string;
    displayName: string;
    avatarUri?: string;
  };
  dueAt: string;
  onOpenDetails: () => void;
  onOpenWorkerProfile: () => void;
}

export function HirerQuestProgressCard({
  questId,
  title,
  status,
  worker,
  dueAt,
  onOpenDetails,
  onOpenWorkerProfile,
}: HirerQuestProgressCardProps) {
  const { locale } = useLocale();
  const colorScheme = useColorScheme();
  const { width } = useWindowDimensions();
  const messages = hirerHomeMessages[locale];
  const palette =
    colorScheme === "dark" ? hirerHomePalette.dark : hirerHomePalette.light;
  const avatarSize = 52;
  const statusLabel = messages.statusLabels[status];
  const dueLabel = useMemo(
    () => messages.dueAt(formatHirerDueAt(dueAt, locale)),
    [dueAt, locale, messages]
  );
  const stages = useMemo(
    () =>
      getQuestProgressStages(status).map((stage) => ({
        ...stage,
        label:
          messages.timelineOverrides[status]?.[stage.key] ??
          messages.timelineLabels[stage.key],
      })),
    [messages, status]
  );
  const timelineAccessibility = stages.map((stage) => {
    if (stage.state === "current")
      return `${stage.label}, ${messages.currentStageLabel}`;
    if (stage.state === "terminal")
      return `${stage.label}, ${messages.terminalStageLabel}`;
    return stage.label;
  });
  const accessibilityLabel = [
    statusLabel,
    title,
    worker.displayName,
    messages.timelineTitle,
    ...timelineAccessibility,
    dueLabel,
    messages.openDetails,
  ].join(". ");

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      onPress={onOpenDetails}
      style={[
        styles.card,
        {
          backgroundColor: palette.surface,
          borderColor: palette.ink,
          shadowColor: palette.shadow,
        },
      ]}
      testID={`hirer-quest-card-${questId}`}
    >
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderCopy}>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: palette.workerSurface },
            ]}
          >
            <Text style={[styles.statusLabel, { color: palette.completed }]}>
              {statusLabel}
            </Text>
          </View>
          <Text
            accessibilityRole="header"
            numberOfLines={2}
            style={[styles.cardTitle, { color: palette.ink }]}
          >
            {title}
          </Text>
        </View>
        <View style={styles.headerArrow}>
          <ChevronRight color={palette.ink} size={22} strokeWidth={2.4} />
        </View>
      </View>

      <View
        style={[styles.divider, { backgroundColor: palette.footerBorder }]}
      />

      <View style={styles.cardBody}>
        <View style={styles.workerColumn}>
          <Pressable
            accessibilityLabel={`${messages.workerProfile}: ${worker.displayName}`}
            accessibilityRole="button"
            onPress={(event) => {
              event.stopPropagation();
              onOpenWorkerProfile();
            }}
            style={styles.workerAvatarButton}
            testID={`hirer-quest-card-worker-${questId}`}
          >
            <View
              style={[
                styles.workerAvatar,
                {
                  backgroundColor: palette.workerSurface,
                  borderColor: palette.workerBorder,
                  height: avatarSize,
                  width: avatarSize,
                },
              ]}
            >
              {worker.avatarUri ? (
                <Image
                  contentFit="cover"
                  source={{ uri: worker.avatarUri }}
                  style={{ height: "100%", width: "100%" }}
                />
              ) : (
                <CircleUserRound
                  color={palette.ink}
                  size={26}
                  strokeWidth={2}
                />
              )}
            </View>
          </Pressable>
          <Text
            numberOfLines={1}
            style={[styles.workerName, { color: palette.ink }]}
          >
            {worker.displayName}
          </Text>
          <Pressable
            accessibilityLabel={`${messages.workerProfile}: ${worker.displayName}`}
            accessibilityRole="button"
            onPress={(event) => {
              event.stopPropagation();
              onOpenWorkerProfile();
            }}
            style={styles.workerProfileButton}
            testID={`hirer-quest-card-worker-profile-${questId}`}
          >
            <Text style={[styles.workerProfileText, { color: palette.ink }]}>
              {messages.workerProfile}
            </Text>
          </Pressable>
        </View>

        <View style={styles.timelineColumn}>
          <Text style={[styles.timelineTitle, { color: palette.ink }]}>
            {messages.timelineTitle}
          </Text>
          {stages.map((stage, index) => {
            const isCurrent = stage.state === "current";
            const isTerminal = stage.state === "terminal";
            const markerStyle =
              stage.state === "completed"
                ? {
                    backgroundColor: palette.completed,
                    borderColor: palette.completed,
                  }
                : isTerminal
                  ? {
                      backgroundColor: palette.terminal,
                      borderColor: palette.terminal,
                    }
                  : {
                      backgroundColor: "transparent",
                      borderColor: palette.pending,
                    };
            const labelColor =
              stage.state === "completed"
                ? palette.completed
                : isTerminal
                  ? palette.terminal
                  : isCurrent
                    ? palette.ink
                    : palette.muted;

            return (
              <View key={stage.key} style={styles.timelineRow}>
                <View style={styles.timelineMarkerColumn}>
                  {index < stages.length - 1 ? (
                    <View
                      style={[
                        styles.timelineLine,
                        { backgroundColor: palette.connector },
                      ]}
                    />
                  ) : null}
                  {isCurrent ? (
                    <View
                      style={[
                        styles.markerCurrentOuter,
                        { backgroundColor: palette.currentHalo },
                      ]}
                    >
                      <View
                        style={[
                          styles.markerCurrentInner,
                          {
                            backgroundColor: palette.current,
                            borderColor: palette.current,
                            borderWidth: 3,
                          },
                        ]}
                      />
                    </View>
                  ) : (
                    <View style={[styles.marker, markerStyle]} />
                  )}
                </View>
                <Text
                  numberOfLines={2}
                  style={[
                    styles.timelineLabel,
                    { color: labelColor },
                    isCurrent && styles.timelineLabelCurrent,
                  ]}
                >
                  {stage.label}
                </Text>
              </View>
            );
          })}
        </View>
      </View>

      <View
        style={[
          styles.cardFooter,
          {
            backgroundColor: palette.footer,
            borderTopColor: palette.footerBorder,
            borderTopWidth: 1,
          },
        ]}
      >
        <Text style={[styles.dueLabel, { color: palette.muted }]}>
          {dueLabel}
        </Text>
        <Pressable
          accessibilityLabel={messages.openDetails}
          accessibilityRole="button"
          onPress={(event) => {
            event.stopPropagation();
            onOpenDetails();
          }}
          style={styles.detailsButton}
          testID={`hirer-quest-card-details-${questId}`}
        >
          <Text style={[styles.detailsText, { color: palette.ink }]}>
            {messages.openDetails}
          </Text>
        </Pressable>
      </View>
    </Pressable>
  );
}

HirerQuestProgressCard.displayName = "HirerQuestProgressCard";
