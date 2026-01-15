
# Deployment Guide - SmallFarm Copilot

This guide covers deploying SmallFarm Copilot to iOS App Store and Google Play Store.

## Prerequisites

- ✅ Expo account (free at expo.dev)
- ✅ Apple Developer account ($99/year) for iOS
- ✅ Google Play Developer account ($25 one-time) for Android
- ✅ EAS CLI installed: `npm install -g eas-cli`
- ✅ Supabase project configured
- ✅ All environment variables set

## 1. Initial Setup

### Install EAS CLI

```bash
npm install -g eas-cli
eas login
```

### Configure EAS

```bash
# Initialize EAS in your project
eas build:configure
```

This creates/updates `eas.json` with build profiles.

## 2. iOS Deployment

### A. Prepare iOS Build

1. **Update app.json**:
```json
{
  "expo": {
    "ios": {
      "bundleIdentifier": "com.yourcompany.smallfarmcopilot",
      "buildNumber": "1",
      "supportsTablet": true
    }
  }
}
```

2. **Set up credentials**:
```bash
eas credentials
```

Follow prompts to:
- Create/upload distribution certificate
- Create/upload provisioning profile
- Set up push notification keys

### B. Build for iOS

```bash
# Production build
eas build --platform ios --profile production

# This will:
# - Build your app in the cloud
# - Generate an .ipa file
# - Provide a download link
```

### C. Submit to App Store

1. **Prepare App Store Connect**:
   - Go to [appstoreconnect.apple.com](https://appstoreconnect.apple.com)
   - Create a new app
   - Fill in app information, screenshots, description

2. **Submit via EAS**:
```bash
eas submit --platform ios --latest
```

Or manually:
- Download the .ipa from EAS
- Upload via Transporter app or Xcode

3. **App Store Information**:
   - **Name**: FarmAssist (or your chosen name)
   - **Subtitle**: AI-Powered Farm Management
   - **Category**: Productivity / Business
   - **Keywords**: farm, agriculture, crop management, farming, homestead
   - **Description**: See STORE_LISTING.md for copy

### D. App Store Review

- **Review Time**: 1-3 days typically
- **Common Issues**:
  - Missing privacy policy
  - Incomplete app information
  - Crashes on launch
  - Missing required permissions explanations

## 3. Android Deployment

### A. Prepare Android Build

1. **Update app.json**:
```json
{
  "expo": {
    "android": {
      "package": "com.yourcompany.smallfarmcopilot",
      "versionCode": 1,
      "permissions": [
        "CAMERA",
        "READ_EXTERNAL_STORAGE",
        "WRITE_EXTERNAL_STORAGE",
        "ACCESS_FINE_LOCATION",
        "POST_NOTIFICATIONS"
      ]
    }
  }
}
```

2. **Set up credentials**:
```bash
eas credentials
```

EAS will generate:
- Keystore
- Upload key
- Service account key (for Play Store)

### B. Build for Android

```bash
# Production build (AAB for Play Store)
eas build --platform android --profile production

# This generates an .aab file
```

### C. Submit to Google Play

1. **Prepare Google Play Console**:
   - Go to [play.google.com/console](https://play.google.com/console)
   - Create a new app
   - Fill in store listing

2. **Submit via EAS**:
```bash
eas submit --platform android --latest
```

Or manually:
- Download the .aab from EAS
- Upload to Google Play Console → Production → Create new release

3. **Play Store Information**:
   - **Name**: FarmAssist
   - **Short Description**: AI-powered farm management for small farms
   - **Full Description**: See STORE_LISTING.md
   - **Category**: Productivity
   - **Content Rating**: Everyone
   - **Target Audience**: Adults

### D. Google Play Review

- **Review Time**: Few hours to 1 day typically
- **Common Issues**:
  - Missing privacy policy
  - Incorrect permissions usage
  - Crashes on specific devices
  - Missing required declarations

## 4. Environment Variables

### Production Environment

Create production environment variables in EAS:

```bash
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value your_production_url
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value your_production_key
```

Or add to `eas.json`:

```json
{
  "build": {
    "production": {
      "env": {
        "EXPO_PUBLIC_SUPABASE_URL": "your_production_url",
        "EXPO_PUBLIC_SUPABASE_ANON_KEY": "your_production_key"
      }
    }
  }
}
```

## 5. App Store Assets

### iOS Screenshots Required
- 6.7" (iPhone 14 Pro Max): 1290 x 2796 px
- 6.5" (iPhone 11 Pro Max): 1242 x 2688 px
- 5.5" (iPhone 8 Plus): 1242 x 2208 px
- 12.9" iPad Pro: 2048 x 2732 px

### Android Screenshots Required
- Phone: 1080 x 1920 px minimum
- 7" Tablet: 1200 x 1920 px
- 10" Tablet: 1600 x 2560 px

### App Icon
- iOS: 1024 x 1024 px (no transparency)
- Android: 512 x 512 px (can have transparency)

### Feature Graphic (Android)
- 1024 x 500 px

## 6. Store Listing Copy

### App Name
**FarmAssist** or **SmallFarm Copilot**

### Subtitle/Short Description
AI-powered farm management for small farms and homesteads

### Description
See `STORE_LISTING.md` for full copy

### Keywords (iOS)
farm, agriculture, crop management, farming, homestead, garden, planting, harvest, AI assistant, weather, tasks, inventory, revenue, marketplace

### Privacy Policy
Required for both stores. Host at:
- Your website
- GitHub Pages
- Or use a privacy policy generator

Must cover:
- Data collection (location, photos, user data)
- Data usage (AI processing, weather services)
- Third-party services (Supabase, OpenAI)
- User rights (data deletion, export)

## 7. Testing Before Submission

### Internal Testing

```bash
# Build for internal testing
eas build --platform ios --profile preview
eas build --platform android --profile preview
```

### TestFlight (iOS)
- Automatically available after build
- Invite testers via email
- Collect feedback before public release

### Internal Testing (Android)
- Upload to Internal Testing track
- Add testers by email
- Test before promoting to production

## 8. Post-Launch

### Monitor Crashes
```bash
# View crash reports
eas build:list
```

### Update App

1. Increment version:
```json
{
  "expo": {
    "version": "1.0.1",
    "ios": { "buildNumber": "2" },
    "android": { "versionCode": 2 }
  }
}
```

2. Build and submit:
```bash
eas build --platform all --profile production
eas submit --platform all --latest
```

### Over-The-Air (OTA) Updates

For minor updates without app store review:

```bash
# Publish update
eas update --branch production --message "Bug fixes"
```

Users get updates automatically without downloading from store.

## 9. Troubleshooting

### Build Fails

```bash
# View build logs
eas build:list
eas build:view [build-id]
```

Common issues:
- Missing dependencies
- Invalid credentials
- Expo SDK version mismatch
- Native module conflicts

### Submission Rejected

**iOS**:
- Check App Store Connect for rejection reason
- Common: Missing privacy policy, crashes, incomplete info
- Fix and resubmit

**Android**:
- Check Google Play Console for issues
- Common: Permissions not explained, crashes, policy violations
- Fix and resubmit

### App Crashes

1. Check Sentry/crash reports
2. Test on physical devices
3. Check for:
   - Missing permissions
   - API errors
   - Memory issues
   - Platform-specific bugs

## 10. Checklist Before Launch

- [ ] All features tested on iOS and Android
- [ ] App icons and splash screens configured
- [ ] Privacy policy created and linked
- [ ] Store listings complete (descriptions, screenshots)
- [ ] Environment variables set for production
- [ ] Supabase production database configured
- [ ] Push notifications tested
- [ ] In-app purchases tested (if applicable)
- [ ] Analytics configured
- [ ] Crash reporting set up
- [ ] Terms of service created
- [ ] Support email configured
- [ ] App Store/Play Store accounts ready
- [ ] Payment methods set up for developer accounts

## 11. Costs Summary

### One-Time
- Google Play Developer: $25
- App Store Developer: $99/year

### Monthly (Optional)
- EAS Build: Free tier available, paid plans for more builds
- Supabase: Free tier available, paid plans for scale
- Domain/hosting for privacy policy: ~$10/year

### Per-Transaction
- Apple: 30% of in-app purchases (15% for small businesses)
- Google: 30% of in-app purchases (15% for first $1M)

---

**Ready to deploy? Start with internal testing, then gradually roll out to production!**
