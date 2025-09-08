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
import { Task } from "@/app/types/task";
import { useLoader } from "@/context/LoaderContext";
import { useTheme } from "@/context/ThemeContext";
import { onSnapshot } from "firebase/firestore";

const TaskScreen = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const router = useRouter();
  const { showLoader, hideLoader } = useLoader();

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
    <View className="flex-1 bg-gray-50">
      <View className="bg-white p-4 border-b border-gray-200">
        <Text className="text-3xl font-bold text-gray-800">My Tasks</Text>
        <Text className="text-sm text-gray-600 mt-1">
          {tasks.length} task{tasks.length !== 1 ? "s" : ""} total
        </Text>
      </View>

      <View className="absolute bottom-5 right-5 z-10">
        <Pressable
          className="bg-blue-500 rounded-full p-4 shadow-lg"
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
            <MaterialIcons name="task-alt" size={64} color="#D1D5DB" />
            <Text className="text-lg text-gray-500 mb-4 mt-4">
              No tasks yet
            </Text>
            <Text className="text-sm text-gray-400">
              Tap the + button to add your first task
            </Text>
          </View>
        ) : (
          tasks.map((task) => {
            return (
              <View
                key={task.id}
                className={`bg-white p-4 mb-3 rounded-lg mx-4 border shadow-sm ${
                  task.status === "completed"
                    ? "border-green-200 opacity-75"
                    : "border-gray-200"
                }`}
              >
                <View className="flex-row justify-between items-start mb-2">
                  <Text
                    className={`text-lg font-semibold flex-1 ${
                      task.status === "completed"
                        ? "line-through text-gray-500"
                        : "text-gray-800"
                    }`}
                  >
                    {task.title}
                  </Text>
                  {task.category && (
                    <View className="bg-blue-100 px-2 py-1 rounded-full ml-2">
                      <Text className="text-xs text-blue-800 capitalize">
                        {task.category}
                      </Text>
                    </View>
                  )}
                </View>

                {task.description && (
                  <Text
                    className="text-sm text-gray-600 mb-3"
                    numberOfLines={2}
                  >
                    {task.description}
                  </Text>
                )}

                <View className="flex-row justify-between items-center">
                  <View className="flex-row flex-wrap">
                    <TouchableOpacity
                      className={`px-3 py-2 rounded-md mr-2 mb-2 ${
                        task.status === "completed"
                          ? "bg-yellow-500"
                          : "bg-green-500"
                      }`}
                      onPress={() => {
                        if (task.id) handleToggleStatus(task.id);
                      }}
                    >
                      <Text className="text-white text-xs font-medium">
                        {task.status === "completed" ? "Undo" : "Done"}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      className="bg-blue-500 px-3 py-2 rounded-md mr-2 mb-2"
                      onPress={() =>
                        router.push(`/(dashboard)/tasks/${task.id}`)
                      }
                    >
                      <Text className="text-white text-xs font-medium">
                        Edit
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      className="bg-red-500 px-3 py-2 rounded-md mb-2"
                      onPress={() => {
                        if (task.id) handleDelete(task.id);
                      }}
                    >
                      <Text className="text-white text-xs font-medium">
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
