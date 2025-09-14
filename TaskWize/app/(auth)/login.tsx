import { login } from "@/service/authService";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const { width, height } = Dimensions.get("window");

// Email validation function
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const Login = () => {
  const router = useRouter();
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [emailError, setEmailError] = useState<string>("");
  const [passwordError, setPasswordError] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const validateForm = (): boolean => {
    let isValid = true;

    // Reset errors
    setEmailError("");
    setPasswordError("");

    // Email validation
    if (!email.trim()) {
      setEmailError("Email is required");
      isValid = false;
    } else if (!isValidEmail(email.trim())) {
      setEmailError("Please enter a valid email address");
      isValid = false;
    }

    // Password validation
    if (!password.trim()) {
      setPasswordError("Password is required");
      isValid = false;
    } else if (password.length < 6) {
      setPasswordError("Password must be at least 6 characters");
      isValid = false;
    }

    return isValid;
  };

  const handleLogin = async () => {
    if (isLoading) return;

    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const res = await login(email.trim(), password);
      console.log(res);
      router.push("/home");
    } catch (err) {
      console.error(err);
      Alert.alert(
        "Login Failed",
        "Invalid email or password. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    router.push("/forgot-password");
  };

  return (
    <View style={styles.container}>
      {/* Custom Background */}
      <View style={styles.backgroundContainer}>
        {/* Purple Gradient Background */}
        <View style={styles.purpleGradient} />

        {/* Hexagonal Logo in Center */}
        <View style={styles.logoBackground}>
          <View style={styles.hexagonContainer}>
            <View style={styles.hexagon}>
              <View style={styles.innerHexagon}>
                <MaterialIcons name="play-arrow" size={40} color="#9333ea" />
              </View>
            </View>
          </View>
        </View>

        {/* Curved White Bottom Section */}
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
              {/* Logo/Icon Section */}
              <View style={styles.logoContainer}>
                <MaterialIcons name="task-alt" size={60} color="#8b5cf6" />
                <Text style={styles.appTitle}>TaskWize</Text>
                <Text style={styles.subtitle}>
                  Welcome back! Please sign in to continue
                </Text>
              </View>

              {/* Form Section */}
              <View style={styles.formContainer}>
                <Text style={styles.formTitle}>Sign In</Text>

                {/* Email Input */}
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

                {/* Password Input */}
                <View style={styles.inputContainer}>
                  <MaterialIcons
                    name="lock"
                    size={20}
                    color="#8b5cf6"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    placeholder="Password"
                    style={[styles.textInput, { paddingRight: 50 }]}
                    placeholderTextColor="#9ca3af"
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={(text) => {
                      setPassword(text);
                      setPasswordError("");
                    }}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity
                    style={styles.eyeIcon}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <MaterialIcons
                      name={showPassword ? "visibility" : "visibility-off"}
                      size={20}
                      color="#ffffff"
                    />
                  </TouchableOpacity>
                </View>
                {passwordError ? (
                  <Text style={styles.errorText}>{passwordError}</Text>
                ) : null}

                {/* Login Button */}
                <TouchableOpacity
                  style={[
                    styles.loginButton,
                    isLoading && styles.loginButtonDisabled,
                  ]}
                  onPress={handleLogin}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#ffffff" size="small" />
                  ) : (
                    <>
                      <Text style={styles.loginButtonText}>Sign In</Text>
                      <MaterialIcons
                        name="arrow-forward"
                        size={20}
                        color="#ffffff"
                      />
                    </>
                  )}
                </TouchableOpacity>

                {/* Forgot Password Link */}
                <Pressable
                  onPress={handleForgotPassword}
                  style={styles.forgotPasswordLink}
                >
                  <Text style={styles.forgotPasswordText}>
                    Forgot Password?
                  </Text>
                </Pressable>

                {/* Register Link */}
                <Pressable
                  onPress={() => router.push("/register")}
                  style={styles.registerLink}
                >
                  <Text style={styles.registerText}>
                    Don&apos;t have an account?{" "}
                    <Text style={styles.registerTextBold}>Sign Up</Text>
                  </Text>
                </Pressable>
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
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#8b5cf6", // Base purple color
    // Note: For better gradient, you might want to use react-native-linear-gradient
  },
  logoBackground: {
    position: "absolute",
    top: "35%",
    left: 0,
    right: 0,
    alignItems: "center",
  },
  hexagonContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  hexagon: {
    width: 120,
    height: 120,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.3)",
    alignItems: "center",
    justifyContent: "center",
    transform: [{ rotate: "0deg" }],
  },
  innerHexagon: {
    width: 80,
    height: 80,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  curvedBottomSection: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: height * 0.25,
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 50,
    borderTopRightRadius: 50,
  },
  overlay: {
    flex: 1,
    position: "relative",
    zIndex: 10,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "flex-end",
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  formWrapper: {
    alignItems: "center",
  },
  glassMorphContainer: {
    width: "100%",
    maxWidth: 400,
    borderRadius: 24,
    padding: 32,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.3)",
    boxShadow: "0px 20px 25px rgba(0, 0, 0, 0.25)",
    elevation: 20,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 30,
  },
  appTitle: {
    fontSize: 34,
    fontWeight: "bold",
    color: "#8b5cf6",
    marginTop: 12,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 16,
    color: "#6b7280",
    textAlign: "center",
    marginTop: 8,
    lineHeight: 24,
  },
  formContainer: {
    width: "100%",
  },
  formTitle: {
    fontSize: 26,
    fontWeight: "700",
    color: "#374151",
    marginBottom: 32,
    textAlign: "center",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f9fafb",
    borderRadius: 16,
    marginBottom: 8,
    borderWidth: 1.5,
    borderColor: "#e5e7eb",
    boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.05)",
    elevation: 2,
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
  eyeIcon: {
    position: "absolute",
    right: 18,
    padding: 6,
  },
  errorText: {
    color: "#ef4444",
    fontSize: 14,
    marginBottom: 12,
    marginLeft: 6,
    fontWeight: "600",
  },
  loginButton: {
    backgroundColor: "#8b5cf6",
    borderRadius: 16,
    paddingVertical: 18,
    marginTop: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#8b5cf6",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 12,
  },
  loginButtonDisabled: {
    backgroundColor: "#8b5cf6AA",
    shadowOpacity: 0.2,
  },
  loginButtonText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "700",
    marginRight: 10,
  },
  forgotPasswordLink: {
    marginTop: 16,
    alignItems: "center",
  },
  forgotPasswordText: {
    color: "#8b5cf6",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  registerLink: {
    marginTop: 32,
    alignItems: "center",
  },
  registerText: {
    color: "#6b7280",
    fontSize: 16,
    textAlign: "center",
  },
  registerTextBold: {
    color: "#8b5cf6",
    fontWeight: "700",
  },
});

export default Login;
