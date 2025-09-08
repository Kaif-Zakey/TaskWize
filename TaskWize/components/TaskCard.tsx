import React from "react";
import { View, Text, Pressable, Alert } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { Task } from "@/types/task";

interface TaskCardProps {
  task: Task;
  onPress?: () => void;
  onToggleStatus?: (taskId: string) => void;
  onDelete?: (taskId: string) => void;
}

const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onPress,
  onToggleStatus,
  onDelete,
}) => {
  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 border-red-500";
      case "medium":
        return "bg-yellow-100 border-yellow-500";
      case "low":
        return "bg-green-100 border-green-500";
      default:
        return "bg-gray-100 border-gray-300";
    }
  };

  const getCategoryIcon = (category?: string) => {
    switch (category?.toLowerCase()) {
      case "work":
        return "work";
      case "personal":
        return "person";
      case "shopping":
        return "shopping-cart";
      case "health":
        return "health-and-safety";
      default:
        return "task-alt";
    }
  };

  const handleDelete = () => {
    Alert.alert("Delete Task", "Are you sure you want to delete this task?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => onDelete?.(task.id!),
      },
    ]);
  };

  return (
    <Pressable
      onPress={onPress}
      className={`p-4 m-2 rounded-lg border-l-4 ${getPriorityColor(task.priority)} ${
        task.status === "completed" ? "opacity-60" : ""
      }`}
    >
      <View className="flex-row justify-between items-start">
        <View className="flex-1">
          {/* Task Title */}
          <Text
            className={`text-lg font-semibold mb-1 ${
              task.status === "completed"
                ? "line-through text-gray-500"
                : "text-gray-800"
            }`}
          >
            {task.title}
          </Text>

          {/* Task Description */}
          {task.description && (
            <Text className="text-gray-600 mb-2" numberOfLines={2}>
              {task.description}
            </Text>
          )}

          {/* Category and Location Row */}
          <View className="flex-row items-center mb-2">
            {task.category && (
              <View className="flex-row items-center mr-4">
                <MaterialIcons
                  name={getCategoryIcon(task.category) as any}
                  size={16}
                  color="#6B7280"
                />
                <Text className="text-sm text-gray-600 ml-1">
                  {task.category}
                </Text>
              </View>
            )}

            {task.location && (
              <View className="flex-row items-center">
                <MaterialIcons name="location-on" size={16} color="#EF4444" />
                <Text className="text-sm text-gray-600 ml-1" numberOfLines={1}>
                  {task.location.name ||
                    task.location.address ||
                    "Location set"}
                </Text>
              </View>
            )}
          </View>

          {/* Due Date */}
          {task.dueDate && (
            <View className="flex-row items-center">
              <MaterialIcons name="schedule" size={16} color="#6B7280" />
              <Text className="text-sm text-gray-600 ml-1">
                Due: {new Date(task.dueDate).toLocaleDateString()}
              </Text>
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View className="flex-row items-center ml-2">
          {/* Status Toggle */}
          <Pressable
            onPress={() => onToggleStatus?.(task.id!)}
            className="p-2 mr-2"
          >
            <MaterialIcons
              name={
                task.status === "completed"
                  ? "check-circle"
                  : "radio-button-unchecked"
              }
              size={24}
              color={task.status === "completed" ? "#10B981" : "#6B7280"}
            />
          </Pressable>

          {/* Delete Button */}
          <Pressable onPress={handleDelete} className="p-2">
            <MaterialIcons name="delete" size={20} color="#EF4444" />
          </Pressable>
        </View>
      </View>

      {/* Priority Badge */}
      {task.priority && (
        <View className="absolute top-2 right-2">
          <View
            className={`px-2 py-1 rounded-full ${
              task.priority === "high"
                ? "bg-red-500"
                : task.priority === "medium"
                  ? "bg-yellow-500"
                  : "bg-green-500"
            }`}
          >
            <Text className="text-xs text-white font-medium">
              {task.priority.toUpperCase()}
            </Text>
          </View>
        </View>
      )}
    </Pressable>
  );
};

export default TaskCard;
