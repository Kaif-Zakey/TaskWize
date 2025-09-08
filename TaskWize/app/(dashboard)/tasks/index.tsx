import {
  View,
  Text,
  Pressable,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useEffect, useState } from "react";
import {
  deleteTask,
  getAllTask,
  tasksRef,
  toggleTaskStatus,
} from "@/service/taskService";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Task } from "@/types/task";
import { useLoader } from "@/context/LoaderContext";
import { useTheme } from "@/context/ThemeContext";
import { onSnapshot } from "firebase/firestore";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const TaskScreen = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const router = useRouter();
  const { showLoader, hideLoader } = useLoader();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const handleFetchData = async () => {
    try {
      showLoader();
      // const data = await getTasks() // returns array axios get
      const data = await getAllTask(); // firebase get all
      console.log(data);
      setTasks(data);
    } catch (error) {
      console.log("Error fetching:", error);
    } finally {
      hideLoader();
    }
  };

  // useEffect(() => {
  //   handleFetchData()
  // }, [segment])

  useEffect(() => {
    const unsubscribe = onSnapshot(
      tasksRef,
      (snapshot) => {
        const allTasks = snapshot.docs.map(
          (d) => ({ id: d.id, ...d.data() }) as Task
        );
        setTasks(allTasks);
        hideLoader();
      },
      (err) => {
        console.log("Error listening:", err);
      }
    );

    return () => unsubscribe();
  }, [hideLoader]);

  const handleToggleStatus = async (taskId: string) => {
    try {
      showLoader();
      await toggleTaskStatus(taskId);
    } catch (error) {
      console.log("Error toggling task status:", error);
      Alert.alert("Error", "Failed to update task status");
    } finally {
      hideLoader();
    }
  };

  const handleDelete = async (id: string) => {
    Alert.alert("Delete", "Are you sure want to delete ?", [
      { text: "Cancel" },
      {
        text: "Delete",
        onPress: async () => {
          try {
            showLoader();
            await deleteTask(id);
            handleFetchData();
          } catch (err) {
            console.log("Error deleting task", err);
          } finally {
            hideLoader();
          }
        },
      },
    ]);
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
          {tasks.length} task{tasks.length !== 1 ? "s" : ""} total
        </Text>
      </View>

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
          onPress={() => {
            router.push("/(dashboard)/tasks/new");
          }}
        >
          <MaterialIcons name="add" size={28} color="#fff" />
        </Pressable>
      </View>

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
                        task.status === "completed" ? "line-through" : "none",
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
                        if (task.id) handleDelete(task.id);
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
    </View>
  );
};

export default TaskScreen;
