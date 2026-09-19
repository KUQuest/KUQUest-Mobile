import { useWindowDimensions } from "react-native";
import {
  BriefcaseBusiness,
  Code2,
  GraduationCap,
  MessageSquare,
  UserRound,
} from "lucide-react-native";
import { ScrollView, Pressable, Text } from "@/tw";
import { cn } from "@/tw/cn";
import { colors } from "../../../theme/colors";
import styles from "../styles/profileComponentStyles";
import type { ProfileTab } from "./profileTypes";
import { defaultAccessibilityLabels } from "./profileShared";

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
  const { fontScale } = useWindowDimensions();
  const tabScale = Math.max(1, fontScale);
  const tabWidth = Math.ceil(70 * tabScale);
  const tabHeight = Math.ceil(72 * tabScale);
  const tabs: { key: ProfileTab; icon: typeof UserRound }[] = [
    { key: "about", icon: UserRound },
    { key: "experience", icon: BriefcaseBusiness },
    { key: "works", icon: Code2 },
    { key: "certificates", icon: GraduationCap },
    { key: "reviews", icon: MessageSquare },
  ];

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      accessibilityLabel={accessibilityLabel}
      contentContainerClassName={styles.tabList}
      contentContainerStyle={{ flexGrow: 1 }}
      className={styles.tabsScroll}
    >
      {tabs.map(({ key, icon: Icon }) => (
        <Pressable
          key={key}
          testID={`profile-tab-${key}`}
          accessibilityRole="tab"
          accessibilityLabel={labels[key]}
          accessibilityState={{ selected: activeTab === key }}
          onPress={() => onChange(key)}
          className={cn(styles.tab, activeTab === key && styles.tabSelected)}
          style={{ flex: 1, minWidth: tabWidth, minHeight: tabHeight }}
        >
          <Icon
            color={activeTab === key ? colors.primary : colors.textSecondary}
            size={22}
            strokeWidth={2}
          />
          <Text
            maxFontSizeMultiplier={2}
            className={cn(
              styles.tabText,
              activeTab === key && styles.tabTextSelected
            )}
            style={{ lineHeight: Math.ceil(14 * tabScale) }}
          >
            {labels[key]}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}
