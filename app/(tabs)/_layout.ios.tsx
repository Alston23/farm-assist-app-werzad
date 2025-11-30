
import React from 'react';
import { Tabs } from 'expo-router/unstable-native-tabs';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.text,
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="crops"
        options={{
          title: 'Crops',
          tabBarIcon: ({ color }) => (
            <IconSymbol ios_icon_name="leaf.fill" android_material_icon_name="eco" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="fields"
        options={{
          title: 'Fields',
          tabBarIcon: ({ color }) => (
            <IconSymbol ios_icon_name="square.grid.3x3" android_material_icon_name="grid-on" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="plantings"
        options={{
          title: 'Plantings',
          tabBarIcon: ({ color }) => (
            <IconSymbol ios_icon_name="leaf.circle.fill" android_material_icon_name="spa" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="schedule"
        options={{
          title: 'Schedule',
          tabBarIcon: ({ color }) => (
            <IconSymbol ios_icon_name="calendar" android_material_icon_name="event" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="revenue"
        options={{
          title: 'Revenue',
          tabBarIcon: ({ color }) => (
            <IconSymbol ios_icon_name="dollarsign.circle" android_material_icon_name="attach-money" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
