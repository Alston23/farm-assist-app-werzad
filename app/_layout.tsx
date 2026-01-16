
import { Stack } from "expo-router";
import { AuthProvider } from "../contexts/AuthContext";
import { CameraProvider } from "../contexts/CameraContext";
import { LocationProvider } from "../contexts/LocationContext";
import { NotificationProvider } from "../contexts/NotificationContext";
import { SubscriptionProvider } from "../contexts/SubscriptionContext";
import { WidgetProvider } from "../contexts/WidgetContext";

export default function RootLayout() {
  console.log("RootLayout initialized");
  
  return (
    <AuthProvider>
      <SubscriptionProvider>
        <CameraProvider>
          <LocationProvider>
            <NotificationProvider>
              <WidgetProvider>
                <Stack screenOptions={{ headerShown: false }}>
                  <Stack.Screen name="index" />
                  <Stack.Screen name="auth" />
                  <Stack.Screen name="login" />
                  <Stack.Screen name="(tabs)" />
                  <Stack.Screen name="crop" />
                  <Stack.Screen name="marketplace" />
                  <Stack.Screen name="paywall" />
                  <Stack.Screen name="seeds" />
                  <Stack.Screen name="fertilizers" />
                  <Stack.Screen name="storage-locations" />
                  <Stack.Screen name="transplants" />
                </Stack>
              </WidgetProvider>
            </NotificationProvider>
          </LocationProvider>
        </CameraProvider>
      </SubscriptionProvider>
    </AuthProvider>
  );
}
