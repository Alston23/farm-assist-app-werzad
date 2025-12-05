
import { Tabs } from 'expo-router';
import { Platform } from 'react-native';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#2D5016',
          borderTopWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
          height: Platform.OS === 'ios' ? 88 : 68,
          paddingBottom: Platform.OS === 'ios' ? 28 : 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: '#FFFFFF',
        tabBarInactiveTintColor: 'rgba(255, 255, 255, 0.5)',
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="crops"
        options={{
          title: 'Crops',
          tabBarIcon: ({ color }) => <TabIcon name="🌾" color={color} />,
        }}
      />
      <Tabs.Screen
        name="fields"
        options={{
          title: 'Fields/Beds',
          tabBarIcon: ({ color }) => <TabIcon name="🏞️" color={color} />,
        }}
      />
      <Tabs.Screen
        name="plantings"
        options={{
          title: 'Plantings',
          tabBarIcon: ({ color }) => <TabIcon name="🌱" color={color} />,
        }}
      />
      <Tabs.Screen
        name="equipment"
        options={{
          title: 'Equipment',
          tabBarIcon: ({ color }) => <TabIcon name="🚜" color={color} />,
        }}
      />
      <Tabs.Screen
        name="tasks"
        options={{
          title: 'Tasks',
          tabBarIcon: ({ color }) => <TabIcon name="✅" color={color} />,
        }}
      />
      <Tabs.Screen
        name="inventory"
        options={{
          title: 'Inventory',
          tabBarIcon: ({ color }) => <TabIcon name="📦" color={color} />,
        }}
      />
      <Tabs.Screen
        name="revenue"
        options={{
          title: 'Revenue',
          tabBarIcon: ({ color }) => <TabIcon name="💰" color={color} />,
        }}
      />
      <Tabs.Screen
        name="marketplace"
        options={{
          title: 'Marketplace',
          tabBarIcon: ({ color }) => <TabIcon name="🛒" color={color} />,
        }}
      />
      <Tabs.Screen
        name="ai-assistant"
        options={{
          title: 'AI Assistant',
          tabBarIcon: ({ color }) => <TabIcon name="🤖" color={color} />,
        }}
      />
      {/* Hide AI sub-pages from tab bar */}
      <Tabs.Screen
        name="ai-crop-recommendations"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="ai-growing-tips"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="ai-personalized-advice"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="ai-problem-diagnosis"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="ai-weather-insights"
        options={{
          href: null,
        }}
      />
      {/* Hide old messages folder from tab bar */}
      <Tabs.Screen
        name="messages"
        options={{
          href: null,
        }}
      />
      {/* Hide marketplace-messages from tab bar */}
      <Tabs.Screen
        name="marketplace-messages"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}

function TabIcon({ name, color }: { name: string; color: string }) {
  return (
    <span style={{ fontSize: 24, opacity: color === '#FFFFFF' ? 1 : 0.5 }}>
      {name}
    </span>
  );
}
