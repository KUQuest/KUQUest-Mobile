import { UserRoundCheck, UsersRound } from "lucide-react-native";

import { Text, View } from "@/tw";
import { createQuestMessages } from "@/locales/createQuestMessages";
import { useAppTheme } from "@/features/workspace/AppThemeProvider";
import styles from "../createQuestStyles";
import {
  QuestMode,
  QuestParticipation,
} from "@/features/questBoard/domain/types";
import type { QuestDraft } from "../../domain/createQuestModel";

export function ModeSummary({
  messages,
  participation,
  candidateMode,
  combinationHint,
}: {
  messages: typeof createQuestMessages.en;
  participation: QuestDraft["participation"];
  candidateMode: QuestDraft["candidateMode"];
  combinationHint: string;
}) {
  const { colors } = useAppTheme();
  const participationLabel =
    participation === QuestParticipation.SINGLE
      ? messages.singleFormat
      : messages.teamFormat;
  const candidateLabel =
    candidateMode === QuestMode.FIRST_COME_FIRST_SERVED
      ? messages.instantAccept
      : messages.selectCandidate;
  const Icon =
    participation === QuestParticipation.SINGLE ? UserRoundCheck : UsersRound;

  return (
    <View accessibilityLiveRegion="polite" className={styles.modeSummary}>
      <View className={styles.modeIcon}>
        <Icon color={colors.hirer} size={22} strokeWidth={2.1} />
      </View>
      <View className={styles.modeCopy}>
        <Text className={styles.modeTitle}>{messages.selectedMode}</Text>
        <Text className={styles.modeValue}>
          {participationLabel} + {candidateLabel}
        </Text>
        <Text className={styles.modeDescription}>{combinationHint}</Text>
      </View>
    </View>
  );
}
