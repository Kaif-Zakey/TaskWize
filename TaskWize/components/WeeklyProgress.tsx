import React from "react";
import { View, Text } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useTheme } from "@/context/ThemeContext";

interface WeeklyProgressProps {
  completedThisWeek: number;
  totalThisWeek: number;
}

const WeeklyProgress: React.FC<WeeklyProgressProps> = ({
  completedThisWeek,
  totalThisWeek,
}) => {
  const { colors } = useTheme();

  const progressPercentage =
    totalThisWeek > 0 ? (completedThisWeek / totalThisWeek) * 100 : 0;

  const getProgressColor = () => {
    if (progressPercentage >= 80) return colors.success;
    if (progressPercentage >= 60) return colors.warning;
    if (progressPercentage >= 40) return "#f97316"; // orange
    return colors.error;
  };

  const getMotivationalMessage = () => {
    if (progressPercentage >= 90) return "Outstanding! You're on fire! 🔥";
    if (progressPercentage >= 70) return "Great job! Keep it up! 💪";
    if (progressPercentage >= 50) return "Good progress! You're doing well! 👍";
    if (progressPercentage >= 25)
      return "You're getting there! Stay focused! 🎯";
    return "Let's get started! You've got this! 🚀";
  };

  return (
    <View
      style={{
        backgroundColor: colors.surface,
        padding: 16,
        borderRadius: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 12,
        }}
      >
        <Text
          style={{
            fontSize: 18,
            fontWeight: "bold",
            color: colors.text,
          }}
        >
          This Week&apos;s Progress
        </Text>
        <MaterialIcons name="trending-up" size={24} color={colors.primary} />
      </View>

      <View style={{ marginBottom: 12 }}>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 8,
          }}
        >
          <Text
            style={{
              fontSize: 14,
              color: colors.textSecondary,
            }}
          >
            {completedThisWeek} of {totalThisWeek} tasks completed
          </Text>
          <Text
            style={{
              fontSize: 14,
              fontWeight: "bold",
              color: colors.text,
            }}
          >
            {Math.round(progressPercentage)}%
          </Text>
        </View>

        <View
          style={{
            backgroundColor: colors.border,
            height: 12,
            borderRadius: 6,
          }}
        >
          <View
            style={{
              height: 12,
              borderRadius: 6,
              backgroundColor: getProgressColor(),
              width: `${progressPercentage}%`,
            }}
          />
        </View>
      </View>

      <Text
        style={{
          fontSize: 14,
          color: colors.textSecondary,
          textAlign: "center",
          fontStyle: "italic",
        }}
      >
        {getMotivationalMessage()}
      </Text>
    </View>
  );
};

export default WeeklyProgress;
