import { Check, Mail, Tag, UsersRound } from "lucide-react-native";
import type { LucideIcon } from "lucide-react-native";

import { Text, View } from "@/tw";
import { cn } from "@/tw/cn";
import { createQuestMessages } from "@/locales/createQuestMessages";
import { colors } from "@/theme/colors";
import styles from "./createQuestStyles";

function SetupMetric({
  icon: Icon,
  label,
  value,
  testID,
  wide,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  testID: string;
  wide: boolean;
}) {
  return (
    <View
      accessible
      accessibilityLabel={`${label}: ${value}`}
      className={cn(styles.setupMetric, wide && styles.setupMetricWide)}
      testID={testID}
    >
      <View className={styles.setupMetricIcon}>
        <Icon color={colors.hirer} size={22} strokeWidth={2.1} />
      </View>
      <View
        className={cn(
          styles.setupMetricCopy,
          wide && styles.setupMetricCopyWide
        )}
      >
        <Text
          className={cn(
            styles.setupMetricLabel,
            wide && styles.setupMetricLabelWide
          )}
        >
          {label}
        </Text>
        <Text
          className={cn(
            styles.setupMetricValue,
            wide && styles.setupMetricValueWide
          )}
        >
          {value}
        </Text>
      </View>
    </View>
  );
}

export function QuestSetupOverview({
  messages,
  questTag,
  teamSize,
  acceptanceMethod,
  wide,
}: {
  messages: typeof createQuestMessages.en;
  questTag: string;
  teamSize: string;
  acceptanceMethod: string;
  wide: boolean;
}) {
  return (
    <View className={styles.setupCard}>
      <View className={styles.setupTitleRow}>
        <View className={styles.setupTitleIcon}>
          <Check color={colors.hirer} size={18} strokeWidth={2.6} />
        </View>
        <Text className={styles.setupTitle}>{messages.questSetup}</Text>
      </View>
      <View className={styles.setupMetrics}>
        <SetupMetric
          icon={Tag}
          label={messages.questTag}
          value={questTag}
          testID="create-quest-summary-type"
          wide={wide}
        />
        <View
          className={cn(
            styles.setupMetricDivider,
            wide && styles.setupMetricDividerWide
          )}
        />
        <SetupMetric
          icon={UsersRound}
          label={messages.teamSize}
          value={teamSize}
          testID="create-quest-summary-size"
          wide={wide}
        />
        <View
          className={cn(
            styles.setupMetricDivider,
            wide && styles.setupMetricDividerWide
          )}
        />
        <SetupMetric
          icon={Mail}
          label={messages.acceptanceMethod}
          value={acceptanceMethod}
          testID="create-quest-summary-applicants"
          wide={wide}
        />
      </View>
      <View className={styles.setupDivider} />
      <Text className={styles.setupHint}>{messages.setupHint}</Text>
    </View>
  );
}
