import type { LucideIcon } from "lucide-react-native";

import { Text, View } from "@/tw";
import { cn } from "@/tw/cn";
import { colors } from "@/theme/colors";
import styles from "./createQuestStyles";

export function SectionHeading({
  icon: Icon,
  title,
  compact = false,
}: {
  icon: LucideIcon;
  title: string;
  compact?: boolean;
}) {
  return (
    <View
      className={cn(styles.sectionHeading, compact && styles.subsectionHeading)}
    >
      <View className={styles.sectionIcon}>
        <Icon color={colors.hirer} size={20} strokeWidth={2.2} />
      </View>
      <View className={styles.sectionHeadingText}>
        <Text accessibilityRole="header" className={styles.sectionTitle}>
          {title}
        </Text>
      </View>
    </View>
  );
}
