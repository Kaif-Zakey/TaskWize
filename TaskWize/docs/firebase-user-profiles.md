# User Profile Firebase Collection

This document explains how user profile data is stored and managed in Firebase Firestore.

## Collection Structure

### Collection Name: `userProfiles`

### Document Structure

Each user profile is stored as a document with the user's Firebase Auth UID as the document ID.

```typescript
{
  displayName: string; // User's display name
  bio: string; // User's bio/description
  location: string; // User's location
  phone: string; // User's phone number
  profileImage: string | null; // URL to profile image or null
  createdAt: Timestamp; // When the profile was first created
  updatedAt: Timestamp; // When the profile was last updated
}
```

## Firestore Rules (Recommended)

To secure user profiles, add these rules to your Firestore:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read and write their own profile
    match /userProfiles/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## Usage Examples

### Load User Profile

```typescript
import { loadUserProfile } from "@/service/userProfileService";

const userId = user.uid; // From Firebase Auth
const profile = await loadUserProfile(userId);
if (profile) {
  console.log("Profile loaded:", profile);
} else {
  console.log("No profile found for user");
}
```

### Save User Profile

```typescript
import { saveUserProfile } from "@/service/userProfileService";

const userId = user.uid; // From Firebase Auth
const profileData = {
  displayName: "John Doe",
  bio: "Software Developer",
  location: "New York, NY",
  phone: "+1234567890",
  profileImage: "https://example.com/image.jpg",
};

await saveUserProfile(userId, profileData);
```

### Update Profile Fields

```typescript
import { updateUserProfile } from "@/service/userProfileService";

const userId = user.uid; // From Firebase Auth
const updates = {
  bio: "Updated bio",
  location: "San Francisco, CA",
};

await updateUserProfile(userId, updates);
```

## Features

- ✅ **Automatic Timestamps**: `createdAt` and `updatedAt` are automatically managed
- ✅ **Type Safety**: Full TypeScript support with proper interfaces
- ✅ **Error Handling**: Comprehensive error handling with descriptive messages
- ✅ **Validation**: Input validation for userId and profile data
- ✅ **Offline Support**: AsyncStorage backup for offline access
- ✅ **Real-time Updates**: Can be extended with real-time listeners if needed

## Data Flow

1. **Load Profile**: App loads profile from Firestore on component mount
2. **Fallback**: If no Firestore profile exists, creates initial profile from Auth data
3. **Save Profile**: User edits are saved to both Firestore and AsyncStorage
4. **Sync**: Firestore serves as the source of truth, AsyncStorage as backup

## Security Considerations

- Each user can only access their own profile document
- Document ID matches Firebase Auth UID for security
- Client-side validation should be paired with server-side rules
- Consider adding data sanitization for user inputs
