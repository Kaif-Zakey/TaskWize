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
    } catch {
      // Error during logout
    }
  };

  useEffect(() => {
    let isMounted = true;

    // Improved session restoration
    const restoreSessionFromStorage = async () => {
      try {
        // Check if Firebase already has the user authenticated
        if (auth.currentUser) {
          setUser(auth.currentUser);
          setLoading(false);
          return true;
        }

        // Try to restore session using SessionManager as backup
        const sessionRestored = await SessionManager.restoreSession();

        if (sessionRestored && auth.currentUser) {
          setUser(auth.currentUser);
          setLoading(false);
          return true;
        }

        // No session to restore
        setLoading(false);
        return false;
      } catch {
        setLoading(false);
        return false;
      }
    };

    // Initialize authentication state
    const initializeAuth = async () => {
      // First try to restore from storage
      await restoreSessionFromStorage();
    };

    initializeAuth();

    // Listen for auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!isMounted) return;

      try {
        // Verify token if user is authenticated and this is initial load
        if (currentUser && isInitializing) {
          try {
            await currentUser.getIdToken(true); // Force refresh to verify token
          } catch {
            // Token is invalid, sign out
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
      } catch {
        // Error in auth state change handler
        setUser(null);
        setLoading(false);
        if (isInitializing) {
          setIsInitializing(false);
        }
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [isInitializing]);

  const initializeLocationMonitoring = async () => {
    if (!user) return;

    try {
      const initialized = await LocationMonitoringService.initialize();
      if (initialized) {
        await LocationMonitoringService.startLocationMonitoring();
      }
    } catch {
      // Error setting up location monitoring
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
