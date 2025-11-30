
import React from 'react';
import { Stack } from 'expo-router';
import FloatingTabBar, { TabBarItem } from '@/components/FloatingTabBar';
import { colors } from '@/styles/commonStyles';

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
      name: 'revenue',
      route: '/(tabs)/revenue',
      icon: 'attach-money',
      label: 'Revenue',
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
        <Stack.Screen key="schedule" name="schedule" />
        <Stack.Screen key="revenue" name="revenue" />
        <Stack.Screen key="settings" name="settings" />
      </Stack>
      <FloatingTabBar tabs={tabs} containerWidth={400} />
    </>
  );
}
