import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  Switch,
} from "react-native";
import React, { useEffect, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { createTask, getTaskById, updateTask } from "@/service/taskService";
import { useLoader } from "@/context/LoaderContext";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import * as Location from "expo-location";
import { MaterialIcons } from "@expo/vector-icons";
import { NotificationService } from "@/service/notificationService";

const TaskFormScreen = () => {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isNew = !id || id === "new";
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [category, setCategory] = useState<string>("");
  const [location, setLocation] = useState<string>("");
  const [currentLocation, setCurrentLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState<boolean>(false);
  const [notifyOnLocation, setNotifyOnLocation] = useState<boolean>(false);
  const [notificationRange, setNotificationRange] = useState<number>(100);
  const router = useRouter();
  const { hideLoader, showLoader } = useLoader();
  const { user } = useAuth();
  const { colors } = useTheme();

  useEffect(() => {
    const load = async () => {
      if (!isNew && id) {
        try {
          showLoader();
          const task = await getTaskById(id);
          if (task) {
            setTitle(task.title);
            setDescription(task.description || "");
            setCategory(task.category || "");
            setNotifyOnLocation(task.notifyOnLocation || false);
            if (task.location) {
              setLocation(task.location.address || "");
              setCurrentLocation({
                latitude: task.location.latitude,
                longitude: task.location.longitude,
              });
              setNotificationRange(task.location.range || 100);
            }
          }
        } finally {
          hideLoader();
        }
      }
    };
    load();
  }, [id, isNew, showLoader, hideLoader]);

  const getCurrentLocation = async () => {
    try {
      setIsLoadingLocation(true);

      // Request permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Denied",
          "Location permission is required to get your current location."
        );
        return;
      }

      // Get current position
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      setCurrentLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      // Reverse geocode to get address
      const reverseGeocode = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (reverseGeocode.length > 0) {
        const address = reverseGeocode[0];
        const formattedAddress = [
          address.name,
          address.street,
          address.city,
          address.region,
          address.country,
        ]
          .filter(Boolean)
          .join(", ");

        setLocation(
          formattedAddress ||
            `${location.coords.latitude}, ${location.coords.longitude}`
        );
      }
    } catch (error) {
      console.error("Error getting location:", error);
      Alert.alert("Error", "Failed to get current location. Please try again.");
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert("Validation", "Title is required");
      return;
    }

    try {
      showLoader();
      if (isNew) {
        const taskLocation = currentLocation
          ? {
              latitude: currentLocation.latitude,
              longitude: currentLocation.longitude,
              address: location || undefined,
              range: notificationRange,
            }
          : undefined;

        await createTask({
          title,
          description,
          userId: user?.uid,
          status: "pending",
          category: category || undefined,
          location: taskLocation,
          notifyOnLocation: notifyOnLocation && currentLocation !== null,
        });

        // Schedule notification if enabled
        if (notifyOnLocation && currentLocation && taskLocation) {
          try {
            // Send immediate confirmation notification
            await NotificationService.sendImmediateTaskNotification(
              title,
              {
                latitude: currentLocation.latitude,
                longitude: currentLocation.longitude,
                address: location || "Unknown location",
              },
              notificationRange
            );

            // Also schedule a delayed notification for testing location monitoring
            await NotificationService.scheduleTaskNotification(
              title,
              {
                latitude: currentLocation.latitude,
                longitude: currentLocation.longitude,
                address: location || "Unknown location",
              },
              notificationRange,
              0.1 // 6 seconds for immediate testing
            );
          } catch (notificationError) {
            console.error(
              "Failed to schedule notification:",
              notificationError
            );
          }
        }
      } else {
        const existingTask = await getTaskById(id!);
        if (existingTask) {
          const taskLocation = currentLocation
            ? {
                latitude: currentLocation.latitude,
                longitude: currentLocation.longitude,
                address: location || undefined,
                range: notificationRange,
              }
            : undefined;

          await updateTask(id!, {
            ...existingTask,
            title,
            description,
            category: category || undefined,
            location: taskLocation,
            notifyOnLocation: notifyOnLocation && currentLocation !== null,
          });

          // Schedule notification if enabled
          if (notifyOnLocation && currentLocation && taskLocation) {
            try {
              // Send immediate confirmation notification
              await NotificationService.sendImmediateTaskNotification(
                title,
                {
                  latitude: currentLocation.latitude,
                  longitude: currentLocation.longitude,
                  address: location || "Unknown location",
                },
                notificationRange
              );

              // Also schedule a delayed notification for testing
              await NotificationService.scheduleTaskNotification(
                title,
                {
                  latitude: currentLocation.latitude,
                  longitude: currentLocation.longitude,
                  address: location || "Unknown location",
                },
                notificationRange,
                0.1 // 6 seconds for immediate testing
              );
            } catch (notificationError) {
              console.error(
                "Failed to schedule notification for updated task:",
                notificationError
              );
            }
          }
        }
      }
      router.back();
    } catch (err) {
      console.error(`Error ${isNew ? "saving" : "updating"} task`, err);
      Alert.alert("Error", `Failed to ${isNew ? "save" : "update"} task`);
    } finally {
      hideLoader();
    }
  };

  const categories = [
    { label: "Work", value: "work" },
    { label: "Personal", value: "personal" },
    { label: "Shopping", value: "shopping" },
    { label: "Health", value: "health" },
  ];

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ padding: 20 }}>
        <Text
          style={{
            fontSize: 24,
            fontWeight: "bold",
            marginBottom: 16,
            color: colors.text,
          }}
        >
          {isNew ? "Add Task" : "Edit Task"}
        </Text>

        <Text
          style={{
            fontSize: 18,
            fontWeight: "500",
            marginBottom: 8,
            color: colors.text,
          }}
        >
          Title *
        </Text>
        <TextInput
          placeholder="Enter task title"
          style={{
            borderWidth: 1,
            borderColor: colors.border,
            padding: 12,
            marginBottom: 16,
            borderRadius: 6,
            fontSize: 16,
            backgroundColor: colors.surface,
            color: colors.text,
          }}
          placeholderTextColor={colors.textSecondary}
          value={title}
          onChangeText={setTitle}
        />

        <Text
          style={{
            fontSize: 18,
            fontWeight: "500",
            marginBottom: 8,
            color: colors.text,
          }}
        >
          Description
        </Text>
        <TextInput
          placeholder="Enter task description"
          style={{
            borderWidth: 1,
            borderColor: colors.border,
            padding: 12,
            marginBottom: 16,
            borderRadius: 6,
            fontSize: 16,
            height: 80,
            backgroundColor: colors.surface,
            color: colors.text,
          }}
          placeholderTextColor={colors.textSecondary}
          value={description}
          onChangeText={setDescription}
          multiline
          textAlignVertical="top"
        />

        <Text
          style={{
            fontSize: 18,
            fontWeight: "500",
            marginBottom: 8,
            color: colors.text,
          }}
        >
          Category
        </Text>
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            marginBottom: 16,
          }}
        >
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat.value}
              onPress={() =>
                setCategory(cat.value === category ? "" : cat.value)
              }
              style={{
                paddingHorizontal: 16,
                paddingVertical: 8,
                marginRight: 8,
                marginBottom: 8,
                borderRadius: 16,
                backgroundColor:
                  category === cat.value ? colors.primary : colors.surface,
                borderWidth: 1,
                borderColor:
                  category === cat.value ? colors.primary : colors.border,
              }}
            >
              <Text
                style={{
                  color:
                    category === cat.value ? "#FFFFFF" : colors.textSecondary,
                }}
              >
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text
          style={{
            fontSize: 18,
            fontWeight: "500",
            marginBottom: 8,
            color: colors.text,
          }}
        >
          Location
        </Text>
        <View style={{ marginBottom: 16 }}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <TextInput
              placeholder="Enter location or use GPS"
              style={{
                borderWidth: 1,
                borderColor: colors.border,
                padding: 12,
                borderRadius: 6,
                fontSize: 16,
                backgroundColor: colors.surface,
                color: colors.text,
                flex: 1,
                marginRight: 8,
              }}
              placeholderTextColor={colors.textSecondary}
              value={location}
              onChangeText={setLocation}
            />
            <TouchableOpacity
              style={{
                backgroundColor: colors.primary,
                padding: 12,
                borderRadius: 6,
                flexDirection: "row",
                alignItems: "center",
              }}
              onPress={getCurrentLocation}
              disabled={isLoadingLocation}
            >
              <MaterialIcons
                name={isLoadingLocation ? "hourglass-empty" : "my-location"}
                size={20}
                color="white"
              />
              <Text style={{ color: "white", marginLeft: 4, fontSize: 12 }}>
                {isLoadingLocation ? "Getting..." : "GPS"}
              </Text>
            </TouchableOpacity>
          </View>

          {currentLocation && (
            <View
              style={{
                backgroundColor: colors.success + "20",
                padding: 8,
                borderRadius: 6,
                marginTop: 8,
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <MaterialIcons
                name="location-on"
                size={16}
                color={colors.success}
              />
              <Text
                style={{
                  color: colors.success,
                  fontSize: 12,
                  marginLeft: 4,
                  flex: 1,
                }}
              >
                Location captured: {currentLocation.latitude.toFixed(6)},{" "}
                {currentLocation.longitude.toFixed(6)}
              </Text>
            </View>
          )}
        </View>

        {/* Notification Settings */}
        {currentLocation && (
          <View style={{ marginBottom: 16 }}>
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
                  fontWeight: "500",
                  color: colors.text,
                }}
              >
                Location Notifications
              </Text>
              <Switch
                value={notifyOnLocation}
                onValueChange={setNotifyOnLocation}
                trackColor={{
                  false: colors.border,
                  true: colors.primary + "40",
                }}
                thumbColor={
                  notifyOnLocation ? colors.primary : colors.textSecondary
                }
              />
            </View>

            {notifyOnLocation && (
              <View>
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "500",
                    marginBottom: 8,
                    color: colors.text,
                  }}
                >
                  Notification Range: {notificationRange}m
                </Text>

                <View
                  style={{
                    flexDirection: "row",
                    flexWrap: "wrap",
                    marginBottom: 8,
                  }}
                >
                  {[50, 100, 200, 500, 1000].map((range) => (
                    <TouchableOpacity
                      key={range}
                      onPress={() => setNotificationRange(range)}
                      style={{
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        marginRight: 8,
                        marginBottom: 8,
                        borderRadius: 16,
                        backgroundColor:
                          notificationRange === range
                            ? colors.primary
                            : colors.surface,
                        borderWidth: 1,
                        borderColor:
                          notificationRange === range
                            ? colors.primary
                            : colors.border,
                      }}
                    >
                      <Text
                        style={{
                          color:
                            notificationRange === range
                              ? "white"
                              : colors.textSecondary,
                          fontSize: 12,
                        }}
                      >
                        {range}m
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <View
                  style={{
                    backgroundColor: colors.info + "20",
                    padding: 12,
                    borderRadius: 8,
                    flexDirection: "row",
                    alignItems: "center",
                  }}
                >
                  <MaterialIcons
                    name="notifications"
                    size={16}
                    color={colors.info}
                  />
                  <Text
                    style={{
                      color: colors.info,
                      fontSize: 12,
                      marginLeft: 8,
                      flex: 1,
                    }}
                  >
                    You will be notified when you are within {notificationRange}
                    m of this location
                  </Text>
                </View>
              </View>
            )}
          </View>
        )}

        <TouchableOpacity
          style={{
            backgroundColor: colors.primary,
            borderRadius: 6,
            paddingHorizontal: 24,
            paddingVertical: 16,
            marginTop: 16,
          }}
          onPress={handleSubmit}
        >
          <Text
            style={{
              fontSize: 20,
              color: "#FFFFFF",
              textAlign: "center",
              fontWeight: "600",
            }}
          >
            {isNew ? "Add Task" : "Update Task"}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export default TaskFormScreen;
