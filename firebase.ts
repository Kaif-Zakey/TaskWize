import AsyncStorage from "@react-native-async-storage/async-storage";
import { initializeApp } from "firebase/app";
import { initializeAuth } from "firebase/auth";
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

// Initialize Auth with proper persistence for React Native
// Note: Firebase 12.x uses different persistence API than older versions
export const auth = initializeAuth(app, {
  // Default persistence should work for React Native
  // AsyncStorage is automatically used by Firebase in React Native environments
});

// Store auth state in AsyncStorage for additional persistence
auth.onAuthStateChanged(async (user) => {
  try {
    if (user) {
      // Store user session info
      await AsyncStorage.setItem("userToken", await user.getIdToken());
      await AsyncStorage.setItem("userId", user.uid);
    } else {
      // Clear stored session
      await AsyncStorage.removeItem("userToken");
      await AsyncStorage.removeItem("userId");
    }
  } catch {
    // Error managing AsyncStorage session
  }
});

export const db = getFirestore(app);
