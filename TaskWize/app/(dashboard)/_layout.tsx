import React from "react";
import { Tabs } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { useTheme } from "@/context/ThemeContext";

const tabs = [
  { label: "Home", name: "home", icon: "home-filled" },
  { label: "Tasks", name: "tasks", icon: "check-circle" },
  { label: "Profile", name: "profile", icon: "person" },
  { label: "Settings", name: "settings", icon: "settings" },
] as const;

const DashboardLayout = () => {
  const { colors } = useTheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
      }}
    >
      {/* (obj.name) ===  ({name}) */}
      {tabs.map(({ name, icon, label }) => (
        <Tabs.Screen
          key={name}
          name={name}
          options={{
            title: label,
            tabBarIcon: ({ color, size }) => (
              <MaterialIcons name={icon} color={color} size={size} />
            ),
          }}
        />
      ))}
    </Tabs>
  );
};

// tasks/index

export default DashboardLayout;
