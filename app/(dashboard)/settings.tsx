import { useAuth } from "@/context/AuthContext";
import { useLoader } from "@/context/LoaderContext";
import { AppPreferences, usePreferences } from "@/context/PreferencesContext";
import { useTheme } from "@/context/ThemeContext";
import { auth } from "@/firebase";
import { NotificationService } from "@/service/notificationService";
import { deleteTask, getAllTaskByUserId } from "@/service/taskService";
import { MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Clipboard from "@react-native-clipboard/clipboard";
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
  Keyboard,
  Linking,
  Modal,
  ScrollView,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
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
          await NotificationService.cancelAllNotifications();
          Alert.alert(
            "Notifications Disabled",
            "All scheduled notifications have been cancelled. You won't receive any push notifications until you re-enable this setting."
          );
        } else {
          // Enable notifications - request permissions if needed
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
      } catch {
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
      } catch {
        // Sound playback failed
      }
    }

    // Save the preference using context
    await updatePreference(key, value);
  };

  const reauthenticateUser = async (password: string): Promise<boolean> => {
    try {
      if (!user?.email) {
        return false;
      }

      if (!auth.currentUser) {
        return false;
      }

      const credential = EmailAuthProvider.credential(user.email, password);
      await reauthenticateWithCredential(auth.currentUser, credential);
      return true;
    } catch (error: any) {
      // Handle specific reauthentication errors
      if (error.code === "auth/wrong-password") {
        // Wrong password provided
      } else if (error.code === "auth/too-many-requests") {
        // Too many failed attempts
      } else if (error.code === "auth/user-disabled") {
        // User account disabled
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
    // Show custom confirmation modal instead of Alert.alert
    setShowLogoutConfirm(true);
  };

  const performLogout = async () => {
    try {
      // Hide the confirmation modal
      setShowLogoutConfirm(false);
      showLoader();

      // Call the logout function from AuthContext
      await logout();

      // Clear any local storage data
      try {
        await AsyncStorage.multiRemove(["appPreferences", "userProfile"]);
      } catch {
        // Don't fail logout if storage clear fails
      }

      // Navigate to login screen
      router.replace("/(auth)/login");
    } catch {
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
                const userTasks = await getAllTaskByUserId(user.uid);

                // Delete each task
                for (const task of userTasks) {
                  if (task.id) {
                    try {
                      await deleteTask(task.id, user.uid);
                    } catch {
                      // Failed to delete task, continue with others
                    }
                  }
                }
              }

              // Clear local storage
              await AsyncStorage.clear();

              hideLoader();
              Alert.alert(
                "Success",
                "All app data and tasks have been permanently deleted!"
              );

              // The preferences context will automatically reload
            } catch {
              hideLoader();
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

    // Dismiss keyboard before proceeding
    Keyboard.dismiss();

    try {
      showLoader();

      // Create email data with multiple fallback strategies
      const subject = feedbackSubject.trim() || "TaskWize App Feedback";
      const userEmail = user?.email || "Not provided";
      const currentDate = new Date().toLocaleDateString();

      // Try multiple email approaches for better compatibility
      const approaches = [
        // Approach 1: Simple email with minimal content
        {
          name: "Simple",
          url: `mailto:kaifzakey22@gmail.com?subject=${encodeURIComponent(
            subject
          )}`,
        },
        // Approach 2: Email with body content
        {
          name: "WithBody",
          url: `mailto:kaifzakey22@gmail.com?subject=${encodeURIComponent(
            subject
          )}&body=${encodeURIComponent(
            `Feedback: ${feedbackMessage.trim()}\n\nFrom: ${userEmail}\nDate: ${currentDate}`
          )}`,
        },
        // Approach 3: Just the email address
        {
          name: "AddressOnly",
          url: "mailto:kaifzakey22@gmail.com",
        },
      ];

      let emailOpened = false;

      // Try each approach until one works
      for (const approach of approaches) {
        try {
          const canOpen = await Linking.canOpenURL(approach.url);
          if (canOpen) {
            await Linking.openURL(approach.url);
            emailOpened = true;
            break;
          }
        } catch {
          // Try next approach
          continue;
        }
      }

      if (emailOpened) {
        // Close modal and reset form
        setShowFeedbackModal(false);
        setFeedbackSubject("");
        setFeedbackMessage("");

        Alert.alert(
          "Email App Opened",
          "Your email app has been opened. Please complete your feedback and send the email to kaifzakey22@gmail.com"
        );
      } else {
        throw new Error("Cannot open email app");
      }
    } catch {
      // Show alternative options with multiple choices
      Alert.alert(
        "Email App Not Available",
        "Unable to open email app. Choose an alternative:",
        [
          {
            text: "Copy to Clipboard",
            onPress: () => copyFeedbackToClipboard(),
          },
          {
            text: "Show Feedback Text",
            onPress: () => showFeedbackText(),
          },
          {
            text: "Cancel",
            style: "cancel",
          },
        ]
      );
    } finally {
      hideLoader();
    }
  };

  const copyFeedbackToClipboard = async () => {
    try {
      const feedbackText = `TaskWize App Feedback

Subject: ${feedbackSubject.trim() || "General Feedback"}

Message:
${feedbackMessage.trim()}

User: ${user?.email || "Not provided"}
Date: ${new Date().toLocaleDateString()}

Please send this feedback to: kaifzakey22@gmail.com`;

      // Copy to clipboard using the installed package
      await Clipboard.setString(feedbackText);

      Alert.alert(
        "Copied to Clipboard",
        "Your feedback has been copied to clipboard. You can now paste it in any email app or messaging platform to send to kaifzakey22@gmail.com",
        [
          {
            text: "OK",
            onPress: () => {
              setShowFeedbackModal(false);
              setFeedbackSubject("");
              setFeedbackMessage("");
            },
          },
        ]
      );
    } catch {
      // Fallback if clipboard fails
      showFeedbackText();
    }
  };

  const showFeedbackText = () => {
    const feedbackText = `TaskWize App Feedback

Subject: ${feedbackSubject.trim() || "General Feedback"}

Message: ${feedbackMessage.trim()}

User: ${user?.email || "Not provided"}
Date: ${new Date().toLocaleDateString()}

Send to: kaifzakey22@gmail.com`;

    Alert.alert("Your Feedback", feedbackText, [
      {
        text: "Close",
        onPress: () => {
          setShowFeedbackModal(false);
          setFeedbackSubject("");
          setFeedbackMessage("");
        },
      },
    ]);
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
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View
            style={{
              flex: 1,
              backgroundColor: "rgba(0, 0, 0, 0.5)",
              justifyContent: "center",
              alignItems: "center",
              padding: 24,
            }}
          >
            <TouchableWithoutFeedback onPress={() => {}}>
              <View
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: 16,
                  padding: 24,
                  width: "100%",
                  maxWidth: 450,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 8,
                }}
              >
                {/* Header */}
                <View style={{ alignItems: "center", marginBottom: 24 }}>
                  <MaterialIcons
                    name="feedback"
                    size={32}
                    color={colors.primary}
                    style={{ marginBottom: 8 }}
                  />
                  <Text
                    style={{
                      fontSize: 22,
                      fontWeight: "bold",
                      color: colors.text,
                      marginBottom: 4,
                    }}
                  >
                    Send Feedback
                  </Text>
                  <Text
                    style={{
                      fontSize: 14,
                      color: colors.textSecondary,
                      textAlign: "center",
                      lineHeight: 20,
                    }}
                  >
                    Help us improve TaskWize with your suggestions
                  </Text>
                </View>

                {/* Subject Input */}
                <View style={{ marginBottom: 20 }}>
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: "600",
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
                      borderRadius: 12,
                      paddingHorizontal: 16,
                      paddingVertical: 14,
                      fontSize: 16,
                      backgroundColor: colors.background,
                      color: colors.text,
                    }}
                    value={feedbackSubject}
                    onChangeText={setFeedbackSubject}
                    placeholder="e.g., Bug Report, Feature Request"
                    placeholderTextColor={colors.textSecondary}
                    returnKeyType="next"
                    onSubmitEditing={() => {
                      // Focus on the message input when subject is done
                    }}
                  />
                </View>

                {/* Message Input */}
                <View style={{ marginBottom: 24 }}>
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: "600",
                      color: colors.text,
                      marginBottom: 8,
                    }}
                  >
                    Your Feedback{" "}
                    <Text style={{ color: colors.primary }}>*</Text>
                  </Text>
                  <TextInput
                    style={{
                      borderWidth: 1,
                      borderColor: feedbackMessage.trim()
                        ? colors.primary
                        : colors.border,
                      borderRadius: 12,
                      paddingHorizontal: 16,
                      paddingVertical: 14,
                      fontSize: 16,
                      backgroundColor: colors.background,
                      color: colors.text,
                      height: 120,
                      textAlignVertical: "top",
                    }}
                    value={feedbackMessage}
                    onChangeText={setFeedbackMessage}
                    placeholder="Tell us what you think about TaskWize. What features would you like to see? Any bugs or issues?"
                    placeholderTextColor={colors.textSecondary}
                    multiline
                    returnKeyType="done"
                    onSubmitEditing={() => {
                      if (feedbackMessage.trim()) {
                        Keyboard.dismiss();
                      }
                    }}
                  />
                </View>

                {/* Help Text */}
                <View style={{ marginBottom: 24 }}>
                  <Text
                    style={{
                      fontSize: 12,
                      color: colors.textSecondary,
                      textAlign: "center",
                      fontStyle: "italic",
                    }}
                  >
                    We&apos;ll try to open your email app, or provide copy
                    options if not available
                  </Text>
                </View>

                {/* Action Buttons */}
                <View style={{ flexDirection: "row", gap: 12 }}>
                  <TouchableOpacity
                    style={{
                      flex: 1,
                      paddingVertical: 14,
                      backgroundColor: colors.border,
                      borderRadius: 12,
                      alignItems: "center",
                    }}
                    onPress={() => {
                      Keyboard.dismiss();
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
                      }}
                    >
                      Cancel
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={{
                      flex: 1,
                      paddingVertical: 14,
                      backgroundColor: feedbackMessage.trim()
                        ? colors.primary
                        : colors.border,
                      borderRadius: 12,
                      alignItems: "center",
                      opacity: feedbackMessage.trim() ? 1 : 0.6,
                    }}
                    onPress={submitFeedback}
                    disabled={!feedbackMessage.trim()}
                  >
                    <Text
                      style={{
                        color: feedbackMessage.trim()
                          ? "white"
                          : colors.textSecondary,
                        fontSize: 16,
                        fontWeight: "600",
                      }}
                    >
                      Send Feedback
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};

export default SettingsScreen;
