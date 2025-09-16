import { auth } from "@/firebase";
import * as Location from "expo-location";
import * as Notifications from "expo-notifications";
import * as TaskManager from "expo-task-manager";
import { NotificationService } from "./notificationService";

const LOCATION_TASK_NAME = "TASKWIZE_LOCATION_TRACKING";

// Define the background location task at module level
TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }: any) => {
  try {
    console.log("🔄 Background location task triggered");

    if (error) {
      console.error("❌ Background location task error:", error);
      return;
    }

    // Check if user is still authenticated
    if (!auth.currentUser) {
      console.log("👤 User not authenticated in background task");
      return;
    }

    if (data && data.locations) {
      const { locations } = data;
      const location = locations[0];

      if (location && location.coords) {
        console.log("📍 Background location update:", {
          lat: location.coords.latitude.toFixed(6),
          lng: location.coords.longitude.toFixed(6),
          timestamp: new Date().toISOString(),
        });

        // Check proximity to tasks in background
        await LocationMonitoringService.checkProximityInBackground(
          location.coords
        );
      }
    }
  } catch (taskError) {
    console.error("❌ Error in background location task:", taskError);

    // Send a notification about the error for debugging
    try {
      const errorMessage =
        taskError instanceof Error ? taskError.message : String(taskError);
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Location Task Error",
          body: `Error: ${errorMessage}`,
        },
        trigger: null,
      });
    } catch (notifError) {
      console.error("Failed to send error notification:", notifError);
    }
  }
});

class LocationMonitoringService {
  private static isInitialized = false;
  private static isMonitoring = false;
  private static lastNotifiedTasks: Set<string> = new Set();
  private static foregroundInterval: number | null = null;

  static async initialize(): Promise<boolean> {
    console.log("🚀 Initializing location monitoring service");

    if (!auth.currentUser) {
      console.log("❌ No authenticated user found");
      return false;
    }

    try {
      // Check if TaskManager is available
      const isTaskManagerAvailable = await TaskManager.isAvailableAsync();
      if (!isTaskManagerAvailable) {
        console.log("❌ TaskManager not available on this platform");
        return false;
      }

      // Stop any existing location updates first
      const isTaskDefined = TaskManager.isTaskDefined(LOCATION_TASK_NAME);
      if (isTaskDefined) {
        try {
          await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
          console.log("🛑 Stopped existing location updates");
        } catch (error) {
          console.log("⚠️ Error stopping existing location updates:", error);
        }
      }

      // Request foreground location permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        console.log("❌ Foreground location permission denied");
        return false;
      }
      console.log("✅ Foreground location permission granted");

      // Request background location permissions (essential for background tracking)
      const { status: backgroundStatus } =
        await Location.requestBackgroundPermissionsAsync();
      if (backgroundStatus !== "granted") {
        console.log(
          "⚠️ Background location permission denied - notifications may not work when app is closed"
        );
        // Don't return false here - we can still work with foreground permissions
      } else {
        console.log("✅ Background location permission granted");
      }

      this.isInitialized = true;
      console.log("✅ Location monitoring initialized successfully");
      return true;
    } catch (error) {
      console.error("❌ Failed to initialize location monitoring:", error);

      // Try to fallback to foreground monitoring
      try {
        console.log("🔄 Attempting fallback to foreground monitoring");
        await this.startForegroundMonitoring();
        this.isInitialized = true;
        console.log("✅ Fallback to foreground monitoring successful");
        return true;
      } catch (fallbackError) {
        console.error("❌ Fallback monitoring also failed:", fallbackError);
        this.isInitialized = false;
        return false;
      }
    }
  }

  static async startLocationMonitoring(): Promise<void> {
    if (!this.isInitialized) {
      console.log("❌ Location monitoring not initialized");
      return;
    }

    if (this.isMonitoring) {
      console.log("⚠️ Location monitoring already running");
      return;
    }

    if (!auth.currentUser) {
      console.log("❌ No authenticated user for location monitoring");
      return;
    }

    try {
      console.log("🚀 Starting background location monitoring");

      // Start background location updates using TaskManager
      await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 15000, // Check every 15 seconds for better responsiveness
        distanceInterval: 25, // Check when user moves 25+ meters
        deferredUpdatesInterval: 30000, // iOS deferred updates
        showsBackgroundLocationIndicator: true, // iOS only
        foregroundService: {
          notificationTitle: "TaskWize Active",
          notificationBody: "Location tracking for task notifications",
          notificationColor: "#4285F4",
          killServiceOnDestroy: false, // Keep service running
        },
        // Additional options for better background performance
        pausesUpdatesAutomatically: false, // iOS - don't pause automatically
        activityType: Location.ActivityType.Other, // iOS - general activity type
      });

      this.isMonitoring = true;
      console.log("✅ Background location monitoring started");

      // Also do an immediate check
      await this.checkLocationAndTasks();
    } catch (error) {
      console.error(
        "❌ Failed to start background location monitoring:",
        error
      );
      this.isMonitoring = false;

      // If background monitoring fails, try foreground monitoring as fallback
      console.log(
        "🔄 Background monitoring failed, starting foreground fallback"
      );
      await this.startForegroundMonitoring();
    }
  }

  static async startForegroundMonitoring(): Promise<void> {
    console.log("🔄 Starting foreground location monitoring (fallback mode)");

    if (this.foregroundInterval) {
      clearInterval(this.foregroundInterval);
    }

    // Check location every 30 seconds in foreground
    this.foregroundInterval = setInterval(async () => {
      try {
        await this.checkLocationAndTasks();
      } catch (error) {
        console.error("❌ Error in foreground location check:", error);
      }
    }, 30000); // 30 seconds

    // Do an immediate check
    await this.checkLocationAndTasks();

    this.isMonitoring = true;
    console.log("✅ Foreground location monitoring started");

    // Test notification to verify notifications work in Expo Go
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "🔄 Location Monitoring Active",
          body: "TaskWize is now monitoring your location for nearby tasks",
          data: { type: "test" },
        },
        trigger: null,
      });
      console.log(
        "✅ Test notification sent - should appear if notifications work"
      );
    } catch (error) {
      console.log("❌ Test notification failed:", error);
    }
  }

  static async stopLocationMonitoring(): Promise<void> {
    try {
      if (this.isMonitoring) {
        await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
        this.isMonitoring = false;
        this.lastNotifiedTasks.clear();
        console.log("🛑 Background location monitoring stopped");
      }

      // Also stop foreground monitoring if active
      if (this.foregroundInterval) {
        clearInterval(this.foregroundInterval);
        this.foregroundInterval = null;
        console.log("🛑 Foreground location monitoring stopped");
      }
    } catch (error) {
      console.error("❌ Error stopping location monitoring:", error);
    }
  }

  // Background proximity checking method called from TaskManager
  static async checkProximityInBackground(userCoords: any): Promise<void> {
    try {
      console.log("🔍 Background proximity check");

      if (!auth.currentUser) {
        console.log("👤 User not authenticated in background");
        return;
      }

      const incompleteTasks =
        await LocationMonitoringService.getIncompleteTasksWithLocation();
      console.log(
        `📋 Background check: Found ${incompleteTasks.length} tasks with location`
      );

      for (const task of incompleteTasks) {
        await LocationMonitoringService.checkProximityToTask(
          userCoords,
          task,
          true
        );
      }
    } catch (error) {
      console.error("❌ Error in background proximity check:", error);
    }
  }

  private static async checkLocationAndTasks(): Promise<void> {
    try {
      if (!auth.currentUser) {
        console.log("👤 User not authenticated, stopping location monitoring");
        this.stopLocationMonitoring();
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const incompleteTasks = await this.getIncompleteTasksWithLocation();

      if (incompleteTasks.length === 0) {
        console.log("⚠️ No tasks with location monitoring found");
        return;
      }

      for (const task of incompleteTasks) {
        await this.checkProximityToTask(location.coords, task);
      }
    } catch (error) {
      console.error("❌ Error checking location and tasks:", error);
    }
  }

  private static async getIncompleteTasksWithLocation(): Promise<any[]> {
    try {
      const { getAllTaskByUserId } = await import("./taskService");
      if (!auth.currentUser) return [];

      const allTasks = await getAllTaskByUserId(auth.currentUser.uid);

      // Filter tasks with defensive location checking
      const filteredTasks = allTasks.filter((task) => {
        // Must be pending and have location monitoring enabled
        if (task.status !== "pending" || !task.notifyOnLocation) {
          return false;
        }

        // Check for location data in various structures
        let lat, lng;
        if (task.location) {
          // Handle direct latitude/longitude structure
          if (task.location.latitude && task.location.longitude) {
            lat = task.location.latitude;
            lng = task.location.longitude;
          }
          // Handle coords structure (fallback for old data)
          else {
            const locationAny = task.location as any;
            if (locationAny.coords?.latitude && locationAny.coords?.longitude) {
              lat = locationAny.coords.latitude;
              lng = locationAny.coords.longitude;
            }
          }
        }

        const hasValidLocation =
          lat && lng && typeof lat === "number" && typeof lng === "number";

        if (!hasValidLocation) {
          console.log(
            `⚠️ Task "${task.title}" has invalid location data:`,
            task.location
          );
          return false;
        }

        return true;
      });

      return filteredTasks;
    } catch (error) {
      console.error("❌ Error fetching tasks with location:", error);
      return [];
    }
  }

  private static async checkProximityToTask(
    userCoords: any,
    task: any,
    isBackground: boolean = false
  ): Promise<void> {
    try {
      // Get task location coordinates defensively
      let taskLat, taskLng, taskRange;

      if (task.location) {
        // Handle direct latitude/longitude structure
        if (task.location.latitude && task.location.longitude) {
          taskLat = task.location.latitude;
          taskLng = task.location.longitude;
          taskRange = task.location.range || 100;
        }
        // Handle coords structure (fallback for old data)
        else {
          const locationAny = task.location as any;
          if (locationAny.coords?.latitude && locationAny.coords?.longitude) {
            taskLat = locationAny.coords.latitude;
            taskLng = locationAny.coords.longitude;
            taskRange = task.location.range || 100;
          }
        }
      }

      if (!taskLat || !taskLng) {
        console.log(
          `⚠️ ${isBackground ? "[BG]" : "[FG]"} Task "${
            task.title
          }" has invalid location coordinates`
        );
        return;
      }

      const distance = this.calculateDistance(
        userCoords.latitude,
        userCoords.longitude,
        taskLat,
        taskLng
      );

      if (distance <= taskRange) {
        if (!this.lastNotifiedTasks.has(task.id)) {
          console.log(
            `🔔 Sending location alert for "${task.title}" (${Math.round(
              distance
            )}m away)`
          );
          await this.sendLocationNotification(task, distance, isBackground);
          this.lastNotifiedTasks.add(task.id);
          setTimeout(() => this.lastNotifiedTasks.delete(task.id), 300000);
        }
      } else {
        console.log(
          `📍 ${isBackground ? "[BG]" : "[FG]"} Task "${
            task.title
          }" is outside range (${Math.round(distance)}m > ${taskRange}m)`
        );
      }
    } catch (error) {
      console.error(
        `❌ Error checking proximity for task "${task.title}":`,
        error
      );
    }
  }

  private static async sendLocationNotification(
    task: any,
    distance: number,
    isBackground: boolean = false
  ): Promise<void> {
    try {
      // In background mode, we can't play sounds through NotificationService
      // but we can include sound in the notification itself
      let soundEnabled = false;
      if (!isBackground) {
        soundEnabled = await NotificationService.areSoundEffectsEnabled();
        if (soundEnabled) {
          await NotificationService.playDirectSound();
        }
      } else {
        // For background notifications, always try to include sound
        soundEnabled = true;
      }

      await Notifications.scheduleNotificationAsync({
        content: {
          title: "📍 Task Location Alert",
          body: `You're near "${task.title}" (${Math.round(distance)}m away)`,
          data: {
            taskId: task.id,
            type: "location-proximity",
            isBackground: isBackground,
          },
          ...(soundEnabled && { sound: "notification.wav" }),
        },
        trigger: null,
      });

      console.log(`✅ Location notification sent for "${task.title}"`);
    } catch (error) {
      console.error("❌ Error sending notification:", error);
    }
  }

  private static calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371e3;
    const phi1 = (lat1 * Math.PI) / 180;
    const phi2 = (lat2 * Math.PI) / 180;
    const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
    const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
      Math.cos(phi1) *
        Math.cos(phi2) *
        Math.sin(deltaLambda / 2) *
        Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  static getStatus() {
    return {
      initialized: this.isInitialized,
      monitoring: this.isMonitoring,
      authenticated: !!auth.currentUser,
    };
  }

  // Debug method to manually trigger location check
  static async debugLocationCheck(): Promise<void> {
    console.log("🔧 Manual location check triggered");
    await this.checkLocationAndTasks();
  }

  static handleUserLogout(): void {
    console.log("👋 Handling user logout - stopping location monitoring");
    this.stopLocationMonitoring();
    this.isInitialized = false;
    this.lastNotifiedTasks.clear();
  }
}

export default LocationMonitoringService;
