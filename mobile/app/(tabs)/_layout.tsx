import { Tabs } from 'expo-router';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: '#0b0f15', borderTopColor: '#222a35' },
        tabBarActiveTintColor: '#c7ff5e',
        tabBarInactiveTintColor: '#8f9bad',
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'الإيرادات' }} />
      <Tabs.Screen name="actions" options={{ title: 'الإجراءات' }} />
      <Tabs.Screen name="pipeline" options={{ title: 'الصفقات' }} />
      <Tabs.Screen name="ops" options={{ title: 'الحراسة' }} />
    </Tabs>
  );
}
