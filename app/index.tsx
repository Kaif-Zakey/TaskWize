import { useAuth } from "@/context/AuthContext";
import { useRouter } from "expo-router";
import React, { useEffect } from "react";
import { ActivityIndicator, Text, View } from "react-native";

const Index = () => {
  const router = useRouter();
  const { user, loading, isInitializing } = useAuth();

  useEffect(() => {
    if (!loading && !isInitializing) {
      if (user) {
        router.replace("/(dashboard)/home");
      } else {
        router.replace("/(auth)/login");
      }
    }
  }, [user, loading, isInitializing, router]);

  // Show loading while initializing or checking auth
  if (loading || isInitializing) {
    return (
      <View className="flex-1 w-full justify-center align-items-center">
        <ActivityIndicator size="large" />
        <Text className="mt-4 text-gray-600">
          {isInitializing ? "Checking saved login..." : "Loading..."}
        </Text>
      </View>
    );
  }

  return null;
};

export default Index;
