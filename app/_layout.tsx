
import "react-native-reanimated";
import React, { useEffect } from "react";
import { useFonts } from "expo-font";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { SystemBars } from "react-native-edge-to-edge";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useColorScheme, Alert } from "react-native";
import { useNetworkState } from "expo-network";
import {
  DarkTheme,
  DefaultTheme,
  Theme,
  ThemeProvider,
} from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { WidgetProvider } from "@/contexts/WidgetContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";

SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  initialRouteName: "(tabs)",
};

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const networkState = useNetworkState();
  const { user, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  // Handle authentication-based navigation
  useEffect(() => {
    if (!loaded || isLoading) {
      console.log('⏳ Still loading...', { loaded, isLoading });
      return;
    }

    const inAuthGroup = segments[0] === 'auth';
    const inTestAuth = segments[0] === 'test-auth';
    const inTabs = segments[0] === '(tabs)';

    console.log('=== NAVIGATION CHECK ===');
    console.log('User:', user ? user.email : 'null');
    console.log('Current segments:', segments);
    console.log('In auth group:', inAuthGroup);
    console.log('In test-auth:', inTestAuth);
    console.log('In tabs:', inTabs);

    // Don't redirect if we're in test-auth
    if (inTestAuth) {
      console.log('✓ In test-auth, allowing access');
      return;
    }

    // If user is not logged in and not on auth screen, redirect to auth
    if (!user && !inAuthGroup) {
      console.log('🔒 User not logged in, redirecting to auth');
      setTimeout(() => {
        router.replace('/auth');
        console.log('✓ Navigation to /auth completed');
      }, 0);
      return;
    }

    // If user is logged in and on auth screen, redirect to main app
    if (user && inAuthGroup) {
      console.log('🚀 User logged in, redirecting to main app');
      setTimeout(() => {
        router.replace('/(tabs)/crops');
        console.log('✓ Navigation to /(tabs)/crops completed');
      }, 0);
      return;
    }

    // If user is logged in and not in tabs, redirect to tabs
    if (user && !inTabs && !inAuthGroup) {
      console.log('🚀 User logged in but not in tabs, redirecting to main app');
      setTimeout(() => {
        router.replace('/(tabs)/crops');
        console.log('✓ Navigation to /(tabs)/crops completed');
      }, 0);
      return;
    }

    console.log('✓ No navigation needed');
  }, [user, segments, loaded, isLoading, router]);

  React.useEffect(() => {
    if (
      !networkState.isConnected &&
      networkState.isInternetReachable === false
    ) {
      Alert.alert(
        "🔌 You are offline",
        "You can keep using the app! Your changes will be saved locally and synced when you are back online."
      );
    }
  }, [networkState.isConnected, networkState.isInternetReachable]);

  if (!loaded || isLoading) {
    return null;
  }

  const CustomDefaultTheme: Theme = {
    ...DefaultTheme,
    dark: false,
    colors: {
      primary: "rgb(0, 122, 255)",
      background: "rgb(242, 242, 247)",
      card: "rgb(255, 255, 255)",
      text: "rgb(0, 0, 0)",
      border: "rgb(216, 216, 220)",
      notification: "rgb(255, 59, 48)",
    },
  };

  const CustomDarkTheme: Theme = {
    ...DarkTheme,
    colors: {
      primary: "rgb(10, 132, 255)",
      background: "rgb(1, 1, 1)",
      card: "rgb(28, 28, 30)",
      text: "rgb(255, 255, 255)",
      border: "rgb(44, 44, 46)",
      notification: "rgb(255, 69, 58)",
    },
  };

  return (
    <>
      <StatusBar style="auto" animated />
      <ThemeProvider
        value={colorScheme === "dark" ? CustomDarkTheme : CustomDefaultTheme}
      >
        <GestureHandlerRootView>
          <Stack
            screenOptions={{
              headerShown: false,
            }}
          >
            <Stack.Screen 
              name="auth" 
              options={{ 
                headerShown: false,
                animation: 'fade',
              }} 
            />
            <Stack.Screen 
              name="(tabs)" 
              options={{ 
                headerShown: false,
              }} 
            />
            <Stack.Screen
              name="modal"
              options={{
                presentation: "modal",
                title: "Standard Modal",
              }}
            />
            <Stack.Screen
              name="formsheet"
              options={{
                presentation: "formSheet",
                title: "Form Sheet Modal",
                sheetGrabberVisible: true,
                sheetAllowedDetents: [0.5, 0.8, 1.0],
                sheetCornerRadius: 20,
              }}
            />
            <Stack.Screen
              name="transparent-modal"
              options={{
                presentation: "transparentModal",
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="fertilizers"
              options={{
                presentation: "modal",
                title: "Fertilizers",
              }}
            />
            <Stack.Screen
              name="seeds"
              options={{
                presentation: "modal",
                title: "Seeds",
              }}
            />
            <Stack.Screen
              name="yields"
              options={{
                presentation: "modal",
                title: "Yields",
              }}
            />
            <Stack.Screen
              name="test-auth"
              options={{
                presentation: "modal",
                title: "Auth Testing",
              }}
            />
          </Stack>
          <SystemBars style={"auto"} />
        </GestureHandlerRootView>
      </ThemeProvider>
    </>
  );
}

export default function RootLayout() {
  return (
    <WidgetProvider>
      <AuthProvider>
        <RootLayoutNav />
      </AuthProvider>
    </WidgetProvider>
  );
}
