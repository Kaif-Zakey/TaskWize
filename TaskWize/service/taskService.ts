import api from "./config/api";
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
import { db } from "@/firebase";
import { Task } from "@/app/types/task";

// tasks
export const tasksRef = collection(db, "tasks");

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
  const taskWithTimestamps = {
    ...task,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: task.status || "pending",
  };
  const docRef = await addDoc(tasksRef, taskWithTimestamps);
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

export const deleteTask = async (id: string) => {
  const taskDocRef = doc(db, "tasks", id);
  return deleteDoc(taskDocRef);
};

export const updateTask = async (id: string, task: Task) => {
  const taskDocRef = doc(db, "tasks", id);
  const { id: _id, ...taskData } = task; // remove id
  const taskWithTimestamp = {
    ...taskData,
    updatedAt: new Date().toISOString(),
  };
  return updateDoc(taskDocRef, taskWithTimestamp);
};

export const getTasks = async () => {
  const response = await api.get("/tasks");
  return response.data;
};

export const addTask = async (task: {
  title: string;
  description?: string;
}) => {
  const res = await api.post("/tasks", task);
  return res.data;
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
