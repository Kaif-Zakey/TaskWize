import { auth } from "@/firebase";
import * as Location from "expo-location";
import * as Notifications from "expo-notifications";
import { NotificationService } from "./notificationService";

class LocationMonitoringService {
  private static isInitialized = false;
  private static isMonitoring = false;
  private static monitoringInterval: ReturnType<typeof setInterval> | null =
    null;
  private static lastNotifiedTasks: Set<string> = new Set();

  static async initialize(): Promise<boolean> {
    if (!auth.currentUser) return false;

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return false;

      await Location.requestBackgroundPermissionsAsync();
      this.isInitialized = true;
      return true;
    } catch {
      return false;
    }
  }

  static async startLocationMonitoring(): Promise<void> {
    if (!this.isInitialized || this.isMonitoring) return;

    this.monitoringInterval = setInterval(async () => {
      await this.checkLocationAndTasks();
    }, 60000);

    this.isMonitoring = true;
  }

  static stopLocationMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    this.isMonitoring = false;
    this.lastNotifiedTasks.clear();
  }

  private static async checkLocationAndTasks(): Promise<void> {
    try {
      if (!auth.currentUser) {
        this.stopLocationMonitoring();
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const incompleteTasks = await this.getIncompleteTasksWithLocation();

      for (const task of incompleteTasks) {
        await this.checkProximityToTask(location.coords, task);
      }
    } catch (error) {
      console.error("Location check error:", error);
    }
  }

  private static async getIncompleteTasksWithLocation(): Promise<any[]> {
    try {
      const { getAllTaskByUserId } = await import("./taskService");
      if (!auth.currentUser) return [];

      const allTasks = await getAllTaskByUserId(auth.currentUser.uid);
      return allTasks.filter(
        (task) =>
          task.status === "pending" &&
          task.location &&
          task.notifyOnLocation &&
          task.location.latitude &&
          task.location.longitude
      );
    } catch {
      return [];
    }
  }

  private static async checkProximityToTask(
    userCoords: any,
    task: any
  ): Promise<void> {
    const distance = this.calculateDistance(
      userCoords.latitude,
      userCoords.longitude,
      task.location.latitude,
      task.location.longitude
    );

    const taskRange = task.location.range || 100;

    if (distance <= taskRange && !this.lastNotifiedTasks.has(task.id)) {
      await this.sendLocationNotification(task, distance);
      this.lastNotifiedTasks.add(task.id);
      setTimeout(() => this.lastNotifiedTasks.delete(task.id), 300000);
    }
  }

  private static async sendLocationNotification(
    task: any,
    distance: number
  ): Promise<void> {
    try {
      const soundEnabled = await NotificationService.areSoundEffectsEnabled();
      if (soundEnabled) {
        await NotificationService.playDirectSound();
      }

      await Notifications.scheduleNotificationAsync({
        content: {
          title: "📍 Task Location Alert",
          body: `You're near "${task.title}" (${Math.round(distance)}m away)`,
          data: { taskId: task.id, type: "location-proximity" },
          sound: soundEnabled ? "notification.wav" : undefined,
        },
        trigger: null,
      });
    } catch (error) {
      console.error("Notification error:", error);
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

  static handleUserLogout(): void {
    this.stopLocationMonitoring();
    this.isInitialized = false;
    this.lastNotifiedTasks.clear();
  }
}

export default LocationMonitoringService;
