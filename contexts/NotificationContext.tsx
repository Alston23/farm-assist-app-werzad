
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Platform, Linking, Alert } from 'react-native';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface NotificationContextType {
  hasAskedForNotifications: boolean;
  notificationPermissionGranted: boolean;
  loading: boolean;
  requestNotificationPermission: () => Promise<boolean>;
  markNotificationsAsked: () => Promise<void>;
  openSettings: () => void;
  checkNotificationPermission: () => Promise<boolean>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const NOTIFICATION_ASKED_KEY = '@farm_copilot_notifications_asked';

// Set the notification handler for when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [hasAskedForNotifications, setHasAskedForNotifications] = useState(false);
  const [notificationPermissionGranted, setNotificationPermissionGranted] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializeNotificationState();
  }, []);

  const initializeNotificationState = async () => {
    try {
      // Check if we've asked before
      const asked = await AsyncStorage.getItem(NOTIFICATION_ASKED_KEY);
      setHasAskedForNotifications(asked === 'true');

      // Check current permission status
      const granted = await checkNotificationPermission();
      setNotificationPermissionGranted(granted);
    } catch (error) {
      console.error('NotificationContext: Error initializing notification state:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkNotificationPermission = async (): Promise<boolean> => {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      
      const granted = status === 'granted';
      setNotificationPermissionGranted(granted);
      return granted;
    } catch (error) {
      console.error('NotificationContext: Error checking notification permission:', error);
      return false;
    }
  };

  const requestNotificationPermission = async (): Promise<boolean> => {
    try {
      // On Android, we need to create a notification channel first (Android 13+)
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#2D5016',
        });
      }

      const { status } = await Notifications.requestPermissionsAsync();
      
      const granted = status === 'granted';
      setNotificationPermissionGranted(granted);
      
      // Mark that we've asked
      await markNotificationsAsked();
      
      return granted;
    } catch (error) {
      console.error('NotificationContext: Error requesting notification permission:', error);
      await markNotificationsAsked();
      return false;
    }
  };

  const markNotificationsAsked = async () => {
    try {
      await AsyncStorage.setItem(NOTIFICATION_ASKED_KEY, 'true');
      setHasAskedForNotifications(true);
    } catch (error) {
      console.error('NotificationContext: Error marking notifications as asked:', error);
    }
  };

  const openSettings = () => {
    if (Platform.OS === 'ios') {
      Linking.openURL('app-settings:');
    } else {
      Linking.openSettings();
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        hasAskedForNotifications,
        notificationPermissionGranted,
        loading,
        requestNotificationPermission,
        markNotificationsAsked,
        openSettings,
        checkNotificationPermission,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
}
