import AsyncStorage from "@react-native-async-storage/async-storage";
import { Audio } from "expo-av";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

// Helper function to check notification preferences (outside of class to avoid circular reference)
const areNotificationsEnabledGlobal = async (): Promise<boolean> => {
  try {
    const savedPreferences = await AsyncStorage.getItem("appPreferences");
    if (savedPreferences) {
      const preferences = JSON.parse(savedPreferences);
      return preferences.notifications === true;
    }
    return true;
  } catch (error) {
    console.error("Error checking notification preferences:", error);
    return true;
  }
};

// Helper function to check sound effects preferences
const areSoundEffectsEnabledGlobal = async (): Promise<boolean> => {
  try {
    const savedPreferences = await AsyncStorage.getItem("appPreferences");
    if (savedPreferences) {
      const preferences = JSON.parse(savedPreferences);
      return preferences.soundEffects === true;
    }
    return true;
  } catch (error) {
    console.error("Error checking sound effects preferences:", error);
    return true;
  }
};

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => {
    // Check if notifications are enabled in user preferences
    const notificationsEnabled = await areNotificationsEnabledGlobal();
    const soundEffectsEnabled = await areSoundEffectsEnabledGlobal();

    return {
      shouldShowAlert: notificationsEnabled,
      shouldPlaySound: notificationsEnabled && soundEffectsEnabled,
      shouldSetBadge: false,
      shouldShowBanner: notificationsEnabled,
      shouldShowList: notificationsEnabled,
    };
  },
});

export class NotificationService {
  /**
   * Check if user has enabled notifications in app preferences
   */
  static async areNotificationsEnabled(): Promise<boolean> {
    return await areNotificationsEnabledGlobal();
  }

  /**
   * Check if user has enabled sound effects in app preferences
   */
  static async areSoundEffectsEnabled(): Promise<boolean> {
    return await areSoundEffectsEnabledGlobal();
  }

  /**
   * Setup notification listeners (call this in your root component)
   */
  static setupNotificationListeners() {
    // Listen for notifications received while app is in foreground
    const foregroundSubscription =
      Notifications.addNotificationReceivedListener((notification) => {
        console.log("Notification received in foreground:", notification);
      });

    // Listen for notification responses (when user taps notification)
    const responseSubscription =
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log("Notification response:", response);
        const data = response.notification.request.content.data;

        if (data?.type === "task-reminder") {
          console.log("Task reminder notification tapped:", data.taskTitle);
          // You can navigate to the task here if needed
        }
      });

    return () => {
      foregroundSubscription.remove();
      responseSubscription.remove();
    };
  }

  /**
   * Request notification permissions for iOS and Android
   */
  static async requestPermissions(): Promise<boolean> {
    try {
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== "granted") {
        console.log("Notification permission denied");
        return false;
      }

      // For iOS, we need to request additional permissions
      if (Platform.OS === "ios") {
        await Notifications.requestPermissionsAsync({
          ios: {
            allowAlert: true,
            allowBadge: true,
            allowSound: true,
          },
        });
      }

      console.log("Notification permissions granted");
      return true;
    } catch (error) {
      console.error("Error requesting notification permissions:", error);
      return false;
    }
  }

  /**
   * Send immediate notification for testing
   */
  static async sendImmediateTaskNotification(
    taskTitle: string,
    taskLocation: { latitude: number; longitude: number; address: string },
    range: number = 100
  ): Promise<string | null> {
    try {
      // Check if notifications are enabled in user preferences
      const notificationsEnabled = await this.areNotificationsEnabled();
      if (!notificationsEnabled) {
        console.log(
          "🔕 Notifications disabled in settings - skipping immediate notification"
        );
        return null;
      }

      // Check if sound effects are enabled
      const soundEffectsEnabled = await this.areSoundEffectsEnabled();

      // First ensure we have permissions
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        throw new Error("Notification permissions not granted");
      }

      // Prepare notification content
      const notificationContent: any = {
        title: "📍 Task Location Set",
        body: `"${taskTitle}" is now set for ${taskLocation.address}. You'll be notified within ${range}m!`,
        data: {
          taskTitle,
          location: taskLocation,
          type: "location-setup",
          range,
        },
      };

      // Add sound only if sound effects are enabled
      if (soundEffectsEnabled) {
        notificationContent.sound = "notification.wav";
      }

      // Send immediate notification
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: notificationContent,
        trigger: null, // Immediate
      });

      console.log("Immediate notification sent:", notificationId);
      return notificationId;
    } catch (error) {
      console.error("Error sending immediate notification:", error);
      return null;
    }
  }

  /**
   * Schedule a simple notification for a task (since location-based triggers aren't supported in managed Expo)
   */
  static async scheduleTaskNotification(
    taskTitle: string,
    taskLocation: { latitude: number; longitude: number; address: string },
    range: number = 100,
    delayMinutes: number = 1 // For testing, show notification after 1 minute
  ): Promise<string | null> {
    try {
      // Check if notifications are enabled in user preferences
      const notificationsEnabled = await this.areNotificationsEnabled();
      if (!notificationsEnabled) {
        console.log(
          "🔕 Notifications disabled in settings - skipping scheduled notification"
        );
        return null;
      }

      // Check if sound effects are enabled
      const soundEffectsEnabled = await this.areSoundEffectsEnabled();

      // First ensure we have permissions
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        throw new Error("Notification permissions not granted");
      }

      // Prepare notification content
      const notificationContent: any = {
        title: "📍 Task Reminder",
        body: `Don't forget about "${taskTitle}" at ${taskLocation.address}`,
        data: {
          taskTitle,
          location: taskLocation,
          type: "task-reminder",
          range,
        },
      };

      // Add sound only if sound effects are enabled
      if (soundEffectsEnabled) {
        notificationContent.sound = "notification.wav";
      }

      // Schedule notification with time trigger (since location triggers aren't supported)
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: notificationContent,
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: delayMinutes * 60, // Convert minutes to seconds
        },
      });

      console.log("Task notification scheduled:", notificationId);
      return notificationId;
    } catch (error) {
      console.error("Error scheduling task notification:", error);
      return null;
    }
  }

  /**
   * Cancel a specific notification
   */
  static async cancelNotification(notificationId: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
      console.log("Notification cancelled:", notificationId);
    } catch (error) {
      console.error("Error cancelling notification:", error);
    }
  }

  /**
   * Cancel all scheduled notifications
   */
  static async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log("All notifications cancelled");
    } catch (error) {
      console.error("Error cancelling all notifications:", error);
    }
  }

  /**
   * Get notification permissions status
   */
  static async getPermissionStatus(): Promise<Notifications.NotificationPermissionsStatus> {
    return await Notifications.getPermissionsAsync();
  }

  /**
   * Test notification (for debugging)
   */
  static async sendTestNotification(): Promise<void> {
    try {
      // Check if notifications are enabled in user preferences
      const notificationsEnabled = await this.areNotificationsEnabled();
      if (!notificationsEnabled) {
        console.log(
          "🔕 Notifications disabled in settings - skipping test notification"
        );
        return;
      }

      // Check if sound effects are enabled
      const soundEffectsEnabled = await this.areSoundEffectsEnabled();

      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        throw new Error("Notification permissions not granted");
      }

      // Prepare notification content
      const notificationContent: any = {
        title: "Test Notification",
        body: "This is a test notification from TaskWize",
      };

      // Add sound only if sound effects are enabled
      if (soundEffectsEnabled) {
        notificationContent.sound = "notification.wav";
      }

      await Notifications.scheduleNotificationAsync({
        content: notificationContent,
        trigger: null, // Show immediately
      });
    } catch (error) {
      console.error("Error sending test notification:", error);
    }
  }

  /**
   * Play sound preview for settings (sound only, no visible notification)
   */
  static async playSoundPreview(): Promise<void> {
    try {
      // Force enable sound for this preview regardless of current settings
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: false, // Don't show alert
          shouldPlaySound: true, // Force play sound
          shouldSetBadge: false,
          shouldShowBanner: false, // Don't show banner
          shouldShowList: false, // Don't add to notification list
        }),
      });

      // Schedule notification just for the sound
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "",
          body: "",
          sound: "notification.wav",
        },
        trigger: null, // Show immediately
      });

      // Restore original notification handler after a short delay
      setTimeout(async () => {
        Notifications.setNotificationHandler({
          handleNotification: async () => {
            const notificationsEnabled = await areNotificationsEnabledGlobal();
            const soundEffectsEnabled = await areSoundEffectsEnabledGlobal();
            return {
              shouldShowAlert: notificationsEnabled,
              shouldPlaySound: notificationsEnabled && soundEffectsEnabled,
              shouldSetBadge: false,
              shouldShowBanner: notificationsEnabled,
              shouldShowList: notificationsEnabled,
            };
          },
        });
      }, 100);
    } catch (error) {
      console.error("Error playing sound preview:", error);
    }
  }

  /**
   * Play sound directly using Audio API (alternative method)
   */
  static async playDirectSound(): Promise<void> {
    try {
      // Set audio mode to allow sound even if device is on silent
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: false,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      // Load and play the notification sound
      const { sound } = await Audio.Sound.createAsync(
        require("../assets/sound/notification.wav"),
        { shouldPlay: true, volume: 1.0 }
      );

      // Clean up after playing
      setTimeout(async () => {
        try {
          await sound.unloadAsync();
        } catch (error) {
          console.error("Error unloading sound:", error);
        }
      }, 2000);
    } catch (error) {
      console.error("Error playing direct sound:", error);
      // Fallback to notification method if direct audio fails
      await this.playSoundPreview();
    }
  }
}
