import { Check, CircleX } from "lucide-react-native";

import { Pressable, Text, View } from "@/tw";
import { cn } from "@/tw/cn";
import { colors } from "@/theme/colors";
import { QuestTeamStatus } from "../../domain/types";

import styles from "../groupQuestStyles";

export interface TeamAssembleLockedStateProps {
  status: QuestTeamStatus | string | undefined;
  rejectedLabel: string;
  selectedLabel: string;
  submittedTitle: string;
  description: string;
  openWorkHubLabel?: string;
  onOpenWorkHub?: () => void;
  viewerIsMember?: boolean;
}

export function TeamAssembleLockedState({
  status,
  rejectedLabel,
  selectedLabel,
  submittedTitle,
  description,
  openWorkHubLabel,
  onOpenWorkHub,
  viewerIsMember = false,
}: TeamAssembleLockedStateProps) {
  const rejected = status === QuestTeamStatus.TEAM_REJECTED;
  return (
    <View
      accessibilityLiveRegion="polite"
      className={cn(
        styles.notice,
        rejected ? styles.noticeDanger : styles.noticeSuccess,
        "flex-col"
      )}
      testID="team-assemble-locked-state"
    >
      <View className="flex-row items-start">
        <View
          className={`${styles.noticeIcon} ${rejected ? styles.noticeIconDanger : ""}`}
        >
          {rejected ? (
            <CircleX color={colors.dangerDark} size={18} strokeWidth={2.1} />
          ) : (
            <Check color={colors.success} size={18} strokeWidth={2.4} />
          )}
        </View>
        <View className={styles.noticeCopy}>
          <Text className={styles.noticeTitle}>
            {rejected
              ? rejectedLabel
              : status === QuestTeamStatus.TEAM_SELECTED
                ? selectedLabel
                : submittedTitle}
          </Text>
          <Text className={styles.noticeText}>{description}</Text>
        </View>
      </View>
      {status === QuestTeamStatus.TEAM_SELECTED &&
      viewerIsMember &&
      onOpenWorkHub ? (
        <Pressable
          accessibilityLabel={openWorkHubLabel}
          accessibilityRole="button"
          className="mt-ku-sm min-h-[48px] w-full items-center justify-center rounded-ku-pill bg-ku-hirer px-ku-md"
          onPress={onOpenWorkHub}
          testID="team-assemble-open-work-hub"
        >
          <Text className="font-ku-semibold text-ku-body-small text-ku-on-hirer">
            {openWorkHubLabel}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}
