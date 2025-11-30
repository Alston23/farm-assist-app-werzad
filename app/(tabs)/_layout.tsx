
import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import FloatingTabBar, { TabBarItem } from '@/components/FloatingTabBar';
import { colors } from '@/styles/commonStyles';
import { useAuth } from '@/contexts/AuthContext';

export default function TabLayout() {
  const { user, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(tabs)';

    if (!user && inAuthGroup) {
      // Redirect to auth if not logged in
      router.replace('/auth');
    } else if (user && !inAuthGroup) {
      // Redirect to tabs if logged in
      router.replace('/(tabs)/crops');
    }
  }, [user, segments, isLoading]);

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
    {
      name: 'marketplace',
      route: '/(tabs)/marketplace',
      icon: 'shopping-cart',
      label: 'Market',
    },
  ];

  // Show nothing while checking auth
  if (isLoading) {
    return null;
  }

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
        <Stack.Screen key="marketplace" name="marketplace" />
        <Stack.Screen key="settings" name="settings" />
      </Stack>
      <FloatingTabBar tabs={tabs} containerWidth={400} />
    </>
  );
}
