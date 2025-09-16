import { auth } from "@/firebase";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { signInWithEmailAndPassword } from "firebase/auth";

export class SessionManager {
  private static readonly KEYS = {
    EMAIL: "user_email_secure",
    PASSWORD_HASH: "user_credentials_secure",
    LOGIN_TIME: "login_timestamp",
    SESSION_ACTIVE: "session_active",
    AUTO_LOGIN: "auto_login_enabled",
  };

  // Save session data securely
  static async saveSession(email: string, password: string): Promise<void> {
    try {
      // Simple encoding for credentials (in production, use proper encryption)
      const encodedPassword = btoa(password);

      await AsyncStorage.multiSet([
        [this.KEYS.EMAIL, email],
        [this.KEYS.PASSWORD_HASH, encodedPassword],
        [this.KEYS.LOGIN_TIME, Date.now().toString()],
        [this.KEYS.SESSION_ACTIVE, "true"],
        [this.KEYS.AUTO_LOGIN, "true"],
      ]);
    } catch {
      // Failed to save session
    }
  }

  // Restore session automatically
  static async restoreSession(): Promise<boolean> {
    try {
      const sessionData = await AsyncStorage.multiGet([
        this.KEYS.EMAIL,
        this.KEYS.PASSWORD_HASH,
        this.KEYS.SESSION_ACTIVE,
        this.KEYS.AUTO_LOGIN,
      ]);

      const email = sessionData[0][1];
      const passwordHash = sessionData[1][1];
      const isActive = sessionData[2][1];
      const autoLoginEnabled = sessionData[3][1];

      // Check if we have valid session data and auto-login is enabled
      if (
        email &&
        passwordHash &&
        isActive === "true" &&
        autoLoginEnabled === "true"
      ) {
        // If Firebase user already exists, session is already restored
        if (auth.currentUser) {
          return true;
        }

        // Try to restore Firebase session
        try {
          const password = atob(passwordHash);
          await signInWithEmailAndPassword(auth, email, password);
          return true;
        } catch {
          // If authentication fails, clear invalid session
          await this.clearSession();
          return false;
        }
      }

      return !!auth.currentUser;
    } catch {
      return false;
    }
  }

  // Clear all session data
  static async clearSession(): Promise<void> {
    try {
      await AsyncStorage.multiRemove(Object.values(this.KEYS));
    } catch {
      // Error clearing session
    }
  }

  // Check if session exists
  static async hasActiveSession(): Promise<boolean> {
    try {
      const isActive = await AsyncStorage.getItem(this.KEYS.SESSION_ACTIVE);
      const autoLogin = await AsyncStorage.getItem(this.KEYS.AUTO_LOGIN);
      return isActive === "true" && autoLogin === "true";
    } catch (error) {
      return false;
    }
  }

  // Update login timestamp to keep session fresh
  static async refreshSession(): Promise<void> {
    try {
      if (await this.hasActiveSession()) {
        await AsyncStorage.setItem(this.KEYS.LOGIN_TIME, Date.now().toString());
      }
    } catch {
      // Error refreshing session
    }
  }
}
