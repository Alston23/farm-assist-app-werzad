
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

/**
 * Schedule a notification for a planting reminder
 * @param title - Notification title
 * @param body - Notification body
 * @param triggerDate - Date when the notification should be triggered
 * @param data - Additional data to include in the notification
 * @returns The notification identifier or null if scheduling failed
 */
export async function schedulePlantingReminder(
  title: string,
  body: string,
  triggerDate: Date,
  data?: Record<string, any>
): Promise<string | null> {
  try {
    console.log('Scheduling notification:', { title, body, triggerDate });

    // Check if the trigger date is in the future
    if (triggerDate <= new Date()) {
      console.log('Trigger date is in the past, not scheduling notification');
      return null;
    }

    // On Android, ensure we have a notification channel
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('planting-reminders', {
        name: 'Planting Reminders',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#2D5016',
      });
    }

    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: data || {},
        sound: true,
      },
      trigger: {
        date: triggerDate,
      },
    });

    console.log('Notification scheduled with identifier:', identifier);
    return identifier;
  } catch (error) {
    console.error('Error scheduling notification:', error);
    return null;
  }
}

/**
 * Schedule a harvest reminder notification
 * @param cropName - Name of the crop
 * @param harvestDate - Date when the crop should be harvested
 * @param daysBeforeReminder - Number of days before harvest to send reminder (default: 3)
 * @returns The notification identifier or null if scheduling failed
 */
export async function scheduleHarvestReminder(
  cropName: string,
  harvestDate: Date,
  daysBeforeReminder: number = 3
): Promise<string | null> {
  const reminderDate = new Date(harvestDate);
  reminderDate.setDate(reminderDate.getDate() - daysBeforeReminder);

  return schedulePlantingReminder(
    `${cropName} Harvest Reminder`,
    `Your ${cropName} will be ready to harvest in ${daysBeforeReminder} days!`,
    reminderDate,
    { type: 'harvest', cropName, harvestDate: harvestDate.toISOString() }
  );
}

/**
 * Schedule a low inventory alert notification
 * @param itemName - Name of the inventory item
 * @param currentQuantity - Current quantity of the item
 * @param threshold - Threshold below which to send alert
 * @returns The notification identifier or null if scheduling failed
 */
export async function scheduleInventoryAlert(
  itemName: string,
  currentQuantity: number,
  threshold: number
): Promise<string | null> {
  if (currentQuantity > threshold) {
    console.log('Inventory above threshold, not scheduling alert');
    return null;
  }

  // Schedule for immediate delivery
  return schedulePlantingReminder(
    'Low Inventory Alert',
    `Your ${itemName} inventory is low (${currentQuantity} remaining). Consider restocking soon.`,
    new Date(Date.now() + 1000), // 1 second from now
    { type: 'inventory', itemName, currentQuantity, threshold }
  );
}

/**
 * Cancel a scheduled notification
 * @param identifier - The notification identifier to cancel
 */
export async function cancelScheduledNotification(identifier: string): Promise<void> {
  try {
    console.log('Canceling notification:', identifier);
    await Notifications.cancelScheduledNotificationAsync(identifier);
    console.log('Notification canceled successfully');
  } catch (error) {
    console.error('Error canceling notification:', error);
  }
}

/**
 * Cancel all scheduled notifications
 */
export async function cancelAllScheduledNotifications(): Promise<void> {
  try {
    console.log('Canceling all scheduled notifications');
    await Notifications.cancelAllScheduledNotificationsAsync();
    console.log('All notifications canceled successfully');
  } catch (error) {
    console.error('Error canceling all notifications:', error);
  }
}
