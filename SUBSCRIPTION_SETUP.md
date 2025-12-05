
# Farm Copilot Pro Subscription Setup Guide

This document explains how to complete the in-app purchase setup for Farm Copilot Pro.

## Overview

The app now has a complete in-app purchase implementation using `expo-in-app-purchases`. When a user successfully purchases the subscription, their `profiles.is_pro` flag is set to `true` in Supabase, which unlocks all Pro features.

## What's Been Implemented

### 1. Database Schema
- ✅ Created `profiles` table with `is_pro` boolean column (default: `false`)
- ✅ Added RLS policies for secure access
- ✅ Created trigger to auto-create profile when user signs up

### 2. Subscription Module (`lib/subscriptions.ts`)
- ✅ `initSubscriptions()` - Initializes IAP and listens for purchase updates
- ✅ `purchasePro()` - Starts purchase flow for `farmcopilot_pro_monthly`
- ✅ `restoreProStatus()` - Restores previous purchases
- ✅ `syncProFromProfile()` - Syncs Pro status from Supabase to app context

### 3. Auth Context Updates
- ✅ Added `isPro` flag to AuthContext
- ✅ Added `profile` object with user's profile data
- ✅ Added `refreshProfile()` function to manually refresh Pro status
- ✅ Automatically fetches profile when user logs in

### 4. App Integration
- ✅ `initSubscriptions()` called in `app/_layout.tsx` when user logs in
- ✅ `syncProFromProfile()` called on app start for authenticated users
- ✅ Updated `PremiumGuard` to use `isPro` from AuthContext
- ✅ Updated `useProStatus` hook to use AuthContext
- ✅ Updated paywall to use real IAP functions

## What You Need to Do

### Step 1: Configure Product ID in App Store Connect (iOS)

1. Go to [App Store Connect](https://appstoreconnect.apple.com/)
2. Navigate to **My Apps** → Your App → **In-App Purchases**
3. Click **+** to create a new subscription
4. Fill in the details:
   - **Reference Name**: Farm Copilot Pro Monthly
   - **Product ID**: `farmcopilot_pro_monthly` (MUST match exactly)
   - **Subscription Group**: Create a new group or use existing
   - **Subscription Duration**: 1 Month
   - **Price**: $12.99 USD (or equivalent in other currencies)
5. Add localized descriptions and screenshots
6. Submit for review (will be reviewed with your app)

### Step 2: Configure Product ID in Google Play Console (Android)

1. Go to [Google Play Console](https://play.google.com/console/)
2. Navigate to your app → **Monetize** → **Products** → **Subscriptions**
3. Click **Create subscription**
4. Fill in the details:
   - **Product ID**: `farmcopilot_pro_monthly` (MUST match exactly)
   - **Name**: Farm Copilot Pro
   - **Description**: Premium features for serious farmers
   - **Billing period**: Monthly
   - **Price**: $12.99 USD
5. Set up base plans and offers as needed
6. Activate the subscription

### Step 3: Test the Purchase Flow

#### iOS Testing
1. Create a Sandbox Tester account in App Store Connect:
   - Go to **Users and Access** → **Sandbox Testers**
   - Add a new tester with a unique email
2. Sign out of your Apple ID on your test device
3. Run the app and try to purchase
4. When prompted, sign in with your Sandbox Tester account
5. Complete the purchase (it's free in sandbox mode)

#### Android Testing
1. Add test users in Google Play Console:
   - Go to **Setup** → **License testing**
   - Add email addresses of testers
2. Create a closed testing track and add your testers
3. Install the app from the testing track
4. Try to purchase (test users can make purchases without being charged)

### Step 4: Verify the Integration

After a successful test purchase:

1. Check that the user's `is_pro` flag is set to `true` in Supabase:
   ```sql
   SELECT id, is_pro FROM profiles WHERE id = 'user-id-here';
   ```

2. Verify that Pro features are now accessible in the app

3. Test the "Restore Purchases" button to ensure it works

## Product ID Reference

The product ID is defined in `lib/subscriptions.ts`:

```typescript
export const PRO_SUBSCRIPTION_ID = 'farmcopilot_pro_monthly';
```

**IMPORTANT**: This ID must match EXACTLY in:
- ✅ `lib/subscriptions.ts` (already set)
- ⚠️ App Store Connect (you need to configure)
- ⚠️ Google Play Console (you need to configure)

## Troubleshooting

### "No products found" error
- Verify the product ID matches exactly in all three places
- Make sure the subscription is approved and active in the store
- Wait a few hours after creating the product (store sync delay)

### Purchase completes but Pro status doesn't update
- Check Supabase logs for errors
- Verify RLS policies allow the user to update their own profile
- Check that the `profiles` table exists and has the `is_pro` column

### "Not logged in" error
- Ensure the user is authenticated before attempting purchase
- Check that `supabase.auth.getUser()` returns a valid user

## Revenue Calculation

At $12.99/month:
- Apple/Google take 30% = $3.90
- You receive 70% = $9.09 per subscriber per month

After 1 year of continuous subscription:
- Apple/Google take 15% = $1.95
- You receive 85% = $11.04 per subscriber per month

## Next Steps

1. Configure the product IDs in both app stores (see steps above)
2. Test the purchase flow thoroughly
3. Submit your app for review
4. Monitor subscription metrics in App Store Connect and Google Play Console

## Support

If you encounter issues:
1. Check the console logs (search for "Subscriptions:")
2. Verify the product ID matches in all locations
3. Test with sandbox/test accounts first
4. Check Supabase for profile updates

## Files Modified

- ✅ `lib/subscriptions.ts` (new file)
- ✅ `contexts/AuthContext.tsx` (updated)
- ✅ `hooks/useProStatus.ts` (updated)
- ✅ `components/PremiumGuard.tsx` (updated)
- ✅ `app/_layout.tsx` (updated)
- ✅ `app/paywall.tsx` (updated)
- ✅ Database: `profiles` table created with `is_pro` column
