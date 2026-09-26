import React, { useMemo } from "react";
import { Pressable, Text, View } from "@/tw";
import { cn } from "@/tw/cn";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import {
  BriefcaseBusiness,
  Check,
  ChevronRight,
  Clock3,
  Flag,
  Play,
  Users,
  X,
} from "lucide-react-native";

import { QuestStatus } from "@/domain/questLifecycle";
import type { QuestMode } from "@/features/questBoard/domain/types";
import { useLocale } from "@/features/preferences/localeStore";
import { useAppTheme } from "@/features/workspace/AppThemeProvider";
import { localizeFacultyName } from "@/locales/academicUnits";
import {
  formatHirerDateTime,
  getQuestProgressStages,
  type CanonicalHirerQuestStatus,
  type QuestMemberProfile,
} from "../hirerHomeData";
import { hirerHomeMessages } from "@/locales/hirerHomeMessages";
import { hirerHomeStyles as styles } from "../hirerHomeStyles";

export interface HirerQuestProgressCardProps {
  questId: string;
  title: string;
  tag?: string;
  status: CanonicalHirerQuestStatus;
  mode?: QuestMode;
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
  startTime?: string | null;
  proofPending?: boolean;
  onOpenDetails: () => void;
  onOpenWorkerProfile?: (workerId: string) => void;
  onViewRoster?: () => void;
  onReviewProof?: () => void;
}

const timelineDotColors = {
  completed: "border-ku-hirer bg-ku-hirer",
  current: "border-[5px] border-ku-hirer-dark bg-ku-surface",
  upcoming: "border-ku-hirer-border bg-ku-surface",
  terminal: "border-ku-danger bg-ku-surface-danger",
} as const;

const timelineLabelColors = {
  completed: "font-ku-medium text-ku-text-secondary",
  current: "font-ku-semibold text-ku-hirer-dark",
  upcoming: "font-ku-regular text-ku-text-muted",
  terminal: "font-ku-semibold text-ku-danger-dark",
} as const;
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
  startTime,
  proofPending,
  onOpenDetails,
  onOpenWorkerProfile,
  onViewRoster,
  onReviewProof,
}: HirerQuestProgressCardProps) {
  const { locale } = useLocale();
  const { colors } = useAppTheme();
  const messages = hirerHomeMessages[locale];
  const statusLabel = messages.statusLabels[status];
  const isTerminal =
    status === QuestStatus.QUEST_FAILED ||
    status === QuestStatus.QUEST_CANCELLED;
  const startLabel = formatHirerDateTime(startTime, locale);
  const endLabel = formatHirerDateTime(dueAt, locale);
  const stages = useMemo(
    () =>
      getQuestProgressStages(status, proofPending).map((stage) => ({
        ...stage,
        label:
          messages.timelineOverrides[status]?.[stage.key] ??
          messages.timelineLabels[stage.key],
      })),
    [messages, proofPending, status]
  );
  const activeStageIndex = stages.findIndex(
    (stage) => stage.state === "current" || stage.state === "terminal"
  );
  const activeStageNumber =
    activeStageIndex === -1 ? stages.length : activeStageIndex + 1;
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
  const progressAccessibilityLabel = [
    messages.timelineTitle,
    messages.stepProgress(activeStageNumber, stages.length),
    ...timelineAccessibility,
  ].join(". ");

  return (
    <View
      className={cn(
        styles.card,
        isTerminal ? "border-ku-border-danger" : "border-ku-border-subtle",
        "bg-ku-surface"
      )}
      testID={`hirer-quest-card-${questId}`}
    >
      <View className={styles.cardHeader}>
        <View className={styles.cardHeaderMetaRow}>
          {tag ? (
            <Chip
              className={styles.tagBadge}
              label={tag}
              leadingIcon={
                <BriefcaseBusiness
                  color={colors.additionalDark}
                  size={14}
                  strokeWidth={2.1}
                />
              }
              textClassName={`${styles.tagText} text-ku-additional-dark`}
              tone="accent"
            />
          ) : (
            <View />
          )}
          <Chip
            className={cn(
              styles.statusBadge,
              isTerminal
                ? "border-ku-border-danger bg-ku-surface-danger"
                : "border-ku-primary-border bg-ku-primary"
            )}
            label={statusLabel}
            textClassName={cn(
              styles.statusLabel,
              isTerminal ? "text-ku-danger-dark" : "text-ku-on-primary"
            )}
            tone="primary"
          />
        </View>
        <Text
          accessibilityRole="header"
          className={`${styles.cardTitle} text-ku-text-strong`}
        >
          {title}
        </Text>
      </View>
      <View className={styles.progressSection}>
        <View
          accessibilityLabel={`${messages.scheduleStart} ${startLabel}. ${messages.scheduleEnd} ${endLabel}`}
          accessible
          className={styles.scheduleRow}
          testID={`hirer-quest-card-schedule-${questId}`}
        >
          <View className={styles.scheduleItem}>
            <View className={styles.scheduleLabelRow}>
              <Play color={colors.hirer} size={12} strokeWidth={2.4} />
              <Text
                className={`${styles.scheduleLabel} text-ku-text-secondary`}
              >
                {messages.scheduleStart}
              </Text>
            </View>
            <Text className={`${styles.scheduleValue} text-ku-text-strong`}>
              {startLabel}
            </Text>
          </View>
          <View className={styles.scheduleDivider} />
          <View className={styles.scheduleItem}>
            <View className={styles.scheduleLabelRow}>
              <Flag
                color={isTerminal ? colors.danger : colors.hirer}
                size={12}
                strokeWidth={2.4}
              />
              <Text
                className={`${styles.scheduleLabel} text-ku-text-secondary`}
              >
                {messages.scheduleEnd}
              </Text>
            </View>
            <Text className={`${styles.scheduleValue} text-ku-text-strong`}>
              {endLabel}
            </Text>
          </View>
        </View>
        <View
          accessibilityLabel={progressAccessibilityLabel}
          accessibilityRole="progressbar"
          accessibilityValue={{
            min: 1,
            max: stages.length,
            now: activeStageNumber,
          }}
          accessible
          testID={`hirer-quest-card-progress-${questId}`}
        >
          <View className={styles.progressHeaderRow}>
            <Text className={`${styles.timelineTitle} text-ku-text-secondary`}>
              {messages.timelineTitle}
            </Text>
            <Text className={`${styles.stepProgressText} text-ku-primary-dark`}>
              {messages.stepProgress(activeStageNumber, stages.length)}
            </Text>
          </View>
          {stages.map((stage, index) => (
            <View className={styles.timelineRow} key={stage.key}>
              <View className={styles.timelineRail}>
                <View className={styles.timelineDotSlot}>
                  <View
                    className={cn(
                      styles.timelineDot,
                      timelineDotColors[stage.state]
                    )}
                  >
                    {stage.state === "completed" ? (
                      <Check color={colors.onHirer} size={10} strokeWidth={3} />
                    ) : stage.state === "terminal" ? (
                      <X color={colors.danger} size={10} strokeWidth={3} />
                    ) : null}
                  </View>
                </View>
                {index < stages.length - 1 ? (
                  <View
                    className={cn(
                      styles.timelineConnector,
                      stage.state === "completed"
                        ? "bg-ku-hirer"
                        : "bg-ku-hirer-border"
                    )}
                  />
                ) : null}
              </View>
              <Text
                className={cn(
                  styles.timelineLabel,
                  timelineLabelColors[stage.state],
                  index === stages.length - 1 && "pb-ku-0"
                )}
              >
                {stage.label}
              </Text>
            </View>
          ))}
        </View>
      </View>
      <View className={styles.cardBody}>
        {primaryWorker && !hasMultipleWorkers ? (
          <View className={styles.workerBanner}>
            <Pressable
              accessibilityLabel={`${onViewRoster ? messages.viewParticipants : messages.workerProfile}: ${primaryWorker.displayName}`}
              accessibilityRole="button"
              className={styles.workerLeading}
              onPress={() => {
                if (onViewRoster) onViewRoster();
                else onOpenWorkerProfile?.(primaryWorker.id);
              }}
              testID={`hirer-quest-card-worker-${questId}`}
            >
              <Avatar
                className={styles.workerAvatar}
                name={primaryWorker.displayName}
                size={44}
                textClassName={`${styles.workerAvatarText} text-ku-additional-dark`}
                uri={primaryWorker.avatarUri}
              />
              <View className={styles.workerCopy}>
                <Text className={`${styles.workerName} text-ku-text-strong`}>
                  {primaryWorker.displayName}
                </Text>
                <Text className={`${styles.workerRole} text-ku-text-secondary`}>
                  {primaryWorker.faculty
                    ? `${localizeFacultyName(primaryWorker.faculty, locale)} · ${messages.assignedWorkerRole}`
                    : messages.assignedWorkerRole}
                </Text>
              </View>
            </Pressable>
            {onOpenWorkerProfile ? (
              <Pressable
                accessibilityLabel={`${messages.workerProfile}: ${primaryWorker.displayName}`}
                accessibilityRole="button"
                className={styles.workerProfileButton}
                onPress={() => onOpenWorkerProfile(primaryWorker.id)}
                testID={`hirer-quest-card-worker-profile-${questId}`}
              >
                <Text
                  className={`${styles.workerProfileText} text-ku-primary-dark`}
                >
                  {messages.workerProfile}
                </Text>
                <ChevronRight
                  color={colors.primary}
                  size={18}
                  strokeWidth={2.4}
                />
              </Pressable>
            ) : null}
          </View>
        ) : hasMultipleWorkers ? (
          <Pressable
            accessibilityLabel={`${messages.viewParticipants}: ${messages.joinedLabel(assignedWorkers?.length ?? 0, headcount)}`}
            accessibilityRole="button"
            className={styles.workerBanner}
            onPress={() => onViewRoster?.()}
            testID={`hirer-quest-card-workers-${questId}`}
          >
            <View className={styles.workerLeading}>
              <View className={styles.workerAvatar}>
                <Users
                  color={colors.additionalDark}
                  size={18}
                  strokeWidth={2.2}
                />
              </View>
              <View className={styles.workerCopy}>
                <Text className={`${styles.workerName} text-ku-text-strong`}>
                  {messages.joinedLabel(
                    assignedWorkers?.length ?? 0,
                    headcount
                  )}
                </Text>
                <Text className={`${styles.workerRole} text-ku-text-secondary`}>
                  {assignedWorkers
                    ?.map((assignedWorker) => assignedWorker.displayName)
                    .slice(0, 2)
                    .join(", ")}
                </Text>
              </View>
            </View>
            <View
              className={styles.workerProfileButton}
              testID={`hirer-quest-card-view-roster-${questId}`}
            >
              <Text
                className={`${styles.workerProfileText} text-ku-primary-dark`}
              >
                {messages.viewParticipants}
              </Text>
              <ChevronRight
                color={colors.primary}
                size={15}
                strokeWidth={2.4}
              />
            </View>
          </Pressable>
        ) : hasApplicants ? (
          <Pressable
            accessibilityLabel={`${messages.viewApplicants}: ${messages.applicantsLabel(applicantCount)}`}
            accessibilityRole="button"
            className={styles.workerBanner}
            onPress={() => onViewRoster?.()}
            testID={`hirer-quest-card-applicants-${questId}`}
          >
            <View className={styles.workerLeading}>
              <View className={styles.workerAvatar}>
                <Users
                  color={colors.additionalDark}
                  size={18}
                  strokeWidth={2.2}
                />
              </View>
              <View className={styles.workerCopy}>
                <Text className={`${styles.workerName} text-ku-text-strong`}>
                  {messages.applicantsLabel(applicantCount)}
                </Text>
                <Text className={`${styles.workerRole} text-ku-text-secondary`}>
                  {messages.waitingForApplicants}
                </Text>
              </View>
            </View>
            <View
              className={styles.workerProfileButton}
              testID={`hirer-quest-card-view-applicants-${questId}`}
            >
              <Text
                className={`${styles.workerProfileText} text-ku-primary-dark`}
              >
                {messages.viewApplicants}
              </Text>
              <ChevronRight
                color={colors.primary}
                size={15}
                strokeWidth={2.4}
              />
            </View>
          </Pressable>
        ) : (
          <Pressable
            accessibilityLabel={`${messages.waitingForApplicants}: ${messages.manageQuest}`}
            accessibilityRole="button"
            className={styles.workerBanner}
            onPress={onOpenDetails}
            testID={`hirer-quest-card-waiting-${questId}`}
          >
            <View className={styles.workerLeading}>
              <View className={styles.workerAvatar}>
                <Clock3 color={colors.textMuted} size={18} strokeWidth={2} />
              </View>
              <View className={styles.workerCopy}>
                <Text className={`${styles.workerName} text-ku-text-strong`}>
                  {messages.waitingForApplicants}
                </Text>
                <Text className={`${styles.workerRole} text-ku-text-secondary`}>
                  {status === QuestStatus.QUEST_DRAFT
                    ? messages.quickDraftDesc
                    : messages.noApplicantsYet}
                </Text>
              </View>
            </View>
            <View
              className={styles.workerProfileButton}
              testID={`hirer-quest-card-manage-${questId}`}
            >
              <Text
                className={`${styles.workerProfileText} text-ku-primary-dark`}
              >
                {messages.manageQuest}
              </Text>
              <ChevronRight
                color={colors.primary}
                size={15}
                strokeWidth={2.4}
              />
            </View>
          </Pressable>
        )}
        {proofPending && onReviewProof ? (
          <Button
            accessibilityLabel={messages.reviewProof}
            accessibilityRole="button"
            className="mt-ku-md"
            onPress={onReviewProof}
            testID={`hirer-quest-card-review-proof-${questId}`}
          >
            {messages.reviewProof}
          </Button>
        ) : null}
      </View>
      <View className={styles.cardFooter}>
        <Pressable
          accessibilityLabel={messages.openDetails}
          accessibilityRole="button"
          className={styles.detailsButton}
          onPress={onOpenDetails}
          testID={`hirer-quest-card-details-${questId}`}
        >
          <Text className={`${styles.detailsText} text-ku-on-hirer`}>
            {messages.openDetails}
          </Text>
          <ChevronRight color={colors.onHirer} size={15} strokeWidth={2.4} />
        </Pressable>
      </View>
    </View>
  );
}

HirerQuestProgressCard.displayName = "HirerQuestProgressCard";
