import { Tabs } from 'expo-router';

import { BottomNav } from '@/components/navigation/BottomNav';

export default function TabsLayout() {
  return (
    <Tabs
      initialRouteName="index"
      tabBar={(props) => <BottomNav {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          elevation: 0,
          position: 'absolute',
          shadowOpacity: 0,
        },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Quest Board' }} />
      <Tabs.Screen name="my-quests" options={{ title: 'My Quests' }} />
      <Tabs.Screen name="create" options={{ title: 'Create' }} />
      <Tabs.Screen name="chat" options={{ title: 'Chat' }} />
      <Tabs.Screen name="profile" options={{ title: 'Student Profile' }} />
    </Tabs>
  );
}
