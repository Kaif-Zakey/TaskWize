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
