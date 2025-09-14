import { useAuth } from "@/context/AuthContext";
import { useLoader } from "@/context/LoaderContext";
import { useTheme } from "@/context/ThemeContext";
import { deleteTask, tasksRef, toggleTaskStatus } from "@/service/taskService";
import Task from "@/src/types/task";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const TaskScreen = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);
  const router = useRouter();
  const { showLoader, hideLoader } = useLoader();
  const { colors } = useTheme();
  const { user: authUser } = useAuth();
  const insets = useSafeAreaInsets();

  // Real-time listener handles data fetching, so no manual fetch needed

  useEffect(() => {
    if (!authUser?.uid) {
      setTasks([]);
      return;
    }

    const unsubscribe = onSnapshot(
      tasksRef,
      (snapshot) => {
        const allTasks = snapshot.docs
          .map((d) => ({ id: d.id, ...d.data() }) as Task)
          .filter((task) => task.userId === authUser?.uid);

        setTasks(allTasks);
        hideLoader();
      },
      (err) => {
        hideLoader();
        Alert.alert("Error", "Failed to load tasks. Please try again.");
      }
    );

    return () => unsubscribe();
  }, [hideLoader, authUser?.uid]);

  const handleToggleStatus = async (taskId: string) => {
    try {
      showLoader();
      await toggleTaskStatus(taskId);
    } catch {
      Alert.alert("Error", "Failed to update task status");
    } finally {
      hideLoader();
    }
  };

  const handleDelete = async (id: string) => {
    if (!authUser?.uid) {
      Alert.alert("Error", "You must be logged in to delete tasks.");
      return;
    }

    setTaskToDelete(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!taskToDelete || !authUser?.uid) return;

    try {
      showLoader();
      await deleteTask(taskToDelete, authUser.uid);
      setShowDeleteModal(false);
      setTaskToDelete(null);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to delete task";
      Alert.alert("Error", errorMessage + " Please try again.");
    } finally {
      hideLoader();
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setTaskToDelete(null);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View
        style={{
          backgroundColor: colors.surface,
          paddingHorizontal: 16,
          paddingTop: insets.top + 20,
          paddingBottom: 16,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        <Text
          style={{
            fontSize: 30,
            fontWeight: "bold",
            color: colors.text,
          }}
        >
          My Tasks
        </Text>
        <Text
          style={{
            fontSize: 14,
            color: colors.textSecondary,
            marginTop: 4,
          }}
        >
          {!authUser
            ? "Please login to view your tasks"
            : `${tasks.length} task${tasks.length !== 1 ? "s" : ""} total`}
        </Text>
      </View>

      {!authUser ? (
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            paddingHorizontal: 32,
          }}
        >
          <MaterialIcons name="login" size={64} color={colors.textSecondary} />
          <Text
            style={{
              fontSize: 18,
              fontWeight: "bold",
              color: colors.text,
              marginTop: 16,
              marginBottom: 8,
              textAlign: "center",
            }}
          >
            Authentication Required
          </Text>
          <Text
            style={{
              fontSize: 14,
              color: colors.textSecondary,
              textAlign: "center",
              lineHeight: 20,
              marginBottom: 24,
            }}
          >
            Please login or register to access your tasks
          </Text>
          <TouchableOpacity
            style={{
              backgroundColor: colors.primary,
              paddingHorizontal: 24,
              paddingVertical: 12,
              borderRadius: 25,
            }}
            onPress={() => router.push("/(auth)/login")}
          >
            <Text
              style={{
                color: "white",
                fontWeight: "600",
                fontSize: 16,
              }}
            >
              Go to Login
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <ScrollView className="flex-1 py-2">
            {tasks.length === 0 ? (
              <View className="flex-1 justify-center items-center py-20">
                <MaterialIcons
                  name="task-alt"
                  size={64}
                  color={colors.textSecondary}
                />
                <Text
                  style={{
                    fontSize: 18,
                    color: colors.textSecondary,
                    marginBottom: 16,
                    marginTop: 16,
                  }}
                >
                  No tasks yet
                </Text>
                <Text
                  style={{
                    fontSize: 14,
                    color: colors.textSecondary,
                    opacity: 0.7,
                  }}
                >
                  Tap the + button to add your first task
                </Text>
              </View>
            ) : (
              tasks.map((task) => {
                return (
                  <View
                    key={task.id}
                    style={{
                      backgroundColor: colors.surface,
                      padding: 16,
                      marginBottom: 12,
                      borderRadius: 8,
                      marginHorizontal: 16,
                      borderWidth: 1,
                      borderColor:
                        task.status === "completed"
                          ? colors.success
                          : colors.border,
                      opacity: task.status === "completed" ? 0.75 : 1,
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.1,
                      shadowRadius: 2,
                      elevation: 2,
                    }}
                  >
                    <View className="flex-row justify-between items-start mb-2">
                      <Text
                        style={{
                          fontSize: 18,
                          fontWeight: "bold",
                          flex: 1,
                          color:
                            task.status === "completed"
                              ? colors.textSecondary
                              : colors.text,
                          textDecorationLine:
                            task.status === "completed"
                              ? "line-through"
                              : "none",
                        }}
                      >
                        {task.title}
                      </Text>
                      {task.category && (
                        <View
                          style={{
                            backgroundColor: colors.primary + "20",
                            paddingHorizontal: 8,
                            paddingVertical: 4,
                            borderRadius: 12,
                            marginLeft: 8,
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 12,
                              color: colors.primary,
                              textTransform: "capitalize",
                            }}
                          >
                            {task.category}
                          </Text>
                        </View>
                      )}
                    </View>

                    {task.description && (
                      <Text
                        style={{
                          fontSize: 14,
                          color: colors.textSecondary,
                          marginBottom: 12,
                        }}
                        numberOfLines={2}
                      >
                        {task.description}
                      </Text>
                    )}

                    {task.location && (
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          marginBottom: 12,
                          backgroundColor: colors.info + "20",
                          padding: 8,
                          borderRadius: 6,
                        }}
                      >
                        <MaterialIcons
                          name="location-on"
                          size={16}
                          color={colors.info}
                        />
                        <Text
                          style={{
                            fontSize: 12,
                            color: colors.info,
                            marginLeft: 4,
                            flex: 1,
                          }}
                          numberOfLines={1}
                        >
                          {task.location.address ||
                            `${task.location.latitude.toFixed(4)}, ${task.location.longitude.toFixed(4)}`}
                        </Text>
                      </View>
                    )}

                    <View className="flex-row justify-between items-center">
                      <View className="flex-row flex-wrap">
                        <TouchableOpacity
                          style={{
                            paddingHorizontal: 12,
                            paddingVertical: 8,
                            borderRadius: 6,
                            marginRight: 8,
                            marginBottom: 8,
                            backgroundColor:
                              task.status === "completed"
                                ? colors.warning
                                : colors.success,
                          }}
                          onPress={() => {
                            if (task.id) handleToggleStatus(task.id);
                          }}
                        >
                          <Text
                            style={{
                              color: "#fff",
                              fontSize: 12,
                              fontWeight: "500",
                            }}
                          >
                            {task.status === "completed" ? "Undo" : "Done"}
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={{
                            backgroundColor: colors.primary,
                            paddingHorizontal: 12,
                            paddingVertical: 8,
                            borderRadius: 6,
                            marginRight: 8,
                            marginBottom: 8,
                          }}
                          onPress={() =>
                            router.push(`/(dashboard)/tasks/${task.id}`)
                          }
                        >
                          <Text
                            style={{
                              color: "#fff",
                              fontSize: 12,
                              fontWeight: "500",
                            }}
                          >
                            Edit
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={{
                            backgroundColor: colors.error,
                            paddingHorizontal: 12,
                            paddingVertical: 8,
                            borderRadius: 6,
                            marginBottom: 8,
                          }}
                          onPress={() => {
                            console.log(
                              "🔥 Delete button pressed for task:",
                              task.id
                            );
                            if (task.id) {
                              handleDelete(task.id);
                            } else {
                              Alert.alert(
                                "Error",
                                "Cannot delete task: ID is missing"
                              );
                            }
                          }}
                        >
                          <Text
                            style={{
                              color: "#fff",
                              fontSize: 12,
                              fontWeight: "500",
                            }}
                          >
                            Delete
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                );
              })
            )}
            <View className="h-20" />
          </ScrollView>
        </>
      )}

      {/* Add Task Button */}
      {authUser && (
        <View className="absolute bottom-5 right-5 z-10">
          <Pressable
            style={{
              backgroundColor: colors.primary,
              borderRadius: 30,
              padding: 16,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.25,
              shadowRadius: 3.84,
              elevation: 5,
            }}
            onPress={() => router.push("/(dashboard)/tasks/new")}
          >
            <MaterialIcons name="add" size={28} color="white" />
          </Pressable>
        </View>
      )}

      {/* Custom Delete Confirmation Modal */}
      <Modal
        visible={showDeleteModal}
        transparent={true}
        animationType="fade"
        onRequestClose={cancelDelete}
      >
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "rgba(0, 0, 0, 0.5)",
          }}
        >
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: 12,
              padding: 24,
              margin: 20,
              minWidth: 300,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.25,
              shadowRadius: 3.84,
              elevation: 5,
            }}
          >
            <Text
              style={{
                fontSize: 20,
                fontWeight: "bold",
                color: colors.text,
                marginBottom: 12,
                textAlign: "center",
              }}
            >
              Delete Task
            </Text>
            <Text
              style={{
                fontSize: 16,
                color: colors.textSecondary,
                marginBottom: 24,
                textAlign: "center",
                lineHeight: 22,
              }}
            >
              Are you sure you want to delete this task? This action cannot be
              undone.
            </Text>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                gap: 12,
              }}
            >
              <TouchableOpacity
                style={{
                  flex: 1,
                  backgroundColor: colors.border,
                  paddingVertical: 12,
                  paddingHorizontal: 24,
                  borderRadius: 8,
                  alignItems: "center",
                }}
                onPress={cancelDelete}
              >
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "600",
                    color: colors.text,
                  }}
                >
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  flex: 1,
                  backgroundColor: colors.error,
                  paddingVertical: 12,
                  paddingHorizontal: 24,
                  borderRadius: 8,
                  alignItems: "center",
                }}
                onPress={confirmDelete}
              >
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "600",
                    color: "#fff",
                  }}
                >
                  Delete
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default TaskScreen;
