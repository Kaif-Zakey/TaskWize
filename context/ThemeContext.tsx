import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface ThemeContextType {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  colors: {
    background: string;
    surface: string;
    primary: string;
    text: string;
    textSecondary: string;
    border: string;
    accent: string;
    success: string;
    warning: string;
    error: string;
    info: string;
  };
}

const lightColors = {
  background: "#f9fafb",
  surface: "#ffffff",
  primary: "#6366f1",
  text: "#111827",
  textSecondary: "#6b7280",
  border: "#e5e7eb",
  accent: "#3b82f6",
  success: "#10b981",
  warning: "#f59e0b",
  error: "#ef4444",
  info: "#06b6d4",
};

const darkColors = {
  background: "#111827",
  surface: "#1f2937",
  primary: "#818cf8",
  text: "#f9fafb",
  textSecondary: "#9ca3af",
  border: "#374151",
  accent: "#60a5fa",
  success: "#34d399",
  warning: "#fbbf24",
  error: "#f87171",
  info: "#22d3ee",
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    loadThemePreference();
  }, []);

  const loadThemePreference = async () => {
    try {
      const savedPreferences = await AsyncStorage.getItem("appPreferences");
      if (savedPreferences) {
        const preferences = JSON.parse(savedPreferences);
        setIsDarkMode(preferences.darkMode || false);
      }
    } catch (error) {
      console.error("Error loading theme preference:", error);
    }
  };

  const toggleDarkMode = async () => {
    try {
      const newDarkMode = !isDarkMode;
      setIsDarkMode(newDarkMode);

      // Update the preferences in AsyncStorage
      const savedPreferences = await AsyncStorage.getItem("appPreferences");
      const preferences = savedPreferences ? JSON.parse(savedPreferences) : {};
      preferences.darkMode = newDarkMode;
      await AsyncStorage.setItem("appPreferences", JSON.stringify(preferences));
    } catch (error) {
      console.error("Error saving theme preference:", error);
    }
  };

  const colors = isDarkMode ? darkColors : lightColors;

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleDarkMode, colors }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
