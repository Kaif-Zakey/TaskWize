import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

interface AppPreferences {
  notifications: boolean;
  locationServices: boolean;
  darkMode: boolean;
  soundEffects: boolean;
  defaultTaskCategory: string;
  reminderTime: string;
}

export type { AppPreferences };

const defaultPreferences: AppPreferences = {
  notifications: true,
  locationServices: true,
  darkMode: false,
  soundEffects: true,
  defaultTaskCategory: "Work",
  reminderTime: "09:00",
};

interface PreferencesContextType {
  preferences: AppPreferences;
  updatePreference: (key: keyof AppPreferences, value: any) => Promise<void>;
  isLocationServicesEnabled: boolean;
}

const PreferencesContext = createContext<PreferencesContextType>({
  preferences: defaultPreferences,
  updatePreference: async () => {},
  isLocationServicesEnabled: true,
});

export const PreferencesProvider = ({ children }: { children: ReactNode }) => {
  const [preferences, setPreferences] =
    useState<AppPreferences>(defaultPreferences);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const savedPreferences = await AsyncStorage.getItem("appPreferences");
      if (savedPreferences) {
        const parsedPreferences = JSON.parse(savedPreferences);
        setPreferences({ ...defaultPreferences, ...parsedPreferences });
      }
    } catch (error) {
      console.error("Error loading preferences:", error);
    }
  };

  const updatePreference = async (key: keyof AppPreferences, value: any) => {
    try {
      const newPreferences = { ...preferences, [key]: value };
      await AsyncStorage.setItem(
        "appPreferences",
        JSON.stringify(newPreferences)
      );
      setPreferences(newPreferences);
    } catch (error) {
      console.error("Error saving preferences:", error);
    }
  };

  const value = {
    preferences,
    updatePreference,
    isLocationServicesEnabled: preferences.locationServices,
  };

  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  );
};

export const usePreferences = () => {
  const context = useContext(PreferencesContext);
  if (!context) {
    throw new Error("usePreferences must be used within a PreferencesProvider");
  }
  return context;
};
