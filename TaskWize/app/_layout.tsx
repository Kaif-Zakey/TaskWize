import React, { useEffect } from "react";
import "./../global.css";
import { Slot } from "expo-router";
import { AuthProvider } from "@/context/AuthContext";
import { LoaderProvider } from "@/context/LoaderContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { NotificationService } from "@/service/notificationService";
import LocationMonitoringService from "@/service/locationMonitoringService";

const RootLayout = () => {
  useEffect(() => {
    // Request notification permissions on app startup
    const setupNotifications = async () => {
      try {
        const hasPermission = await NotificationService.requestPermissions();
        console.log(
          "Notification permissions:",
          hasPermission ? "granted" : "denied"
        );
      } catch (error) {
        console.error("Error setting up notifications:", error);
      }
    };

    // Initialize location monitoring service
    const setupLocationMonitoring = async () => {
      try {
        const initialized = await LocationMonitoringService.initialize();
        if (initialized) {
          console.log("✅ Location monitoring service initialized");
        } else {
          console.log(
            "⚠️ Location monitoring service could not be initialized"
          );
        }
      } catch (error) {
        console.error("❌ Error setting up location monitoring:", error);
      }
    };

    setupNotifications();
    setupLocationMonitoring();

    // Setup notification listeners
    const cleanup = NotificationService.setupNotificationListeners();

    return cleanup;
  }, []);

  return (
    <ThemeProvider>
      <LoaderProvider>
        <AuthProvider>
          <Slot />
        </AuthProvider>
      </LoaderProvider>
    </ThemeProvider>
  );
};

export default RootLayout;
