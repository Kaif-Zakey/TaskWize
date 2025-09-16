# Quick Fix for Production Authentication Persistence

## Issue

Users are getting logged out when closing and reopening the app in production builds, even though authentication persistence is configured.

## Root Cause

React Native production builds sometimes don't properly restore Firebase authentication state, especially on Android devices with aggressive battery optimization.

## Immediate Solution

### 1. Test Current Build

First, test your current build with these steps:

1. **Install the APK** from the build that just completed
2. **Login to the app**
3. **Check AsyncStorage data** - You should see these logs:
   - `✅ User session stored to AsyncStorage`
   - `✅ Login successful, session data stored`
4. **Close the app completely** (not just minimize)
5. **Reopen the app**
6. **Check logs** for:
   - `🔍 Checking stored session...`
   - `🔄 Firebase user exists, restoring to state` (if working)
   - OR `⚠️ Stored session found but no Firebase auth, waiting for restoration...`

### 2. Debug Steps

If the authentication still doesn't persist:

**Step A: Check Storage Permissions**

```javascript
// Add this to your login screen to debug
import AsyncStorage from "@react-native-async-storage/async-storage";

const debugStorage = async () => {
  try {
    await AsyncStorage.setItem("test", "value");
    const value = await AsyncStorage.getItem("test");
    console.log("AsyncStorage test:", value); // Should print 'value'
  } catch (error) {
    console.error("AsyncStorage error:", error);
  }
};
```

**Step B: Check Firebase Initialization**

```javascript
// Add this to your app start
import { auth } from "@/firebase";

console.log("Firebase Auth initialized:", !!auth);
console.log("Current user on start:", !!auth.currentUser);
```

### 3. Alternative Persistence Method

If the current approach still doesn't work, here's a more aggressive backup method:

**Create: `service/sessionManager.ts`**

```typescript
import AsyncStorage from "@react-native-async-storage/async-storage";
import { auth } from "@/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";

export class SessionManager {
  private static readonly KEYS = {
    EMAIL: "user_email",
    PASSWORD_HASH: "user_pass_hash", // Store encrypted
    LOGIN_TIME: "login_time",
    SESSION_ACTIVE: "session_active",
  };

  static async saveSession(email: string, password: string) {
    try {
      await AsyncStorage.multiSet([
        [this.KEYS.EMAIL, email],
        [this.KEYS.PASSWORD_HASH, btoa(password)], // Basic encoding
        [this.KEYS.LOGIN_TIME, Date.now().toString()],
        [this.KEYS.SESSION_ACTIVE, "true"],
      ]);
      console.log("✅ Session saved to storage");
    } catch (error) {
      console.error("Failed to save session:", error);
    }
  }

  static async restoreSession(): Promise<boolean> {
    try {
      const sessionData = await AsyncStorage.multiGet([
        this.KEYS.EMAIL,
        this.KEYS.PASSWORD_HASH,
        this.KEYS.SESSION_ACTIVE,
      ]);

      const email = sessionData[0][1];
      const passwordHash = sessionData[1][1];
      const isActive = sessionData[2][1];

      if (email && passwordHash && isActive === "true" && !auth.currentUser) {
        console.log("🔄 Attempting to restore session for:", email);

        try {
          const password = atob(passwordHash);
          await signInWithEmailAndPassword(auth, email, password);
          console.log("✅ Session restored successfully");
          return true;
        } catch (authError) {
          console.error("Failed to restore session:", authError);
          await this.clearSession();
          return false;
        }
      }

      return !!auth.currentUser;
    } catch (error) {
      console.error("Error restoring session:", error);
      return false;
    }
  }

  static async clearSession() {
    try {
      await AsyncStorage.multiRemove(Object.values(this.KEYS));
      console.log("🗑️ Session cleared");
    } catch (error) {
      console.error("Error clearing session:", error);
    }
  }
}
```

## 4. Implementation

**Update your login function:**

```typescript
// In your login screen
import { SessionManager } from "@/service/sessionManager";

const handleLogin = async (email: string, password: string) => {
  try {
    await login(email, password); // Your existing login
    await SessionManager.saveSession(email, password); // Backup method
  } catch (error) {
    console.error("Login failed:", error);
  }
};
```

**Update your AuthContext:**

```typescript
// In AuthContext.tsx, add to the useEffect
useEffect(() => {
  const initAuth = async () => {
    // First try normal Firebase restoration
    if (!auth.currentUser) {
      // If no Firebase user, try backup restoration
      await SessionManager.restoreSession();
    }
  };

  initAuth();
}, []);
```

## 5. Test Again

1. Build new APK with SessionManager
2. Login → Close app → Reopen (should stay logged in)
3. Check logs for session restoration messages

## Security Note

The backup method stores encoded credentials locally. For production:

- Consider using device keychain/keystore
- Implement proper encryption
- Add session expiration (7-30 days)

This backup method ensures users stay logged in even if Firebase auth fails to persist.
