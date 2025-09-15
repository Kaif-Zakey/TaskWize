import { auth } from "@/firebase";
import LocationMonitoringService from "@/service/locationMonitoringService";
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

      // Sign out from Firebase (this will automatically clear persistence)
      await signOut(auth);
    } catch {
      // Silent error handling in production
    }
  };

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

  useEffect(() => {
    let isMounted = true;

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!isMounted) return;

      console.log(
        "🔄 Auth state changed:",
        currentUser ? `User logged in: ${currentUser.uid}` : "User logged out"
      );

      // Debug: Check if this is a restored session
      if (currentUser && isInitializing) {
        console.log("🔄 User session restored from persistence!");
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
        console.log("� User logged out, cleaning up location monitoring");
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
  }, [isInitializing]);

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
