
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
    console.log('TabLayout - isLoading:', isLoading, 'user:', user ? 'exists' : 'null', 'segments:', segments);
    
    if (isLoading) {
      console.log('Still loading auth state...');
      return;
    }

    const inAuthGroup = segments[0] === '(tabs)';
    console.log('inAuthGroup:', inAuthGroup);

    if (!user && inAuthGroup) {
      console.log('No user and in tabs, redirecting to auth...');
      router.replace('/auth');
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
  ];

  // Show nothing while checking auth
  if (isLoading) {
    console.log('Rendering null while loading...');
    return null;
  }

  // Show nothing if not authenticated (will redirect)
  if (!user) {
    console.log('Rendering null - no user');
    return null;
  }

  console.log('Rendering tab layout for authenticated user');
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
        <Stack.Screen key="inventory" name="inventory" />
        <Stack.Screen key="revenue" name="revenue" />
        <Stack.Screen key="marketplace" name="marketplace" />
        <Stack.Screen key="settings" name="settings" />
      </Stack>
      <FloatingTabBar tabs={tabs} containerWidth={450} />
    </>
  );
}
