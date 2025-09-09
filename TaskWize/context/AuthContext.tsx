import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { onAuthStateChanged, User, signOut } from "firebase/auth";
import { auth } from "@/firebase";
import LocationMonitoringService from "@/service/locationMonitoringService";

const AuthContext = createContext<{
  user: User | null;
  loading: boolean;
  logout: () => Promise<void>;
}>({
  user: null,
  loading: true,
  logout: async () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const logout = async () => {
    // Clean up location monitoring before signing out
    LocationMonitoringService.handleUserLogout();
    await signOut(auth);
  };

  useEffect(() => {
    const unsubcribe = onAuthStateChanged(auth, (currentUser) => {
      const wasLoggedIn = user !== null;
      const isNowLoggedIn = currentUser !== null;

      setUser(currentUser ?? null);
      setLoading(false);

      // Handle location monitoring cleanup when user logs out (not during initial load)
      if (wasLoggedIn && !isNowLoggedIn) {
        LocationMonitoringService.handleUserLogout();
      }
    });

    return unsubcribe;
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
// export { AuthProvider, useAuth }
