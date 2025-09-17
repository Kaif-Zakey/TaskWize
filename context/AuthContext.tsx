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
      LocationMonitoringService.handleUserLogout();
      await signOut(auth);
    } catch {
      // Error during logout
    }
  };

  useEffect(() => {
    let isMounted = true;

    // Listen for auth state changes - Firebase handles persistence automatically
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!isMounted) return;

      try {
        // Verify token if user is authenticated and this is initial load
        if (currentUser && isInitializing) {
          try {
            await currentUser.getIdToken(true);
          } catch {
            await signOut(auth);
            return;
          }
        }

        const previousUser = previousUserRef.current;
        const wasLoggedIn = previousUser !== null;
        const isNowLoggedIn = currentUser !== null;

        previousUserRef.current = currentUser;
        setUser(currentUser ?? null);
        setLoading(false);

        if (wasLoggedIn && !isNowLoggedIn) {
          LocationMonitoringService.handleUserLogout();
        }

        if (isInitializing) {
          setIsInitializing(false);
        }
      } catch {
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
