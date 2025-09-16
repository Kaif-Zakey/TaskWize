import { auth } from "@/firebase";
import LocationMonitoringService from "@/service/locationMonitoringService";
import { SessionManager } from "@/service/sessionManager";
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

      // Clear all session data using SessionManager
      await SessionManager.clearSession();

      // Sign out from Firebase
      await signOut(auth);
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  useEffect(() => {
    let isMounted = true;

    // Session restoration using SessionManager
    const restoreSessionFromStorage = async () => {
      try {
        // Try to restore session using SessionManager
        const sessionRestored = await SessionManager.restoreSession();

        if (sessionRestored && auth.currentUser && !user) {
          setUser(auth.currentUser);
          setLoading(false);
          return true;
        }

        // If no session or restoration failed, check Firebase auth state
        if (!auth.currentUser) {
          // Give Firebase time to restore session automatically
          setTimeout(() => {
            if (auth.currentUser) {
              setUser(auth.currentUser);
            }
            setLoading(false);
          }, 1500);
          return false;
        }

        return !!auth.currentUser;
      } catch (error) {
        console.error("Error restoring session:", error);
        setLoading(false);
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

      // Check if this is a restored session and verify token
      if (currentUser && isInitializing) {
        try {
          await currentUser.getIdToken(true); // Force refresh token
        } catch (error) {
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

      // Handle location monitoring cleanup when user logs out
      if (wasLoggedIn && !isNowLoggedIn) {
        LocationMonitoringService.handleUserLogout();
      }

      // Mark initialization as complete
      if (isInitializing) {
        setIsInitializing(false);
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
