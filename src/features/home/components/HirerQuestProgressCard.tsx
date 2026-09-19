import React, { useMemo } from "react";
import { Pressable, Text, View } from "@/tw";
import { Avatar } from "@/components/ui/Avatar";
import { Chip } from "@/components/ui/Chip";
import {
  BriefcaseBusiness,
  Check,
  ChevronRight,
  Clock3,
  Users,
} from "lucide-react-native";
import { useColorScheme } from "react-native";

import { useLocale } from "@/features/preferences/localeStore";

import {
  formatHirerDueAt,
  getQuestProgressStages,
  type CanonicalHirerQuestStatus,
  type QuestMemberProfile,
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
  mode?: "FIRST_COME_FIRST_SERVED" | "CANDIDATE";
  headcount?: number;
  worker?: {
    id: string;
    displayName: string;
    avatarUri?: string;
    faculty?: string;
  };
  assignedWorkers?: QuestMemberProfile[];
  applicants?: QuestMemberProfile[];
  dueAt?: string | null;
  onOpenDetails: () => void;
  onOpenWorkerProfile?: (workerId: string) => void;
  onViewRoster?: () => void;
}

export function HirerQuestProgressCard({
  questId,
  title,
  tag,
  status,
  worker,
  assignedWorkers,
  applicants,
  headcount,
  dueAt,
  onOpenDetails,
  onOpenWorkerProfile,
  onViewRoster,
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
  const primaryWorker =
    assignedWorkers && assignedWorkers.length > 0 ? assignedWorkers[0] : worker;
  const hasMultipleWorkers = Boolean(
    assignedWorkers && assignedWorkers.length > 1
  );
  const hasApplicants = Boolean(applicants && applicants.length > 0);
  const applicantCount = applicants?.length ?? 0;

  const accessibilityLabel = [
    statusLabel,
    title,
    primaryWorker?.displayName ?? messages.waitingForApplicants,
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
          backgroundColor: palette.cardBg,
          borderColor: palette.cardBorder,
          shadowColor: palette.cardShadow,
        },
      ]}
      testID={`hirer-quest-card-${questId}`}
    >
      {/* Top: Topic, Tag & Status */}
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderMetaRow}>
          {tag ? (
            <Chip
              label={tag}
              leadingIcon={
                <BriefcaseBusiness
                  color={palette.tagText}
                  size={12}
                  strokeWidth={2.2}
                />
              }
              style={[
                styles.tagBadge,
                {
                  backgroundColor: palette.tagBg,
                  borderColor: palette.tagBorder,
                },
              ]}
              textStyle={[styles.tagText, { color: palette.tagText }]}
              tone="accent"
            />
          ) : (
            <View />
          )}
          <Chip
            label={statusLabel}
            style={[
              styles.statusBadge,
              {
                backgroundColor: isTerminal
                  ? palette.terminalBg
                  : palette.statusBg,
                borderColor: isTerminal
                  ? palette.terminalBorder
                  : palette.statusBorder,
              },
            ]}
            textStyle={[
              styles.statusLabel,
              {
                color: isTerminal ? palette.terminalText : palette.statusText,
              },
            ]}
            tone="primary"
          />
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

      <View
        style={[styles.divider, { backgroundColor: palette.footerBorder }]}
      />

      {/* Body */}
      <View style={styles.cardBody}>
        {/* Who do it / Roster banner */}
        {primaryWorker && !hasMultipleWorkers ? (
          <Pressable
            accessibilityLabel={`${messages.workerProfile}: ${primaryWorker.displayName}`}
            accessibilityRole="button"
            onPress={(event) => {
              event.stopPropagation();
              if (onViewRoster) {
                onViewRoster();
              } else if (onOpenWorkerProfile) {
                onOpenWorkerProfile(primaryWorker.id);
              }
            }}
            style={[
              styles.workerBanner,
              {
                backgroundColor: palette.workerBg,
                borderColor: palette.workerBorder,
              },
            ]}
            testID={`hirer-quest-card-worker-${questId}`}
          >
            <View style={styles.workerLeading}>
              <Avatar
                name={primaryWorker.displayName}
                size={40}
                style={[
                  styles.workerAvatar,
                  {
                    backgroundColor: palette.avatarBg,
                    borderColor: palette.tagBorder,
                  },
                ]}
                textStyle={[
                  styles.workerAvatarText,
                  { color: palette.avatarText },
                ]}
                uri={primaryWorker.avatarUri}
              />
              <View style={styles.workerCopy}>
                <Text
                  numberOfLines={1}
                  style={[styles.workerName, { color: palette.ink }]}
                >
                  {primaryWorker.displayName}
                </Text>
                <Text
                  numberOfLines={1}
                  style={[styles.workerRole, { color: palette.secondaryText }]}
                >
                  {primaryWorker.faculty
                    ? `${primaryWorker.faculty} · ${messages.assignedWorkerRole}`
                    : messages.assignedWorkerRole}
                </Text>
              </View>
            </View>
            <Pressable
              accessibilityLabel={`${messages.workerProfile}: ${primaryWorker.displayName}`}
              accessibilityRole="button"
              onPress={(event) => {
                event.stopPropagation();
                if (onOpenWorkerProfile) {
                  onOpenWorkerProfile(primaryWorker.id);
                } else if (onViewRoster) {
                  onViewRoster();
                }
              }}
              style={styles.workerProfileButton}
              testID={`hirer-quest-card-worker-profile-${questId}`}
            >
              <Text
                style={[styles.workerProfileText, { color: palette.primary }]}
              >
                {messages.workerProfile}
              </Text>
              <ChevronRight
                color={palette.primary}
                size={15}
                strokeWidth={2.4}
              />
            </Pressable>
          </Pressable>
        ) : hasMultipleWorkers ? (
          <Pressable
            accessibilityLabel={messages.joinedLabel(
              assignedWorkers?.length ?? 0,
              headcount
            )}
            accessibilityRole="button"
            onPress={(event) => {
              event.stopPropagation();
              onViewRoster?.();
            }}
            style={[
              styles.workerBanner,
              {
                backgroundColor: palette.workerBg,
                borderColor: palette.workerBorder,
              },
            ]}
            testID={`hirer-quest-card-workers-${questId}`}
          >
            <View style={styles.workerLeading}>
              <View
                style={[
                  styles.workerAvatar,
                  {
                    backgroundColor: palette.avatarBg,
                    borderColor: palette.tagBorder,
                  },
                ]}
              >
                <Users color={palette.avatarText} size={18} strokeWidth={2.2} />
              </View>
              <View style={styles.workerCopy}>
                <Text
                  numberOfLines={1}
                  style={[styles.workerName, { color: palette.ink }]}
                >
                  {messages.joinedLabel(
                    assignedWorkers?.length ?? 0,
                    headcount
                  )}
                </Text>
                <Text
                  numberOfLines={1}
                  style={[styles.workerRole, { color: palette.secondaryText }]}
                >
                  {assignedWorkers
                    ?.map((w) => w.displayName)
                    .slice(0, 2)
                    .join(", ")}
                </Text>
              </View>
            </View>
            <View
              style={styles.workerProfileButton}
              testID={`hirer-quest-card-view-roster-${questId}`}
            >
              <Text
                style={[styles.workerProfileText, { color: palette.primary }]}
              >
                {messages.viewParticipants}
              </Text>
              <ChevronRight
                color={palette.primary}
                size={15}
                strokeWidth={2.4}
              />
            </View>
          </Pressable>
        ) : hasApplicants ? (
          <Pressable
            accessibilityLabel={messages.applicantsLabel(applicantCount)}
            accessibilityRole="button"
            onPress={(event) => {
              event.stopPropagation();
              onViewRoster?.();
            }}
            style={[
              styles.workerBanner,
              {
                backgroundColor: palette.workerBg,
                borderColor: palette.workerBorder,
              },
            ]}
            testID={`hirer-quest-card-applicants-${questId}`}
          >
            <View style={styles.workerLeading}>
              <View
                style={[
                  styles.workerAvatar,
                  {
                    backgroundColor: palette.avatarBg,
                    borderColor: palette.tagBorder,
                  },
                ]}
              >
                <Users color={palette.primary} size={18} strokeWidth={2.2} />
              </View>
              <View style={styles.workerCopy}>
                <Text
                  numberOfLines={1}
                  style={[styles.workerName, { color: palette.ink }]}
                >
                  {messages.applicantsLabel(applicantCount)}
                </Text>
                <Text
                  numberOfLines={1}
                  style={[styles.workerRole, { color: palette.secondaryText }]}
                >
                  {messages.waitingForApplicants}
                </Text>
              </View>
            </View>
            <View
              style={styles.workerProfileButton}
              testID={`hirer-quest-card-view-applicants-${questId}`}
            >
              <Text
                style={[styles.workerProfileText, { color: palette.primary }]}
              >
                {messages.viewApplicants}
              </Text>
              <ChevronRight
                color={palette.primary}
                size={15}
                strokeWidth={2.4}
              />
            </View>
          </Pressable>
        ) : (
          <Pressable
            accessibilityLabel={messages.waitingForApplicants}
            accessibilityRole="button"
            onPress={(event) => {
              event.stopPropagation();
              onOpenDetails();
            }}
            style={[
              styles.workerBanner,
              {
                backgroundColor: palette.workerBg,
                borderColor: palette.workerBorder,
              },
            ]}
            testID={`hirer-quest-card-waiting-${questId}`}
          >
            <View style={styles.workerLeading}>
              <View
                style={[
                  styles.workerAvatar,
                  {
                    backgroundColor: palette.avatarBg,
                    borderColor: palette.tagBorder,
                  },
                ]}
              >
                <Clock3 color={palette.muted} size={18} strokeWidth={2} />
              </View>
              <View style={styles.workerCopy}>
                <Text
                  numberOfLines={1}
                  style={[styles.workerName, { color: palette.ink }]}
                >
                  {status === "QUEST_DRAFT"
                    ? messages.statusLabels.QUEST_DRAFT
                    : messages.statusLabels.QUEST_OPEN}
                </Text>
                <Text
                  numberOfLines={1}
                  style={[styles.workerRole, { color: palette.secondaryText }]}
                >
                  {status === "QUEST_DRAFT"
                    ? messages.quickDraftDesc
                    : messages.noApplicantsYet}
                </Text>
              </View>
            </View>
            <View
              style={styles.workerProfileButton}
              testID={`hirer-quest-card-manage-${questId}`}
            >
              <Text
                style={[styles.workerProfileText, { color: palette.primary }]}
              >
                {messages.manageQuest}
              </Text>
              <ChevronRight
                color={palette.primary}
                size={15}
                strokeWidth={2.4}
              />
            </View>
          </Pressable>
        )}
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
              style={[
                styles.trackLine,
                { backgroundColor: palette.stepConnector },
              ]}
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
                        { backgroundColor: palette.stepCurrentOuter },
                      ]}
                    >
                      <View
                        style={[
                          styles.stepDotCurrentInner,
                          { backgroundColor: palette.stepCurrentInner },
                        ]}
                      />
                    </View>
                  ) : (
                    <View
                      style={[
                        styles.stepDot,
                        {
                          backgroundColor: isCompleted
                            ? palette.stepCompleted
                            : palette.cardBg,
                          borderColor: isCompleted
                            ? palette.stepCompleted
                            : palette.stepUpcoming,
                        },
                      ]}
                    >
                      {isCompleted ? (
                        <Check
                          color={palette.stepCompletedCheck}
                          size={11}
                          strokeWidth={3}
                        />
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
                            ? palette.primary
                            : isTerminalStage
                              ? palette.terminalText
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
            backgroundColor: palette.footerBg,
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
