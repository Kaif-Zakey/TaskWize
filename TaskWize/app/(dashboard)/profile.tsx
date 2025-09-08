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
import { useTheme } from "@/context/ThemeContext";
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
  const { colors } = useTheme();
  const router = useRouter();

  const [profile, setProfile] = useState<UserProfile>({
    displayName: "",
    bio: "",
    location: "",
    phone: "",
    profileImage: null,
  });

  const [tempProfile, setTempProfile] = useState<UserProfile>(profile);
  const [isEditing, setIsEditing] = useState(false);
  const [showImageOptions, setShowImageOptions] = useState(false);

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

  const handleEditToggle = () => {
    if (isEditing) {
      setTempProfile(profile);
    }
    setIsEditing(!isEditing);
  };

  const handleSaveChanges = () => {
    saveProfile(tempProfile);
    setIsEditing(false);
  };

  const requestCameraPermissions = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    return status === "granted";
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

  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Logout",
          style: "destructive",
          onPress: () => {
            // Add logout logic here
            router.replace("/(auth)/login");
          },
        },
      ]
    );
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
          {isEditing ? (
            <View style={{ flexDirection: "row", gap: 12 }}>
              <TouchableOpacity
                style={{
                  backgroundColor: colors.border,
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 8,
                }}
                onPress={handleEditToggle}
              >
                <Text style={{ 
                  color: colors.text, 
                  fontWeight: '600' 
                }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  backgroundColor: colors.primary,
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 8,
                }}
                onPress={handleSaveChanges}
              >
                <Text style={{ 
                  color: '#FFFFFF', 
                  fontWeight: '600' 
                }}>Save</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={{
                backgroundColor: colors.primary,
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 8,
              }}
              onPress={handleEditToggle}
            >
              <Text style={{ 
                color: '#FFFFFF', 
                fontWeight: '600' 
              }}>Edit</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Profile Picture Section */}
      <View style={{ 
        backgroundColor: colors.surface, 
        marginTop: 24, 
        marginHorizontal: 24, 
        padding: 24, 
        borderRadius: 8, 
        shadowOpacity: 0.05, 
        shadowRadius: 4, 
        elevation: 2 
      }}>
        <Text style={{ 
          fontSize: 20, 
          fontWeight: '600', 
          color: colors.text, 
          marginBottom: 16 
        }}>
          Profile Picture
        </Text>
        <View style={{ alignItems: 'center' }}>
          <TouchableOpacity
            style={{ position: 'relative', marginBottom: 16 }}
            onPress={() => isEditing && setShowImageOptions(true)}
          >
            {tempProfile.profileImage ? (
              <Image
                source={{ uri: tempProfile.profileImage }}
                style={{ 
                  width: 128, 
                  height: 128, 
                  borderRadius: 64 
                }}
              />
            ) : (
              <View style={{ 
                width: 128, 
                height: 128, 
                borderRadius: 64, 
                backgroundColor: colors.border, 
                alignItems: 'center', 
                justifyContent: 'center' 
              }}>
                <MaterialIcons name="person" size={64} color={colors.textSecondary} />
              </View>
            )}
            {isEditing && (
              <View style={{ 
                position: 'absolute', 
                bottom: 0, 
                right: 0, 
                backgroundColor: colors.primary, 
                borderRadius: 16, 
                padding: 8 
              }}>
                <MaterialIcons name="camera-alt" size={20} color="white" />
              </View>
            )}
          </TouchableOpacity>
          {!isEditing && (
            <TouchableOpacity
              style={{ 
                backgroundColor: colors.primary, 
                paddingHorizontal: 16, 
                paddingVertical: 8, 
                borderRadius: 8 
              }}
              onPress={() => setShowImageOptions(true)}
            >
              <Text style={{ 
                color: '#FFFFFF', 
                fontWeight: '600' 
              }}>Change Photo</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Personal Information Section */}
      <View style={{ 
        backgroundColor: colors.surface, 
        marginTop: 24, 
        marginHorizontal: 24, 
        padding: 24, 
        borderRadius: 8, 
        shadowOpacity: 0.05, 
        shadowRadius: 4, 
        elevation: 2 
      }}>
        <Text style={{ 
          fontSize: 20, 
          fontWeight: '600', 
          color: colors.text, 
          marginBottom: 16 
        }}>
          Personal Information
        </Text>

        {/* Display Name */}
        <View style={{ marginBottom: 16 }}>
          <Text style={{ 
            fontSize: 14, 
            fontWeight: '500', 
            color: colors.text, 
            marginBottom: 8 
          }}>
            Display Name
          </Text>
          {isEditing ? (
            <TextInput
              style={{ 
                borderWidth: 1, 
                borderColor: colors.border, 
                borderRadius: 8, 
                paddingHorizontal: 16, 
                paddingVertical: 12, 
                fontSize: 16, 
                backgroundColor: colors.surface, 
                color: colors.text 
              }}
              placeholderTextColor={colors.textSecondary}
              value={tempProfile.displayName}
              onChangeText={(text) =>
                setTempProfile({ ...tempProfile, displayName: text })
              }
              placeholder="Enter your display name"
            />
          ) : (
            <Text style={{ 
              fontSize: 16, 
              color: colors.text, 
              paddingVertical: 12, 
              paddingHorizontal: 16, 
              backgroundColor: colors.background, 
              borderRadius: 8 
            }}>
              {profile.displayName || "Not specified"}
            </Text>
          )}
        </View>

        {/* Bio */}
        <View style={{ marginBottom: 16 }}>
          <Text style={{ 
            fontSize: 14, 
            fontWeight: '500', 
            color: colors.text, 
            marginBottom: 8 
          }}>Bio</Text>
          {isEditing ? (
            <TextInput
              style={{ 
                borderWidth: 1, 
                borderColor: colors.border, 
                borderRadius: 8, 
                paddingHorizontal: 16, 
                paddingVertical: 12, 
                fontSize: 16, 
                height: 96, 
                backgroundColor: colors.surface, 
                color: colors.text 
              }}
              placeholderTextColor={colors.textSecondary}
              value={tempProfile.bio}
              onChangeText={(text) =>
                setTempProfile({ ...tempProfile, bio: text })
              }
              placeholder="Tell us about yourself"
              multiline
              textAlignVertical="top"
            />
          ) : (
            <Text style={{ 
              fontSize: 16, 
              color: colors.text, 
              paddingVertical: 12, 
              paddingHorizontal: 16, 
              backgroundColor: colors.background, 
              borderRadius: 8, 
              minHeight: 60 
            }}>
              {profile.bio || "No bio added yet"}
            </Text>
          )}
        </View>

        {/* Location */}
        <View style={{ marginBottom: 16 }}>
          <Text style={{ 
            fontSize: 14, 
            fontWeight: '500', 
            color: colors.text, 
            marginBottom: 8 
          }}>
            Location
          </Text>
          {isEditing ? (
            <TextInput
              style={{ 
                borderWidth: 1, 
                borderColor: colors.border, 
                borderRadius: 8, 
                paddingHorizontal: 16, 
                paddingVertical: 12, 
                fontSize: 16, 
                backgroundColor: colors.surface, 
                color: colors.text 
              }}
              placeholderTextColor={colors.textSecondary}
              value={tempProfile.location}
              onChangeText={(text) =>
                setTempProfile({ ...tempProfile, location: text })
              }
              placeholder="Enter your location"
            />
          ) : (
            <Text style={{ 
              fontSize: 16, 
              color: colors.text, 
              paddingVertical: 12, 
              paddingHorizontal: 16, 
              backgroundColor: colors.background, 
              borderRadius: 8 
            }}>
              {profile.location || "Not specified"}
            </Text>
          )}
        </View>

        {/* Phone */}
        <View style={{ marginBottom: 16 }}>
          <Text style={{ 
            fontSize: 14, 
            fontWeight: '500', 
            color: colors.text, 
            marginBottom: 8 
          }}>
            Phone Number
          </Text>
          {isEditing ? (
            <TextInput
              style={{ 
                borderWidth: 1, 
                borderColor: colors.border, 
                borderRadius: 8, 
                paddingHorizontal: 16, 
                paddingVertical: 12, 
                fontSize: 16, 
                backgroundColor: colors.surface, 
                color: colors.text 
              }}
              placeholderTextColor={colors.textSecondary}
              value={tempProfile.phone}
              onChangeText={(text) =>
                setTempProfile({ ...tempProfile, phone: text })
              }
              placeholder="Enter your phone number"
              keyboardType="phone-pad"
            />
          ) : (
            <Text style={{ 
              fontSize: 16, 
              color: colors.text, 
              paddingVertical: 12, 
              paddingHorizontal: 16, 
              backgroundColor: colors.background, 
              borderRadius: 8 
            }}>
              {profile.phone || "Not specified"}
            </Text>
          )}
        </View>
      </View>

      {/* Account Information Section */}
      <View style={{ 
        backgroundColor: colors.surface, 
        marginTop: 24, 
        marginHorizontal: 24, 
        padding: 24, 
        borderRadius: 8, 
        shadowOpacity: 0.05, 
        shadowRadius: 4, 
        elevation: 2 
      }}>
        <Text style={{ 
          fontSize: 20, 
          fontWeight: '600', 
          color: colors.text, 
          marginBottom: 16 
        }}>
          Account Information
        </Text>

        <View style={{ marginBottom: 16 }}>
          <Text style={{ 
            fontSize: 14, 
            fontWeight: '500', 
            color: colors.text, 
            marginBottom: 8 
          }}>Email</Text>
          <Text style={{ 
            fontSize: 16, 
            color: colors.text, 
            paddingVertical: 12, 
            paddingHorizontal: 16, 
            backgroundColor: colors.background, 
            borderRadius: 8 
          }}>
            {user?.email}
          </Text>
        </View>

        <View style={{ marginBottom: 16 }}>
          <Text style={{ 
            fontSize: 14, 
            fontWeight: '500', 
            color: colors.text, 
            marginBottom: 8 
          }}>
            Member Since
          </Text>
          <Text style={{ 
            fontSize: 16, 
            color: colors.text, 
            paddingVertical: 12, 
            paddingHorizontal: 16, 
            backgroundColor: colors.background, 
            borderRadius: 8 
          }}>
            {new Date(user?.metadata?.creationTime || "").toLocaleDateString()}
          </Text>
        </View>
      </View>

      {/* Actions Section */}
      <View style={{ 
        backgroundColor: colors.surface, 
        marginTop: 24, 
        marginHorizontal: 24, 
        marginBottom: 32, 
        padding: 24, 
        borderRadius: 8, 
        shadowOpacity: 0.05, 
        shadowRadius: 4, 
        elevation: 2 
      }}>
        <Text style={{ 
          fontSize: 20, 
          fontWeight: '600', 
          color: colors.text, 
          marginBottom: 16 
        }}>
          Account Actions
        </Text>

        <TouchableOpacity
          style={{ 
            backgroundColor: colors.error, 
            paddingVertical: 12, 
            paddingHorizontal: 16, 
            borderRadius: 8, 
            alignItems: 'center' 
          }}
          onPress={handleLogout}
        >
          <Text style={{ 
            color: '#FFFFFF', 
            fontWeight: '600', 
            fontSize: 16 
          }}>
            Logout
          </Text>
        </TouchableOpacity>
      </View>

      {/* Image Options Modal */}
      <Modal
        visible={showImageOptions}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowImageOptions(false)}
      >
        <View style={{ 
          flex: 1, 
          backgroundColor: 'rgba(0,0,0,0.5)', 
          justifyContent: 'flex-end' 
        }}>
          <View style={{ 
            backgroundColor: colors.surface, 
            paddingTop: 24, 
            paddingBottom: 40, 
            paddingHorizontal: 24, 
            borderTopLeftRadius: 20, 
            borderTopRightRadius: 20 
          }}>
            <Text style={{ 
              fontSize: 18, 
              fontWeight: '600', 
              color: colors.text, 
              marginBottom: 20, 
              textAlign: 'center' 
            }}>
              Choose Photo Option
            </Text>
            
            <TouchableOpacity
              style={{ 
                backgroundColor: colors.primary, 
                padding: 16, 
                borderRadius: 8, 
                marginBottom: 12, 
                alignItems: 'center' 
              }}
              onPress={handleTakePhoto}
            >
              <Text style={{ 
                color: '#FFFFFF', 
                fontWeight: '600', 
                fontSize: 16 
              }}>
                Take Photo
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={{ 
                backgroundColor: colors.border, 
                padding: 16, 
                borderRadius: 8, 
                marginBottom: 12, 
                alignItems: 'center' 
              }}
              onPress={handlePickImage}
            >
              <Text style={{ 
                color: colors.text, 
                fontWeight: '600', 
                fontSize: 16 
              }}>
                Choose from Gallery
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={{ 
                padding: 16, 
                alignItems: 'center' 
              }}
              onPress={() => setShowImageOptions(false)}
            >
              <Text style={{ 
                color: colors.textSecondary, 
                fontSize: 16 
              }}>
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
