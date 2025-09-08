import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  TextInput,
  Modal,
} from "react-native";
import React, { useState, useEffect } from "react";
import { MaterialIcons } from "@expo/vector-icons";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface UserProfile {
  displayName: string;
  bio: string;
  location: string;
  phone: string;
  profileImage: string | null;
}

const ProfileScreen = () => {
  const { user } = useAuth();
  const router = useRouter();

  const [profile, setProfile] = useState<UserProfile>({
    displayName: "",
    bio: "",
    location: "",
    phone: "",
    profileImage: null,
  });

  const [isEditing, setIsEditing] = useState(false);
  const [showImageOptions, setShowImageOptions] = useState(false);
  const [tempProfile, setTempProfile] = useState<UserProfile>(profile);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const savedProfile = await AsyncStorage.getItem("userProfile");
        if (savedProfile) {
          const parsedProfile = JSON.parse(savedProfile);
          setProfile(parsedProfile);
          setTempProfile(parsedProfile);
        } else {
          // Initialize with user data if available
          const initialProfile = {
            displayName: user?.displayName || user?.email?.split("@")[0] || "",
            bio: "",
            location: "",
            phone: "",
            profileImage: user?.photoURL || null,
          };
          setProfile(initialProfile);
          setTempProfile(initialProfile);
        }
      } catch (error) {
        console.error("Error loading profile:", error);
      }
    };

    loadProfile();
  }, [user]);

  const saveProfile = async (newProfile: UserProfile) => {
    try {
      await AsyncStorage.setItem("userProfile", JSON.stringify(newProfile));
      setProfile(newProfile);
      setTempProfile(newProfile);
      Alert.alert("Success", "Profile updated successfully!");
    } catch (error) {
      console.error("Error saving profile:", error);
      Alert.alert("Error", "Failed to save profile changes.");
    }
  };

  const requestCameraPermissions = async () => {
    const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
    const mediaLibraryPermission =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    return (
      cameraPermission.status === "granted" &&
      mediaLibraryPermission.status === "granted"
    );
  };

  const handleTakePhoto = async () => {
    const hasPermission = await requestCameraPermissions();
    if (!hasPermission) {
      Alert.alert(
        "Permission Required",
        "Camera access is required to take photos."
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const newProfile = { ...tempProfile, profileImage: result.assets[0].uri };
      setTempProfile(newProfile);
      if (!isEditing) {
        saveProfile(newProfile);
      }
      setShowImageOptions(false);
    }
  };

  const handlePickImage = async () => {
    const hasPermission = await requestCameraPermissions();
    if (!hasPermission) {
      Alert.alert(
        "Permission Required",
        "Media library access is required to select photos."
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const newProfile = { ...tempProfile, profileImage: result.assets[0].uri };
      setTempProfile(newProfile);
      if (!isEditing) {
        saveProfile(newProfile);
      }
      setShowImageOptions(false);
    }
  };

  const handleSaveChanges = () => {
    saveProfile(tempProfile);
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setTempProfile(profile);
    setIsEditing(false);
  };

  const handleRemoveImage = () => {
    const newProfile = { ...tempProfile, profileImage: null };
    setTempProfile(newProfile);
    if (!isEditing) {
      saveProfile(newProfile);
    }
    setShowImageOptions(false);
  };

  return (
    <ScrollView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white pt-16 pb-6 px-6 border-b border-gray-200">
        <View className="flex-row justify-between items-center">
          <View>
            <Text className="text-3xl font-bold text-gray-900 mb-2">
              Profile
            </Text>
            <Text className="text-gray-600">
              Manage your personal information
            </Text>
          </View>
          {!isEditing ? (
            <TouchableOpacity
              className="bg-blue-500 px-4 py-2 rounded-lg"
              onPress={() => setIsEditing(true)}
            >
              <Text className="text-white font-semibold">Edit</Text>
            </TouchableOpacity>
          ) : (
            <View className="flex-row gap-2">
              <TouchableOpacity
                className="bg-gray-500 px-3 py-2 rounded-lg"
                onPress={handleCancelEdit}
              >
                <Text className="text-white font-semibold">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="bg-green-500 px-3 py-2 rounded-lg"
                onPress={handleSaveChanges}
              >
                <Text className="text-white font-semibold">Save</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      {/* Profile Picture Section */}
      <View className="bg-white mt-6 mx-6 p-6 rounded-lg shadow-sm">
        <Text className="text-xl font-semibold text-gray-900 mb-4">
          Profile Picture
        </Text>
        <View className="items-center">
          <TouchableOpacity
            className="relative mb-4"
            onPress={() => isEditing && setShowImageOptions(true)}
          >
            {tempProfile.profileImage ? (
              <Image
                source={{ uri: tempProfile.profileImage }}
                className="w-32 h-32 rounded-full"
              />
            ) : (
              <View className="w-32 h-32 rounded-full bg-gray-200 items-center justify-center">
                <MaterialIcons name="person" size={64} color="#9ca3af" />
              </View>
            )}
            {isEditing && (
              <View className="absolute bottom-0 right-0 bg-blue-500 rounded-full p-2">
                <MaterialIcons name="camera-alt" size={20} color="white" />
              </View>
            )}
          </TouchableOpacity>
          {!isEditing && (
            <TouchableOpacity
              className="bg-blue-500 px-4 py-2 rounded-lg"
              onPress={() => setShowImageOptions(true)}
            >
              <Text className="text-white font-semibold">Change Photo</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Personal Information Section */}
      <View className="bg-white mt-6 mx-6 p-6 rounded-lg shadow-sm">
        <Text className="text-xl font-semibold text-gray-900 mb-4">
          Personal Information
        </Text>

        {/* Display Name */}
        <View className="mb-4">
          <Text className="text-sm font-medium text-gray-700 mb-2">
            Display Name
          </Text>
          {isEditing ? (
            <TextInput
              className="border border-gray-300 rounded-lg px-4 py-3 text-base"
              value={tempProfile.displayName}
              onChangeText={(text) =>
                setTempProfile({ ...tempProfile, displayName: text })
              }
              placeholder="Enter your display name"
            />
          ) : (
            <Text className="text-base text-gray-900 py-3 px-4 bg-gray-50 rounded-lg">
              {profile.displayName || "Not specified"}
            </Text>
          )}
        </View>

        {/* Bio */}
        <View className="mb-4">
          <Text className="text-sm font-medium text-gray-700 mb-2">Bio</Text>
          {isEditing ? (
            <TextInput
              className="border border-gray-300 rounded-lg px-4 py-3 text-base h-24"
              value={tempProfile.bio}
              onChangeText={(text) =>
                setTempProfile({ ...tempProfile, bio: text })
              }
              placeholder="Tell us about yourself"
              multiline
              textAlignVertical="top"
            />
          ) : (
            <Text className="text-base text-gray-900 py-3 px-4 bg-gray-50 rounded-lg min-h-[60px]">
              {profile.bio || "No bio added yet"}
            </Text>
          )}
        </View>

        {/* Location */}
        <View className="mb-4">
          <Text className="text-sm font-medium text-gray-700 mb-2">
            Location
          </Text>
          {isEditing ? (
            <TextInput
              className="border border-gray-300 rounded-lg px-4 py-3 text-base"
              value={tempProfile.location}
              onChangeText={(text) =>
                setTempProfile({ ...tempProfile, location: text })
              }
              placeholder="Enter your location"
            />
          ) : (
            <Text className="text-base text-gray-900 py-3 px-4 bg-gray-50 rounded-lg">
              {profile.location || "Not specified"}
            </Text>
          )}
        </View>

        {/* Phone */}
        <View className="mb-4">
          <Text className="text-sm font-medium text-gray-700 mb-2">
            Phone Number
          </Text>
          {isEditing ? (
            <TextInput
              className="border border-gray-300 rounded-lg px-4 py-3 text-base"
              value={tempProfile.phone}
              onChangeText={(text) =>
                setTempProfile({ ...tempProfile, phone: text })
              }
              placeholder="Enter your phone number"
              keyboardType="phone-pad"
            />
          ) : (
            <Text className="text-base text-gray-900 py-3 px-4 bg-gray-50 rounded-lg">
              {profile.phone || "Not specified"}
            </Text>
          )}
        </View>
      </View>

      {/* Account Information Section */}
      <View className="bg-white mt-6 mx-6 p-6 rounded-lg shadow-sm">
        <Text className="text-xl font-semibold text-gray-900 mb-4">
          Account Information
        </Text>

        <View className="mb-4">
          <Text className="text-sm font-medium text-gray-700 mb-2">Email</Text>
          <Text className="text-base text-gray-900 py-3 px-4 bg-gray-50 rounded-lg">
            {user?.email}
          </Text>
        </View>

        <View className="mb-4">
          <Text className="text-sm font-medium text-gray-700 mb-2">
            Member Since
          </Text>
          <Text className="text-base text-gray-900 py-3 px-4 bg-gray-50 rounded-lg">
            {user?.metadata?.creationTime
              ? new Date(user.metadata.creationTime).toLocaleDateString()
              : "Unknown"}
          </Text>
        </View>

        <TouchableOpacity
          className="flex-row items-center justify-between py-3 px-4 bg-blue-50 rounded-lg border border-blue-200"
          onPress={() => router.push("/(dashboard)/settings")}
        >
          <View className="flex-row items-center">
            <MaterialIcons name="settings" size={24} color="#3b82f6" />
            <Text className="text-blue-700 font-semibold ml-3">
              Account Settings
            </Text>
          </View>
          <MaterialIcons name="chevron-right" size={24} color="#3b82f6" />
        </TouchableOpacity>
      </View>

      {/* Statistics Section */}
      <View className="bg-white mt-6 mx-6 mb-8 p-6 rounded-lg shadow-sm">
        <Text className="text-xl font-semibold text-gray-900 mb-4">
          Profile Statistics
        </Text>

        <View className="flex-row justify-between">
          <View className="items-center flex-1">
            <Text className="text-2xl font-bold text-blue-600">0</Text>
            <Text className="text-sm text-gray-600">Tasks Created</Text>
          </View>
          <View className="items-center flex-1">
            <Text className="text-2xl font-bold text-green-600">0</Text>
            <Text className="text-sm text-gray-600">Completed</Text>
          </View>
          <View className="items-center flex-1">
            <Text className="text-2xl font-bold text-orange-600">0</Text>
            <Text className="text-sm text-gray-600">In Progress</Text>
          </View>
        </View>
      </View>

      {/* Image Options Modal */}
      <Modal
        visible={showImageOptions}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowImageOptions(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-xl p-6">
            <Text className="text-xl font-bold text-gray-900 mb-4 text-center">
              Profile Picture Options
            </Text>

            <TouchableOpacity
              className="flex-row items-center py-4 px-4 bg-blue-50 rounded-lg mb-3"
              onPress={handleTakePhoto}
            >
              <MaterialIcons name="camera-alt" size={24} color="#3b82f6" />
              <Text className="text-blue-700 font-semibold ml-3 text-lg">
                Take Photo
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-row items-center py-4 px-4 bg-green-50 rounded-lg mb-3"
              onPress={handlePickImage}
            >
              <MaterialIcons name="photo-library" size={24} color="#10b981" />
              <Text className="text-green-700 font-semibold ml-3 text-lg">
                Choose from Gallery
              </Text>
            </TouchableOpacity>

            {(tempProfile.profileImage || profile.profileImage) && (
              <TouchableOpacity
                className="flex-row items-center py-4 px-4 bg-red-50 rounded-lg mb-3"
                onPress={handleRemoveImage}
              >
                <MaterialIcons name="delete" size={24} color="#ef4444" />
                <Text className="text-red-700 font-semibold ml-3 text-lg">
                  Remove Photo
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              className="py-4 px-4 bg-gray-200 rounded-lg"
              onPress={() => setShowImageOptions(false)}
            >
              <Text className="text-gray-700 font-semibold text-center text-lg">
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

export default ProfileScreen;
