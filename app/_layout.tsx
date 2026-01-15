
import { Stack } from "expo-router";
import { AuthProvider } from "../contexts/AuthContext";
import { CameraProvider } from "../contexts/CameraContext";
import { LocationProvider } from "../contexts/LocationContext";
import { NotificationProvider } from "../contexts/NotificationContext";
import { SubscriptionProvider } from "../contexts/SubscriptionContext";
import { WidgetProvider } from "../contexts/WidgetContext";

export default function RootLayout() {
  return (
    <AuthProvider>
      <SubscriptionProvider>
        <CameraProvider>
          <LocationProvider>
            <NotificationProvider>
              <WidgetProvider>
                <Stack screenOptions={{ headerShown: false }} />
              </WidgetProvider>
            </NotificationProvider>
          </LocationProvider>
        </CameraProvider>
      </SubscriptionProvider>
    </AuthProvider>
  );
}
