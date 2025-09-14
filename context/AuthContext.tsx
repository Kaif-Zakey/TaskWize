import { auth } from "@/firebase";
import LocationMonitoringService from "@/service/locationMonitoringService";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

// AsyncStorage keys
const STORAGE_KEYS = {
  USER_DATA: "@taskwize_user_data",
  IS_LOGGED_IN: "@taskwize_is_logged_in",
  USER_PREFERENCES: "@taskwize_user_preferences",
};

interface StoredUserData {
  uid: string;
  email: string | null;
  displayName: string | null;
  lastLoginTime: string;
}

const AuthContext = createContext<{
  user: User | null;
  loading: boolean;
  logout: () => Promise<void>;
  isInitializing: boolean;
}>({
  user: null,
  loading: true,
  logout: async () => {},
  isInitializing: true,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);
  const previousUserRef = useRef<User | null>(null);

  // Store user data in AsyncStorage
  const storeUserData = async (userData: User) => {
    try {
      const storedData: StoredUserData = {
        uid: userData.uid,
        email: userData.email,
        displayName: userData.displayName,
        lastLoginTime: new Date().toISOString(),
      };

      await AsyncStorage.multiSet([
        [STORAGE_KEYS.USER_DATA, JSON.stringify(storedData)],
        [STORAGE_KEYS.IS_LOGGED_IN, "true"],
      ]);
    } catch {
      // Silent error handling in production
    }
  };

  // Clear user data from AsyncStorage
  const clearUserData = async () => {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.USER_DATA,
        STORAGE_KEYS.IS_LOGGED_IN,
        STORAGE_KEYS.USER_PREFERENCES,
      ]);
    } catch {
      // Silent error handling in production
    }
  };

  // Check if user was previously logged in
  const checkStoredAuth = async () => {
    try {
      const isLoggedIn = await AsyncStorage.getItem(STORAGE_KEYS.IS_LOGGED_IN);
      const storedUserData = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);

      if (isLoggedIn === "true" && storedUserData) {
        // Firebase will handle the actual auth state via onAuthStateChanged
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const logout = async () => {
    try {
      // Clean up location monitoring before signing out
      LocationMonitoringService.handleUserLogout();

      // Clear AsyncStorage
      await clearUserData();

      // Sign out from Firebase
      await signOut(auth);
    } catch {
      // Silent error handling in production
    }
  };

  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      try {
        // Check if user was previously logged in
        await checkStoredAuth();
      } catch {
        // Silent error handling in production
      } finally {
        if (isMounted) {
          setIsInitializing(false);
        }
      }
    };

    initializeAuth();

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!isMounted) return;

      const previousUser = previousUserRef.current;
      const wasLoggedIn = previousUser !== null;
      const isNowLoggedIn = currentUser !== null;

      // Update the ref before setting state
      previousUserRef.current = currentUser;

      setUser(currentUser ?? null);
      setLoading(false);

      if (currentUser) {
        // User is logged in - store their data
        await storeUserData(currentUser);
      } else {
        // User is logged out
        if (wasLoggedIn) {
          // Clear stored data only if user was previously logged in
          await clearUserData();
        }
      }

      // Handle location monitoring cleanup when user logs out (not during initial load)
      if (wasLoggedIn && !isNowLoggedIn) {
        LocationMonitoringService.handleUserLogout();
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, logout, isInitializing }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
// export { AuthProvider, useAuth }
