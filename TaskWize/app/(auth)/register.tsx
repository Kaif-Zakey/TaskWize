import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Pressable,
  Alert,
  ActivityIndicator
} from "react-native"
import React, { useState } from "react"
import { useRouter } from "expo-router"
import { register } from "@/service/authService"

const Register = () => {
  const router = useRouter()
  const [email, setEmail] = useState<string>("")
  const [password, setPasword] = useState<string>("")
  const [isLodingReg, setIsLoadingReg] = useState<boolean>(false)

  const handleRegister = async () => {
    // if(!email){

    // }
    // 
    if (isLodingReg) return
    setIsLoadingReg(true)
    await register(email, password)
      .then((res) => {
        console.log(res)
        router.back()
      })
      .catch((err) => {
        console.error(err)
        Alert.alert("Registration fail", "Somthing went wrong")
        // import { Alert } from "react-native"
      })
      .finally(() => {
        setIsLoadingReg(false)
      })
  }

  return (
    <View className="flex-1 bg-gray-100 justify-center p-4">
      <Text className="text-2xl font-bold mb-6 text-blue-600 text-center">
        Register
      </Text>
      <TextInput
        placeholder="Email"
        className="bg-surface border border-gray-300 rounded px-4 py-3 mb-4 text-gray-900"
        placeholderTextColor="#9CA3AF"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        placeholder="Password"
        className="bg-surface border border-gray-300 rounded px-4 py-3 mb-4 text-gray-900"
        placeholderTextColor="#9CA3AF"
        secureTextEntry
        value={password}
        onChangeText={setPasword}
      />
      <TouchableOpacity
        className="bg-green-600 p-4 rounded mt-2"
        onPress={handleRegister}
      >
        {isLodingReg ? (
          <ActivityIndicator color="#fff" size="large" />
        ) : (
          <Text className="text-center text-2xl text-white">Register</Text>
        )}
      </TouchableOpacity>
      <Pressable onPress={() => router.back()}>
        <Text className="text-center text-blue-500 text-xl">
          Alredy have an account? Login
        </Text>
      </Pressable>
    </View>
  )
}

export default Register
