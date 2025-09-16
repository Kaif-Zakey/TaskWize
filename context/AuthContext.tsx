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

const AuthContext = createContext<{
  user: User | null;
  loading: boolean;
  logout: () => Promise<void>;
  isInitializing: boolean;
  initializeLocationMonitoring: () => Promise<void>;
}>({
  user: null,
  loading: true,
  logout: async () => {},
  isInitializing: true,
  initializeLocationMonitoring: async () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);
  const previousUserRef = useRef<User | null>(null);

  const logout = async () => {
    try {
      // Clean up location monitoring before signing out
      LocationMonitoringService.handleUserLogout();

      // Clear AsyncStorage session data
      await AsyncStorage.multiRemove(["userToken", "userId"]);
      console.log("🗑️ Cleared user session from AsyncStorage");

      // Sign out from Firebase
      await signOut(auth);
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  useEffect(() => {
    let isMounted = true;

    // Enhanced session restoration for production builds
    const restoreSessionFromStorage = async () => {
      try {
        const storedToken = await AsyncStorage.getItem("userToken");
        const storedUserId = await AsyncStorage.getItem("userId");
        const lastLoginTime = await AsyncStorage.getItem("lastLoginTime");

        console.log("🔍 Checking stored session...", {
          hasToken: !!storedToken,
          hasUserId: !!storedUserId,
          hasLoginTime: !!lastLoginTime,
          currentUser: !!auth.currentUser,
        });

        if (storedToken && storedUserId) {
          // Check if we have Firebase auth but no user state
          if (auth.currentUser && !user) {
            console.log("🔄 Firebase user exists, restoring to state");
            setUser(auth.currentUser);
            setLoading(false);
            return true;
          }

          // If we have stored session but no Firebase auth, try to restore
          if (!auth.currentUser) {
            console.log(
              "⚠️ Stored session found but no Firebase auth, waiting for restoration..."
            );
            // Give Firebase time to restore the session
            setTimeout(async () => {
              if (auth.currentUser) {
                console.log("✅ Firebase session restored!");
                setUser(auth.currentUser);
              } else {
                console.log(
                  "❌ Firebase session restoration failed, clearing storage"
                );
                await AsyncStorage.multiRemove([
                  "userToken",
                  "userId",
                  "lastLoginTime",
                ]);
              }
              setLoading(false);
            }, 2000); // Wait 2 seconds for Firebase to restore
            return false;
          }
        }

        return false;
      } catch (error) {
        console.error("Error restoring session:", error);
        return false;
      }
    };

    // Check for stored session first
    const initializeAuth = async () => {
      await restoreSessionFromStorage();
    };

    initializeAuth();

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!isMounted) return;

      console.log(
        "🔄 Auth state changed:",
        currentUser ? `User logged in: ${currentUser.uid}` : "User logged out"
      );

      // Debug: Check if this is a restored session
      if (currentUser && isInitializing) {
        console.log("🔄 User session restored from Firebase persistence!");

        // Verify token is still valid
        try {
          await currentUser.getIdToken(true); // Force refresh
          console.log("✅ User token is valid and refreshed");
        } catch (error) {
          console.error("❌ User token invalid, signing out:", error);
          await signOut(auth);
          return;
        }
      }

      const previousUser = previousUserRef.current;
      const wasLoggedIn = previousUser !== null;
      const isNowLoggedIn = currentUser !== null;

      // Update the ref before setting state
      previousUserRef.current = currentUser;

      setUser(currentUser ?? null);
      setLoading(false);

      // Handle location monitoring for authenticated users
      if (isNowLoggedIn) {
        console.log("👤 User authenticated, setting up location monitoring");
        // We no longer start location monitoring here automatically
        // It will be triggered from the home/tasks screens after tasks are loaded
      }

      // Handle location monitoring cleanup when user logs out
      if (wasLoggedIn && !isNowLoggedIn) {
        console.log("🚪 User logged out, cleaning up location monitoring");
        LocationMonitoringService.handleUserLogout();
      }

      // Mark initialization as complete
      if (isInitializing) {
        setIsInitializing(false);
        console.log("✅ Auth initialization completed");
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [isInitializing, user]);

  const initializeLocationMonitoring = async () => {
    if (!user) return;

    console.log("👤 User authenticated, setting up location monitoring");
    try {
      const initialized = await LocationMonitoringService.initialize();
      if (initialized) {
        console.log("📍 Location monitoring initialized, starting monitoring");
        await LocationMonitoringService.startLocationMonitoring();
      } else {
        console.log("⚠️ Failed to initialize location monitoring");
      }
    } catch (error) {
      console.error("Error setting up location monitoring:", error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        logout,
        isInitializing,
        initializeLocationMonitoring,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
