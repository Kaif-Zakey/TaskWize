import { usePreferences } from "@/context/PreferencesContext";
import locationService from "@/service/locationService";
import Location from "@/src/types/location";
import Task from "@/src/types/task";
import { MaterialIcons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";

interface TaskFormProps {
  task?: Task;
  onSave: (task: Omit<Task, "id">) => void;
  onCancel: () => void;
}

const categories = [
  { label: "Work", value: "work", icon: "work" },
  { label: "Personal", value: "personal", icon: "person" },
  { label: "Shopping", value: "shopping", icon: "shopping-cart" },
  { label: "Health", value: "health", icon: "health-and-safety" },
  { label: "Education", value: "education", icon: "school" },
  { label: "Finance", value: "finance", icon: "account-balance" },
];

const priorities = [
  { label: "Low", value: "low", color: "bg-green-500" },
  { label: "Medium", value: "medium", color: "bg-yellow-500" },
  { label: "High", value: "high", color: "bg-red-500" },
];

const TaskForm: React.FC<TaskFormProps> = ({ task, onSave, onCancel }) => {
  const { isLocationServicesEnabled } = usePreferences();
  const [title, setTitle] = useState(task?.title || "");
  const [description, setDescription] = useState(task?.description || "");
  const [category, setCategory] = useState(task?.category || "");
  const [priority, setPriority] = useState<"low" | "medium" | "high">(
    task?.priority || "medium"
  );
  const [dueDate, setDueDate] = useState(
    task?.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : ""
  );
  const [location, setLocation] = useState<Location | null>(
    task?.location || null
  );
  const [notifyOnLocation, setNotifyOnLocation] = useState(
    task?.notifyOnLocation || false
  );
  const [locationInput, setLocationInput] = useState(
    task?.location?.address || ""
  );
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  const handleGetCurrentLocation = async () => {
    setIsLoadingLocation(true);
    try {
      const currentLocation = await locationService.getCurrentLocation();
      if (currentLocation) {
        const address = await locationService.reverseGeocode(
          currentLocation.coords.latitude,
          currentLocation.coords.longitude
        );

        setLocation({
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
          address: address || "Current Location",
        });
        setLocationInput(address || "Current Location");
      } else {
        Alert.alert(
          "Error",
          "Unable to get current location. Please check permissions."
        );
      }
    } catch {
      Alert.alert("Error", "Failed to get current location.");
    }
    setIsLoadingLocation(false);
  };

  const handleSearchLocation = async () => {
    if (!locationInput.trim()) return;

    setIsLoadingLocation(true);
    try {
      const searchResult = await locationService.geocodeAddress(locationInput);
      if (searchResult) {
        setLocation(searchResult);
      } else {
        Alert.alert(
          "Error",
          "Location not found. Please try a different address."
        );
      }
    } catch {
      Alert.alert("Error", "Failed to search location.");
    }
    setIsLoadingLocation(false);
  };

  const handleSave = () => {
    if (!title.trim()) {
      Alert.alert("Error", "Please enter a task title.");
      return;
    }

    const taskData: Omit<Task, "id"> = {
      title: title.trim(),
      description: description.trim(),
      priority,
      status: task?.status || "pending",
    };

    // Only add optional fields if they have values
    if (category) {
      taskData.category = category;
    }

    if (dueDate) {
      taskData.dueDate = dueDate;
    }

    // Only include location data if location services are enabled
    if (isLocationServicesEnabled && location) {
      taskData.location = location;
      taskData.notifyOnLocation = notifyOnLocation;
    } else {
      // Clear location data if location services are disabled
      taskData.location = undefined;
      taskData.notifyOnLocation = false;
    }

    onSave(taskData);
  };

  return (
    <ScrollView className="flex-1 bg-white p-4">
      <Text className="text-2xl font-bold mb-6 text-gray-800">
        {task ? "Edit Task" : "Create New Task"}
      </Text>

      {/* Title Input */}
      <View className="mb-4">
        <Text className="text-lg font-semibold mb-2 text-gray-700">
          Title *
        </Text>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Enter task title"
          className="border border-gray-300 rounded-lg p-3 text-base"
          multiline={false}
        />
      </View>

      {/* Description Input */}
      <View className="mb-4">
        <Text className="text-lg font-semibold mb-2 text-gray-700">
          Description
        </Text>
        <TextInput
          value={description}
          onChangeText={setDescription}
          placeholder="Enter task description"
          className="border border-gray-300 rounded-lg p-3 text-base h-20"
          multiline
          textAlignVertical="top"
        />
      </View>

      {/* Category Selection */}
      <View className="mb-4">
        <Text className="text-lg font-semibold mb-2 text-gray-700">
          Category
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row">
            {categories.map((cat) => (
              <Pressable
                key={cat.value}
                onPress={() => setCategory(cat.value)}
                className={`flex-row items-center px-4 py-2 mr-2 rounded-full border ${
                  category === cat.value
                    ? "bg-blue-500 border-blue-500"
                    : "bg-gray-100 border-gray-300"
                }`}
              >
                <MaterialIcons
                  name={cat.icon as any}
                  size={18}
                  color={category === cat.value ? "white" : "#6B7280"}
                />
                <Text
                  className={`ml-1 ${
                    category === cat.value ? "text-white" : "text-gray-600"
                  }`}
                >
                  {cat.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Priority Selection */}
      <View className="mb-4">
        <Text className="text-lg font-semibold mb-2 text-gray-700">
          Priority
        </Text>
        <View className="flex-row">
          {priorities.map((pri) => (
            <Pressable
              key={pri.value}
              onPress={() =>
                setPriority(pri.value as "low" | "medium" | "high")
              }
              className={`flex-1 py-3 mx-1 rounded-lg ${
                priority === pri.value ? pri.color : "bg-gray-200"
              }`}
            >
              <Text
                className={`text-center font-medium ${
                  priority === pri.value ? "text-white" : "text-gray-600"
                }`}
              >
                {pri.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Due Date */}
      <View className="mb-4">
        <Text className="text-lg font-semibold mb-2 text-gray-700">
          Due Date
        </Text>
        <TextInput
          value={dueDate}
          onChangeText={setDueDate}
          placeholder="YYYY-MM-DD"
          className="border border-gray-300 rounded-lg p-3 text-base"
        />
      </View>

      {/* Location Section - Only show if location services are enabled */}
      {isLocationServicesEnabled && (
        <View className="mb-4">
          <Text className="text-lg font-semibold mb-2 text-gray-700">
            Location
          </Text>

          <View className="flex-row mb-2">
            <TextInput
              value={locationInput}
              onChangeText={setLocationInput}
              placeholder="Enter address or location name"
              className="flex-1 border border-gray-300 rounded-lg p-3 text-base mr-2"
            />
            <Pressable
              onPress={handleSearchLocation}
              disabled={isLoadingLocation}
              className="bg-blue-500 rounded-lg px-4 py-3 justify-center"
            >
              <MaterialIcons name="search" size={20} color="white" />
            </Pressable>
          </View>

          <Pressable
            onPress={handleGetCurrentLocation}
            disabled={isLoadingLocation}
            className="flex-row items-center justify-center bg-gray-100 rounded-lg p-3 mb-2"
          >
            <MaterialIcons name="my-location" size={20} color="#6B7280" />
            <Text className="ml-2 text-gray-600">
              {isLoadingLocation
                ? "Getting location..."
                : "Use Current Location"}
            </Text>
          </Pressable>

          {location && (
            <View className="bg-green-50 border border-green-200 rounded-lg p-3 mb-2">
              <View className="flex-row items-center">
                <MaterialIcons name="location-on" size={20} color="#10B981" />
                <Text className="ml-2 text-green-700 font-medium">
                  Location Set
                </Text>
              </View>
              <Text className="text-sm text-green-600 mt-1">
                {location.address ||
                  `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`}
              </Text>
            </View>
          )}

          {location && (
            <View className="flex-row items-center justify-between bg-blue-50 border border-blue-200 rounded-lg p-3">
              <Text className="text-blue-700">
                Notify when near this location
              </Text>
              <Switch
                value={notifyOnLocation}
                onValueChange={setNotifyOnLocation}
                trackColor={{ false: "#D1D5DB", true: "#3B82F6" }}
                thumbColor={notifyOnLocation ? "#ffffff" : "#f4f3f4"}
              />
            </View>
          )}
        </View>
      )}

      {/* Action Buttons */}
      <View className="flex-row space-x-3 mt-6">
        <Pressable
          onPress={onCancel}
          className="flex-1 bg-gray-200 rounded-lg py-4"
        >
          <Text className="text-center text-gray-700 font-semibold text-base">
            Cancel
          </Text>
        </Pressable>

        <Pressable
          onPress={handleSave}
          className="flex-1 bg-blue-500 rounded-lg py-4"
        >
          <Text className="text-center text-white font-semibold text-base">
            {task ? "Update Task" : "Create Task"}
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
};

export default TaskForm;
