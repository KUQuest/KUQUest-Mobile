import { Tabs, useSegments } from "expo-router";
import { useWindowDimensions } from "react-native";

import { BottomNav } from "@/components/navigation/BottomNav";
import { useLocale } from "@/features/preferences/localeStore";
import { navigationMessages } from "@/locales/navigationMessages";
import { getAppChromeMetrics } from "@/theme/layout";

export default function TabsLayout() {
  const { width, fontScale } = useWindowDimensions();
  const metrics = getAppChromeMetrics(width, fontScale);
  const segments = useSegments();
  const { locale } = useLocale();
  const messages = navigationMessages[locale];
  const isTablet = metrics.isTablet;
  const isCreateQuest = segments[segments.length - 1] === "create";
  const isChatConversation = segments[segments.length - 2] === "chat";
  const isMyQuests = segments[segments.length - 1] === "my-quests";

  return (
    <Tabs
      initialRouteName="index"
      tabBar={(props) =>
        isCreateQuest || isChatConversation || isMyQuests ? null : (
          <BottomNav {...props} />
        )
      }
      screenOptions={{
        headerShown: false,
        tabBarPosition: isTablet ? "left" : "bottom",
        tabBarStyle: {
          width: isTablet ? metrics.tabletNavWidth : undefined,
          backgroundColor: "transparent",
          borderTopWidth: 0,
          elevation: 0,
          position: isTablet ? "relative" : "absolute",
          shadowOpacity: 0,
        },
      }}
    >
      <Tabs.Screen name="index" options={{ title: messages.board }} />
      <Tabs.Screen name="money" options={{ title: messages.money }} />
      <Tabs.Screen name="create" options={{ title: messages.create }} />
      <Tabs.Screen
        name="my-quests"
        options={{ title: messages.workManagement }}
      />
      <Tabs.Screen name="chat" options={{ title: messages.chat }} />
      <Tabs.Screen name="profile" options={{ title: messages.profile }} />
    </Tabs>
  );
}
