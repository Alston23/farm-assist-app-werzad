
import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { SubscriptionProvider } from '../contexts/SubscriptionContext';
import { LocationProvider } from '../contexts/LocationContext';
import { NotificationProvider } from '../contexts/NotificationContext';
import { CameraProvider } from '../contexts/CameraContext';
import * as SplashScreen from 'expo-splash-screen';
import { initSubscriptions, syncProFromProfile } from '../lib/subscriptions';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const { user, loading: authLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  // Initialize subscriptions when user logs in
  useEffect(() => {
    if (user && !authLoading) {
      // Initialize IAP
      initSubscriptions().catch((error) => {
        console.error('RootLayoutNav: Error initializing subscriptions:', error);
      });
      
      // Sync Pro status from Supabase
      syncProFromProfile().catch((error) => {
        console.error('RootLayoutNav: Error syncing Pro status:', error);
      });
    }
  }, [user, authLoading]);

  // Handle navigation guard - SIMPLIFIED
  useEffect(() => {
    if (authLoading) {
      // Still loading, don't navigate yet
      return;
    }

    // Hide splash screen once auth state is determined
    SplashScreen.hideAsync().catch((error) => {
      console.error('RootLayoutNav: Error hiding splash screen:', error);
    });

    const inAuthGroup = segments[0] === 'auth';
    
    console.log('RootLayoutNav: segments:', segments, 'user:', !!user);
    
    // Only redirect if user is authenticated but on auth screen
    if (user && inAuthGroup) {
      console.log('RootLayoutNav: User authenticated on auth screen, redirecting to crops');
      router.replace('/(tabs)/crops');
    }
    // Don't redirect unauthenticated users here - let index.tsx handle it
  }, [user, authLoading, segments, router]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="auth" />
      <Stack.Screen name="home" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="crop" />
      <Stack.Screen name="marketplace" />
      <Stack.Screen name="paywall" />
      <Stack.Screen name="fertilizers" />
      <Stack.Screen name="seeds" />
      <Stack.Screen name="storage-locations" />
      <Stack.Screen name="transplants" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <LocationProvider>
        <CameraProvider>
          <NotificationProvider>
            <SubscriptionProvider>
              <RootLayoutNav />
            </SubscriptionProvider>
          </NotificationProvider>
        </CameraProvider>
      </LocationProvider>
    </AuthProvider>
  );
}
