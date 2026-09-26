import { ArrowLeft } from "lucide-react-native";
import { Pressable, Text, View } from "@/tw";

import type { MyQuestMessages } from "@/locales/myQuestMessages";
import type { ThemeColors } from "@/theme/colors";
import type { MyQuestTab } from "../myQuestWorkspaceProjection";
import styles from "./myQuestListStyles";

export function MyQuestListHeader({
  messages,
  palette,
  tabs,
  selectedTab,
  tabLabels,
  onBackPress,
  onTabPress,
}: {
  messages: MyQuestMessages;
  palette: ThemeColors;
  tabs: MyQuestTab[];
  selectedTab: MyQuestTab;
  tabLabels: Record<MyQuestTab, string>;
  onBackPress: () => void;
  onTabPress: (tab: MyQuestTab) => void;
}) {
  return (
    <View className="border-b border-ku-border-subtle bg-ku-surface px-ku-lg pt-ku-sm pb-ku-md">
      <View className={styles.headerRow}>
        <Pressable
          accessibilityLabel={messages.back}
          accessibilityRole="button"
          className={`${styles.backButton} border-ku-border-accent`}
          onPress={onBackPress}
          style={({ pressed }) =>
            pressed ? { backgroundColor: palette.surfaceMuted } : undefined
          }
          testID="my-quest-list-back"
        >
          <ArrowLeft color={palette.primary} size={24} strokeWidth={2.2} />
        </Pressable>
        <View className={styles.headerCopy}>
          <Text
            className={`${styles.title} text-ku-text-strong`}
            numberOfLines={1}
          >
            {messages.title}
          </Text>
          <Text
            className={`${styles.subtitle} text-ku-text-secondary`}
            numberOfLines={2}
          >
            {messages.subtitle}
          </Text>
        </View>
      </View>
      <View accessibilityRole="tablist" className={styles.tabRow}>
        {tabs.map((option) => {
          const selected = option === selectedTab;
          return (
            <Pressable
              accessibilityLabel={tabLabels[option]}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              className={`${styles.tabButton} ${
                selected
                  ? "border-ku-primary bg-ku-surface-success"
                  : "border-ku-border-accent bg-ku-surface"
              }`}
              key={option}
              onPress={() => onTabPress(option)}
              testID={`my-quest-list-tab-${option}`}
            >
              <Text
                className={`${styles.tabButtonText} ${
                  selected ? "text-ku-primary" : "text-ku-text-secondary"
                }`}
              >
                {tabLabels[option]}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
