
import { Platform, Alert } from "react-native";
import { supabase } from "./supabase";
import Constants from 'expo-constants';

// Product ID for the Pro subscription
export const PRO_SUBSCRIPTION_ID = 'farmcopilot_pro_monthly';

let isInitialized = false;
let purchaseUpdateSubscription: any | null = null;

// Dynamic IAP module loader
let IAP: typeof import('expo-in-app-purchases') | null = null;

async function getIAP() {
  // When running in Expo Go / Natively preview, do NOT load the native module
  if (Constants.appOwnership === 'expo') {
    return null;
  }
  if (!IAP) {
    IAP = await import('expo-in-app-purchases');
  }
  return IAP;
}

/**
 * Initialize the in-app purchase library and listen for purchase updates
 */
export async function initSubscriptions(): Promise<void> {
  const InAppPurchases = await getIAP();
  if (!InAppPurchases) {
    // Running in Expo Go → skip IAP logic
    console.log('IAP disabled in Expo Go');
    return;
  }

  try {
    // Check if user is logged in
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return;
    }

    // Connect to the store
    await InAppPurchases.connectAsync();
    
    isInitialized = true;

    // Set up purchase update listener
    purchaseUpdateSubscription = InAppPurchases.setPurchaseListener(({ responseCode, results, errorCode }) => {
      if (responseCode === InAppPurchases.IAPResponseCode.OK) {
        results?.forEach(async (purchase) => {
          if (!purchase.acknowledged) {
            // Finish the transaction
            await InAppPurchases.finishTransactionAsync(purchase, true);
          }

          // Check if this is our Pro subscription
          if (purchase.productId === PRO_SUBSCRIPTION_ID) {
            await handleSuccessfulPurchase(purchase);
          }
        });
      } else if (responseCode === InAppPurchases.IAPResponseCode.USER_CANCELED) {
        // User canceled - no action needed
      } else if (responseCode === InAppPurchases.IAPResponseCode.ERROR) {
        console.error('Subscriptions: Purchase error', errorCode);
        Alert.alert('Purchase Error', 'There was an error processing your purchase. Please try again.');
      }
    });
  } catch (error) {
    console.error('Subscriptions: Error initializing IAP', error);
    isInitialized = false;
  }
}

/**
 * Handle a successful purchase by updating the user's Pro status in Supabase
 */
async function handleSuccessfulPurchase(purchase: any): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('Subscriptions: No user found when handling purchase');
      return;
    }

    // Update the user's profile to mark them as Pro
    const { error } = await supabase
      .from('profiles')
      .update({ is_pro: true })
      .eq('id', user.id);

    if (error) {
      console.error('Subscriptions: Error updating profile', error);
      Alert.alert('Error', 'Your purchase was successful, but we couldn\'t update your account. Please contact support.');
    } else {
      // Sync the Pro status to the app context
      await syncProFromProfile();
      
      Alert.alert(
        'Welcome to Pro!',
        'Your subscription is now active. Enjoy all the premium features!',
        [{ text: 'OK' }]
      );
    }
  } catch (error) {
    console.error('Subscriptions: Exception handling purchase', error);
  }
}

/**
 * Start the purchase flow for the Pro subscription
 */
export async function purchasePro(): Promise<void> {
  const InAppPurchases = await getIAP();
  if (!InAppPurchases) {
    // Running in Expo Go → skip IAP logic
    console.log('IAP disabled in Expo Go');
    return;
  }

  try {
    // Check if user is logged in
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      Alert.alert('Not Logged In', 'Please log in to purchase a subscription.');
      return;
    }

    // Initialize if not already done
    if (!isInitialized) {
      await initSubscriptions();
    }

    // Get available products
    const { responseCode, results } = await InAppPurchases.getProductsAsync([PRO_SUBSCRIPTION_ID]);
    
    if (responseCode !== InAppPurchases.IAPResponseCode.OK) {
      console.error('Subscriptions: Error fetching products', responseCode);
      Alert.alert('Error', 'Unable to load subscription information. Please try again later.');
      return;
    }

    if (!results || results.length === 0) {
      console.error('Subscriptions: No products found');
      Alert.alert('Error', 'Subscription not available. Please try again later.');
      return;
    }

    // Purchase the subscription
    await InAppPurchases.purchaseItemAsync(PRO_SUBSCRIPTION_ID);
  } catch (error: any) {
    console.error('Subscriptions: Error purchasing', error);
    
    // Don't show an alert if the user canceled
    if (error?.code !== 'E_USER_CANCELLED') {
      Alert.alert('Purchase Error', 'There was an error starting the purchase. Please try again.');
    }
  }
}

/**
 * Restore previous purchases and update Pro status if subscription is active
 */
export async function restoreProStatus(): Promise<void> {
  const InAppPurchases = await getIAP();
  if (!InAppPurchases) {
    // Running in Expo Go → skip IAP logic
    console.log('IAP disabled in Expo Go');
    return;
  }

  try {
    // Check if user is logged in
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      Alert.alert('Not Logged In', 'Please log in to restore purchases.');
      return;
    }

    // Initialize if not already done
    if (!isInitialized) {
      await initSubscriptions();
    }

    // Get purchase history
    const { responseCode, results } = await InAppPurchases.getPurchaseHistoryAsync();
    
    if (responseCode !== InAppPurchases.IAPResponseCode.OK) {
      console.error('Subscriptions: Error fetching purchase history', responseCode);
      Alert.alert('Error', 'Unable to restore purchases. Please try again later.');
      return;
    }

    // Check if user has an active Pro subscription
    const hasActiveSubscription = results?.some(
      (purchase) => purchase.productId === PRO_SUBSCRIPTION_ID
    );

    if (hasActiveSubscription) {
      // Update the user's profile
      const { error } = await supabase
        .from('profiles')
        .update({ is_pro: true })
        .eq('id', user.id);

      if (error) {
        console.error('Subscriptions: Error updating profile', error);
        Alert.alert('Error', 'Unable to restore your subscription. Please contact support.');
      } else {
        // Sync the Pro status to the app context
        await syncProFromProfile();
        
        Alert.alert(
          'Subscription Restored',
          'Your Pro subscription has been restored successfully!',
          [{ text: 'OK' }]
        );
      }
    } else {
      Alert.alert(
        'No Subscription Found',
        'We couldn\'t find an active subscription for this account.',
        [{ text: 'OK' }]
      );
    }
  } catch (error) {
    console.error('Subscriptions: Error restoring purchases', error);
    Alert.alert('Error', 'There was an error restoring purchases. Please try again.');
  }
}

/**
 * Fetch the user's profile from Supabase and update the app context with Pro status
 */
export async function syncProFromProfile(): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return;
    }

    // Fetch the user's profile
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('is_pro')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('Subscriptions: Error fetching profile', error);
      return;
    }

    if (profile) {
      // The SubscriptionContext will automatically pick up the change
      // when it fetches the subscription status, but we can also
      // trigger a manual refresh if needed
      
      // For now, we'll just log it. The context will handle the state update.
    }
  } catch (error) {
    console.error('Subscriptions: Exception syncing profile', error);
  }
}

/**
 * Disconnect from the store (call on app cleanup)
 */
export async function disconnectSubscriptions(): Promise<void> {
  const InAppPurchases = await getIAP();
  if (!InAppPurchases) {
    // Running in Expo Go → skip IAP logic
    console.log('IAP disabled in Expo Go');
    return;
  }

  try {
    if (purchaseUpdateSubscription) {
      purchaseUpdateSubscription.remove();
      purchaseUpdateSubscription = null;
    }
    
    if (isInitialized) {
      await InAppPurchases.disconnectAsync();
      isInitialized = false;
    }
  } catch (error) {
    console.error('Subscriptions: Error disconnecting', error);
  }
}
