declare module "firebase/auth/react-native" {
  import { Auth } from "firebase/auth";
  export function initializeAuth(app: any, options?: any): Auth;
  export function getReactNativePersistence(storage: any): any;
}
