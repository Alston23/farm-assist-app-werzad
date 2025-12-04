
import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
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
        router.replace('/auth');
      } else if (user && inAuthGroup) {
        // Redirect to tabs if authenticated and on auth screen
        console.log('RootLayoutNav: User authenticated, redirecting to /(tabs)/crops');
        router.replace('/(tabs)/crops');
      } else if (user && !inTabsGroup && segments[0] !== 'crop' && segments[0] !== 'marketplace' && segments[0] !== 'home') {
        // Redirect to tabs if authenticated but not in a valid route
        console.log('RootLayoutNav: User authenticated but in invalid route, redirecting to /(tabs)/crops');
        router.replace('/(tabs)/crops');
      }
    }
  }, [user, loading, segments]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="auth" />
      <Stack.Screen name="home" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="crop" />
      <Stack.Screen name="marketplace" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}
