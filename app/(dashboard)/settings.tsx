import { useAuth } from "@/context/AuthContext";
import { useLoader } from "@/context/LoaderContext";
import { AppPreferences, usePreferences } from "@/context/PreferencesContext";
import { useTheme } from "@/context/ThemeContext";
import { auth } from "@/firebase";
import { NotificationService } from "@/service/notificationService";
import { deleteTask, getAllTaskByUserId } from "@/service/taskService";
import { MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
} from "firebase/auth";
import React, { useState } from "react";
import {
  Alert,
  Animated,
  Linking,
  Modal,
  ScrollView,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const SettingsScreen = () => {
  const { user, logout } = useAuth();
  const { toggleDarkMode, colors } = useTheme();
  const { showLoader, hideLoader } = useLoader();
  const { preferences, updatePreference } = usePreferences();
  const router = useRouter();

  // Account Settings State
  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackSubject, setFeedbackSubject] = useState("");
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const dropdownAnimation = useState(new Animated.Value(0))[0];

  // Category options with icons
  const categoryOptions = [
    { label: "Work", value: "Work", icon: "work" },
    { label: "Personal", value: "Personal", icon: "person" },
    { label: "Shopping", value: "Shopping", icon: "shopping-cart" },
    { label: "Health", value: "Health", icon: "health-and-safety" },
    { label: "Education", value: "Education", icon: "school" },
    { label: "Finance", value: "Finance", icon: "account-balance" },
  ];

  const toggleCategoryDropdown = () => {
    const toValue = showCategoryDropdown ? 0 : 1;
    setShowCategoryDropdown(!showCategoryDropdown);

    Animated.timing(dropdownAnimation, {
      toValue,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  const closeCategoryDropdown = () => {
    if (showCategoryDropdown) {
      setShowCategoryDropdown(false);
      Animated.timing(dropdownAnimation, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }).start();
    }
  };

  // Custom updatePreference function that handles special cases
  const updatePreferenceWithSpecialHandling = async (
    key: keyof AppPreferences,
    value: any
  ) => {
    // Handle notifications specially
    if (key === "notifications") {
      try {
        if (value === false) {
          // Disable notifications - cancel all scheduled notifications
          console.log(
            "🔕 Disabling push notifications - cancelling all scheduled notifications"
          );
          await NotificationService.cancelAllNotifications();
          Alert.alert(
            "Notifications Disabled",
            "All scheduled notifications have been cancelled. You won't receive any push notifications until you re-enable this setting."
          );
        } else {
          // Enable notifications - request permissions if needed
          console.log(
            "🔔 Enabling push notifications - requesting permissions"
          );
          const hasPermission = await NotificationService.requestPermissions();
          if (!hasPermission) {
            Alert.alert(
              "Permission Required",
              "Please enable notifications in your device settings to receive push notifications."
            );
            // Don't update the preference if permission was denied
            return;
          }
          Alert.alert(
            "Notifications Enabled",
            "Push notifications are now enabled. You'll receive task reminders and alerts."
          );
        }
      } catch (error) {
        console.error("Error updating notification settings:", error);
        Alert.alert(
          "Error",
          "Failed to update notification settings. Please try again."
        );
        return;
      }
    }

    // Handle dark mode specially
    if (key === "darkMode") {
      toggleDarkMode();
    }

    // Handle sound effects specially - play preview sound when enabled
    if (key === "soundEffects" && value === true) {
      try {
        // Play a preview sound directly without notification
        await NotificationService.playDirectSound();
      } catch (error) {
        console.error("Error playing preview sound:", error);
      }
    }

    // Save the preference using context
    await updatePreference(key, value);
  };

  const reauthenticateUser = async (password: string): Promise<boolean> => {
    try {
      if (!user?.email) {
        console.error("No user email found");
        return false;
      }

      if (!auth.currentUser) {
        console.error("No current user found");
        return false;
      }

      console.log("Attempting reauthentication for:", user.email);
      const credential = EmailAuthProvider.credential(user.email, password);
      await reauthenticateWithCredential(auth.currentUser, credential);
      console.log("Reauthentication successful");
      return true;
    } catch (error: any) {
      console.error("Reauthentication failed:", error);

      // Handle specific reauthentication errors
      if (error.code === "auth/wrong-password") {
        console.error("Wrong password provided");
      } else if (error.code === "auth/too-many-requests") {
        console.error("Too many failed attempts");
      } else if (error.code === "auth/user-disabled") {
        console.error("User account disabled");
      }

      return false;
    }
  };

  const handleUpdatePassword = async () => {
    if (!newPassword || !confirmPassword) {
      Alert.alert("Error", "Please fill in all password fields.");
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert("Error", "New passwords do not match.");
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters long.");
      return;
    }

    if (!currentPassword) {
      Alert.alert("Error", "Please enter your current password.");
      return;
    }

    try {
      const isReauthenticated = await reauthenticateUser(currentPassword);
      if (!isReauthenticated) {
        Alert.alert("Error", "Current password is incorrect.");
        return;
      }

      await updatePassword(auth.currentUser!, newPassword);
      Alert.alert("Success", "Password updated successfully!");
      setIsEditingPassword(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to update password.");
    }
  };

  const handleLogout = () => {
    console.log("🔥 LOGOUT BUTTON CLICKED");
    console.log("🔥 Current user:", user);
    console.log("🔥 Logout function exists:", typeof logout);

    // Show custom confirmation modal instead of Alert.alert
    setShowLogoutConfirm(true);
  };

  const performLogout = async () => {
    try {
      console.log("🔐 Starting logout process...");
      console.log("🔐 User before logout:", user);

      // Hide the confirmation modal
      setShowLogoutConfirm(false);
      showLoader();

      // Call the logout function from AuthContext
      console.log("🔐 Calling logout from AuthContext...");
      console.log("🔐 Logout function type:", typeof logout);

      await logout();
      console.log("🔐 Logout function completed");

      console.log("🔐 Logout successful, clearing local data...");

      // Clear any local storage data
      try {
        await AsyncStorage.multiRemove(["appPreferences", "userProfile"]);
        console.log("🔐 Local storage cleared");
      } catch (storageError) {
        console.error("Storage clear error:", storageError);
        // Don't fail logout if storage clear fails
      }

      console.log("🔐 Navigating to login screen...");
      // Navigate to login screen
      router.replace("/(auth)/login");

      console.log("✅ Logout process completed successfully");
    } catch (error) {
      console.error("❌ Logout error:", error);
      console.error("❌ Error details:", (error as Error).message);
      Alert.alert("Error", "Failed to logout. Please try again.");
    } finally {
      hideLoader();
    }
  };

  const clearAppData = () => {
    Alert.alert(
      "Clear App Data",
      "This will reset all app preferences, clear local data, AND DELETE ALL YOUR TASKS from Firebase. This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear All Data",
          style: "destructive",
          onPress: async () => {
            try {
              showLoader();

              // First, delete all user tasks from Firebase
              if (user?.uid) {
                console.log("🗑️ Deleting all user tasks from Firebase...");
                const userTasks = await getAllTaskByUserId(user.uid);
                console.log(`Found ${userTasks.length} tasks to delete`);

                // Delete each task
                for (const task of userTasks) {
                  if (task.id) {
                    try {
                      await deleteTask(task.id, user.uid);
                      console.log(`✅ Deleted task: ${task.title}`);
                    } catch (error) {
                      console.error(
                        `❌ Failed to delete task ${task.id}:`,
                        error
                      );
                    }
                  }
                }

                console.log("🗑️ All tasks deleted from Firebase");
              }

              // Clear local storage
              console.log("🧹 Clearing local storage...");
              await AsyncStorage.clear();

              hideLoader();
              Alert.alert(
                "Success",
                "All app data and tasks have been permanently deleted!"
              );

              // The preferences context will automatically reload
            } catch (error) {
              hideLoader();
              console.error("Error clearing app data:", error);
              Alert.alert(
                "Error",
                "Failed to clear all app data. Please try again."
              );
            }
          },
        },
      ]
    );
  };

  const submitFeedback = async () => {
    if (!feedbackMessage.trim()) {
      Alert.alert("Error", "Please enter your feedback message.");
      return;
    }

    try {
      showLoader();

      // Prepare email data
      const emailData = {
        to: "kaifzakey22@gmail.com",
        subject: feedbackSubject.trim() || "TaskWize App Feedback",
        message: `
Feedback from TaskWize User
==========================

User Email: ${user?.email || "Not provided"}
User ID: ${user?.uid || "Not provided"}
Date: ${new Date().toISOString()}

Subject: ${feedbackSubject.trim() || "General Feedback"}

Message:
${feedbackMessage.trim()}

--
Sent from TaskWize Mobile App
        `.trim(),
      };

      // Use React Native Linking to open email app
      const emailUrl = `mailto:${emailData.to}?subject=${encodeURIComponent(emailData.subject)}&body=${encodeURIComponent(emailData.message)}`;

      const canOpen = await Linking.canOpenURL(emailUrl);
      if (canOpen) {
        await Linking.openURL(emailUrl);

        // Close modal and reset form
        setShowFeedbackModal(false);
        setFeedbackSubject("");
        setFeedbackMessage("");

        Alert.alert(
          "Thank You!",
          "Your default email app has been opened with your feedback. Please send the email to complete the submission."
        );
      } else {
        throw new Error("No email app available");
      }
    } catch (error) {
      console.error("Error submitting feedback:", error);
      Alert.alert(
        "Error",
        "Failed to open email app. You can manually send feedback to kaifzakey22@gmail.com"
      );
    } finally {
      hideLoader();
    }
  };

  const SettingItem = ({
    icon,
    title,
    subtitle,
    onPress,
    rightComponent,
  }: {
    icon: string;
    title: string;
    subtitle?: string;
    onPress?: () => void;
    rightComponent?: React.ReactNode;
  }) => (
    <TouchableOpacity
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 16,
        paddingHorizontal: 24,
        backgroundColor: colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
      }}
      onPress={onPress}
    >
      <MaterialIcons name={icon as any} size={24} color={colors.primary} />
      <View style={{ flex: 1, marginLeft: 16 }}>
        <Text
          style={{
            fontSize: 18,
            fontWeight: "600",
            color: colors.text,
          }}
        >
          {title}
        </Text>
        {subtitle && (
          <Text
            style={{
              fontSize: 14,
              color: colors.textSecondary,
              marginTop: 4,
            }}
          >
            {subtitle}
          </Text>
        )}
      </View>
      {rightComponent || (
        <MaterialIcons
          name="chevron-right"
          size={24}
          color={colors.textSecondary}
        />
      )}
    </TouchableOpacity>
  );

  const SwitchItem = ({
    icon,
    title,
    subtitle,
    value,
    onValueChange,
  }: {
    icon: string;
    title: string;
    subtitle?: string;
    value: boolean;
    onValueChange: (value: boolean) => void;
  }) => (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 16,
        paddingHorizontal: 24,
        backgroundColor: colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
      }}
    >
      <MaterialIcons name={icon as any} size={24} color={colors.primary} />
      <View style={{ flex: 1, marginLeft: 16 }}>
        <Text
          style={{
            fontSize: 18,
            fontWeight: "600",
            color: colors.text,
          }}
        >
          {title}
        </Text>
        {subtitle && (
          <Text
            style={{
              fontSize: 14,
              color: colors.textSecondary,
              marginTop: 4,
            }}
          >
            {subtitle}
          </Text>
        )}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.border, true: colors.primary }}
        thumbColor={value ? "#ffffff" : colors.surface}
      />
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView style={{ flex: 1 }} onScrollBeginDrag={closeCategoryDropdown}>
        {/* Header */}
        <View
          style={{
            backgroundColor: colors.surface,
            paddingTop: 64,
            paddingBottom: 24,
            paddingHorizontal: 24,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
          }}
        >
          <Text
            style={{
              fontSize: 30,
              fontWeight: "bold",
              color: colors.text,
              marginBottom: 8,
            }}
          >
            Settings
          </Text>
          <Text style={{ color: colors.textSecondary }}>
            Customize your TaskWize experience
          </Text>
        </View>

        {/* App Preferences Section */}
        <View style={{ marginTop: 24 }}>
          <Text
            style={{
              fontSize: 20,
              fontWeight: "bold",
              color: colors.text,
              paddingHorizontal: 24,
              marginBottom: 16,
            }}
          >
            App Preferences
          </Text>

          <SwitchItem
            icon="notifications"
            title="Push Notifications"
            subtitle="Receive task reminders and updates"
            value={preferences.notifications}
            onValueChange={(value) =>
              updatePreferenceWithSpecialHandling("notifications", value)
            }
          />

          <SwitchItem
            icon="location-on"
            title="Location Services"
            subtitle="Enable location-based task features"
            value={preferences.locationServices}
            onValueChange={(value) =>
              updatePreference("locationServices", value)
            }
          />

          <SwitchItem
            icon="dark-mode"
            title="Dark Mode"
            subtitle="Switch to dark theme"
            value={preferences.darkMode}
            onValueChange={(value) =>
              updatePreferenceWithSpecialHandling("darkMode", value)
            }
          />

          <SwitchItem
            icon="volume-up"
            title="Sound Effects"
            subtitle="Play sounds for app interactions"
            value={preferences.soundEffects}
            onValueChange={(value) =>
              updatePreferenceWithSpecialHandling("soundEffects", value)
            }
          />
        </View>

        {/* Task Preferences Section */}
        <View style={{ marginTop: 32 }}>
          <Text
            style={{
              fontSize: 20,
              fontWeight: "bold",
              color: colors.text,
              paddingHorizontal: 24,
              marginBottom: 16,
            }}
          >
            Task Preferences
          </Text>

          <SettingItem
            icon="category"
            title="Default Task Category"
            subtitle={`Currently: ${preferences.defaultTaskCategory}`}
            onPress={toggleCategoryDropdown}
            rightComponent={
              <MaterialIcons
                name={
                  showCategoryDropdown
                    ? "keyboard-arrow-up"
                    : "keyboard-arrow-down"
                }
                size={24}
                color={colors.textSecondary}
              />
            }
          />

          {/* Category Dropdown with Animation */}
          <Animated.View
            style={{
              height: dropdownAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [0, categoryOptions.length * 60],
              }),
              opacity: dropdownAnimation,
              overflow: "hidden",
            }}
          >
            <View
              style={{
                backgroundColor: colors.surface,
                marginHorizontal: 24,
                marginTop: 8,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: colors.border,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
                elevation: 3,
                overflow: "hidden",
              }}
            >
              {categoryOptions.map((category, index) => (
                <TouchableOpacity
                  key={category.value}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    padding: 16,
                    borderBottomWidth:
                      index < categoryOptions.length - 1 ? 1 : 0,
                    borderBottomColor: colors.border,
                    backgroundColor:
                      preferences.defaultTaskCategory === category.value
                        ? `${colors.primary}15`
                        : "transparent",
                  }}
                  onPress={() => {
                    updatePreference("defaultTaskCategory", category.value);
                    toggleCategoryDropdown();
                  }}
                  activeOpacity={0.7}
                >
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      backgroundColor:
                        preferences.defaultTaskCategory === category.value
                          ? `${colors.primary}20`
                          : `${colors.textSecondary}10`,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <MaterialIcons
                      name={category.icon as any}
                      size={20}
                      color={
                        preferences.defaultTaskCategory === category.value
                          ? colors.primary
                          : colors.textSecondary
                      }
                    />
                  </View>
                  <Text
                    style={{
                      marginLeft: 12,
                      fontSize: 16,
                      color:
                        preferences.defaultTaskCategory === category.value
                          ? colors.primary
                          : colors.text,
                      fontWeight:
                        preferences.defaultTaskCategory === category.value
                          ? "600"
                          : "400",
                      flex: 1,
                    }}
                  >
                    {category.label}
                  </Text>
                  {preferences.defaultTaskCategory === category.value && (
                    <View
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: 12,
                        backgroundColor: colors.primary,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <MaterialIcons name="check" size={16} color="white" />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>
        </View>

        {/* Account Section */}
        <View style={{ marginTop: 32 }}>
          <Text
            style={{
              fontSize: 20,
              fontWeight: "bold",
              color: colors.text,
              paddingHorizontal: 24,
              marginBottom: 16,
            }}
          >
            Account Settings
          </Text>

          <SettingItem
            icon="lock"
            title="Change Password"
            subtitle="Update your account password"
            onPress={() => setIsEditingPassword(true)}
          />

          <SettingItem
            icon="person"
            title="Profile"
            subtitle="Manage your profile information"
            onPress={() => router.push("/(dashboard)/profile")}
          />
        </View>

        {/* Data & Privacy Section */}
        <View className="mt-8">
          <Text className="text-xl font-bold text-gray-900 px-6 mb-4">
            Data & Privacy
          </Text>

          <SettingItem
            icon="delete-forever"
            title="Clear App Data"
            subtitle="Reset preferences, clear local data, and delete all tasks"
            onPress={clearAppData}
          />
        </View>

        {/* Support Section */}
        <View className="mt-8">
          <Text className="text-xl font-bold text-gray-900 px-6 mb-4">
            Support & About
          </Text>

          <SettingItem
            icon="help"
            title="Help & FAQ"
            subtitle="Get help and find answers"
            onPress={() =>
              Alert.alert(
                "Help",
                "For support, please contact us at support@taskwize.com"
              )
            }
          />

          <SettingItem
            icon="feedback"
            title="Send Feedback"
            subtitle="Help us improve TaskWize"
            onPress={() => setShowFeedbackModal(true)}
          />

          <SettingItem
            icon="info"
            title="About TaskWize"
            subtitle="Version 1.0.0"
            onPress={() =>
              Alert.alert(
                "About TaskWize",
                "TaskWize v1.0.0\n\nA smart location-based task management app built with React Native and Firebase.\n\n© 2025 TaskWize Team"
              )
            }
          />

          <SettingItem
            icon="policy"
            title="Privacy Policy"
            subtitle="Read our privacy policy"
            onPress={() =>
              Alert.alert(
                "Privacy Policy",
                "Your privacy is important to us. We collect and use your data only to provide and improve our services."
              )
            }
          />
        </View>

        {/* Logout Section */}
        <View className="mt-8 mb-8">
          <TouchableOpacity
            className="mx-6 py-4 bg-red-500 rounded-lg items-center"
            onPress={handleLogout}
          >
            <Text className="text-white text-lg font-semibold">Logout</Text>
          </TouchableOpacity>
        </View>

        {/* Password Update Modal */}
        <Modal
          visible={isEditingPassword}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setIsEditingPassword(false)}
        >
          <View className="flex-1 justify-center items-center bg-black/50">
            <View className="bg-white m-6 p-6 rounded-lg w-11/12">
              <Text className="text-2xl font-bold text-gray-900 mb-4">
                Update Password
              </Text>

              <TextInput
                className="border border-gray-300 rounded-lg px-4 py-3 mb-4 text-base"
                placeholder="Current Password"
                value={currentPassword}
                onChangeText={setCurrentPassword}
                secureTextEntry
              />

              <TextInput
                className="border border-gray-300 rounded-lg px-4 py-3 mb-4 text-base"
                placeholder="New Password"
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
              />

              <TextInput
                className="border border-gray-300 rounded-lg px-4 py-3 mb-6 text-base"
                placeholder="Confirm New Password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
              />

              <View className="flex-row gap-3">
                <TouchableOpacity
                  className="flex-1 py-3 bg-gray-200 rounded-lg items-center"
                  onPress={() => {
                    setIsEditingPassword(false);
                    setCurrentPassword("");
                    setNewPassword("");
                    setConfirmPassword("");
                  }}
                >
                  <Text className="text-gray-700 font-semibold">Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  className="flex-1 py-3 bg-blue-500 rounded-lg items-center"
                  onPress={handleUpdatePassword}
                >
                  <Text className="text-white font-semibold">
                    Update Password
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </ScrollView>

      {/* Logout Confirmation Modal */}
      <Modal
        visible={showLogoutConfirm}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowLogoutConfirm(false)}
      >
        <View className="flex-1 bg-black/50 justify-center items-center">
          <View className="bg-white rounded-xl mx-6 p-6 shadow-lg">
            <Text className="text-xl font-bold text-gray-800 mb-3 text-center">
              Confirm Logout
            </Text>
            <Text className="text-gray-600 mb-6 text-center leading-5">
              Are you sure you want to logout? You&apos;ll need to sign in again
              to access your tasks.
            </Text>
            <View className="flex-row justify-center space-x-4">
              <TouchableOpacity
                className="flex-1 px-4 py-3 bg-gray-200 rounded-lg mr-2"
                onPress={() => setShowLogoutConfirm(false)}
              >
                <Text className="text-gray-700 font-semibold text-center">
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 px-4 py-3 bg-red-500 rounded-lg ml-2"
                onPress={performLogout}
              >
                <Text className="text-white font-semibold text-center">
                  Logout
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Feedback Modal */}
      <Modal
        visible={showFeedbackModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowFeedbackModal(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            justifyContent: "center",
            alignItems: "center",
            padding: 20,
          }}
        >
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: 12,
              padding: 24,
              width: "100%",
              maxWidth: 500,
              maxHeight: "80%",
            }}
          >
            <Text
              style={{
                fontSize: 20,
                fontWeight: "bold",
                color: colors.text,
                marginBottom: 8,
                textAlign: "center",
              }}
            >
              Send Feedback
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: colors.textSecondary,
                marginBottom: 20,
                textAlign: "center",
              }}
            >
              Help us improve TaskWize with your suggestions and feedback
            </Text>

            <Text
              style={{
                fontSize: 16,
                fontWeight: "500",
                color: colors.text,
                marginBottom: 8,
              }}
            >
              Subject (optional)
            </Text>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 8,
                paddingHorizontal: 16,
                paddingVertical: 12,
                fontSize: 16,
                backgroundColor: colors.background,
                color: colors.text,
                marginBottom: 16,
              }}
              value={feedbackSubject}
              onChangeText={setFeedbackSubject}
              placeholder="e.g., Bug Report, Feature Request, General Feedback"
              placeholderTextColor={colors.textSecondary}
            />

            <Text
              style={{
                fontSize: 16,
                fontWeight: "500",
                color: colors.text,
                marginBottom: 8,
              }}
            >
              Your Feedback *
            </Text>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 8,
                paddingHorizontal: 16,
                paddingVertical: 12,
                fontSize: 16,
                backgroundColor: colors.background,
                color: colors.text,
                height: 120,
                textAlignVertical: "top",
                marginBottom: 20,
              }}
              value={feedbackMessage}
              onChangeText={setFeedbackMessage}
              placeholder="Tell us what you think about TaskWize. What features would you like to see? Any bugs or issues? We'd love to hear from you!"
              placeholderTextColor={colors.textSecondary}
              multiline
            />

            <View
              style={{ flexDirection: "row", justifyContent: "space-between" }}
            >
              <TouchableOpacity
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  paddingHorizontal: 20,
                  backgroundColor: colors.border,
                  borderRadius: 8,
                  marginRight: 10,
                }}
                onPress={() => {
                  setShowFeedbackModal(false);
                  setFeedbackSubject("");
                  setFeedbackMessage("");
                }}
              >
                <Text
                  style={{
                    color: colors.text,
                    fontSize: 16,
                    fontWeight: "600",
                    textAlign: "center",
                  }}
                >
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  paddingHorizontal: 20,
                  backgroundColor: colors.primary,
                  borderRadius: 8,
                  marginLeft: 10,
                }}
                onPress={submitFeedback}
              >
                <Text
                  style={{
                    color: "white",
                    fontSize: 16,
                    fontWeight: "600",
                    textAlign: "center",
                  }}
                >
                  Send Feedback
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default SettingsScreen;
