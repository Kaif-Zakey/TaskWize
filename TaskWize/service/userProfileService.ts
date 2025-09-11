import { db } from "@/firebase";
import {
  doc,
  DocumentReference,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";

export interface UserProfile {
  displayName: string;
  bio: string;
  location: string;
  phone: string;
  profileImage: string | null;
  createdAt?: any;
  updatedAt?: any;
}

/**
 * Save user profile to Firestore
 * @param userId - The user's unique ID from Firebase Auth
 * @param profileData - The profile data to save
 */
export const saveUserProfile = async (
  userId: string,
  profileData: UserProfile
): Promise<void> => {
  if (!userId) {
    throw new Error("User ID is required");
  }

  if (!profileData) {
    throw new Error("Profile data is required");
  }

  try {
    const userDocRef: DocumentReference = doc(db, "userProfiles", userId);

    // Check if document exists
    const docSnap = await getDoc(userDocRef);

    if (docSnap.exists()) {
      // Update existing profile
      await updateDoc(userDocRef, {
        ...profileData,
        updatedAt: serverTimestamp(),
      });
      console.log(`✅ User profile updated for userId: ${userId}`);
    } else {
      // Create new profile
      await setDoc(userDocRef, {
        ...profileData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      console.log(`✅ New user profile created for userId: ${userId}`);
    }
  } catch (error) {
    console.error("❌ Error saving user profile to Firestore:", error);
    throw new Error("Failed to save profile data");
  }
};

/**
 * Load user profile from Firestore
 * @param userId - The user's unique ID from Firebase Auth
 * @returns UserProfile data or null if not found
 */
export const loadUserProfile = async (
  userId: string
): Promise<UserProfile | null> => {
  if (!userId) {
    throw new Error("User ID is required");
  }

  try {
    const userDocRef: DocumentReference = doc(db, "userProfiles", userId);
    const docSnap = await getDoc(userDocRef);

    if (docSnap.exists()) {
      const data = docSnap.data() as UserProfile;
      console.log(`✅ User profile loaded for userId: ${userId}`);
      return data;
    } else {
      console.log(`📄 No user profile found for userId: ${userId}`);
      return null;
    }
  } catch (error) {
    console.error("❌ Error loading user profile from Firestore:", error);
    throw new Error("Failed to load profile data");
  }
};

/**
 * Update specific fields in user profile
 * @param userId - The user's unique ID from Firebase Auth
 * @param updates - Partial profile data to update
 */
export const updateUserProfile = async (
  userId: string,
  updates: Partial<UserProfile>
): Promise<void> => {
  try {
    const userDocRef: DocumentReference = doc(db, "userProfiles", userId);
    await updateDoc(userDocRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });

    console.log("✅ User profile updated successfully in Firestore");
  } catch (error) {
    console.error("❌ Error updating user profile in Firestore:", error);
    throw new Error("Failed to update profile data");
  }
};
