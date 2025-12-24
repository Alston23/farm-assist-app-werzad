export async function initSubscriptions(): Promise<void> {
  return;
}

// lib/subscriptions.ts

import Constants from 'expo-constants';
import { Alert, Platform } from 'react-native';
import { supabase } from './supabase';

let IAP: any = null;

const PRO_SUBSCRIPTION_ID = 'pro_monthly'; // <-- keep your real product id

let isInitialized = false;
let initPromise: Promise<void> | null = null;
let purchaseUpdateSub: any = null;

async function getIAP() {
  if (Constants.appOwnership === 'expo') return null;

  if (!IAP) {
    IAP = await import('expo-in-app-purchases');
  }
  return IAP;
}

function isAlreadyConnectedError(err: any) {
  const msg = String(err?.message ?? err);
  return (
    msg.includes('Already connected') ||
    msg.includes('already connected') ||
    msg.includes('E_IAP_ALREADY_CONNECTED')
  );
}

export async function initSubscriptions(): Promise<void> {
  if (isInitialized) return;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const InAppPurchases = await getIAP();
    if (!InAppPurchases) return;

    try {
      await InAppPurchases.connectAsync();
    } catch (err) {
      if (!isAlreadyConnectedError(err)) {

        throw err;
      }
    }

    isInitialized = true;

    try {
      purchaseUpdateSub?.remove?.();
    } catch {}

    purchaseUpdateSub = InAppPurchases.setPurchaseListener(
      async ({ responseCode, results }) => {
        try {
          if (
            responseCode === InAppPurchases.IAPResponseCode.OK &&
            Array.isArray(results)
          ) {
            for (const purchase of results) {
              if (!purchase.acknowledged) {
                await InAppPurchases.finishTransactionAsync(purchase, true);
              }

              if (purchase.productId === PRO_SUBSCRIPTION_ID) {
                await handleSuccessfulPurchase(purchase);
              }
            }
          }

          if (
            responseCode ===
            InAppPurchases.IAPResponseCode.USER_CANCELED
          ) {
            return;
          }

          if (
            responseCode ===
            InAppPurchases.IAPResponseCode.ERROR
          ) {
            console.error('Subscriptions: Purchase error');
          }
        } catch (e) {
          console.error('Subscriptions: Listener exception', e);
        }
      }
    );
  })();

  return initPromise;
}

async function handleSuccessfulPurchase(_purchase: any) {
  const { data } = await supabase.auth.getUser();
  const user = data.user;

  if (!user) return;

  await supabase
    .from('profiles')
    .update({ is_pro: true })
    .eq('id', user.id);
}

export async function purchasePro(): Promise<void> {
  const InAppPurchases = await getIAP();
  if (!InAppPurchases) {
    console.log('IAP disabled in Expo Go');
    return;
  }

  const { data } = await supabase.auth.getUser();
  const user = data.user;

  if (!user) {
    Alert.alert('Not Logged In', 'Please log in to purchase a subscription.');
    return;
  }

  const { responseCode, results } =
    await InAppPurchases.getProductsAsync([PRO_SUBSCRIPTION_ID]);

  if (responseCode !== InAppPurchases.IAPResponseCode.OK || !results?.length) {
    Alert.alert('Error', 'Unable to load subscription.');
    return;
  }

  await InAppPurchases.purchaseItemAsync(PRO_SUBSCRIPTION_ID);
}
