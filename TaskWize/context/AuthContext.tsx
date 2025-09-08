import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { onAuthStateChanged, User, signOut } from "firebase/auth";
import { auth } from "@/firebase";

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
    await signOut(auth);
  };

  useEffect(() => {
    const unsubcribe = onAuthStateChanged(auth, (user) => {
      setUser(user ?? null);
      setLoading(false);
    });

    return unsubcribe;
  }, []);

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
