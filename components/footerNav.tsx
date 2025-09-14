import { View, Text, Pressable } from "react-native";
import React from "react";
import { useRouter, useSegments } from "expo-router";
import { useTheme } from "@/context/ThemeContext";

const tabs = [
  { label: "Home", path: "/(dashboard)/home" },
  { label: "Tasks", path: "/(dashboard)/tasks" },
  { label: "Profile", path: "/(dashboard)/profile" },
] as const;

const FooterNav = () => {
  const router = useRouter();
  const { colors } = useTheme();

  const segment = useSegments(); // ["(dashboard)", "home"]
  const activeRouter =
    segment.length >= 2
      ? `/(dashboard)/${segment[1]}`
      : `/(dashboard)/${segment[0] || "home"}`;

  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-around",
        borderTopWidth: 1,
        borderTopColor: colors.border,
        paddingVertical: 8,
        backgroundColor: colors.surface,
      }}
    >
      {tabs.map((data, index) => (
        <Pressable
          key={index}
          style={{
            paddingVertical: 4,
            paddingHorizontal: 16,
            borderRadius: 8,
            backgroundColor:
              data?.path === activeRouter ? colors.primary : "transparent",
          }}
          onPress={() => {
            router.push(data?.path);
          }}
        >
          <Text
            style={{
              fontSize: 18,
              color: data?.path === activeRouter ? "white" : colors.text,
            }}
          >
            {data?.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
};

export default FooterNav;
