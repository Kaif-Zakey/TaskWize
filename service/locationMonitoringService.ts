import { auth } from "@/firebase";
import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";
import { NotificationService } from "./notificationService";

const LOCATION_TASK_NAME = "background-location-task";

interface TaskLocation {
  id: string;
  title: string;
  latitude: number;
  longitude: number;
  range: number;
  address?: string;
  status: "pending" | "completed";
}

// Define the background task at module level with error handling
TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }: any) => {
  try {
    console.log("🔄 Background location task triggered");

    // Check if user is authenticated before processing location updates
    if (!auth.currentUser) {
      console.log("👤 User not authenticated, skipping location monitoring");
      return;
    }

    if (error) {
      console.error("❌ Background location task error:", error.message);
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

        // Call the static method to check proximity
        await LocationMonitoringService.checkProximityToTasks({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
      } else {
        console.log("⚠️ No location data in background task");
      }
    } else {
      console.log("⚠️ No location data received in background task");
    }
  } catch (taskError) {
    console.error("❌ Error in background location task:", taskError);
  }
});

class LocationMonitoringService {
  private static trackedTasks: TaskLocation[] = [];
  private static isMonitoring = false;
  private static isInitialized = false;

  /**
   * Initialize the location monitoring service
   */
  static async initialize() {
    // Check if user is authenticated before initializing
    if (!auth.currentUser) {
      console.log(
        "👤 User not authenticated, cannot initialize location monitoring"
      );
      return false;
    }

    if (this.isInitialized) {
      console.log("📱 Location monitoring service already initialized");
      return true;
    }

    try {
      // Check if running on a platform that supports background tasks
      if (!TaskManager) {
        console.log("TaskManager is not available on this platform");
        return false;
      }

      // Request location permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        console.log("📍 Location permission not granted");
        return false;
      }

      // Request background location permissions
      const backgroundStatus =
        await Location.requestBackgroundPermissionsAsync();
      if (backgroundStatus.status !== "granted") {
        console.log("🔒 Background location permission not granted");
        return false;
      }

      this.isInitialized = true;
      console.log("✅ Location monitoring service ready");
      return true;
    } catch (error) {
      console.error("❌ Error initializing location monitoring:", error);
      return false;
    }
  }

  /**
   * Add a task location to monitor
   */
  static addTaskLocation(taskLocation: TaskLocation) {
    // Check if user is authenticated before adding task location
    if (!auth.currentUser) {
      console.log(
        "👤 User not authenticated, cannot add task location for monitoring"
      );
      return;
    }

    // Remove existing task with same ID if exists
    this.trackedTasks = this.trackedTasks.filter(
      (task) => task.id !== taskLocation.id
    );

    // Add new task location
    this.trackedTasks.push(taskLocation);

    console.log("Added task location for monitoring:", taskLocation.title);
    console.log("Currently tracking:", this.trackedTasks.length, "tasks");

    // Start monitoring if not already started
    if (!this.isMonitoring) {
      this.startLocationMonitoring();
    }
  }

  /**
   * Remove a task location from monitoring
   */
  static removeTaskLocation(taskId: string) {
    this.trackedTasks = this.trackedTasks.filter((task) => task.id !== taskId);

    console.log("Removed task location:", taskId);
    console.log("Currently tracking:", this.trackedTasks.length, "tasks");

    // Stop monitoring if no tasks left
    if (this.trackedTasks.length === 0 && this.isMonitoring) {
      this.stopLocationMonitoring();
    }
  }

  /**
   * Get all currently tracked tasks
   */
  static getTrackedTasks(): TaskLocation[] {
    return [...this.trackedTasks];
  }

  /**
   * Clear all tracked tasks
   */
  static clearAllTasks() {
    this.trackedTasks = [];
    this.stopLocationMonitoring();
    console.log("🧹 Cleared all tasks from location monitoring");
  }

  /**
   * Restore tasks with location monitoring from Firebase when user logs in
   */
  static async restoreTasksFromFirebase(userId: string) {
    try {
      console.log("🔄 Restoring tasks with location monitoring from Firebase");

      // Import task service here to avoid circular dependency
      const { getAllTaskByUserId } = await import("./taskService");

      // Get all user tasks
      const allTasks = await getAllTaskByUserId(userId);

      // Filter tasks that need location monitoring
      const tasksWithLocation = allTasks.filter(
        (task) =>
          task.status === "pending" && task.location && task.notifyOnLocation
      );

      console.log(
        `📍 Found ${tasksWithLocation.length} pending tasks with location monitoring out of ${allTasks.length} total tasks`
      );

      // Clear existing tracked tasks first
      this.trackedTasks = [];

      // Add each task to location monitoring
      for (const task of tasksWithLocation) {
        if (task.location && task.id) {
          this.addTaskLocation({
            id: task.id,
            title: task.title,
            latitude: task.location.latitude,
            longitude: task.location.longitude,
            range: task.location.range || 100,
            address: task.location.address,
            status: task.status as "pending" | "completed",
          });
        }
      }

      console.log(
        `✅ Task restoration completed. Now tracking ${this.trackedTasks.length} tasks`
      );

      // Start monitoring if we have tasks and not already monitoring
      if (this.trackedTasks.length > 0 && !this.isMonitoring) {
        console.log("🚀 Starting location monitoring for restored tasks");
        await this.startLocationMonitoring();
      }
    } catch (error) {
      console.error("❌ Error restoring tasks from Firebase:", error);
    }
  }

  /**
   * Force refresh tasks from Firebase (useful for debugging)
   */
  static async forceRefreshTasks() {
    if (!auth.currentUser) {
      console.log("👤 User not authenticated, cannot refresh tasks");
      return;
    }

    console.log("🔄 Force refreshing tasks from Firebase");
    await this.restoreTasksFromFirebase(auth.currentUser.uid);
  }

  /**
   * Check if the service is ready to use
   */
  static isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Get service status
   */
  static getStatus() {
    return {
      initialized: this.isInitialized,
      monitoring: this.isMonitoring,
      trackedTasksCount: this.trackedTasks.length,
      authenticated: !!auth.currentUser,
    };
  }

  /**
   * Handle user logout - stop all location monitoring and clear tasks
   */
  static handleUserLogout() {
    console.log("👤 User logged out, cleaning up location monitoring");
    this.clearAllTasks();
    this.isInitialized = false;
    console.log("🧹 Location monitoring cleaned up after logout");
  }

  /**
   * Calculate distance between two coordinates in meters
   */
  private static calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  }

  /**
   * Check if user is near any tracked task locations
   * Enhanced to only notify for pending (incomplete) tasks with sound alerts
   */
  public static async checkProximityToTasks(userLocation: {
    latitude: number;
    longitude: number;
  }) {
    // Check if user is authenticated before processing proximity checks
    if (!auth.currentUser) {
      console.log("👤 User not authenticated, skipping proximity checks");
      return;
    }

    console.log(
      `🔍 Checking proximity for ${this.trackedTasks.length} tracked tasks`
    );

    if (this.trackedTasks.length === 0) {
      console.log("📍 No tasks being tracked for location monitoring");
      return;
    }

    for (const task of this.trackedTasks) {
      // Only check proximity for pending (incomplete) tasks
      if (task.status !== "pending") {
        continue;
      }

      const distance = this.calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        task.latitude,
        task.longitude
      );

      console.log(
        `Distance to pending task "${task.title}": ${Math.round(distance)}m (range: ${task.range}m)`
      );

      // Check if user is WITHIN the specified range for pending tasks
      if (distance <= task.range) {
        console.log(
          `✅ User is near incomplete task: ${task.title} (${Math.round(distance)}m away)`
        );

        // Play sound immediately for location-based alert (if sound effects enabled)
        try {
          const soundEnabled =
            await NotificationService.areSoundEffectsEnabled();
          if (soundEnabled) {
            await NotificationService.playDirectSound();
            console.log("🔊 Played location-based task sound alert");
          }
        } catch (error) {
          console.error("Error playing location sound alert:", error);
        }

        // Send notification using the existing method signature
        await NotificationService.sendImmediateTaskNotification(
          task.title,
          {
            latitude: task.latitude,
            longitude: task.longitude,
            address: task.address || `${task.latitude}, ${task.longitude}`,
          },
          task.range
        );

        // Remove the task from monitoring after notifying to prevent spam
        this.removeTaskLocation(task.id);
      }
    }
  }

  /**
   * Start background location monitoring
   */
  private static async startLocationMonitoring() {
    try {
      // Check if user is authenticated before starting location monitoring
      if (!auth.currentUser) {
        console.log(
          "👤 User not authenticated, cannot start location monitoring"
        );
        return;
      }

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        console.error("Location permission not granted");
        return;
      }

      const { status: backgroundStatus } =
        await Location.requestBackgroundPermissionsAsync();
      if (backgroundStatus !== "granted") {
        console.error("Background location permission not granted");
        return;
      }

      // Start location updates (task is already defined at module level)
      await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 30000, // Update every 30 seconds
        distanceInterval: 50, // Update every 50 meters
        foregroundService: {
          notificationTitle: "TaskWize Location Monitoring",
          notificationBody: "Monitoring your task locations",
          notificationColor: "#4285F4",
        },
      });

      this.isMonitoring = true;
      console.log("✅ Location monitoring started");
    } catch (error) {
      console.error("Error starting location monitoring:", error);
    }
  }

  /**
   * Stop background location monitoring
   */
  private static async stopLocationMonitoring() {
    try {
      await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
      this.isMonitoring = false;
      console.log("🛑 Location monitoring stopped");
    } catch (error) {
      console.error("Error stopping location monitoring:", error);
    }
  }

  /**
   * Get current monitoring status
   */
  static getMonitoringStatus() {
    return {
      isMonitoring: this.isMonitoring,
      taskCount: this.trackedTasks.length,
      tasks: this.trackedTasks.map((task) => ({
        id: task.id,
        title: task.title,
        range: task.range,
      })),
    };
  }

  /**
   * Manual location check (for foreground use)
   */
  static async checkCurrentLocation() {
    try {
      // Check if user is authenticated before checking location
      if (!auth.currentUser) {
        console.log("👤 User not authenticated, cannot check current location");
        return;
      }

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        console.error("Location permission not granted");
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      console.log("Current location:", location.coords);

      await this.checkProximityToTasks({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
    } catch (error) {
      console.error("Error checking current location:", error);
    }
  }
}

export default LocationMonitoringService;
