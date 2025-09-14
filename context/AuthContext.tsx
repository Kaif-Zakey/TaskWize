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

  useEffect(() => {
    let isMounted = true;

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!isMounted) return;

      console.log(
        "🔄 Auth state changed:",
        currentUser ? "User logged in" : "User logged out"
      );

      const previousUser = previousUserRef.current;
      const wasLoggedIn = previousUser !== null;
      const isNowLoggedIn = currentUser !== null;

      // Update the ref before setting state
      previousUserRef.current = currentUser;

      setUser(currentUser ?? null);
      setLoading(false);

      // Mark initialization as complete once we get the first auth state
      if (isInitializing) {
        setIsInitializing(false);
        console.log("✅ Auth initialization completed");
      }

      // Handle location monitoring when user logs in (not during initial load if already logged in)
      if (!wasLoggedIn && isNowLoggedIn) {
        console.log("👤 User logged in, initializing location monitoring");
        try {
          // Add a small delay to ensure the auth state is fully established
          setTimeout(async () => {
            const initialized = await LocationMonitoringService.initialize();
            if (initialized) {
              console.log(
                "📍 Location monitoring initialized, restoring tasks"
              );
              // Restore tasks with location monitoring
              await LocationMonitoringService.restoreTasksFromFirebase(
                currentUser.uid
              );
            } else {
              console.log("⚠️ Failed to initialize location monitoring");
            }
          }, 1000);
        } catch (error) {
          console.error(
            "Error initializing location monitoring after login:",
            error
          );
        }
      }

      // Handle case when user is already logged in on app start (restored from persistence)
      if (isInitializing && isNowLoggedIn) {
        console.log(
          "🔄 User already logged in on app start, initializing location monitoring"
        );
        try {
          // Add a delay to ensure all services are ready
          setTimeout(async () => {
            const initialized = await LocationMonitoringService.initialize();
            if (initialized) {
              console.log(
                "📍 Location monitoring initialized on app start, restoring tasks"
              );
              // Restore tasks with location monitoring
              await LocationMonitoringService.restoreTasksFromFirebase(
                currentUser.uid
              );
            } else {
              console.log(
                "⚠️ Failed to initialize location monitoring on app start"
              );
            }
          }, 2000); // Longer delay for app start
        } catch (error) {
          console.error(
            "Error initializing location monitoring on app start:",
            error
          );
        }
      }

      // Handle location monitoring cleanup when user logs out (not during initial load)
      if (wasLoggedIn && !isNowLoggedIn) {
        console.log("👋 User logged out, cleaning up location monitoring");
        LocationMonitoringService.handleUserLogout();
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [isInitializing]);

  return (
    <AuthContext.Provider value={{ user, loading, logout, isInitializing }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
