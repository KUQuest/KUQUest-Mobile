import { UserRoundCheck, UsersRound } from "lucide-react-native";

import { Text, View } from "@/tw";
import { createQuestMessages } from "@/locales/createQuestMessages";
import { colors } from "@/theme/colors";
import styles from "../createQuestStyles";
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
  const participationLabel =
    participation === "SINGLE" ? messages.singleFormat : messages.teamFormat;
  const candidateLabel =
    candidateMode === "FIRST_COME_FIRST_SERVED"
      ? messages.instantAccept
      : messages.selectCandidate;

  return (
    <View accessibilityLiveRegion="polite" className={styles.modeSummary}>
      <View className={styles.modeIcon}>
        {participation === "SINGLE" ? (
          <UserRoundCheck color={colors.hirer} size={30} strokeWidth={2.1} />
        ) : (
          <UsersRound color={colors.hirer} size={32} strokeWidth={2.1} />
        )}
      </View>
      <View className={styles.modeCopy}>
        <Text className={styles.modeTitle}>
          {messages.selectedMode}:{" "}
          <Text className={styles.modeValue}>
            {participationLabel} + {candidateLabel}
          </Text>
        </Text>
        <Text className={styles.modeDescription}>{combinationHint}</Text>
      </View>
    </View>
  );
}
