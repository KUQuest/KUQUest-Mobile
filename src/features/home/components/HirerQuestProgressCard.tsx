import React, { useMemo } from "react";
import { Image, Pressable, Text, View } from "@/tw";
import {
  BriefcaseBusiness,
  Check,
  ChevronRight,
  CircleUserRound,
  Clock3,
} from "lucide-react-native";
import { useColorScheme } from "react-native";

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
  tag?: string;
  status: CanonicalHirerQuestStatus;
  worker: {
    id: string;
    displayName: string;
    avatarUri?: string;
    faculty?: string;
  };
  dueAt: string;
  onOpenDetails: () => void;
  onOpenWorkerProfile: () => void;
}

export function HirerQuestProgressCard({
  questId,
  title,
  tag,
  status,
  worker,
  dueAt,
  onOpenDetails,
  onOpenWorkerProfile,
}: HirerQuestProgressCardProps) {
  const { locale } = useLocale();
  const colorScheme = useColorScheme();
  const messages = hirerHomeMessages[locale];
  const palette =
    colorScheme === "dark" ? hirerHomePalette.dark : hirerHomePalette.light;
  const statusLabel = messages.statusLabels[status];
  const isTerminal = status === "QUEST_FAILED" || status === "QUEST_CANCELLED";
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

  const activeStageIndex = useMemo(() => {
    const stageIndex = stages.findIndex(
      (stage) => stage.state === "current" || stage.state === "terminal"
    );
    return stageIndex >= 0
      ? stageIndex
      : stages.findIndex((stage) => stage.state === "completed");
  }, [stages]);
  const activeStageNumber = Math.max(1, activeStageIndex + 1);

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
          borderColor: palette.cardBorder,
          shadowColor: palette.shadow,
        },
      ]}
      testID={`hirer-quest-card-${questId}`}
    >
      {/* Top: Topic & Status */}
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderMetaRow}>
          {tag ? (
            <View
              style={[
                styles.tagBadge,
                {
                  backgroundColor: palette.tagBg,
                  borderColor: palette.tagBorder,
                },
              ]}
            >
              <BriefcaseBusiness
                color={palette.tagText}
                size={12}
                strokeWidth={2.2}
              />
              <Text style={[styles.tagText, { color: palette.tagText }]}>
                {tag}
              </Text>
            </View>
          ) : (
            <View />
          )}

          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor: isTerminal
                  ? palette.surfaceDanger
                  : palette.surfaceSuccess,
                borderColor: isTerminal
                  ? palette.borderDanger
                  : palette.borderSuccess,
              },
            ]}
          >
            <View
              style={[
                styles.statusBadgeDot,
                {
                  backgroundColor: isTerminal
                    ? palette.terminal
                    : palette.completed,
                },
              ]}
            />
            <Text
              style={[
                styles.statusLabel,
                {
                  color: isTerminal ? palette.terminal : palette.completed,
                },
              ]}
            >
              {statusLabel}
            </Text>
          </View>
        </View>

        <View style={styles.cardTitleRow}>
          <Text
            accessibilityRole="header"
            numberOfLines={2}
            style={[styles.cardTitle, { color: palette.ink }]}
          >
            {title}
          </Text>
          <View style={styles.headerArrow}>
            <ChevronRight color={palette.muted} size={20} strokeWidth={2.2} />
          </View>
        </View>
      </View>

      <View style={[styles.divider, { backgroundColor: palette.cardBorder }]} />

      {/* Body */}
      <View style={styles.cardBody}>
        {/* Who do it: Worker Card Banner */}
        <Pressable
          accessibilityLabel={`${messages.workerProfile}: ${worker.displayName}`}
          accessibilityRole="button"
          onPress={(event) => {
            event.stopPropagation();
            onOpenWorkerProfile();
          }}
          style={[
            styles.workerBanner,
            {
              backgroundColor: palette.workerSurface,
              borderColor: palette.workerBorder,
            },
          ]}
          testID={`hirer-quest-card-worker-${questId}`}
        >
          <View style={styles.workerLeading}>
            <View
              style={[
                styles.workerAvatar,
                {
                  backgroundColor: palette.surfaceSuccess,
                  borderColor: palette.borderSuccess,
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
                <Text
                  style={[
                    styles.workerAvatarText,
                    { color: palette.primaryDeep },
                  ]}
                >
                  {worker.displayName.slice(0, 1).toUpperCase()}
                </Text>
              )}
            </View>
            <View style={styles.workerCopy}>
              <Text
                numberOfLines={1}
                style={[styles.workerName, { color: palette.ink }]}
              >
                {worker.displayName}
              </Text>
              <Text
                numberOfLines={1}
                style={[styles.workerRole, { color: palette.secondaryText }]}
              >
                {worker.faculty
                  ? `${worker.faculty} · ${messages.assignedWorkerRole}`
                  : messages.assignedWorkerRole}
              </Text>
            </View>
          </View>
          <View
            style={styles.workerProfileButton}
            testID={`hirer-quest-card-worker-profile-${questId}`}
          >
            <Text
              style={[styles.workerProfileText, { color: palette.primary }]}
            >
              {messages.workerProfile}
            </Text>
            <ChevronRight color={palette.primary} size={15} strokeWidth={2.4} />
          </View>
        </Pressable>

        {/* Progress of work: 5-Stage Step Track */}
        <View style={styles.progressSection}>
          <View style={styles.progressHeaderRow}>
            <Text style={[styles.timelineTitle, { color: palette.muted }]}>
              {messages.timelineTitle}
            </Text>
            <Text style={[styles.stepProgressText, { color: palette.primary }]}>
              {messages.stepProgress(activeStageNumber, stages.length)}
            </Text>
          </View>

          <View style={styles.stagesTrack}>
            <View
              style={[styles.trackLine, { backgroundColor: palette.connector }]}
            />
            {stages.map((stage) => {
              const isCompleted = stage.state === "completed";
              const isCurrent = stage.state === "current";
              const isTerminalStage = stage.state === "terminal";

              return (
                <View key={stage.key} style={styles.stageStep}>
                  {isCurrent ? (
                    <View
                      style={[
                        styles.stepDotCurrentOuter,
                        { backgroundColor: palette.currentHalo },
                      ]}
                    >
                      <View
                        style={[
                          styles.stepDotCurrentInner,
                          { backgroundColor: palette.primary },
                        ]}
                      />
                    </View>
                  ) : (
                    <View
                      style={[
                        styles.stepDot,
                        {
                          backgroundColor: isCompleted
                            ? palette.completed
                            : palette.surface,
                          borderColor: isCompleted
                            ? palette.completed
                            : palette.pending,
                        },
                      ]}
                    >
                      {isCompleted ? (
                        <Check color="#FFFFFF" size={11} strokeWidth={3} />
                      ) : null}
                    </View>
                  )}
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.stepLabel,
                      {
                        color: isCurrent
                          ? palette.primary
                          : isCompleted
                            ? palette.completed
                            : isTerminalStage
                              ? palette.terminal
                              : palette.muted,
                      },
                      isCurrent && styles.stepLabelCurrent,
                    ]}
                  >
                    {stage.label}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      </View>

      {/* Footer: Due date & Details action */}
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
        <View style={styles.dueRow}>
          <Clock3 color={palette.secondaryText} size={15} strokeWidth={2} />
          <Text style={[styles.dueLabel, { color: palette.secondaryText }]}>
            {dueLabel}
          </Text>
        </View>
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
          <Text style={[styles.detailsText, { color: palette.primary }]}>
            {messages.openDetails}
          </Text>
          <ChevronRight color={palette.primary} size={15} strokeWidth={2.4} />
        </Pressable>
      </View>
    </Pressable>
  );
}

HirerQuestProgressCard.displayName = "HirerQuestProgressCard";
