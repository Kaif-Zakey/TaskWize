import React from "react";
import { View, Text } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

interface WeeklyProgressProps {
  completedThisWeek: number;
  totalThisWeek: number;
}

const WeeklyProgress: React.FC<WeeklyProgressProps> = ({
  completedThisWeek,
  totalThisWeek,
}) => {
  const progressPercentage =
    totalThisWeek > 0 ? (completedThisWeek / totalThisWeek) * 100 : 0;

  const getProgressColor = () => {
    if (progressPercentage >= 80) return "bg-green-500";
    if (progressPercentage >= 60) return "bg-yellow-500";
    if (progressPercentage >= 40) return "bg-orange-500";
    return "bg-red-500";
  };

  const getMotivationalMessage = () => {
    if (progressPercentage >= 90) return "Outstanding! You&apos;re on fire! 🔥";
    if (progressPercentage >= 70) return "Great job! Keep it up! 💪";
    if (progressPercentage >= 50)
      return "Good progress! You&apos;re doing well! 👍";
    if (progressPercentage >= 25)
      return "You&apos;re getting there! Stay focused! 🎯";
    return "Let&apos;s get started! You&apos;ve got this! 🚀";
  };

  return (
    <View className="bg-white p-4 rounded-xl shadow-sm">
      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-lg font-semibold text-gray-800">
          This Week&apos;s Progress
        </Text>
        <MaterialIcons name="trending-up" size={24} color="#3B82F6" />
      </View>

      <View className="mb-3">
        <View className="flex-row justify-between items-center mb-2">
          <Text className="text-sm text-gray-600">
            {completedThisWeek} of {totalThisWeek} tasks completed
          </Text>
          <Text className="text-sm font-semibold text-gray-800">
            {Math.round(progressPercentage)}%
          </Text>
        </View>

        <View className="bg-gray-200 h-3 rounded-full">
          <View
            className={`h-3 rounded-full ${getProgressColor()}`}
            style={{ width: `${progressPercentage}%` }}
          />
        </View>
      </View>

      <Text className="text-sm text-gray-600 text-center italic">
        {getMotivationalMessage()}
      </Text>
    </View>
  );
};

export default WeeklyProgress;
