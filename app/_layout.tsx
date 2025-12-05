
import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { SubscriptionProvider } from '../contexts/SubscriptionContext';
import { LocationProvider, useLocation } from '../contexts/LocationContext';
import { NotificationProvider, useNotification } from '../contexts/NotificationContext';
import * as SplashScreen from 'expo-splash-screen';
import { initSubscriptions, syncProFromProfile } from '../lib/subscriptions';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const { user, loading: authLoading } = useAuth();
  const { hasAskedForLocation, loading: locationLoading } = useLocation();
  const { hasAskedForNotifications, loading: notificationLoading } = useNotification();
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

  useEffect(() => {
    if (!authLoading && !locationLoading && !notificationLoading) {
      // Hide splash screen once all states are determined
      SplashScreen.hideAsync().catch((error) => {
        console.error('Error hiding splash screen:', error);
      });

      const inAuthGroup = segments[0] === 'auth';
      const inTabsGroup = segments[0] === '(tabs)';
      const inLocationOnboarding = segments[0] === 'location-onboarding';
      const inNotificationOnboarding = segments[0] === 'notification-onboarding';

      if (!user && !inAuthGroup) {
        // Redirect to auth if not authenticated
        router.replace('/auth');
      } else if (user && inAuthGroup) {
        // User just logged in, check if we need to show onboarding screens
        if (!hasAskedForLocation) {
          router.replace('/location-onboarding');
        } else if (!hasAskedForNotifications) {
          router.replace('/notification-onboarding');
        } else {
          router.replace('/(tabs)/crops');
        }
      } else if (user && !hasAskedForLocation && !inLocationOnboarding) {
        // User is authenticated but hasn't been asked about location yet
        router.replace('/location-onboarding');
      } else if (user && hasAskedForLocation && !hasAskedForNotifications && !inNotificationOnboarding && !inLocationOnboarding) {
        // User has completed location onboarding but not notification onboarding
        router.replace('/notification-onboarding');
      } else if (user && !inTabsGroup && segments[0] !== 'crop' && segments[0] !== 'marketplace' && segments[0] !== 'home' && segments[0] !== 'paywall' && segments[0] !== 'fertilizers' && segments[0] !== 'seeds' && segments[0] !== 'storage-locations' && segments[0] !== 'transplants' && segments[0] !== 'location-onboarding' && segments[0] !== 'notification-onboarding') {
        // Redirect to tabs if authenticated but not in a valid route
        router.replace('/(tabs)/crops');
      }
    }
  }, [user, authLoading, hasAskedForLocation, locationLoading, hasAskedForNotifications, notificationLoading, segments, router]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="auth" />
      <Stack.Screen name="location-onboarding" />
      <Stack.Screen name="notification-onboarding" />
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
        <NotificationProvider>
          <SubscriptionProvider>
            <RootLayoutNav />
          </SubscriptionProvider>
        </NotificationProvider>
      </LocationProvider>
    </AuthProvider>
  );
}
