
import React from 'react';
import { Stack } from 'expo-router';
import { AuthProvider } from '@/contexts/AuthContext';

export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="auth" />
        <Stack.Screen name="home" />
        <Stack.Screen name="crops" />
        <Stack.Screen name="fields" />
        <Stack.Screen name="plantings" />
        <Stack.Screen name="equipment" />
        <Stack.Screen name="tasks" />
        <Stack.Screen name="inventory" />
        <Stack.Screen name="revenue" />
        <Stack.Screen name="marketplace" />
        <Stack.Screen name="ai-assistant" />
      </Stack>
    </AuthProvider>
  );
}
