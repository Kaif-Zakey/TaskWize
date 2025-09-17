import { auth } from "@/firebase";
import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";

export const register = (email: string, password: string) => {
  return createUserWithEmailAndPassword(auth, email, password);
};

export const login = async (email: string, password: string) => {
  return signInWithEmailAndPassword(auth, email, password);
};

export const logout = async () => {
  return await signOut(auth);
};

export const resetPassword = (email: string) => {
  return sendPasswordResetEmail(auth, email);
};
