import { Fragment } from "react";
import type { LucideIcon } from "lucide-react-native";
import {
  ChevronRight,
  ClipboardList,
  FileCheck2,
  LayoutDashboard,
  Settings,
  Users,
  WalletCards,
} from "lucide-react-native";

import { useAppTheme } from "@/features/workspace/AppThemeProvider";
import { Pressable, Text, View } from "@/tw";
import type { HirerAttentionItem } from "../hirerHomeData";
import type { HirerHomeMessages } from "@/locales/hirerHomeMessages";
import { hirerHomeStyles as styles } from "../hirerHomeStyles";

export type HirerMyQuestsTab = "active" | "draft" | "completed";

export function HirerHomeMasthead({
  messages,
  activeCount,
  draftCount,
  completedCount,
  onOpenMyQuests,
}: {
  messages: HirerHomeMessages;
  activeCount: number;
  draftCount: number;
  completedCount: number;
  onOpenMyQuests: (tab: HirerMyQuestsTab) => void;
}) {
  const stats: { tab: HirerMyQuestsTab; label: string; count: number }[] = [
    { tab: "active", label: messages.statActive, count: activeCount },
    { tab: "draft", label: messages.statDrafts, count: draftCount },
    { tab: "completed", label: messages.statCompleted, count: completedCount },
  ];

  return (
    <View className={styles.masthead}>
      <View className={styles.mastheadCopy}>
        <Text className={styles.mastheadEyebrow}>{messages.eyebrow}</Text>
        <Text
          accessibilityRole="header"
          className={styles.mastheadTitle}
          testID="hirer-home-title"
        >
          {messages.title}
        </Text>
        <Text className={styles.mastheadSubtitle}>{messages.subtitle}</Text>
      </View>
      <View className={styles.statsRow}>
        {stats.map(({ tab, label, count }, index) => (
          <Fragment key={tab}>
            {index > 0 ? <View className={styles.statDivider} /> : null}
            <Pressable
              accessibilityHint={messages.statHint}
              accessibilityLabel={`${label}: ${count}`}
              accessibilityRole="button"
              className={styles.statTile}
              onPress={() => onOpenMyQuests(tab)}
              testID={`hirer-overview-${tab}`}
            >
              <Text className={styles.statValue}>{count}</Text>
              <Text className={styles.statLabel} numberOfLines={2}>
                {label}
              </Text>
            </Pressable>
          </Fragment>
        ))}
      </View>
    </View>
  );
}

export function HirerAttentionSection({
  items,
  messages,
  onOpenItem,
}: {
  items: HirerAttentionItem[];
  messages: HirerHomeMessages;
  onOpenItem: (item: HirerAttentionItem) => void;
}) {
  const { colors } = useAppTheme();
  if (items.length === 0) return null;

  return (
    <View className={styles.section} testID="hirer-home-attention">
      <View className={styles.sectionHeaderRow}>
        <Text accessibilityRole="header" className={styles.sectionTitle}>
          {messages.attentionTitle}
        </Text>
        <Text className={styles.countPill}>{items.length}</Text>
      </View>
      <View className={styles.list}>
        {items.map((item, index) => {
          const Icon = item.kind === "proof" ? FileCheck2 : Users;
          const action =
            item.kind === "proof"
              ? messages.attentionProof
              : messages.attentionApplicants(item.count);
          return (
            <Fragment key={`${item.kind}-${item.questId}`}>
              {index > 0 ? <View className={styles.listDivider} /> : null}
              <Pressable
                accessibilityLabel={`${action}: ${item.questTitle}`}
                accessibilityRole="button"
                className={styles.attentionRow}
                onPress={() => onOpenItem(item)}
                testID={`hirer-attention-${item.kind}-${item.questId}`}
              >
                <View className={styles.iconBadge}>
                  <Icon color={colors.hirer} size={20} strokeWidth={2.2} />
                </View>
                <View className={styles.rowCopy}>
                  <Text className={styles.attentionAction}>{action}</Text>
                  <Text className={styles.attentionQuest} numberOfLines={2}>
                    {item.questTitle}
                  </Text>
                </View>
                <ChevronRight color={colors.textSecondary} size={20} />
              </Pressable>
            </Fragment>
          );
        })}
      </View>
    </View>
  );
}

export type HirerShortcutRoute =
  "/my-quests" | "/quest-board" | "/top-up" | "/settings";

export function HirerShortcutsSection({
  messages,
  onNavigate,
}: {
  messages: HirerHomeMessages;
  onNavigate: (route: HirerShortcutRoute) => void;
}) {
  const { colors } = useAppTheme();
  const shortcuts: {
    key: string;
    destination: HirerShortcutRoute;
    Icon: LucideIcon;
    title: string;
    description: string;
  }[] = [
    {
      key: "my-quests",
      destination: "/my-quests",
      Icon: ClipboardList,
      title: messages.shortcutMyQuestsTitle,
      description: messages.shortcutMyQuestsDesc,
    },
    {
      key: "board",
      destination: "/quest-board",
      Icon: LayoutDashboard,
      title: messages.shortcutBoardTitle,
      description: messages.shortcutBoardDesc,
    },
    {
      key: "topup",
      destination: "/top-up",
      Icon: WalletCards,
      title: messages.shortcutTopUpTitle,
      description: messages.shortcutTopUpDesc,
    },
    {
      key: "settings",
      destination: "/settings",
      Icon: Settings,
      title: messages.shortcutSettingsTitle,
      description: messages.shortcutSettingsDesc,
    },
  ];

  return (
    <View className={styles.section} testID="hirer-home-shortcuts">
      <Text
        accessibilityRole="header"
        className={`${styles.sectionTitle} px-ku-xs`}
      >
        {messages.shortcutsTitle}
      </Text>
      <View className={styles.shortcutGrid}>
        {shortcuts.map(({ key, destination, Icon, title, description }) => (
          <Pressable
            accessibilityLabel={`${title}: ${description}`}
            accessibilityRole="button"
            className={styles.shortcutTile}
            key={key}
            onPress={() => onNavigate(destination)}
            testID={`hirer-shortcut-${key}`}
          >
            <View className={styles.iconBadge}>
              <Icon color={colors.hirer} size={20} strokeWidth={2.2} />
            </View>
            <View>
              <Text className={styles.shortcutTitle}>{title}</Text>
              <Text className={styles.shortcutDesc}>{description}</Text>
            </View>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
