
import React from 'react';
import { Stack } from 'expo-router';
import FloatingTabBar, { TabBarItem } from '@/components/FloatingTabBar';

export default function TabLayout() {
  const tabs: TabBarItem[] = [
    {
      name: 'crops',
      route: '/(tabs)/crops',
      icon: 'eco',
      label: 'Crops',
    },
    {
      name: 'fields',
      route: '/(tabs)/fields',
      icon: 'grid-on',
      label: 'Fields',
    },
    {
      name: 'plantings',
      route: '/(tabs)/plantings',
      icon: 'spa',
      label: 'Plantings',
    },
    {
      name: 'schedule',
      route: '/(tabs)/schedule',
      icon: 'event',
      label: 'Schedule',
    },
    {
      name: 'equipment',
      route: '/(tabs)/equipment',
      icon: 'build',
      label: 'Equipment',
    },
    {
      name: 'inventory',
      route: '/(tabs)/inventory',
      icon: 'inventory',
      label: 'Inventory',
    },
    {
      name: 'revenue',
      route: '/(tabs)/revenue',
      icon: 'attach-money',
      label: 'Revenue',
    },
    {
      name: 'marketplace',
      route: '/(tabs)/marketplace',
      icon: 'store',
      label: 'Market',
    },
    {
      name: 'ai-assistant',
      route: '/(tabs)/ai-assistant',
      icon: 'auto-awesome',
      label: 'AI',
    },
    {
      name: 'settings',
      route: '/(tabs)/settings',
      icon: 'settings',
      label: 'Settings',
    },
  ];

  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'none',
        }}
      >
        <Stack.Screen key="crops" name="crops" />
        <Stack.Screen key="fields" name="fields" />
        <Stack.Screen key="plantings" name="plantings" />
        <Stack.Screen key="ai-assistant" name="ai-assistant" />
        <Stack.Screen key="schedule" name="schedule" />
        <Stack.Screen key="equipment" name="equipment" />
        <Stack.Screen key="inventory" name="inventory" />
        <Stack.Screen key="revenue" name="revenue" />
        <Stack.Screen key="marketplace" name="marketplace" />
        <Stack.Screen key="settings" name="settings" />
      </Stack>
      <FloatingTabBar tabs={tabs} />
    </>
  );
}
