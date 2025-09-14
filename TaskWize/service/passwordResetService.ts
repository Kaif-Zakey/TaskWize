import { auth } from "@/firebase";
import { sendPasswordResetEmail } from "firebase/auth";

// Send Firebase reset email
export const sendFirebaseResetEmail = async (email: string): Promise<void> => {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error) {
    console.error("Error sending Firebase reset email:", error);
    throw new Error("Failed to send reset email");
  }
};
