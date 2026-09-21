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

import { useLocale } from "@/features/preferences/localeStore";
import { useAppTheme } from "@/features/workspace/AppThemeProvider";
import {
  formatHirerDueAt,
  getQuestProgressStages,
  type CanonicalHirerQuestStatus,
  type QuestMemberProfile,
} from "../hirerHomeData";
import { hirerHomeMessages } from "../hirerHomeMessages";
import {
  hirerHomeCardShadow,
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
    faculty?: string;
    avatarUri?: string;
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
  const { scheme } = useAppTheme();
  const messages = hirerHomeMessages[locale];
  const palette =
    scheme === "dark" ? hirerHomePalette.dark : hirerHomePalette.light;
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
  const workerBanner = "border-ku-border-accent bg-ku-surface";
  const avatarClass = `${styles.workerAvatar} border-ku-border-accent bg-ku-surface-success`;
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      className={`${styles.card} border-ku-border-success bg-ku-surface-success`}
      onPress={onOpenDetails}
      style={{ ...hirerHomeCardShadow, shadowColor: palette.cardShadow }}
      testID={`hirer-quest-card-${questId}`}
    >
      <View className={styles.cardHeader}>
        <View className={styles.cardHeaderMetaRow}>
          {tag ? (
            <Chip
              className={`${styles.tagBadge} border-ku-border-accent bg-ku-surface`}
              label={tag}
              leadingIcon={
                <BriefcaseBusiness
                  color={palette.tagText}
                  size={12}
                  strokeWidth={2.2}
                />
              }
              textClassName={`${styles.tagText} text-ku-primary`}
              tone="accent"
            />
          ) : (
            <View />
          )}
          <Chip
            className={`${styles.statusBadge} ${
              isTerminal
                ? "border-ku-border-danger bg-ku-surface-danger"
                : "border-ku-primary bg-ku-primary"
            }`}
            label={statusLabel}
            textClassName={`${styles.statusLabel} ${
              isTerminal ? "text-ku-danger" : "text-ku-on-primary"
            }`}
            tone="primary"
          />
        </View>
        <View className={styles.cardTitleRow}>
          <Text
            accessibilityRole="header"
            className={`${styles.cardTitle} text-ku-primary-deep`}
            numberOfLines={2}
          >
            {title}
          </Text>
          <View className={styles.headerArrow}>
            <ChevronRight color={palette.muted} size={20} strokeWidth={2.2} />
          </View>
        </View>
      </View>
      <View className={`${styles.divider} bg-ku-border-success`} />
      <View className={styles.cardBody}>
        {primaryWorker && !hasMultipleWorkers ? (
          <Pressable
            accessibilityLabel={`${messages.workerProfile}: ${primaryWorker.displayName}`}
            accessibilityRole="button"
            className={`${styles.workerBanner} ${workerBanner}`}
            onPress={(event) => {
              event.stopPropagation();
              if (onViewRoster) onViewRoster();
              else onOpenWorkerProfile?.(primaryWorker.id);
            }}
            testID={`hirer-quest-card-worker-${questId}`}
          >
            <View className={styles.workerLeading}>
              <Avatar
                className={avatarClass}
                name={primaryWorker.displayName}
                size={40}
                textClassName={`${styles.workerAvatarText} text-ku-primary`}
                uri={primaryWorker.avatarUri}
              />
              <View className={styles.workerCopy}>
                <Text
                  className={`${styles.workerName} text-ku-primary-deep`}
                  numberOfLines={1}
                >
                  {primaryWorker.displayName}
                </Text>
                <Text
                  className={`${styles.workerRole} text-ku-text-secondary`}
                  numberOfLines={1}
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
              className={styles.workerProfileButton}
              onPress={(event) => {
                event.stopPropagation();
                onOpenWorkerProfile?.(primaryWorker.id);
              }}
              testID={`hirer-quest-card-worker-profile-${questId}`}
            >
              <Text className={`${styles.workerProfileText} text-ku-primary`}>
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
            className={`${styles.workerBanner} ${workerBanner}`}
            onPress={(event) => {
              event.stopPropagation();
              onViewRoster?.();
            }}
            testID={`hirer-quest-card-workers-${questId}`}
          >
            <View className={styles.workerLeading}>
              <View className={avatarClass}>
                <Users color={palette.avatarText} size={18} strokeWidth={2.2} />
              </View>
              <View className={styles.workerCopy}>
                <Text
                  className={`${styles.workerName} text-ku-primary-deep`}
                  numberOfLines={1}
                >
                  {messages.joinedLabel(
                    assignedWorkers?.length ?? 0,
                    headcount
                  )}
                </Text>
                <Text
                  className={`${styles.workerRole} text-ku-text-secondary`}
                  numberOfLines={1}
                >
                  {assignedWorkers
                    ?.map((w) => w.displayName)
                    .slice(0, 2)
                    .join(", ")}
                </Text>
              </View>
            </View>
            <View
              className={styles.workerProfileButton}
              testID={`hirer-quest-card-view-roster-${questId}`}
            >
              <Text className={`${styles.workerProfileText} text-ku-primary`}>
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
            className={`${styles.workerBanner} ${workerBanner}`}
            onPress={(event) => {
              event.stopPropagation();
              onViewRoster?.();
            }}
            testID={`hirer-quest-card-applicants-${questId}`}
          >
            <View className={styles.workerLeading}>
              <View className={avatarClass}>
                <Users color={palette.primary} size={18} strokeWidth={2.2} />
              </View>
              <View className={styles.workerCopy}>
                <Text
                  className={`${styles.workerName} text-ku-primary-deep`}
                  numberOfLines={1}
                >
                  {messages.applicantsLabel(applicantCount)}
                </Text>
                <Text
                  className={`${styles.workerRole} text-ku-text-secondary`}
                  numberOfLines={1}
                >
                  {messages.waitingForApplicants}
                </Text>
              </View>
            </View>
            <View
              className={styles.workerProfileButton}
              testID={`hirer-quest-card-view-applicants-${questId}`}
            >
              <Text className={`${styles.workerProfileText} text-ku-primary`}>
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
            className={`${styles.workerBanner} ${workerBanner}`}
            onPress={(event) => {
              event.stopPropagation();
              onOpenDetails();
            }}
            testID={`hirer-quest-card-waiting-${questId}`}
          >
            <View className={styles.workerLeading}>
              <View className={avatarClass}>
                <Clock3 color={palette.muted} size={18} strokeWidth={2} />
              </View>
              <View className={styles.workerCopy}>
                <Text
                  className={`${styles.workerName} text-ku-primary-deep`}
                  numberOfLines={1}
                >
                  {status === "QUEST_DRAFT"
                    ? messages.statusLabels.QUEST_DRAFT
                    : messages.statusLabels.QUEST_OPEN}
                </Text>
                <Text
                  className={`${styles.workerRole} text-ku-text-secondary`}
                  numberOfLines={1}
                >
                  {status === "QUEST_DRAFT"
                    ? messages.quickDraftDesc
                    : messages.noApplicantsYet}
                </Text>
              </View>
            </View>
            <View
              className={styles.workerProfileButton}
              testID={`hirer-quest-card-manage-${questId}`}
            >
              <Text className={`${styles.workerProfileText} text-ku-primary`}>
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
        <View className={styles.progressSection}>
          <View className={styles.progressHeaderRow}>
            <Text className={`${styles.timelineTitle} text-ku-text-muted`}>
              {messages.timelineTitle}
            </Text>
            <Text className={`${styles.stepProgressText} text-ku-primary`}>
              {messages.stepProgress(activeStageNumber, stages.length)}
            </Text>
          </View>
          <View className={styles.stagesTrack}>
            <View className={`${styles.trackLine} bg-ku-border-success`} />
            {stages.map((stage) => {
              const isCompleted = stage.state === "completed";
              const isCurrent = stage.state === "current";
              const isTerminalStage = stage.state === "terminal";
              return (
                <View key={stage.key} className={styles.stageStep}>
                  {isCurrent ? (
                    <View
                      className={`${styles.stepDotCurrentOuter} bg-ku-surface`}
                    >
                      <View
                        className={`${styles.stepDotCurrentInner} bg-ku-primary`}
                      />
                    </View>
                  ) : (
                    <View
                      className={`${styles.stepDot} ${
                        isCompleted
                          ? "border-ku-primary bg-ku-primary"
                          : "border-ku-disabled bg-ku-surface-success"
                      }`}
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
                    className={`${styles.stepLabel} ${
                      isCurrent || isCompleted
                        ? "font-ku-bold text-ku-primary"
                        : isTerminalStage
                          ? "text-ku-danger"
                          : "text-ku-text-muted"
                    }`}
                    numberOfLines={1}
                  >
                    {stage.label}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      </View>
      <View
        className={`${styles.cardFooter} border-t border-ku-border-success bg-ku-surface-success`}
      >
        <View className={styles.dueRow}>
          <Clock3 color={palette.secondaryText} size={15} strokeWidth={2} />
          <Text className={`${styles.dueLabel} text-ku-text-secondary`}>
            {dueLabel}
          </Text>
        </View>
        <Pressable
          accessibilityLabel={messages.openDetails}
          accessibilityRole="button"
          className={styles.detailsButton}
          onPress={(event) => {
            event.stopPropagation();
            onOpenDetails();
          }}
          testID={`hirer-quest-card-details-${questId}`}
        >
          <Text className={`${styles.detailsText} text-ku-primary`}>
            {messages.openDetails}
          </Text>
          <ChevronRight color={palette.primary} size={15} strokeWidth={2.4} />
        </Pressable>
      </View>
    </Pressable>
  );
}

HirerQuestProgressCard.displayName = "HirerQuestProgressCard";
