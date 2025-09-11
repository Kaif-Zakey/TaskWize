import { Location as TaskLocation } from "@/types/task";
import * as Location from "expo-location";
import * as Notifications from "expo-notifications";
import { NotificationService } from "./notificationService";

export class LocationService {
  private static instance: LocationService;
  private watchSubscription: Location.LocationSubscription | null = null;
  private currentLocation: Location.LocationObject | null = null;

  public static getInstance(): LocationService {
    if (!LocationService.instance) {
      LocationService.instance = new LocationService();
    }
    return LocationService.instance;
  }

  /**
   * Request location permissions
   */
  async requestPermissions(): Promise<boolean> {
    try {
      const { status: foregroundStatus } =
        await Location.requestForegroundPermissionsAsync();

      if (foregroundStatus !== "granted") {
        console.log("Foreground location permission not granted");
        return false;
      }

      // Request background permission for location-based notifications
      const { status: backgroundStatus } =
        await Location.requestBackgroundPermissionsAsync();

      if (backgroundStatus !== "granted") {
        console.log("Background location permission not granted");
        // We can still work with foreground permissions
      }

      // Request notification permissions
      const notificationStatus = await Notifications.requestPermissionsAsync();
      if (notificationStatus.status !== "granted") {
        console.log("Notification permission not granted");
      }

      return true;
    } catch (error) {
      console.error("Error requesting permissions:", error);
      return false;
    }
  }

  /**
   * Get current location
   */
  async getCurrentLocation(): Promise<Location.LocationObject | null> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        return null;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      this.currentLocation = location;
      return location;
    } catch (error) {
      console.error("Error getting current location:", error);
      return null;
    }
  }

  /**
   * Reverse geocode coordinates to get address
   */
  async reverseGeocode(
    latitude: number,
    longitude: number
  ): Promise<string | null> {
    try {
      const results = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      if (results.length > 0) {
        const result = results[0];
        return [result.street, result.city, result.region, result.country]
          .filter(Boolean)
          .join(", ");
      }

      return null;
    } catch (error) {
      console.error("Error reverse geocoding:", error);
      return null;
    }
  }

  /**
   * Forward geocode address to get coordinates
   */
  async geocodeAddress(address: string): Promise<TaskLocation | null> {
    try {
      const results = await Location.geocodeAsync(address);

      if (results.length > 0) {
        const result = results[0];
        return {
          latitude: result.latitude,
          longitude: result.longitude,
          address,
        };
      }

      return null;
    } catch (error) {
      console.error("Error geocoding address:", error);
      return null;
    }
  }

  /**
   * Calculate distance between two coordinates (in meters)
   */
  calculateDistance(
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
   * Start watching location for task notifications
   */
  async startLocationTracking(
    tasks: {
      id: string;
      location: TaskLocation;
      title: string;
      notifyOnLocation?: boolean;
    }[],
    notificationRadius: number = 100 // meters
  ): Promise<void> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        return;
      }

      // Stop existing subscription
      if (this.watchSubscription) {
        this.watchSubscription.remove();
      }

      this.watchSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 30000, // Check every 30 seconds
          distanceInterval: 50, // Check when moved 50 meters
        },
        (location) => {
          this.currentLocation = location;
          this.checkTaskProximity(tasks, location, notificationRadius);
        }
      );
    } catch (error) {
      console.error("Error starting location tracking:", error);
    }
  }

  /**
   * Stop location tracking
   */
  stopLocationTracking(): void {
    if (this.watchSubscription) {
      this.watchSubscription.remove();
      this.watchSubscription = null;
    }
  }

  /**
   * Check if user is near any task locations and send notifications
   */
  private async checkTaskProximity(
    tasks: {
      id: string;
      location: TaskLocation;
      title: string;
      notifyOnLocation?: boolean;
    }[],
    currentLocation: Location.LocationObject,
    radius: number
  ): Promise<void> {
    const { latitude, longitude } = currentLocation.coords;

    for (const task of tasks) {
      if (!task.notifyOnLocation || !task.location) {
        continue;
      }

      const distance = this.calculateDistance(
        latitude,
        longitude,
        task.location.latitude,
        task.location.longitude
      );

      if (distance <= radius) {
        await this.sendLocationNotification(task);
      }
    }
  }

  /**
   * Send notification when near task location
   */
  private async sendLocationNotification(task: {
    id: string;
    title: string;
    location: TaskLocation;
  }): Promise<void> {
    try {
      // Check if sound effects are enabled
      const soundEffectsEnabled =
        await NotificationService.areSoundEffectsEnabled();

      // Prepare notification content
      const notificationContent: any = {
        title: "TaskWize Reminder",
        body: `You're near: ${task.title}`,
        subtitle: task.location.name || task.location.address,
        data: { taskId: task.id },
      };

      // Add sound only if sound effects are enabled
      if (soundEffectsEnabled) {
        notificationContent.sound = "notification.wav";
      }

      await Notifications.scheduleNotificationAsync({
        content: notificationContent,
        trigger: null, // Send immediately
      });
    } catch (error) {
      console.error("Error sending notification:", error);
    }
  }

  /**
   * Get current location coordinates
   */
  getCurrentCoordinates(): { latitude: number; longitude: number } | null {
    if (!this.currentLocation) {
      return null;
    }

    return {
      latitude: this.currentLocation.coords.latitude,
      longitude: this.currentLocation.coords.longitude,
    };
  }
}

export default LocationService.getInstance();
