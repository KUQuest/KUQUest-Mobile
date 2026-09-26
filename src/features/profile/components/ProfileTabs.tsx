import {
  BriefcaseBusiness,
  Code2,
  GraduationCap,
  MessageSquare,
  UserRound,
} from "lucide-react-native";
import { ScrollView, Pressable, Text } from "@/tw";
import { cn } from "@/tw/cn";
import { useAppTheme } from "@/features/workspace/AppThemeProvider";
import styles from "../styles/profileComponentStyles";
import type { ProfileTab } from "./profileTypes";
import { defaultAccessibilityLabels } from "./profileShared";

const tabs: { key: ProfileTab; icon: typeof UserRound }[] = [
  { key: "about", icon: UserRound },
  { key: "experience", icon: BriefcaseBusiness },
  { key: "works", icon: Code2 },
  { key: "certificates", icon: GraduationCap },
  { key: "reviews", icon: MessageSquare },
];

export function ProfileTabs({
  activeTab,
  labels,
  onChange,
  accessibilityLabel = defaultAccessibilityLabels.sectionsLabel,
}: {
  activeTab: ProfileTab;
  labels: Record<ProfileTab, string>;
  onChange: (tab: ProfileTab) => void;
  accessibilityLabel?: string;
}) {
  const { colors } = useAppTheme();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="tablist"
      contentContainerClassName={styles.tabList}
      className={styles.tabsScroll}
    >
      {tabs.map(({ key, icon: Icon }) => {
        const selected = activeTab === key;
        return (
          <Pressable
            key={key}
            testID={`profile-tab-${key}`}
            accessibilityRole="tab"
            accessibilityLabel={labels[key]}
            accessibilityState={{ selected }}
            onPress={() => onChange(key)}
            className={cn(styles.tab, selected && styles.tabSelected)}
          >
            <Icon
              color={selected ? colors.onPrimary : colors.textSecondary}
              size={18}
              strokeWidth={2}
            />
            <Text
              maxFontSizeMultiplier={2}
              className={cn(styles.tabText, selected && styles.tabTextSelected)}
            >
              {labels[key]}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
