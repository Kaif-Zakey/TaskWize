import { MaterialIcons } from "@expo/vector-icons";
import * as Location from "expo-location";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

// Import expo-maps components conditionally
import Constants from "expo-constants";

// Check if we're in Expo Go vs development build
const isExpoGo = Constants.appOwnership === "expo";
const isMapAvailable = Platform.OS !== "web" && !isExpoGo;

// Conditional imports for expo-maps (only in development/production builds)
let GoogleMaps: any = null;
let AppleMaps: any = null;
let isMapModuleLoaded = false;

if (!isExpoGo && Platform.OS !== "web") {
  try {
    const expoMaps = require("expo-maps"); // eslint-disable-line
    GoogleMaps = expoMaps.GoogleMaps;
    AppleMaps = expoMaps.AppleMaps;
    isMapModuleLoaded = !!(GoogleMaps && AppleMaps);
  } catch (error) {
    // expo-maps not available, will use fallback
    console.log("expo-maps not available:", error);
    isMapModuleLoaded = false;
  }
}

interface LocationData {
  latitude: number;
  longitude: number;
  address?: string;
  name?: string;
  range?: number; // notification range in meters
}

interface LocationPickerProps {
  visible: boolean;
  onClose: () => void;
  onLocationSelect: (location: LocationData) => void;
  initialLocation?: LocationData;
  colors: {
    primary: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
  };
}

const LocationPicker: React.FC<LocationPickerProps> = ({
  visible,
  onClose,
  onLocationSelect,
  initialLocation,
  colors,
}) => {
  const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(
    initialLocation || null
  );
  const [region, setRegion] = useState({
    latitude: initialLocation?.latitude || 37.78825,
    longitude: initialLocation?.longitude || -122.4324,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (initialLocation) {
      setSelectedLocation(initialLocation);
      setRegion((prevRegion) => ({
        ...prevRegion,
        latitude: initialLocation.latitude,
        longitude: initialLocation.longitude,
      }));
    }
  }, [initialLocation]);

  const searchLocation = async () => {
    if (!searchQuery.trim()) {
      Alert.alert("Error", "Please enter a location to search");
      return;
    }

    setIsSearching(true);
    try {
      const geocodedLocation = await Location.geocodeAsync(searchQuery);

      if (geocodedLocation.length > 0) {
        const result = geocodedLocation[0];
        const newLocation: LocationData = {
          latitude: result.latitude,
          longitude: result.longitude,
          address: searchQuery,
        };

        setSelectedLocation(newLocation);
        setRegion({
          latitude: result.latitude,
          longitude: result.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });
      } else {
        Alert.alert("Not Found", "Could not find the specified location");
      }
    } catch (error) {
      console.error("Search error:", error);
      Alert.alert("Error", "Failed to search for location");
    } finally {
      setIsSearching(false);
    }
  };

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Denied",
          "Location permission is required to get your current location."
        );
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const newLocation = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };

      // Reverse geocode to get address
      const reverseGeocode = await Location.reverseGeocodeAsync(newLocation);
      let address = "";

      if (reverseGeocode.length > 0) {
        const addr = reverseGeocode[0];
        address = [addr.name, addr.street, addr.city, addr.region, addr.country]
          .filter(Boolean)
          .join(", ");
      }

      const locationData: LocationData = {
        ...newLocation,
        address: address || `${newLocation.latitude}, ${newLocation.longitude}`,
        name: "Current Location",
      };

      setSelectedLocation(locationData);
      setRegion((prevRegion) => ({
        ...prevRegion,
        latitude: newLocation.latitude,
        longitude: newLocation.longitude,
      }));
    } catch (error) {
      console.error("Error getting location:", error);
      Alert.alert("Error", "Failed to get current location.");
    }
  };

  const handleMapPress = async (event: any) => {
    let coordinate;

    // Handle different event structures for iOS vs Android
    if (Platform.OS === "ios" && event.coordinates) {
      coordinate = event.coordinates;
    } else if (event.nativeEvent && event.nativeEvent.coordinate) {
      coordinate = event.nativeEvent.coordinate;
    } else {
      return;
    }

    try {
      // Reverse geocode to get address
      const reverseGeocode = await Location.reverseGeocodeAsync(coordinate);
      let address = "";

      if (reverseGeocode.length > 0) {
        const addr = reverseGeocode[0];
        address = [addr.name, addr.street, addr.city, addr.region, addr.country]
          .filter(Boolean)
          .join(", ");
      }

      const locationData: LocationData = {
        latitude: coordinate.latitude,
        longitude: coordinate.longitude,
        address: address || `${coordinate.latitude}, ${coordinate.longitude}`,
        name: "Selected Location",
      };

      setSelectedLocation(locationData);
      setRegion((prevRegion) => ({
        ...prevRegion,
        latitude: coordinate.latitude,
        longitude: coordinate.longitude,
      }));
    } catch (error) {
      console.error("Error reverse geocoding:", error);
      const locationData: LocationData = {
        latitude: coordinate.latitude,
        longitude: coordinate.longitude,
        address: `${coordinate.latitude}, ${coordinate.longitude}`,
        name: "Selected Location",
      };
      setSelectedLocation(locationData);
    }
  };

  const handleConfirm = () => {
    if (selectedLocation) {
      onLocationSelect(selectedLocation);
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.primary }]}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <MaterialIcons name="close" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Select Location</Text>
          <TouchableOpacity
            onPress={handleConfirm}
            style={styles.confirmButton}
            disabled={!selectedLocation}
          >
            <Text
              style={[
                styles.confirmText,
                { opacity: selectedLocation ? 1 : 0.5 },
              ]}
            >
              Confirm
            </Text>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View
          style={[styles.searchContainer, { backgroundColor: colors.surface }]}
        >
          <View style={styles.searchRow}>
            <TextInput
              placeholder="Search for a place or address..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={[
                styles.searchInputField,
                {
                  backgroundColor: colors.background,
                  color: colors.text,
                  borderColor: colors.border,
                },
              ]}
              placeholderTextColor={colors.textSecondary}
              onSubmitEditing={searchLocation}
            />
            <TouchableOpacity
              onPress={searchLocation}
              style={[styles.searchButton, { backgroundColor: colors.primary }]}
              disabled={isSearching || !searchQuery.trim()}
            >
              <MaterialIcons name="search" size={20} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Current Location Button */}
        <TouchableOpacity
          style={[
            styles.currentLocationButton,
            { backgroundColor: colors.primary },
          ]}
          onPress={getCurrentLocation}
        >
          <MaterialIcons name="my-location" size={20} color="white" />
          <Text style={styles.currentLocationText}>Use Current Location</Text>
        </TouchableOpacity>

        {/* Map */}
        <View style={styles.mapContainer}>
          {Platform.OS === "web" ? (
            // Web fallback
            <View
              style={[
                styles.map,
                {
                  justifyContent: "center",
                  alignItems: "center",
                  backgroundColor: "#f0f0f0",
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: colors.border,
                },
              ]}
            >
              <MaterialIcons
                name="map"
                size={48}
                color={colors.textSecondary}
              />
              <Text
                style={{
                  color: colors.text,
                  marginTop: 8,
                  textAlign: "center",
                  paddingHorizontal: 20,
                }}
              >
                Map view is available on mobile devices
              </Text>
              {selectedLocation && (
                <View style={{ marginTop: 16, alignItems: "center" }}>
                  <Text style={{ color: colors.text, fontWeight: "bold" }}>
                    Selected Location:
                  </Text>
                  <Text style={{ color: colors.textSecondary, marginTop: 4 }}>
                    {selectedLocation.latitude.toFixed(6)},{" "}
                    {selectedLocation.longitude.toFixed(6)}
                  </Text>
                </View>
              )}
            </View>
          ) : isMapAvailable && isMapModuleLoaded ? (
            // Mobile with expo-maps - Auto-detect platform with safety checks
            (() => {
              try {
                return Platform.OS === "ios" && AppleMaps ? (
                  <AppleMaps.View
                    style={styles.map}
                    cameraPosition={{
                      coordinates: {
                        latitude: region.latitude,
                        longitude: region.longitude,
                      },
                      zoom: 15,
                    }}
                    onMapClick={handleMapPress}
                    properties={{
                      isMyLocationEnabled: true,
                    }}
                    markers={
                      selectedLocation
                        ? [
                            {
                              coordinates: {
                                latitude: selectedLocation.latitude,
                                longitude: selectedLocation.longitude,
                              },
                              title: selectedLocation.name,
                            },
                          ]
                        : []
                    }
                  />
                ) : GoogleMaps ? (
                  <GoogleMaps.View
                    style={styles.map}
                    cameraPosition={{
                      coordinates: {
                        latitude: region.latitude,
                        longitude: region.longitude,
                      },
                      zoom: 15,
                    }}
                    onMapClick={handleMapPress}
                    properties={{
                      isMyLocationEnabled: true,
                    }}
                    markers={
                      selectedLocation
                        ? [
                            {
                              coordinates: {
                                latitude: selectedLocation.latitude,
                                longitude: selectedLocation.longitude,
                              },
                              title: selectedLocation.name,
                            },
                          ]
                        : []
                    }
                  />
                ) : (
                  // Fallback if map components are not available
                  <View style={styles.fallbackContainer}>
                    <View
                      style={[
                        styles.map,
                        {
                          justifyContent: "center",
                          alignItems: "center",
                          backgroundColor: "#f0f0f0",
                          borderRadius: 8,
                          borderWidth: 1,
                          borderColor: colors.border,
                        },
                      ]}
                    >
                      <MaterialIcons
                        name="location-on"
                        size={48}
                        color={colors.primary}
                      />
                      <Text
                        style={{
                          color: colors.text,
                          marginTop: 8,
                          textAlign: "center",
                          paddingHorizontal: 20,
                          fontSize: 16,
                          fontWeight: "bold",
                        }}
                      >
                        Map Not Available
                      </Text>
                      <Text
                        style={{
                          color: colors.textSecondary,
                          marginTop: 4,
                          textAlign: "center",
                          paddingHorizontal: 20,
                          fontSize: 12,
                        }}
                      >
                        Use location buttons below
                      </Text>
                    </View>
                  </View>
                );
              } catch (error) {
                console.error("Map rendering error:", error);
                // Return fallback on any error
                return (
                  <View style={styles.fallbackContainer}>
                    <View
                      style={[
                        styles.map,
                        {
                          justifyContent: "center",
                          alignItems: "center",
                          backgroundColor: "#f0f0f0",
                          borderRadius: 8,
                          borderWidth: 1,
                          borderColor: colors.border,
                        },
                      ]}
                    >
                      <MaterialIcons name="warning" size={48} color="#ff6b6b" />
                      <Text
                        style={{
                          color: colors.text,
                          marginTop: 8,
                          textAlign: "center",
                          paddingHorizontal: 20,
                          fontSize: 16,
                          fontWeight: "bold",
                        }}
                      >
                        Map Error
                      </Text>
                      <Text
                        style={{
                          color: colors.textSecondary,
                          marginTop: 4,
                          textAlign: "center",
                          paddingHorizontal: 20,
                          fontSize: 12,
                        }}
                      >
                        Please use location buttons below
                      </Text>
                    </View>
                  </View>
                );
              }
            })()
          ) : (
            // Universal Fallback for Expo Go and when expo-maps is not available
            <View style={styles.fallbackContainer}>
              <View
                style={[
                  styles.map,
                  {
                    justifyContent: "center",
                    alignItems: "center",
                    backgroundColor: "#f0f0f0",
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: colors.border,
                  },
                ]}
              >
                <MaterialIcons
                  name="location-on"
                  size={48}
                  color={colors.primary}
                />
                <Text
                  style={{
                    color: colors.text,
                    marginTop: 8,
                    textAlign: "center",
                    paddingHorizontal: 20,
                    fontSize: 16,
                    fontWeight: "bold",
                  }}
                >
                  {isExpoGo ? "Location Picker" : "Map Loading..."}
                </Text>
                <Text
                  style={{
                    color: colors.textSecondary,
                    marginTop: 4,
                    textAlign: "center",
                    paddingHorizontal: 20,
                    fontSize: 12,
                  }}
                >
                  {isExpoGo
                    ? "Use location buttons below or enter manually"
                    : "Please wait while map loads..."}
                </Text>

                {/* Current Location Button for Expo Go */}
                {isExpoGo && (
                  <TouchableOpacity
                    style={[
                      styles.locationButton,
                      { backgroundColor: colors.primary },
                    ]}
                    onPress={getCurrentLocation}
                  >
                    <MaterialIcons name="my-location" size={20} color="white" />
                    <Text style={styles.locationButtonText}>
                      Get Current Location
                    </Text>
                  </TouchableOpacity>
                )}

                {selectedLocation && (
                  <View style={{ marginTop: 16, alignItems: "center" }}>
                    <Text style={{ color: colors.text, fontWeight: "bold" }}>
                      Selected Location:
                    </Text>
                    <Text style={{ color: colors.textSecondary, marginTop: 4 }}>
                      {selectedLocation.latitude.toFixed(6)},{" "}
                      {selectedLocation.longitude.toFixed(6)}
                    </Text>
                    {selectedLocation.address && (
                      <Text
                        style={{
                          color: colors.textSecondary,
                          marginTop: 2,
                          fontSize: 12,
                        }}
                      >
                        {selectedLocation.address}
                      </Text>
                    )}
                  </View>
                )}
              </View>

              {/* Message for Expo Go users */}
              {isExpoGo && (
                <View style={{ padding: 16, alignItems: "center" }}>
                  <Text
                    style={{ color: colors.textSecondary, textAlign: "center" }}
                  >
                    Use the search function above to find locations in Expo Go
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Selected Location Info */}
        {selectedLocation && (
          <View
            style={[styles.locationInfo, { backgroundColor: colors.surface }]}
          >
            <MaterialIcons name="place" size={24} color={colors.primary} />
            <View style={styles.locationText}>
              <Text style={[styles.locationName, { color: colors.text }]}>
                {selectedLocation.name || "Selected Location"}
              </Text>
              <Text
                style={[
                  styles.locationAddress,
                  { color: colors.textSecondary },
                ]}
              >
                {selectedLocation.address}
              </Text>
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "white",
  },
  confirmButton: {
    padding: 8,
  },
  confirmText: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    zIndex: 1,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  searchInputField: {
    flex: 1,
    fontSize: 16,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    minHeight: 44,
  },
  searchButton: {
    width: 44,
    height: 44,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  currentLocationButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 16,
    marginBottom: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 3.84,
    elevation: 5,
  },
  currentLocationText: {
    color: "white",
    fontWeight: "600",
    marginLeft: 8,
  },
  mapContainer: {
    height: 250, // Fixed height instead of flex: 1 to make it smaller
    margin: 16,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "#e0e0e0",
  },
  map: {
    flex: 1,
  },
  locationInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  locationText: {
    flex: 1,
    marginLeft: 12,
  },
  locationName: {
    fontSize: 16,
    fontWeight: "600",
  },
  locationAddress: {
    fontSize: 14,
    marginTop: 4,
    lineHeight: 20,
  },
  // Styles for Expo Go fallback
  fallbackContainer: {
    flex: 1,
  },
  locationButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  locationButtonText: {
    color: "white",
    fontWeight: "600",
    marginLeft: 8,
  },
});

export default LocationPicker;
