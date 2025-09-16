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

// Initialize Auth with React Native persistence
// Firebase v12+ automatically uses AsyncStorage in React Native environments
export const auth = initializeAuth(app);

// Enhanced session persistence with AsyncStorage
auth.onAuthStateChanged(async (user) => {
  try {
    if (user) {
      // Store essential user data for session persistence
      await AsyncStorage.setItem(
        "firebaseUser",
        JSON.stringify({
          uid: user.uid,
          email: user.email,
          emailVerified: user.emailVerified,
          timestamp: Date.now(),
        })
      );
      // Get and store fresh token for compatibility
      const token = await user.getIdToken();
      await AsyncStorage.setItem("firebaseToken", token);
      await AsyncStorage.setItem("userToken", token);
      await AsyncStorage.setItem("userId", user.uid);
    } else {
      // Clear all session data when user logs out
      await AsyncStorage.multiRemove([
        "firebaseUser",
        "firebaseToken",
        "userToken",
        "userId",
      ]);
    }
  } catch {
    // Silent error handling for AsyncStorage operations
  }
});

export const db = getFirestore(app);
