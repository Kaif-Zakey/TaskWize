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
      }

      // Handle location monitoring when user logs in
      if (!wasLoggedIn && isNowLoggedIn) {
        console.log("👤 User logged in, initializing location monitoring");
        try {
          const initialized = await LocationMonitoringService.initialize();
          if (initialized) {
            // Restore tasks with location monitoring
            await LocationMonitoringService.restoreTasksFromFirebase(
              currentUser.uid
            );
          }
        } catch (error) {
          console.error(
            "Error initializing location monitoring after login:",
            error
          );
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
