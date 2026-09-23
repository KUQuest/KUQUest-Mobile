import type { ReactNode } from "react";
import { CalendarClock, ChevronDown } from "lucide-react-native";

import { Pressable, Text, View } from "@/tw";
import { createQuestMessages } from "@/locales/createQuestMessages";
import { colors } from "@/theme/colors";
import styles from "../createQuestStyles";

export function LogisticsSection({
  messages,
  expanded,
  summary,
  onPress,
  children,
}: {
  messages: typeof createQuestMessages.en;
  expanded: boolean;
  summary: string;
  onPress: () => void;
  children: ReactNode;
}) {
  return (
    <View className={styles.sectionCard}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${messages.logistics}: ${expanded ? messages.logisticsDescription : summary}`}
        accessibilityState={{ expanded }}
        className={styles.collapsibleHeader}
        onPress={onPress}
        testID="create-quest-logistics-toggle"
      >
        <View className={styles.collapsibleHeaderIcon}>
          <CalendarClock color={colors.primary} size={20} strokeWidth={2.2} />
        </View>
        <View className={styles.collapsibleHeaderCopy}>
          <Text accessibilityRole="header" className={styles.sectionTitle}>
            {messages.logistics}
          </Text>
          <Text className={styles.sectionDescription}>
            {messages.logisticsDescription}
          </Text>
          {!expanded ? (
            <Text className={styles.collapsibleSummary}>{summary}</Text>
          ) : null}
        </View>
        <ChevronDown
          color={colors.primary}
          size={22}
          strokeWidth={2.2}
          style={{ transform: [{ rotate: expanded ? "180deg" : "0deg" }] }}
        />
      </Pressable>
      {expanded ? (
        <View className={styles.collapsibleContent}>{children}</View>
      ) : null}
    </View>
  );
}
