import { AuthProvider } from "@/context/AuthContext";
import { LoaderProvider } from "@/context/LoaderContext";
import { PreferencesProvider } from "@/context/PreferencesContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { NotificationService } from "@/service/notificationService";
import * as Notifications from "expo-notifications";
import { Slot } from "expo-router";
import React, { useEffect } from "react";
import { Platform } from "react-native";
import "./../global.css";

const RootLayout = () => {
  useEffect(() => {
    // Setup Android notification channel
    const setupAndroidNotifications = async () => {
      if (Platform.OS === "android") {
        try {
          await Notifications.setNotificationChannelAsync("default", {
            name: "TaskWize Notifications",
            importance: Notifications.AndroidImportance.HIGH,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: "#4285F4",
            sound: "notification.wav",
          });
          console.log("✅ Android notification channel created");
        } catch (error) {
          console.error(
            "❌ Error creating Android notification channel:",
            error
          );
        }
      }
    };

    // Request notification permissions on app startup
    const setupNotifications = async () => {
      try {
        // Setup Android channel first
        await setupAndroidNotifications();

        const hasPermission = await NotificationService.requestPermissions();
        console.log(
          "Notification permissions:",
          hasPermission ? "granted" : "denied"
        );
      } catch (error) {
        console.error("Error setting up notifications:", error);
      }
    };

    setupNotifications();

    // Setup notification listeners
    const notificationCleanup =
      NotificationService.setupNotificationListeners();

    return () => {
      notificationCleanup();
    };
  }, []);

  return (
    <ThemeProvider>
      <LoaderProvider>
        <PreferencesProvider>
          <AuthProvider>
            <Slot />
          </AuthProvider>
        </PreferencesProvider>
      </LoaderProvider>
    </ThemeProvider>
  );
};

export default RootLayout;
