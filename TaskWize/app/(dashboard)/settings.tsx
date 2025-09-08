import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
  Modal,
  TextInput,
} from "react-native";
import React, { useState, useEffect } from "react";
import { MaterialIcons } from "@expo/vector-icons";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { useLoader } from "@/context/LoaderContext";
import { useRouter } from "expo-router";
import {
  updatePassword,
  updateEmail,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from "firebase/auth";
import { auth } from "@/firebase";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface AppPreferences {
  notifications: boolean;
  locationServices: boolean;
  autoSync: boolean;
  darkMode: boolean;
  soundEffects: boolean;
  taskReminders: boolean;
  weeklyReports: boolean;
  priorityAlerts: boolean;
  defaultTaskCategory: string;
  defaultPriority: string;
  reminderTime: string;
}

const SettingsScreen = () => {
  const { user, logout } = useAuth();
  const { isDarkMode, toggleDarkMode, colors } = useTheme();
  const { showLoader, hideLoader } = useLoader();
  const router = useRouter();

  // App Preferences State
  const [preferences, setPreferences] = useState<AppPreferences>({
    notifications: true,
    locationServices: true,
    autoSync: true,
    darkMode: false,
    soundEffects: true,
    taskReminders: true,
    weeklyReports: false,
    priorityAlerts: true,
    defaultTaskCategory: "Work",
    defaultPriority: "Medium",
    reminderTime: "09:00",
  });

  // Account Settings State
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    loadPreferences();
    setNewEmail(user?.email || "");
  }, [user]);

  useEffect(() => {
    // Sync the theme context with preferences
    setPreferences((prev) => ({
      ...prev,
      darkMode: isDarkMode,
    }));
  }, [isDarkMode]);

  const loadPreferences = async () => {
    try {
      const savedPreferences = await AsyncStorage.getItem("appPreferences");
      if (savedPreferences) {
        setPreferences(JSON.parse(savedPreferences));
      }
    } catch (error) {
      console.error("Error loading preferences:", error);
    }
  };

  const savePreferences = async (newPreferences: AppPreferences) => {
    try {
      await AsyncStorage.setItem(
        "appPreferences",
        JSON.stringify(newPreferences)
      );
      setPreferences(newPreferences);
    } catch (error) {
      console.error("Error saving preferences:", error);
    }
  };

  const updatePreference = (key: keyof AppPreferences, value: any) => {
    const newPreferences = { ...preferences, [key]: value };
    savePreferences(newPreferences);

    // Handle dark mode specially
    if (key === "darkMode") {
      toggleDarkMode();
    }
  };

  const reauthenticateUser = async (password: string): Promise<boolean> => {
    try {
      if (!user?.email) return false;
      const credential = EmailAuthProvider.credential(user.email, password);
      await reauthenticateWithCredential(auth.currentUser!, credential);
      return true;
    } catch (error) {
      console.error("Reauthentication failed:", error);
      return false;
    }
  };

  const handleUpdateEmail = async () => {
    if (!newEmail.trim()) {
      Alert.alert("Error", "Please enter a valid email address.");
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

      await updateEmail(auth.currentUser!, newEmail);
      Alert.alert("Success", "Email updated successfully!");
      setIsEditingEmail(false);
      setCurrentPassword("");
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to update email.");
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
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          try {
            showLoader();
            await logout();
            // Navigate to login screen
            router.replace("/(auth)/login");
          } catch (error) {
            console.error("Logout error:", error);
            Alert.alert("Error", "Failed to logout. Please try again.");
          } finally {
            hideLoader();
          }
        },
      },
    ]);
  };

  const clearAppData = () => {
    Alert.alert(
      "Clear App Data",
      "This will reset all app preferences and clear local data. This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear Data",
          style: "destructive",
          onPress: async () => {
            try {
              await AsyncStorage.clear();
              Alert.alert("Success", "App data cleared successfully!");
              loadPreferences(); // Reset to defaults
            } catch (error) {
              console.error("Error clearing app data:", error);
              Alert.alert("Error", "Failed to clear app data.");
            }
          },
        },
      ]
    );
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
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }}>
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
          onValueChange={(value) => updatePreference("notifications", value)}
        />

        <SwitchItem
          icon="location-on"
          title="Location Services"
          subtitle="Enable location-based task features"
          value={preferences.locationServices}
          onValueChange={(value) => updatePreference("locationServices", value)}
        />

        <SwitchItem
          icon="sync"
          title="Auto Sync"
          subtitle="Automatically sync data across devices"
          value={preferences.autoSync}
          onValueChange={(value) => updatePreference("autoSync", value)}
        />

        <SwitchItem
          icon="dark-mode"
          title="Dark Mode"
          subtitle="Switch to dark theme"
          value={preferences.darkMode}
          onValueChange={(value) => updatePreference("darkMode", value)}
        />

        <SwitchItem
          icon="volume-up"
          title="Sound Effects"
          subtitle="Play sounds for app interactions"
          value={preferences.soundEffects}
          onValueChange={(value) => updatePreference("soundEffects", value)}
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

        <SwitchItem
          icon="alarm"
          title="Task Reminders"
          subtitle="Get reminded about upcoming tasks"
          value={preferences.taskReminders}
          onValueChange={(value) => updatePreference("taskReminders", value)}
        />

        <SwitchItem
          icon="assessment"
          title="Weekly Reports"
          subtitle="Receive weekly productivity reports"
          value={preferences.weeklyReports}
          onValueChange={(value) => updatePreference("weeklyReports", value)}
        />

        <SwitchItem
          icon="priority-high"
          title="Priority Alerts"
          subtitle="Special notifications for high priority tasks"
          value={preferences.priorityAlerts}
          onValueChange={(value) => updatePreference("priorityAlerts", value)}
        />

        <SettingItem
          icon="category"
          title="Default Task Category"
          subtitle={`Currently: ${preferences.defaultTaskCategory}`}
          onPress={() => {
            Alert.alert(
              "Default Category",
              "Choose your default task category",
              [
                {
                  text: "Work",
                  onPress: () =>
                    updatePreference("defaultTaskCategory", "Work"),
                },
                {
                  text: "Personal",
                  onPress: () =>
                    updatePreference("defaultTaskCategory", "Personal"),
                },
                {
                  text: "Shopping",
                  onPress: () =>
                    updatePreference("defaultTaskCategory", "Shopping"),
                },
                {
                  text: "Health",
                  onPress: () =>
                    updatePreference("defaultTaskCategory", "Health"),
                },
                { text: "Cancel", style: "cancel" },
              ]
            );
          }}
        />

        <SettingItem
          icon="flag"
          title="Default Priority"
          subtitle={`Currently: ${preferences.defaultPriority}`}
          onPress={() => {
            Alert.alert(
              "Default Priority",
              "Choose your default task priority",
              [
                {
                  text: "Low",
                  onPress: () => updatePreference("defaultPriority", "Low"),
                },
                {
                  text: "Medium",
                  onPress: () => updatePreference("defaultPriority", "Medium"),
                },
                {
                  text: "High",
                  onPress: () => updatePreference("defaultPriority", "High"),
                },
                {
                  text: "Urgent",
                  onPress: () => updatePreference("defaultPriority", "Urgent"),
                },
                { text: "Cancel", style: "cancel" },
              ]
            );
          }}
        />
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
          icon="email"
          title="Change Email"
          subtitle={user?.email || "No email"}
          onPress={() => setIsEditingEmail(true)}
        />

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
          icon="backup"
          title="Backup Data"
          subtitle="Export your tasks and settings"
          onPress={() =>
            Alert.alert(
              "Feature Coming Soon",
              "Data backup feature will be available in the next update."
            )
          }
        />

        <SettingItem
          icon="restore"
          title="Restore Data"
          subtitle="Import previously backed up data"
          onPress={() =>
            Alert.alert(
              "Feature Coming Soon",
              "Data restore feature will be available in the next update."
            )
          }
        />

        <SettingItem
          icon="delete-forever"
          title="Clear App Data"
          subtitle="Reset all preferences and clear local data"
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
          onPress={() =>
            Alert.alert(
              "Feedback",
              "Thank you for your interest! Please send feedback to feedback@taskwize.com"
            )
          }
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

      {/* Email Update Modal */}
      <Modal
        visible={isEditingEmail}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsEditingEmail(false)}
      >
        <View className="flex-1 justify-center items-center bg-black/50">
          <View className="bg-white m-6 p-6 rounded-lg w-11/12">
            <Text className="text-2xl font-bold text-gray-900 mb-4">
              Update Email
            </Text>

            <TextInput
              className="border border-gray-300 rounded-lg px-4 py-3 mb-4 text-base"
              placeholder="New Email Address"
              value={newEmail}
              onChangeText={setNewEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <TextInput
              className="border border-gray-300 rounded-lg px-4 py-3 mb-6 text-base"
              placeholder="Current Password"
              value={currentPassword}
              onChangeText={setCurrentPassword}
              secureTextEntry
            />

            <View className="flex-row gap-3">
              <TouchableOpacity
                className="flex-1 py-3 bg-gray-200 rounded-lg items-center"
                onPress={() => {
                  setIsEditingEmail(false);
                  setCurrentPassword("");
                }}
              >
                <Text className="text-gray-700 font-semibold">Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="flex-1 py-3 bg-blue-500 rounded-lg items-center"
                onPress={handleUpdateEmail}
              >
                <Text className="text-white font-semibold">Update Email</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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
  );
};

export default SettingsScreen;
