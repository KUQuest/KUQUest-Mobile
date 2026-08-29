import { Tabs, useSegments } from 'expo-router';
import { useWindowDimensions } from 'react-native';

import { BottomNav } from '@/components/navigation/BottomNav';
import { NavigationVisibilityProvider } from '@/components/navigation/NavigationVisibilityContext';
import { useLocale } from '@/locales/LocaleProvider';
import { navigationMessages } from '@/locales/navigationMessages';

export default function TabsLayout() {
  const { width } = useWindowDimensions();
  const segments = useSegments();
  const { locale } = useLocale();
  const messages = navigationMessages[locale];
  const isTablet = width >= 768;
  const isCreateQuest = segments[segments.length - 1] === 'create';
  const isChatConversation = segments[segments.length - 2] === 'chat';

  return (
    <NavigationVisibilityProvider>
      <Tabs
        initialRouteName="index"
        tabBar={(props) => isCreateQuest || isChatConversation ? null : <BottomNav {...props} />}
        screenOptions={{
          headerShown: false,
          tabBarPosition: isTablet ? 'left' : 'bottom',
          tabBarStyle: {
            width: isTablet ? 88 : undefined,
            backgroundColor: 'transparent',
            borderTopWidth: 0,
            elevation: 0,
            position: isTablet ? 'relative' : 'absolute',
            shadowOpacity: 0,
          },
        }}
      >
        <Tabs.Screen name="index" options={{ title: messages.board }} />
        <Tabs.Screen name="my-quests" options={{ title: messages.myQuests }} />
        <Tabs.Screen name="create" options={{ title: messages.create }} />
        <Tabs.Screen name="chat" options={{ title: messages.chat }} />
        <Tabs.Screen name="profile" options={{ title: messages.profile }} />
      </Tabs>
    </NavigationVisibilityProvider>
  );
}
