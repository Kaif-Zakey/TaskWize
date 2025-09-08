import { View, Text } from "react-native"
import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState
} from "react"
import { onAuthStateChanged, User } from "firebase/auth"
import { auth } from "@/firebase"

const AuthContext = createContext<{ user: User | null; loading: boolean }>({
  user: null,
  loading: true
})

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    const unsubcribe = onAuthStateChanged(auth, (user) => {
      setUser(user ?? null)
      setLoading(false)
    })

    return unsubcribe
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  return useContext(AuthContext)
}
// export { AuthProvider, useAuth }
