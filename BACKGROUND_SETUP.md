# Background Notifications Setup Guide

This guide addresses the issues with background notifications and Firebase authentication persistence in production builds.

## 🔧 Changes Made

### 1. App Configuration (`app.json`)

**Android Permissions Added:**

- `FOREGROUND_SERVICE` - For background location service
- `FOREGROUND_SERVICE_LOCATION` - Specific foreground service type for location
- `WAKE_LOCK` - Prevent device from sleeping during location tracking
- `RECEIVE_BOOT_COMPLETED` - Start service after device restart
- `USE_FULL_SCREEN_INTENT` - For important notifications
- `REQUEST_IGNORE_BATTERY_OPTIMIZATIONS` - Request battery optimization exemption

**iOS Background Modes Added:**

- `location` - Background location updates
- `background-processing` - Background app refresh
- `background-fetch` - Periodic background updates

### 2. Firebase Authentication (`firebase.ts`)

Fixed Firebase v12 authentication with proper persistence:

```typescript
import { getAuth } from "firebase/auth";

// Firebase v12 automatically handles React Native persistence
export const auth = getAuth(app);
```

### 3. Location Monitoring Service Improvements

**Enhanced Background Task:**

- Better error handling with notification feedback
- More frequent location updates (15 seconds vs 30 seconds)
- Smaller distance threshold (25m vs 50m)
- Persistent foreground service that doesn't kill on destroy

**Improved Configuration:**

```typescript
await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
  accuracy: Location.Accuracy.Balanced,
  timeInterval: 15000, // Every 15 seconds
  distanceInterval: 25, // Every 25 meters
  pausesUpdatesAutomatically: false, // Don't pause automatically
  foregroundService: {
    notificationTitle: "TaskWize Active",
    notificationBody: "Location tracking for task notifications",
    killServiceOnDestroy: false, // Keep service running
  },
});
```

## 🚀 Build Instructions

### For EAS Build:

1. **Create a new build:**

   ```bash
   npx eas build --platform android --profile production
   ```

2. **For iOS (if needed):**
   ```bash
   npx eas build --platform ios --profile production
   ```

### For Local Development Build:

```bash
npx expo run:android --variant release
```

## 📱 User Instructions for Production

### Android Battery Optimization

**Important:** Users need to disable battery optimization for the app to work properly in background:

1. **Samsung/One UI:**

   - Settings → Apps → TaskWize → Battery → Allow background activity
   - Settings → Device care → Battery → Background usage limits → Never sleeping apps → Add TaskWize

2. **MIUI (Xiaomi):**

   - Settings → Apps → Manage apps → TaskWize → Battery saver → No restrictions
   - Settings → Apps → Manage apps → TaskWize → Other permissions → Display pop-up windows while running in background

3. **EMUI (Huawei):**

   - Settings → Apps → Apps → TaskWize → Battery → App launch → Manage manually → Enable all

4. **ColorOS (Oppo/OnePlus):**

   - Settings → Apps → App Management → TaskWize → Battery usage → Allow background activity

5. **Stock Android:**
   - Settings → Apps → TaskWize → Battery → Battery optimization → Don't optimize

### iOS Background App Refresh

1. Settings → General → Background App Refresh → ON
2. Settings → General → Background App Refresh → TaskWize → ON
3. Settings → Privacy & Security → Location Services → TaskWize → Always

## 🔍 Troubleshooting

### Background Notifications Not Working

1. **Check Device Settings:**

   - Ensure battery optimization is disabled
   - Verify background app refresh is enabled
   - Check notification permissions

2. **Verify Background Location Permission:**

   - App should request "Allow all the time" location permission
   - Not just "While using app"

3. **Test Background Task:**
   - The app shows a persistent notification when location tracking is active
   - If notification disappears, background task was killed

### Authentication Issues

1. **Re-login Required:**

   - This should be fixed with proper Firebase persistence
   - If still occurring, check network connectivity during authentication

2. **Session Restoration:**
   - App now properly restores user sessions on startup
   - AuthContext shows "User session restored from persistence!" in logs

## 📊 Testing Background Functionality

### Development Testing:

1. Install app in release mode
2. Log in and enable location permissions
3. Go to tasks screen to start location monitoring
4. Force close the app (don't just minimize)
5. Move to a location near a task
6. Notification should appear even with app closed

### Production Testing:

1. Install from APK/App Store
2. Follow same steps as development
3. Additionally test after device restart
4. Test with various battery optimization settings

## ⚠️ Known Limitations

1. **Battery Optimization:** Android manufacturers aggressively kill background tasks. Users MUST whitelist the app.

2. **iOS Background Limits:** iOS limits background execution time. Location-based notifications work best.

3. **Network Dependency:** Background tasks need network access to fetch tasks and send notifications.

## 🔄 Additional Recommendations

### For Better Background Performance:

1. **Reduce Background Task Frequency:** If battery drain is an issue, increase `timeInterval` to 30000 (30 seconds)

2. **Implement Local Notifications:** Cache nearby tasks locally and use local notifications when possible

3. **User Education:** Show in-app tutorial about battery optimization settings

4. **Fallback Strategy:** If background monitoring fails, fall back to foreground-only monitoring with user notification

## 📞 Support

If background notifications still don't work after following this guide:

1. Check device-specific battery optimization settings
2. Verify all permissions are granted correctly
3. Test with location simulation in development
4. Check system notification settings for the app

The key is that background execution on mobile devices is heavily restricted, and user action is often required to whitelist apps for proper background functionality.
