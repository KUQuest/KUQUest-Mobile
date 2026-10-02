import { ArrowLeft } from "lucide-react-native";
import { Pressable, Text, View } from "@/tw";
import { cn } from "@/tw/cn";

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
    <View className="border-b border-ku-divider bg-ku-surface-accent">
      <View className="w-full max-w-[720px] self-center px-ku-lg pt-ku-md pb-ku-md">
        <View className={styles.headerRow}>
          <Pressable
            accessibilityLabel={messages.back}
            accessibilityRole="button"
            className={styles.backButton}
            onPress={onBackPress}
            style={({ pressed }) =>
              pressed ? { backgroundColor: palette.surfaceMuted } : undefined
            }
            testID="my-quest-list-back"
          >
            <ArrowLeft color={palette.textStrong} size={22} strokeWidth={2} />
          </Pressable>
          <View className={styles.headerCopy}>
            <Text accessibilityRole="header" className={styles.title}>
              {messages.title}
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
                className={cn(
                  styles.tabButton,
                  selected ? "bg-ku-primary" : "active:bg-ku-surface"
                )}
                key={option}
                onPress={() => onTabPress(option)}
                testID={`my-quest-list-tab-${option}`}
              >
                <Text
                  className={cn(
                    styles.tabButtonText,
                    selected ? "text-ku-on-primary" : "text-ku-text-secondary"
                  )}
                >
                  {tabLabels[option]}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}
