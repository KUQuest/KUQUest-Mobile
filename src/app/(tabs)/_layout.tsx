import { Tabs, useRouter, useSegments } from 'expo-router';
import { Settings } from 'lucide-react-native';
import { useWindowDimensions } from 'react-native';

import { BottomNav } from '@/components/navigation/BottomNav';
import { NavigationVisibilityProvider } from '@/components/navigation/NavigationVisibilityContext';
import { useLocale } from '@/locales/LocaleProvider';
import { navigationMessages } from '@/locales/navigationMessages';
import { settingsMessages } from '@/locales/settingsMessages';
import { Pressable } from '@/tw';
import { colors } from '@/theme/colors';

function ProfileSettingsButton({ label }: { label: string }) {
  const router = useRouter();

  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      hitSlop={8}
      onPress={() => router.push('/settings')}
      style={{ alignItems: 'center', justifyContent: 'center', minHeight: 48, minWidth: 48 }}
      testID="open-settings"
    >
      <Settings color={colors.primary} size={24} strokeWidth={2.2} />
    </Pressable>
  );
}

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
        <Tabs.Screen
          name="profile"
          options={{
            title: messages.profile,
            headerShown: true,
            headerShadowVisible: false,
            headerStyle: { backgroundColor: colors.surface },
            headerRight: () => <ProfileSettingsButton label={settingsMessages[locale].title} />,
          }}
        />
      </Tabs>
    </NavigationVisibilityProvider>
  );
}
