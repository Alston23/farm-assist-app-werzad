
import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { SubscriptionProvider } from '../contexts/SubscriptionContext';
import * as SplashScreen from 'expo-splash-screen';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    console.log('RootLayoutNav: Auth state - loading:', loading, 'user:', user ? 'exists' : 'none', 'segments:', segments);
    
    if (!loading) {
      // Hide splash screen once auth state is determined
      SplashScreen.hideAsync().catch((error) => {
        console.error('Error hiding splash screen:', error);
      });

      const inAuthGroup = segments[0] === 'auth';
      const inTabsGroup = segments[0] === '(tabs)';

      if (!user && !inAuthGroup) {
        // Redirect to auth if not authenticated
        console.log('RootLayoutNav: No user, redirecting to /auth');
        // Use replace to prevent going back to protected routes
        router.replace('/auth');
      } else if (user && inAuthGroup) {
        // Redirect to tabs if authenticated and on auth screen
        console.log('RootLayoutNav: User authenticated, redirecting to /(tabs)/crops');
        router.replace('/(tabs)/crops');
      } else if (user && !inTabsGroup && segments[0] !== 'crop' && segments[0] !== 'marketplace' && segments[0] !== 'home' && segments[0] !== 'paywall' && segments[0] !== 'fertilizers' && segments[0] !== 'seeds' && segments[0] !== 'storage-locations' && segments[0] !== 'transplants') {
        // Redirect to tabs if authenticated but not in a valid route
        console.log('RootLayoutNav: User authenticated but in invalid route, redirecting to /(tabs)/crops');
        router.replace('/(tabs)/crops');
      }
    }
  }, [user, loading, segments, router]);

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
      <SubscriptionProvider>
        <RootLayoutNav />
      </SubscriptionProvider>
    </AuthProvider>
  );
}
