import AsyncStorage from "@react-native-async-storage/async-storage";
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);

// Initialize Auth - Firebase v12 automatically handles React Native persistence
export const auth = getAuth(app);

// Store auth state in AsyncStorage for additional persistence
auth.onAuthStateChanged(async (user) => {
  try {
    if (user) {
      // Store user session info
      await AsyncStorage.setItem("userToken", await user.getIdToken());
      await AsyncStorage.setItem("userId", user.uid);
      console.log("✅ User session stored to AsyncStorage");
    } else {
      // Clear stored session
      await AsyncStorage.removeItem("userToken");
      await AsyncStorage.removeItem("userId");
      console.log("🗑️ User session cleared from AsyncStorage");
    }
  } catch (error) {
    console.error("Error managing AsyncStorage session:", error);
  }
});

export const db = getFirestore(app);
