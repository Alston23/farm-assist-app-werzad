
import React from 'react';
import { Tabs } from 'expo-router';
import { useColorScheme } from 'react-native';

export default function TabsLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
          borderTopColor: isDark ? '#2C2C2E' : '#E0E0E0',
          borderTopWidth: 1,
        },
        tabBarActiveTintColor: '#6BA542',
        tabBarInactiveTintColor: isDark ? '#8E8E93' : '#999999',
      }}
    >
      <Tabs.Screen 
        name="home" 
        options={{ 
          title: 'Home',
          tabBarLabel: 'Home',
        }} 
      />
      <Tabs.Screen 
        name="crops" 
        options={{ 
          title: 'Crops',
          tabBarLabel: 'Crops',
        }} 
      />
      <Tabs.Screen 
        name="fields" 
        options={{ 
          title: 'Fields',
          tabBarLabel: 'Fields',
        }} 
      />
      <Tabs.Screen 
        name="tasks" 
        options={{ 
          title: 'Tasks',
          tabBarLabel: 'Tasks',
        }} 
      />
      <Tabs.Screen 
        name="index" 
        options={{ 
          href: null, // Hide from tab bar
        }} 
      />
    </Tabs>
  );
}
