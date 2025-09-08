import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
} from "react-native";
import React, { useEffect, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { createTask, getTaskById, updateTask } from "@/service/taskService";
import { useLoader } from "@/context/LoaderContext";
import { useAuth } from "@/context/AuthContext";

const TaskFormScreen = () => {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isNew = !id || id === "new";
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [category, setCategory] = useState<string>("");
  const router = useRouter();
  const { hideLoader, showLoader } = useLoader();
  const { user } = useAuth();

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
          }
        } finally {
          hideLoader();
        }
      }
    };
    load();
  }, [id, isNew, showLoader, hideLoader]);

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert("Validation", "Title is required");
      return;
    }

    try {
      showLoader();
      if (isNew) {
        await createTask({
          title,
          description,
          userId: user?.uid,
          status: "pending",
          category: category || undefined,
        });
      } else {
        const existingTask = await getTaskById(id!);
        if (existingTask) {
          await updateTask(id!, {
            ...existingTask,
            title,
            description,
            category: category || undefined,
          });
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
    <ScrollView className="flex-1 bg-white">
      <View className="p-5">
        <Text className="text-2xl font-bold mb-4 text-gray-800">
          {isNew ? "Add Task" : "Edit Task"}
        </Text>

        <Text className="text-lg font-medium mb-2 text-gray-700">Title *</Text>
        <TextInput
          placeholder="Enter task title"
          className="border border-gray-400 p-3 mb-4 rounded-md text-base"
          value={title}
          onChangeText={setTitle}
        />

        <Text className="text-lg font-medium mb-2 text-gray-700">
          Description
        </Text>
        <TextInput
          placeholder="Enter task description"
          className="border border-gray-400 p-3 mb-4 rounded-md text-base h-20"
          value={description}
          onChangeText={setDescription}
          multiline
          textAlignVertical="top"
        />

        <Text className="text-lg font-medium mb-2 text-gray-700">Category</Text>
        <View className="flex-row flex-wrap mb-4">
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat.value}
              onPress={() =>
                setCategory(cat.value === category ? "" : cat.value)
              }
              className={`px-4 py-2 mr-2 mb-2 rounded-full border ${
                category === cat.value
                  ? "bg-blue-500 border-blue-500"
                  : "bg-gray-100 border-gray-300"
              }`}
            >
              <Text
                className={`${
                  category === cat.value ? "text-white" : "text-gray-600"
                }`}
              >
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          className="bg-blue-500 rounded-md px-6 py-4 mt-4"
          onPress={handleSubmit}
        >
          <Text className="text-xl text-white text-center font-semibold">
            {isNew ? "Add Task" : "Update Task"}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export default TaskFormScreen;
