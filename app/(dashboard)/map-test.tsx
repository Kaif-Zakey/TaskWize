/**
 * Map Test Component - Shows what happens in Expo Go vs Development Build
 */
import { MaterialIcons } from "@expo/vector-icons";
import Constants from "expo-constants";
import React from "react";
import { Platform, StyleSheet, Text, View } from "react-native";

const MapTestScreen = () => {
  const isExpoGo = Constants.appOwnership === "expo";
  const isDevelopmentBuild = !isExpoGo;
  const isMapSupported = Platform.OS !== "web";

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Map Functionality Test</Text>
      </View>

      <View style={styles.infoSection}>
        <Text style={styles.sectionTitle}>Environment Info:</Text>
        <Text style={styles.infoText}>• Platform: {Platform.OS}</Text>
        <Text style={styles.infoText}>
          • Expo Go: {isExpoGo ? "Yes" : "No"}
        </Text>
        <Text style={styles.infoText}>
          • Development Build: {isDevelopmentBuild ? "Yes" : "No"}
        </Text>
        <Text style={styles.infoText}>
          • Map Supported: {isMapSupported ? "Yes" : "No"}
        </Text>
      </View>

      <View style={styles.mapTestSection}>
        <Text style={styles.sectionTitle}>Map Status:</Text>

        {isExpoGo ? (
          <View style={styles.statusContainer}>
            <MaterialIcons name="warning" size={48} color="#ff9800" />
            <Text style={styles.statusTitle}>Maps Not Available</Text>
            <Text style={styles.statusDescription}>
              expo-maps requires a development build and is not supported in
              Expo Go.
            </Text>
            <Text style={styles.recommendation}>
              ✅ To test maps: Use your development build APK
            </Text>
          </View>
        ) : (
          <View style={styles.statusContainer}>
            <MaterialIcons name="map" size={48} color="#4caf50" />
            <Text style={styles.statusTitle}>Maps Available!</Text>
            <Text style={styles.statusDescription}>
              You&apos;re running in a development build. Maps should work
              perfectly.
            </Text>
            <Text style={styles.recommendation}>
              ✅ Go to task creation to test location picker
            </Text>
          </View>
        )}
      </View>

      <View style={styles.instructionsSection}>
        <Text style={styles.sectionTitle}>Testing Instructions:</Text>
        {isExpoGo ? (
          <>
            <Text style={styles.instruction}>
              1. Install your development build APK
            </Text>
            <Text style={styles.instruction}>
              2. Open the development build app
            </Text>
            <Text style={styles.instruction}>
              3. Scan the QR code from expo start --dev-client
            </Text>
            <Text style={styles.instruction}>
              4. Test maps in task creation
            </Text>
          </>
        ) : (
          <>
            <Text style={styles.instruction}>
              1. Navigate to Dashboard → Tasks
            </Text>
            <Text style={styles.instruction}>2. Create a new task</Text>
            <Text style={styles.instruction}>
              3. Tap on location/map button
            </Text>
            <Text style={styles.instruction}>
              4. Maps should load successfully!
            </Text>
          </>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f5f5f5",
  },
  header: {
    alignItems: "center",
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
  },
  infoSection: {
    backgroundColor: "white",
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  mapTestSection: {
    backgroundColor: "white",
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  instructionsSection: {
    backgroundColor: "white",
    padding: 15,
    borderRadius: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#333",
  },
  infoText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 5,
  },
  statusContainer: {
    alignItems: "center",
    paddingVertical: 20,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 10,
    marginBottom: 10,
    color: "#333",
  },
  statusDescription: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 15,
  },
  recommendation: {
    fontSize: 14,
    color: "#4caf50",
    fontWeight: "bold",
    textAlign: "center",
  },
  instruction: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
});

export default MapTestScreen;
