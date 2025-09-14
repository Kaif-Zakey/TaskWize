import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { sendFirebaseResetEmail } from "@/service/passwordResetService";

const { width, height } = Dimensions.get("window");

// Email validation function
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const ForgotPassword = () => {
  const router = useRouter();
  const [email, setEmail] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [emailError, setEmailError] = useState<string>("");

  const validateEmail = (): boolean => {
    if (!email.trim()) {
      setEmailError("Email is required");
      return false;
    }
    if (!isValidEmail(email.trim())) {
      setEmailError("Please enter a valid email address");
      return false;
    }
    setEmailError("");
    return true;
  };

  const handleSendResetEmail = async () => {
    if (!validateEmail()) return;

    setIsLoading(true);
    try {
      await sendFirebaseResetEmail(email.trim());
      Alert.alert(
        "Reset Email Sent",
        `A password reset email has been sent to ${email.trim()}. Please check your inbox and click the link to reset your password.`,
        [
          {
            text: "OK",
            onPress: () => router.push("/login"),
          },
        ]
      );
    } catch (error) {
      console.error("Error sending reset email:", error);
      Alert.alert("Error", "Unable to send reset email. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.backgroundContainer}>
        <View style={styles.purpleGradient}>
          <View style={styles.backgroundOverlay}>
            <View style={styles.backgroundShape1} />
            <View style={styles.backgroundShape2} />
            <View style={styles.backgroundShape3} />
          </View>
        </View>
        <View style={styles.curvedBottomSection} />
      </View>

      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.formWrapper}>
            <View style={styles.glassMorphContainer}>
              <View style={styles.logoContainer}>
                <MaterialIcons name="lock-reset" size={60} color="#8b5cf6" />
                <Text style={styles.appTitle}>TaskWize</Text>
              </View>

              <View style={styles.formContainer}>
                <Text style={styles.formTitle}>Reset Password</Text>
                <Text style={styles.subtitle}>
                  Enter your email address and we&apos;ll send you a link to
                  reset your password.
                </Text>

                <View style={styles.inputContainer}>
                  <MaterialIcons
                    name="email"
                    size={20}
                    color="#8b5cf6"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    placeholder="Email Address"
                    style={styles.textInput}
                    placeholderTextColor="#9ca3af"
                    value={email}
                    onChangeText={(text) => {
                      setEmail(text);
                      setEmailError("");
                    }}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
                {emailError ? (
                  <Text style={styles.errorText}>{emailError}</Text>
                ) : null}

                <TouchableOpacity
                  style={[
                    styles.submitButton,
                    isLoading && styles.submitButtonDisabled,
                  ]}
                  onPress={handleSendResetEmail}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#ffffff" size="small" />
                  ) : (
                    <>
                      <Text style={styles.submitButtonText}>
                        Send Reset Email
                      </Text>
                      <MaterialIcons name="email" size={20} color="#ffffff" />
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => router.push("/login")}
                  style={styles.backButton}
                >
                  <MaterialIcons name="arrow-back" size={20} color="#8b5cf6" />
                  <Text style={styles.backButtonText}>Back to Login</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: width,
    height: height,
  },
  purpleGradient: {
    flex: 1,
    backgroundColor: "#8b5cf6",
  },
  backgroundOverlay: {
    flex: 1,
    position: "relative",
    overflow: "hidden",
  },
  backgroundShape1: {
    position: "absolute",
    top: -50,
    right: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  backgroundShape2: {
    position: "absolute",
    top: 100,
    left: -75,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
  },
  backgroundShape3: {
    position: "absolute",
    bottom: 50,
    right: 20,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
  },
  curvedBottomSection: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: height * 0.65,
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
  },
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "flex-end",
    paddingBottom: 50,
  },
  formWrapper: {
    paddingHorizontal: 24,
    paddingTop: 60,
  },
  glassMorphContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 28,
    padding: 32,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 20,
    },
    shadowOpacity: 0.1,
    shadowRadius: 25,
    elevation: 20,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 40,
  },
  appTitle: {
    fontSize: 32,
    fontWeight: "800",
    color: "#1f2937",
    marginTop: 16,
    letterSpacing: -0.5,
  },
  formContainer: {
    width: "100%",
  },
  formTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1f2937",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#6b7280",
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 24,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f9fafb",
    borderRadius: 16,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: "#e5e7eb",
  },
  inputIcon: {
    marginLeft: 18,
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    paddingVertical: 18,
    paddingRight: 18,
    fontSize: 16,
    color: "#374151",
    fontWeight: "500",
  },
  errorText: {
    color: "#ef4444",
    fontSize: 14,
    marginBottom: 12,
    marginLeft: 6,
    fontWeight: "600",
  },
  submitButton: {
    backgroundColor: "#8b5cf6",
    borderRadius: 16,
    paddingVertical: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 24,
    shadowColor: "#8b5cf6",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  submitButtonDisabled: {
    backgroundColor: "#d1d5db",
    shadowOpacity: 0,
    elevation: 0,
  },
  submitButtonText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "700",
    marginRight: 10,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 24,
    paddingVertical: 12,
  },
  backButtonText: {
    color: "#8b5cf6",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
});

export default ForgotPassword;
