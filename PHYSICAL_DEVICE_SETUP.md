
# Physical Device Setup Guide

This guide explains how to run the Farm Assist app on a physical iPhone device with proper Expo dev server attachment.

## Problem Summary

The app was experiencing issues where the Expo dev server would skip attachment during native runs (`expo run:ios`), causing async native actions like the image picker to fire logs but immediately cancel with no UI callback.

## Root Cause

The issue was caused by:
1. **`.npmrc` configuration**: The `node-linker=hoisted` setting was conflicting with Expo's dev server attachment mechanism
2. **Missing dev client configuration**: The app wasn't properly configured to use Expo Dev Client for native runs
3. **Image picker callback timing**: Callbacks weren't properly synchronized with the native bridge lifecycle

## Fixes Applied

### 1. Updated `.npmrc`
- Removed `node-linker=hoisted` configuration
- This allows Expo to use its default npm behavior which works better with native runs

### 2. Updated `metro.config.js`
- Simplified configuration to use Expo defaults
- Added proper dev server middleware configuration
- Enabled better source maps for debugging

### 3. Updated `app.json`
- Added explicit `expo-dev-client` plugin configuration
- Added `READ_MEDIA_IMAGES` permission for Android 13+
- Added `runtimeVersion` policy for better update management
- Configured router origin settings

### 4. Updated `package.json`
- Added `--dev-client` flag to all start scripts
- Added separate `run:ios` and `run:android` scripts for native builds
- Ensured proper dev server attachment during native runs

### 5. Updated `utils/imagePicker.ts`
- Added `setImmediate()` wrapper around callbacks to ensure they execute after native bridge completes
- Enhanced logging with `[ImagePicker]` and `[ImageUpload]` prefixes for easier debugging
- Improved error handling and user feedback
- Removed `exif` data to reduce payload size and improve performance

## How to Run on Physical Device

### First Time Setup

1. **Clean and reinstall dependencies:**
   ```bash
   rm -rf node_modules
   rm -rf ios/build
   rm package-lock.json
   npm install
   ```

2. **Prebuild native projects:**
   ```bash
   npx expo prebuild --clean
   ```

3. **Install on device:**
   ```bash
   npx expo run:ios --device
   ```
   
   This will:
   - Build the native app with Expo Dev Client
   - Install it on your connected iPhone
   - Start the Metro bundler
   - Automatically connect the app to the dev server

### Subsequent Runs

For subsequent development sessions, you have two options:

**Option A: Full Native Build (if you changed native code or config)**
```bash
npx expo run:ios --device
```

**Option B: Dev Client Mode (faster, for JS-only changes)**
```bash
npm run ios
```
Then open the installed app on your device manually.

## Verifying Dev Server Connection

When the app launches, you should see:

1. **In Terminal:**
   ```
   › Metro waiting on exp://192.168.x.x:8081
   › Scan the QR code above with Expo Go (Android) or the Camera app (iOS)
   ```

2. **In Xcode Console / Device Logs:**
   ```
   [ImagePicker] Opening picker, allowMultiple: false
   [ImagePicker] Requesting camera permissions
   [ImagePicker] Launching camera
   [ImagePicker] Camera image captured: file:///...
   ```

3. **No "Skipping dev server" messages**

## Testing Image Picker

### AI Assistant (Problem Diagnosis)
1. Navigate to **AI Assistant** → **Identify Plant Issues**
2. Tap **"Upload Photo for Analysis"** or the camera icon (📷)
3. Choose **"Take Photo"** or **"Choose from Library"**
4. Select/capture an image
5. The image should immediately trigger analysis (no extra button press needed)

### Marketplace
1. Navigate to **Marketplace** → **Customer Marketplace** → **+ Add**
2. Tap **"Add Photos"**
3. Choose camera or library
4. Select images
5. Images should appear in the listing form

## Troubleshooting

### Issue: "Skipping dev server" message
**Solution:** 
- Make sure you're using `npx expo run:ios --device` (not `expo start --ios`)
- Ensure `.npmrc` doesn't contain `node-linker=hoisted`
- Try cleaning: `rm -rf node_modules && npm install`

### Issue: Image picker opens but callback never fires
**Solution:**
- Check that the app is connected to Metro bundler (you should see logs in terminal)
- Verify the dev client is installed (look for "Expo Go" or dev client UI)
- Check device logs for `[ImagePicker]` messages

### Issue: "Camera permission required" alert
**Solution:**
- Go to iPhone Settings → Farm Assist → Enable Camera and Photos permissions
- Restart the app

### Issue: App crashes when selecting image
**Solution:**
- Check terminal for error logs
- Verify Supabase storage bucket exists and has proper permissions
- Check that user is authenticated

## Key Differences: Simulator vs Physical Device

| Aspect | Simulator | Physical Device |
|--------|-----------|-----------------|
| Dev Server | Auto-connects | Requires proper network config |
| Image Picker | Stock photos only | Real camera + photo library |
| Permissions | Auto-granted | Must be explicitly granted |
| Performance | Slower | Native speed |
| Native Modules | Limited | Full support |

## Network Requirements

For the dev server to attach properly on a physical device:

1. **Same WiFi Network**: Your computer and iPhone must be on the same WiFi network
2. **No VPN**: Disable VPN on both devices during development
3. **Firewall**: Ensure your firewall allows connections on port 8081
4. **Router**: Some corporate/public WiFi networks block device-to-device communication

## Production Builds

For production builds (TestFlight, App Store):

```bash
# Build for TestFlight
eas build --platform ios --profile preview

# Build for App Store
eas build --platform ios --profile production
```

Production builds don't need the dev server and will work independently.

## Additional Notes

- The image picker now uses `setImmediate()` to ensure callbacks execute after the native bridge completes
- All image picker operations are logged with `[ImagePicker]` prefix for easy debugging
- The AI Assistant automatically triggers analysis after image selection (no manual send button needed)
- Both AI Assistant and Marketplace use the same `openImagePicker()` function for consistency
