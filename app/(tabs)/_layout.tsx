import { Tabs } from 'expo-router';
import { FloatingTabBar } from '../../components/navigation/FloatingTabBar';

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}>
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="finance" options={{ title: 'Finance', href: null }} />
      <Tabs.Screen name="sports" options={{ title: 'Sports', href: null }} />
      <Tabs.Screen name="vehicle" options={{ title: 'Vehicle', href: null }} />
      <Tabs.Screen name="english" options={{ title: 'English' }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
    </Tabs>
  );
}
