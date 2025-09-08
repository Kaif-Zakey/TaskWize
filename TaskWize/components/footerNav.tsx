import { View, Text, Pressable } from "react-native";
import React from "react";
import { useRouter, useSegments } from "expo-router";

const tabs = [
  { label: "Home", path: "/(dashboard)/home" },
  { label: "Tasks", path: "/(dashboard)/tasks" },
  { label: "Profile", path: "/(dashboard)/profile" },
] as const;

const FooterNav = () => {
  const router = useRouter();

  const segment = useSegments(); // ["(dashboard)", "home"]
  const activeRouter =
    segment.length >= 2
      ? `/(dashboard)/${segment[1]}`
      : `/(dashboard)/${segment[0] || "home"}`;

  return (
    <View className="flex-row justify-around border-gray-300 py-2 bg-white">
      {/* {tabs.map(() => {
        return <View></View>
      })} */}
      {tabs.map((data, index) => (
        <Pressable
          key={index}
          // data.path === activeRouter -> this button is active
          //   "" + "" -> ` ${can use varibles like any} `
          className={`py-1 px-4 rounded-lg ${data?.path === activeRouter ? "bg-blue-600" : ""}`}
          onPress={() => {
            router.push(data?.path);
          }}
        >
          <Text className="text-2xl">{data?.label}</Text>
        </Pressable>
      ))}
    </View>
  );
};

export default FooterNav;
