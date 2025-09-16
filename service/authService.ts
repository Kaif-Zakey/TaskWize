import { auth } from "@/firebase";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  User,
} from "firebase/auth";
import { SessionManager } from "./sessionManager";

export const register = (email: string, password: string) => {
  return createUserWithEmailAndPassword(auth, email, password);
};

export const login = async (email: string, password: string) => {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);

    // Save session data for permanent persistence
    await SessionManager.saveSession(email, password);

    // Store additional data in AsyncStorage
    await AsyncStorage.setItem("lastLoginTime", Date.now().toString());
    await AsyncStorage.setItem("userEmail", email);

    return result;
  } catch (error) {
    console.error("Login error:", error);
    throw error;
  }
};

export const logout = async () => {
  try {
    // Clear all session data including SessionManager data
    await SessionManager.clearSession();

    // Clear additional AsyncStorage data
    await AsyncStorage.multiRemove([
      "userToken",
      "userId",
      "lastLoginTime",
      "userEmail",
    ]);

    return await signOut(auth);
  } catch (error) {
    console.error("Logout error:", error);
    throw error;
  }
};

export const resetPassword = (email: string) => {
  return sendPasswordResetEmail(auth, email);
};

// Enhanced session validation
export const validateSession = async (): Promise<boolean> => {
  try {
    const user = auth.currentUser;
    if (!user) {
      return false;
    }

    // Check if token is still valid by trying to refresh it
    const token = await user.getIdToken(true); // Force refresh

    if (token) {
      // Update stored token and refresh session
      await AsyncStorage.setItem("userToken", token);
      await SessionManager.refreshSession();
      return true;
    }

    return false;
  } catch (error) {
    // Clear invalid session data
    await SessionManager.clearSession();
    await AsyncStorage.multiRemove([
      "userToken",
      "userId",
      "lastLoginTime",
      "userEmail",
    ]);
    return false;
  }
};

// Auto session refresh
export const setupSessionRefresh = () => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      try {
        // Refresh token every time auth state changes
        const token = await user.getIdToken(true);
        await AsyncStorage.setItem("userToken", token);
        await AsyncStorage.setItem("userId", user.uid);
        await SessionManager.refreshSession();
      } catch (error) {
        console.error("Failed to refresh session:", error);
      }
    }
  });
};
