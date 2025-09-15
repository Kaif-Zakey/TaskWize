import { db } from "@/firebase";
import Task from "@/src/types/task";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  updateDoc,
  where,
} from "firebase/firestore";

// tasks
export const tasksRef = collection(db, "tasks");

// Utility function to get default category from preferences
export const getDefaultTaskCategory = async (): Promise<string> => {
  try {
    const savedPreferences = await AsyncStorage.getItem("appPreferences");
    if (savedPreferences) {
      const preferences = JSON.parse(savedPreferences);
      const defaultCategory = preferences.defaultTaskCategory || "Work";

      // Convert display names to lowercase values used in TaskForm
      const categoryMap: { [key: string]: string } = {
        Work: "work",
        Personal: "personal",
        Shopping: "shopping",
        Health: "health",
        Education: "education",
        Finance: "finance",
      };

      return categoryMap[defaultCategory] || "work";
    }
    return "work"; // Default fallback
  } catch (error) {
    console.error("Error loading default task category:", error);
    return "work"; // Default fallback
  }
};

export const getAllTaskByUserId = async (userId: string) => {
  const q = query(tasksRef, where("userId", "==", userId));

  const querySnapshot = await getDocs(q);
  const taskList = querySnapshot.docs.map((taskRef) => ({
    id: taskRef.id,
    ...taskRef.data(),
  })) as Task[];
  return taskList;
};

export const createTask = async (task: Task) => {
  // If no category is provided, use the default category from preferences
  let finalCategory = task.category;
  if (!finalCategory || finalCategory.trim() === "") {
    finalCategory = await getDefaultTaskCategory();
  }

  // Normalize location data structure
  let normalizedLocation = null;
  if (task.location) {
    console.log("📍 Creating task with location data:", task.location);

    // Handle potential coords structure from LocationPicker
    const taskLocationAny = task.location as any;
    if (taskLocationAny.coords) {
      // Handle location data coming from LocationPicker with coords structure
      normalizedLocation = {
        latitude: taskLocationAny.coords.latitude,
        longitude: taskLocationAny.coords.longitude,
        range: task.location.range || 100,
        address: task.location.address || "",
        name: task.location.name || "",
      };
      console.log("📍 Normalized from coords structure:", normalizedLocation);
    } else if (task.location.latitude && task.location.longitude) {
      // Handle location data already in correct format
      normalizedLocation = {
        latitude: task.location.latitude,
        longitude: task.location.longitude,
        range: task.location.range || 100,
        address: task.location.address || "",
        name: task.location.name || "",
      };
      console.log("📍 Used direct structure:", normalizedLocation);
    } else {
      console.log("⚠️ Location data provided but no valid coordinates found");
    }
  }

  const taskWithTimestamps = {
    ...task,
    category: finalCategory,
    location: normalizedLocation,
    notifyOnLocation:
      task.notifyOnLocation ?? (normalizedLocation ? true : false),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: task.status || "pending",
  };

  console.log("📝 Final task data before saving:", {
    title: taskWithTimestamps.title,
    location: taskWithTimestamps.location,
    notifyOnLocation: taskWithTimestamps.notifyOnLocation,
  });

  // Remove undefined values to prevent Firebase errors
  const cleanedTask = Object.fromEntries(
    Object.entries(taskWithTimestamps).filter(
      ([_, value]) => value !== undefined
    )
  );

  const docRef = await addDoc(tasksRef, cleanedTask);
  return docRef.id;
};

export const getAllTask = async () => {
  const snapshot = await getDocs(tasksRef);
  return snapshot.docs.map((task) => ({
    id: task.id,
    ...task.data(),
  })) as Task[];
};

export const getTaskById = async (id: string) => {
  const taskDocRef = doc(db, "tasks", id);
  const snapshot = await getDoc(taskDocRef);
  return snapshot.exists()
    ? ({
        id: snapshot.id,
        ...snapshot.data(),
      } as Task)
    : null;
};

export const deleteTask = async (id: string, userId?: string) => {
  try {
    if (!id) {
      throw new Error("Task ID is required for deletion");
    }

    const taskDocRef = doc(db, "tasks", id);

    // Check if task exists and verify ownership
    const taskSnapshot = await getDoc(taskDocRef);
    if (!taskSnapshot.exists()) {
      throw new Error("Task not found");
    }

    const taskData = taskSnapshot.data();

    // Verify user ownership if userId is provided
    if (userId && taskData.userId !== userId) {
      throw new Error("Not authorized to delete this task");
    }

    // Note: Location monitoring will automatically stop tracking this task when it's deleted

    // Delete the task
    await deleteDoc(taskDocRef);

    return { success: true, id };
  } catch (error) {
    throw error;
  }
};

export const updateTask = async (id: string, task: Task) => {
  const taskDocRef = doc(db, "tasks", id);
  const { id: _id, ...taskData } = task; // remove id

  // Normalize location data structure for updates too
  let normalizedLocation = taskData.location;
  if (taskData.location) {
    const taskLocationAny = taskData.location as any;
    if (taskLocationAny.coords) {
      // Handle location data coming from LocationPicker with coords structure
      normalizedLocation = {
        latitude: taskLocationAny.coords.latitude,
        longitude: taskLocationAny.coords.longitude,
        range: taskData.location.range || 100,
        address: taskData.location.address || "",
        name: taskData.location.name || "",
      };
    } else if (taskData.location.latitude && taskData.location.longitude) {
      // Already in correct format
      normalizedLocation = {
        latitude: taskData.location.latitude,
        longitude: taskData.location.longitude,
        range: taskData.location.range || 100,
        address: taskData.location.address || "",
        name: taskData.location.name || "",
      };
    }
  }

  const taskWithTimestamp = {
    ...taskData,
    location: normalizedLocation,
    notifyOnLocation:
      taskData.notifyOnLocation ?? (normalizedLocation ? true : false),
    updatedAt: new Date().toISOString(),
  };

  // Remove undefined values to prevent Firebase errors
  const cleanedTask = Object.fromEntries(
    Object.entries(taskWithTimestamp).filter(
      ([_, value]) => value !== undefined
    )
  );

  // Note: Location monitoring will automatically handle task status changes in the next interval

  return updateDoc(taskDocRef, cleanedTask);
};

// New helper functions for TaskWize features

export const getTasksByStatus = async (
  userId: string,
  status: "pending" | "completed"
) => {
  const q = query(
    tasksRef,
    where("userId", "==", userId),
    where("status", "==", status)
  );

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((taskRef) => ({
    id: taskRef.id,
    ...taskRef.data(),
  })) as Task[];
};

export const getTasksByCategory = async (userId: string, category: string) => {
  const q = query(
    tasksRef,
    where("userId", "==", userId),
    where("category", "==", category)
  );

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((taskRef) => ({
    id: taskRef.id,
    ...taskRef.data(),
  })) as Task[];
};

export const getTasksWithLocation = async (userId: string) => {
  const q = query(tasksRef, where("userId", "==", userId));
  const querySnapshot = await getDocs(q);

  return querySnapshot.docs
    .map(
      (taskRef) =>
        ({
          id: taskRef.id,
          ...taskRef.data(),
        }) as Task
    )
    .filter((task) => task.location);
};

export const toggleTaskStatus = async (taskId: string) => {
  const task = await getTaskById(taskId);
  if (task) {
    const newStatus = task.status === "completed" ? "pending" : "completed";
    await updateTask(taskId, { ...task, status: newStatus });
    return newStatus;
  }
  return null;
};

// Dashboard Statistics Functions
export const getTaskStatistics = async (userId: string) => {
  const tasks = await getAllTaskByUserId(userId);

  const stats = {
    total: tasks.length,
    completed: tasks.filter((task) => task.status === "completed").length,
    pending: tasks.filter((task) => task.status === "pending").length,
    highPriority: tasks.filter(
      (task) => task.priority === "high" && task.status === "pending"
    ).length,
    withLocation: tasks.filter((task) => task.location).length,
    byCategory: tasks.reduce(
      (acc, task) => {
        const category = task.category || "Other";
        acc[category] = (acc[category] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    ),
    completionRate:
      tasks.length > 0
        ? Math.round(
            (tasks.filter((task) => task.status === "completed").length /
              tasks.length) *
              100
          )
        : 0,
  };

  return stats;
};

export const getRecentTasks = async (userId: string, limit: number = 5) => {
  const tasks = await getAllTaskByUserId(userId);

  return tasks
    .filter((task) => task.status === "pending")
    .sort(
      (a, b) =>
        new Date(b.createdAt || "").getTime() -
        new Date(a.createdAt || "").getTime()
    )
    .slice(0, limit);
};

export const getUpcomingTasks = async (userId: string) => {
  const tasks = await getAllTaskByUserId(userId);
  const now = new Date();

  return tasks
    .filter((task) => task.status === "pending" && task.dueDate)
    .filter((task) => new Date(task.dueDate!) >= now)
    .sort(
      (a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime()
    )
    .slice(0, 5);
};

export const getOverdueTasks = async (userId: string) => {
  const tasks = await getAllTaskByUserId(userId);
  const now = new Date();

  return tasks
    .filter((task) => task.status === "pending" && task.dueDate)
    .filter((task) => new Date(task.dueDate!) < now);
};
