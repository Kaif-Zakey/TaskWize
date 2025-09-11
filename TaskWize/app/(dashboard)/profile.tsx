import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import {
  UserProfile as FirestoreUserProfile,
  loadUserProfile,
  saveUserProfile,
} from "@/service/userProfileService";
import { MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { CameraType, CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import * as MediaLibrary from "expo-media-library";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Image,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

// Use the Firestore UserProfile interface
type UserProfile = FirestoreUserProfile;

const ProfileScreen = () => {
  const { user } = useAuth();
  const { colors } = useTheme();

  const [profile, setProfile] = useState<UserProfile>({
    displayName: "",
    bio: "",
    location: "",
    phone: "",
    profileImage: null,
  });

  const [showImageOptions, setShowImageOptions] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<CameraType>("back");

  // Camera and media library permissions
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();

  // Camera reference
  const cameraRef = useRef<CameraView>(null);

  // Individual field editing states
  const [showNameEdit, setShowNameEdit] = useState(false);
  const [showBioEdit, setShowBioEdit] = useState(false);
  const [showLocationEdit, setShowLocationEdit] = useState(false);
  const [showPhoneEdit, setShowPhoneEdit] = useState(false);

  // Temporary field values for editing
  const [tempName, setTempName] = useState("");
  const [tempBio, setTempBio] = useState("");
  const [tempLocation, setTempLocation] = useState("");
  const [tempPhone, setTempPhone] = useState("");

  useEffect(() => {
    const loadProfile = async () => {
      if (!user?.uid) {
        console.log("❌ No user ID available");
        return;
      }

      try {
        console.log("🔄 Loading user profile from Firestore...");
        const firestoreProfile = await loadUserProfile(user.uid);

        if (firestoreProfile) {
          // Profile exists in Firestore
          console.log("✅ Profile loaded from Firestore:", firestoreProfile);
          setProfile(firestoreProfile);
        } else {
          // No profile in Firestore, create initial profile
          console.log("📝 Creating initial profile...");
          const initialProfile: UserProfile = {
            displayName: user?.displayName || user?.email?.split("@")[0] || "",
            bio: "",
            location: "",
            phone: "",
            profileImage: user?.photoURL || null,
          };
          setProfile(initialProfile);

          // Save initial profile to Firestore
          await saveUserProfile(user.uid, initialProfile);
        }
      } catch (error) {
        console.error("❌ Error loading profile:", error);
        Alert.alert("Error", "Failed to load profile data. Please try again.");
      }
    };

    loadProfile();
  }, [user]);

  // Monitor camera permission changes
  useEffect(() => {
    if (cameraPermission) {
      console.log("📱 Camera permission status:", cameraPermission.status);
    }
  }, [cameraPermission]);

  // Monitor showCamera state changes
  useEffect(() => {
    console.log("📱 showCamera state changed:", showCamera);
  }, [showCamera]);

  const saveProfile = async (newProfile: UserProfile) => {
    if (!user?.uid) {
      Alert.alert("Error", "User not authenticated. Please log in again.");
      return;
    }

    try {
      console.log("🔄 Saving profile to Firestore...", newProfile);
      await saveUserProfile(user.uid, newProfile);

      // Also save to AsyncStorage as backup
      await AsyncStorage.setItem("userProfile", JSON.stringify(newProfile));

      setProfile(newProfile);
      Alert.alert("Success", "Profile updated successfully!");
      console.log("✅ Profile saved successfully");
    } catch (error) {
      console.error("❌ Error saving profile:", error);
      Alert.alert("Error", "Failed to save profile changes. Please try again.");
    }
  };

  // Individual field editing functions
  const openNameEdit = () => {
    setTempName(profile.displayName);
    setShowNameEdit(true);
  };

  const saveNameEdit = async () => {
    const updatedProfile = { ...profile, displayName: tempName };
    await saveProfile(updatedProfile);
    setShowNameEdit(false);
  };

  const openBioEdit = () => {
    setTempBio(profile.bio);
    setShowBioEdit(true);
  };

  const saveBioEdit = async () => {
    const updatedProfile = { ...profile, bio: tempBio };
    await saveProfile(updatedProfile);
    setShowBioEdit(false);
  };

  const openLocationEdit = () => {
    setTempLocation(profile.location);
    setShowLocationEdit(true);
  };

  const saveLocationEdit = async () => {
    const updatedProfile = { ...profile, location: tempLocation };
    await saveProfile(updatedProfile);
    setShowLocationEdit(false);
  };

  const openPhoneEdit = () => {
    setTempPhone(profile.phone);
    setShowPhoneEdit(true);
  };

  const savePhoneEdit = async () => {
    const updatedProfile = { ...profile, phone: tempPhone };
    await saveProfile(updatedProfile);
    setShowPhoneEdit(false);
  };

  const requestCameraPermissions = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    return status === "granted";
  };

  const handleTakePhoto = async () => {
    console.log("🎯 Take Photo button pressed!");

    try {
      console.log("🎥 Starting camera permission check...");
      console.log("📱 Current camera permission:", cameraPermission);

      // Request camera permission if not granted
      let hasPermission = cameraPermission?.granted;

      if (!hasPermission) {
        console.log("📱 Requesting camera permission...");
        const permission = await requestCameraPermission();
        console.log("📱 Camera permission result:", permission);
        hasPermission = permission.granted;

        if (!hasPermission) {
          Alert.alert(
            "Permission Required",
            "Camera access is required to take photos."
          );
          return;
        }
      }

      // Request media library permission
      console.log("💾 Requesting media library permission...");
      const mediaPermission = await MediaLibrary.requestPermissionsAsync();
      console.log("💾 Media library permission result:", mediaPermission);

      // Don't block camera if media library permission is denied
      // We'll handle this when saving the photo
      if (!mediaPermission.granted) {
        console.log(
          "⚠️ Media library permission denied, but proceeding with camera"
        );
        Alert.alert(
          "Limited Access",
          "Photos won't be saved to gallery, but you can still take photos for your profile."
        );
      }

      console.log("✅ Camera permission granted, opening camera...");
      setShowImageOptions(false);

      // Add a small delay to ensure state updates
      setTimeout(() => {
        console.log("🎬 Setting showCamera to true");
        setShowCamera(true);
      }, 100);
    } catch (error) {
      console.error("❌ Error in handleTakePhoto:", error);
      Alert.alert("Error", "Failed to open camera. Please try again.");
    }
  };

  const takePicture = async () => {
    console.log("📸 Starting picture capture...");

    if (cameraRef.current) {
      try {
        console.log("📷 Taking picture...");
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          base64: false,
        });

        console.log("📷 Photo captured:", photo.uri);

        // Try to save to media library (optional)
        try {
          console.log("💾 Attempting to save to gallery...");
          const mediaPermission = await MediaLibrary.getPermissionsAsync();

          if (mediaPermission.granted) {
            const asset = await MediaLibrary.saveToLibraryAsync(photo.uri);
            console.log("📸 Photo saved to gallery:", asset);
          } else {
            console.log(
              "⚠️ Media library permission not granted, skipping gallery save"
            );
          }
        } catch (mediaError) {
          console.warn("⚠️ Failed to save to gallery:", mediaError);
          // Continue anyway, don't block profile update
        }

        // Update profile with new image
        console.log("🔄 Updating profile with new image...");
        const newProfile = { ...profile, profileImage: photo.uri };
        await saveProfile(newProfile);

        setShowCamera(false);
        Alert.alert("Success", "Photo captured and saved to profile!");
      } catch (error) {
        console.error("❌ Error taking picture:", error);
        Alert.alert("Error", "Failed to capture photo. Please try again.");
      }
    } else {
      console.error("❌ Camera ref is null");
      Alert.alert("Error", "Camera is not ready. Please try again.");
    }
  };

  const flipCamera = () => {
    setCameraFacing((current) => (current === "back" ? "front" : "back"));
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
      const newProfile = { ...profile, profileImage: result.assets[0].uri };
      await saveProfile(newProfile);
      setShowImageOptions(false);
    }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View
        style={{
          backgroundColor: colors.surface,
          paddingTop: 64,
          paddingBottom: 24,
          paddingHorizontal: 24,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <View>
            <Text
              style={{
                fontSize: 30,
                fontWeight: "bold",
                color: colors.text,
                marginBottom: 8,
              }}
            >
              Profile
            </Text>
            <Text style={{ color: colors.textSecondary }}>
              Manage your personal information
            </Text>
          </View>
        </View>
      </View>

      {/* Profile Picture Section */}
      <View
        style={{
          backgroundColor: colors.surface,
          marginTop: 24,
          marginHorizontal: 24,
          padding: 24,
          borderRadius: 8,
          shadowOpacity: 0.05,
          shadowRadius: 4,
          elevation: 2,
        }}
      >
        <Text
          style={{
            fontSize: 20,
            fontWeight: "600",
            color: colors.text,
            marginBottom: 16,
          }}
        >
          Profile Picture
        </Text>
        <View style={{ alignItems: "center" }}>
          <TouchableOpacity
            style={{ position: "relative", marginBottom: 16 }}
            onPress={() => setShowImageOptions(true)}
          >
            {profile.profileImage ? (
              <Image
                source={{ uri: profile.profileImage }}
                style={{
                  width: 128,
                  height: 128,
                  borderRadius: 64,
                }}
              />
            ) : (
              <View
                style={{
                  width: 128,
                  height: 128,
                  borderRadius: 64,
                  backgroundColor: colors.border,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <MaterialIcons
                  name="person"
                  size={64}
                  color={colors.textSecondary}
                />
              </View>
            )}
            <View
              style={{
                position: "absolute",
                bottom: 0,
                right: 0,
                backgroundColor: colors.primary,
                borderRadius: 16,
                padding: 8,
              }}
            >
              <MaterialIcons name="camera-alt" size={20} color="white" />
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Personal Information Section */}
      <View
        style={{
          backgroundColor: colors.surface,
          marginTop: 24,
          marginHorizontal: 24,
          padding: 24,
          borderRadius: 8,
          shadowOpacity: 0.05,
          shadowRadius: 4,
          elevation: 2,
        }}
      >
        <Text
          style={{
            fontSize: 20,
            fontWeight: "600",
            color: colors.text,
            marginBottom: 16,
          }}
        >
          Personal Information
        </Text>

        {/* Display Name */}
        <View style={{ marginBottom: 16 }}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 8,
            }}
          >
            <Text
              style={{
                fontSize: 14,
                fontWeight: "500",
                color: colors.text,
              }}
            >
              Display Name
            </Text>
            <TouchableOpacity onPress={openNameEdit}>
              <MaterialIcons name="edit" size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>
          <Text
            style={{
              fontSize: 16,
              color: colors.text,
              paddingVertical: 12,
              paddingHorizontal: 16,
              backgroundColor: colors.background,
              borderRadius: 8,
            }}
          >
            {profile.displayName || "Not specified"}
          </Text>
        </View>

        {/* Bio */}
        <View style={{ marginBottom: 16 }}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 8,
            }}
          >
            <Text
              style={{
                fontSize: 14,
                fontWeight: "500",
                color: colors.text,
              }}
            >
              Bio
            </Text>
            <TouchableOpacity onPress={openBioEdit}>
              <MaterialIcons name="edit" size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>
          <Text
            style={{
              fontSize: 16,
              color: colors.text,
              paddingVertical: 12,
              paddingHorizontal: 16,
              backgroundColor: colors.background,
              borderRadius: 8,
              minHeight: 60,
            }}
          >
            {profile.bio || "No bio added yet"}
          </Text>
        </View>

        {/* Location */}
        <View style={{ marginBottom: 16 }}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 8,
            }}
          >
            <Text
              style={{
                fontSize: 14,
                fontWeight: "500",
                color: colors.text,
              }}
            >
              Location
            </Text>
            <TouchableOpacity onPress={openLocationEdit}>
              <MaterialIcons name="edit" size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>
          <Text
            style={{
              fontSize: 16,
              color: colors.text,
              paddingVertical: 12,
              paddingHorizontal: 16,
              backgroundColor: colors.background,
              borderRadius: 8,
            }}
          >
            {profile.location || "Not specified"}
          </Text>
        </View>

        {/* Phone */}
        <View style={{ marginBottom: 16 }}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 8,
            }}
          >
            <Text
              style={{
                fontSize: 14,
                fontWeight: "500",
                color: colors.text,
              }}
            >
              Phone Number
            </Text>
            <TouchableOpacity onPress={openPhoneEdit}>
              <MaterialIcons name="edit" size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>
          <Text
            style={{
              fontSize: 16,
              color: colors.text,
              paddingVertical: 12,
              paddingHorizontal: 16,
              backgroundColor: colors.background,
              borderRadius: 8,
            }}
          >
            {profile.phone || "Not specified"}
          </Text>
        </View>
      </View>

      {/* Account Information Section */}
      <View
        style={{
          backgroundColor: colors.surface,
          marginTop: 24,
          marginHorizontal: 24,
          padding: 24,
          borderRadius: 8,
          shadowOpacity: 0.05,
          shadowRadius: 4,
          elevation: 2,
        }}
      >
        <Text
          style={{
            fontSize: 20,
            fontWeight: "600",
            color: colors.text,
            marginBottom: 16,
          }}
        >
          Account Information
        </Text>

        <View style={{ marginBottom: 16 }}>
          <Text
            style={{
              fontSize: 14,
              fontWeight: "500",
              color: colors.text,
              marginBottom: 8,
            }}
          >
            Email
          </Text>
          <Text
            style={{
              fontSize: 16,
              color: colors.text,
              paddingVertical: 12,
              paddingHorizontal: 16,
              backgroundColor: colors.background,
              borderRadius: 8,
            }}
          >
            {user?.email}
          </Text>
        </View>

        <View style={{ marginBottom: 16 }}>
          <Text
            style={{
              fontSize: 14,
              fontWeight: "500",
              color: colors.text,
              marginBottom: 8,
            }}
          >
            Member Since
          </Text>
          <Text
            style={{
              fontSize: 16,
              color: colors.text,
              paddingVertical: 12,
              paddingHorizontal: 16,
              backgroundColor: colors.background,
              borderRadius: 8,
            }}
          >
            {new Date(user?.metadata?.creationTime || "").toLocaleDateString()}
          </Text>
        </View>
      </View>

      {/* Image Options Modal */}
      <Modal
        visible={showImageOptions}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowImageOptions(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.5)",
            justifyContent: "flex-end",
          }}
        >
          <View
            style={{
              backgroundColor: colors.surface,
              paddingTop: 24,
              paddingBottom: 40,
              paddingHorizontal: 24,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
            }}
          >
            <Text
              style={{
                fontSize: 18,
                fontWeight: "600",
                color: colors.text,
                marginBottom: 20,
                textAlign: "center",
              }}
            >
              Choose Photo Option
            </Text>

            <TouchableOpacity
              style={{
                backgroundColor: colors.primary,
                padding: 16,
                borderRadius: 8,
                marginBottom: 12,
                alignItems: "center",
              }}
              onPress={() => {
                console.log("🔥 Button pressed - calling handleTakePhoto");
                Alert.alert("Debug", "Take Photo button was pressed!");
                handleTakePhoto();
              }}
            >
              <Text
                style={{
                  color: "#FFFFFF",
                  fontWeight: "600",
                  fontSize: 16,
                }}
              >
                Take Photo
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                backgroundColor: colors.border,
                padding: 16,
                borderRadius: 8,
                marginBottom: 12,
                alignItems: "center",
              }}
              onPress={handlePickImage}
            >
              <Text
                style={{
                  color: colors.text,
                  fontWeight: "600",
                  fontSize: 16,
                }}
              >
                Choose from Gallery
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                padding: 16,
                alignItems: "center",
              }}
              onPress={() => setShowImageOptions(false)}
            >
              <Text
                style={{
                  color: colors.textSecondary,
                  fontSize: 16,
                }}
              >
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Camera Modal */}
      <Modal
        visible={showCamera}
        animationType="slide"
        onRequestClose={() => setShowCamera(false)}
      >
        <View style={{ flex: 1, backgroundColor: "black" }}>
          {showCamera && cameraPermission?.granted && (
            <CameraView
              ref={cameraRef}
              style={{ flex: 1 }}
              facing={cameraFacing}
            >
              {/* Camera Header */}
              <View
                style={{
                  position: "absolute",
                  top: 50,
                  left: 0,
                  right: 0,
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  paddingHorizontal: 20,
                  zIndex: 1,
                }}
              >
                <TouchableOpacity
                  style={{
                    backgroundColor: "rgba(0,0,0,0.6)",
                    borderRadius: 20,
                    padding: 10,
                  }}
                  onPress={() => setShowCamera(false)}
                >
                  <MaterialIcons name="close" size={24} color="white" />
                </TouchableOpacity>

                <Text
                  style={{
                    color: "white",
                    fontSize: 18,
                    fontWeight: "600",
                  }}
                >
                  Take Photo
                </Text>

                <TouchableOpacity
                  style={{
                    backgroundColor: "rgba(0,0,0,0.6)",
                    borderRadius: 20,
                    padding: 10,
                  }}
                  onPress={flipCamera}
                >
                  <MaterialIcons
                    name="flip-camera-ios"
                    size={24}
                    color="white"
                  />
                </TouchableOpacity>
              </View>

              {/* Camera Controls */}
              <View
                style={{
                  position: "absolute",
                  bottom: 50,
                  left: 0,
                  right: 0,
                  alignItems: "center",
                  zIndex: 1,
                }}
              >
                <TouchableOpacity
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: 40,
                    backgroundColor: "white",
                    borderWidth: 4,
                    borderColor: "rgba(255,255,255,0.3)",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  onPress={takePicture}
                >
                  <View
                    style={{
                      width: 60,
                      height: 60,
                      borderRadius: 30,
                      backgroundColor: "white",
                    }}
                  />
                </TouchableOpacity>
              </View>
            </CameraView>
          )}

          {showCamera && !cameraPermission?.granted && (
            <View
              style={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
                backgroundColor: "black",
              }}
            >
              <Text
                style={{ color: "white", fontSize: 16, textAlign: "center" }}
              >
                Camera permission is required to take photos.
              </Text>
              <TouchableOpacity
                style={{
                  backgroundColor: "white",
                  paddingHorizontal: 20,
                  paddingVertical: 10,
                  borderRadius: 8,
                  marginTop: 20,
                }}
                onPress={() => setShowCamera(false)}
              >
                <Text style={{ color: "black", fontWeight: "600" }}>Close</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Modal>

      {/* Name Edit Modal */}
      <Modal
        visible={showNameEdit}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowNameEdit(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            justifyContent: "center",
            alignItems: "center",
            padding: 20,
          }}
        >
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: 12,
              padding: 24,
              width: "100%",
              maxWidth: 400,
            }}
          >
            <Text
              style={{
                fontSize: 18,
                fontWeight: "600",
                color: colors.text,
                marginBottom: 20,
                textAlign: "center",
              }}
            >
              Edit Display Name
            </Text>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 8,
                paddingHorizontal: 16,
                paddingVertical: 12,
                fontSize: 16,
                backgroundColor: colors.background,
                color: colors.text,
                marginBottom: 20,
              }}
              value={tempName}
              onChangeText={setTempName}
              placeholder="Enter your display name"
              placeholderTextColor={colors.textSecondary}
            />
            <View
              style={{ flexDirection: "row", justifyContent: "space-between" }}
            >
              <TouchableOpacity
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  paddingHorizontal: 20,
                  backgroundColor: colors.border,
                  borderRadius: 8,
                  marginRight: 10,
                }}
                onPress={() => setShowNameEdit(false)}
              >
                <Text
                  style={{
                    color: colors.text,
                    fontSize: 16,
                    fontWeight: "600",
                    textAlign: "center",
                  }}
                >
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  paddingHorizontal: 20,
                  backgroundColor: colors.primary,
                  borderRadius: 8,
                  marginLeft: 10,
                }}
                onPress={saveNameEdit}
              >
                <Text
                  style={{
                    color: "#FFFFFF",
                    fontSize: 16,
                    fontWeight: "600",
                    textAlign: "center",
                  }}
                >
                  Save
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Bio Edit Modal */}
      <Modal
        visible={showBioEdit}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowBioEdit(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            justifyContent: "center",
            alignItems: "center",
            padding: 20,
          }}
        >
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: 12,
              padding: 24,
              width: "100%",
              maxWidth: 400,
            }}
          >
            <Text
              style={{
                fontSize: 18,
                fontWeight: "600",
                color: colors.text,
                marginBottom: 20,
                textAlign: "center",
              }}
            >
              Edit Bio
            </Text>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 8,
                paddingHorizontal: 16,
                paddingVertical: 12,
                fontSize: 16,
                backgroundColor: colors.background,
                color: colors.text,
                marginBottom: 20,
                height: 120,
                textAlignVertical: "top",
              }}
              value={tempBio}
              onChangeText={setTempBio}
              placeholder="Tell us about yourself"
              placeholderTextColor={colors.textSecondary}
              multiline
            />
            <View
              style={{ flexDirection: "row", justifyContent: "space-between" }}
            >
              <TouchableOpacity
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  paddingHorizontal: 20,
                  backgroundColor: colors.border,
                  borderRadius: 8,
                  marginRight: 10,
                }}
                onPress={() => setShowBioEdit(false)}
              >
                <Text
                  style={{
                    color: colors.text,
                    fontSize: 16,
                    fontWeight: "600",
                    textAlign: "center",
                  }}
                >
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  paddingHorizontal: 20,
                  backgroundColor: colors.primary,
                  borderRadius: 8,
                  marginLeft: 10,
                }}
                onPress={saveBioEdit}
              >
                <Text
                  style={{
                    color: "#FFFFFF",
                    fontSize: 16,
                    fontWeight: "600",
                    textAlign: "center",
                  }}
                >
                  Save
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Location Edit Modal */}
      <Modal
        visible={showLocationEdit}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowLocationEdit(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            justifyContent: "center",
            alignItems: "center",
            padding: 20,
          }}
        >
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: 12,
              padding: 24,
              width: "100%",
              maxWidth: 400,
            }}
          >
            <Text
              style={{
                fontSize: 18,
                fontWeight: "600",
                color: colors.text,
                marginBottom: 20,
                textAlign: "center",
              }}
            >
              Edit Location
            </Text>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 8,
                paddingHorizontal: 16,
                paddingVertical: 12,
                fontSize: 16,
                backgroundColor: colors.background,
                color: colors.text,
                marginBottom: 20,
              }}
              value={tempLocation}
              onChangeText={setTempLocation}
              placeholder="Enter your location"
              placeholderTextColor={colors.textSecondary}
            />
            <View
              style={{ flexDirection: "row", justifyContent: "space-between" }}
            >
              <TouchableOpacity
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  paddingHorizontal: 20,
                  backgroundColor: colors.border,
                  borderRadius: 8,
                  marginRight: 10,
                }}
                onPress={() => setShowLocationEdit(false)}
              >
                <Text
                  style={{
                    color: colors.text,
                    fontSize: 16,
                    fontWeight: "600",
                    textAlign: "center",
                  }}
                >
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  paddingHorizontal: 20,
                  backgroundColor: colors.primary,
                  borderRadius: 8,
                  marginLeft: 10,
                }}
                onPress={saveLocationEdit}
              >
                <Text
                  style={{
                    color: "#FFFFFF",
                    fontSize: 16,
                    fontWeight: "600",
                    textAlign: "center",
                  }}
                >
                  Save
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Phone Edit Modal */}
      <Modal
        visible={showPhoneEdit}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowPhoneEdit(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            justifyContent: "center",
            alignItems: "center",
            padding: 20,
          }}
        >
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: 12,
              padding: 24,
              width: "100%",
              maxWidth: 400,
            }}
          >
            <Text
              style={{
                fontSize: 18,
                fontWeight: "600",
                color: colors.text,
                marginBottom: 20,
                textAlign: "center",
              }}
            >
              Edit Phone Number
            </Text>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 8,
                paddingHorizontal: 16,
                paddingVertical: 12,
                fontSize: 16,
                backgroundColor: colors.background,
                color: colors.text,
                marginBottom: 20,
              }}
              value={tempPhone}
              onChangeText={setTempPhone}
              placeholder="Enter your phone number"
              placeholderTextColor={colors.textSecondary}
              keyboardType="phone-pad"
            />
            <View
              style={{ flexDirection: "row", justifyContent: "space-between" }}
            >
              <TouchableOpacity
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  paddingHorizontal: 20,
                  backgroundColor: colors.border,
                  borderRadius: 8,
                  marginRight: 10,
                }}
                onPress={() => setShowPhoneEdit(false)}
              >
                <Text
                  style={{
                    color: colors.text,
                    fontSize: 16,
                    fontWeight: "600",
                    textAlign: "center",
                  }}
                >
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  paddingHorizontal: 20,
                  backgroundColor: colors.primary,
                  borderRadius: 8,
                  marginLeft: 10,
                }}
                onPress={savePhoneEdit}
              >
                <Text
                  style={{
                    color: "#FFFFFF",
                    fontSize: 16,
                    fontWeight: "600",
                    textAlign: "center",
                  }}
                >
                  Save
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

export default ProfileScreen;
