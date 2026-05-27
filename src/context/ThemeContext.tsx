import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";
import { Appearance, useColorScheme } from "react-native";
import { dark, light, ThemeColors } from "../design-system/colors";

type ThemeType = "light" | "dark";

type ThemeContextType = {
  theme: ThemeType;
  colors: ThemeColors;
  toggleTheme: () => void;
  isDark: boolean;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = "@theme_preference";

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const systemColorScheme = useColorScheme();
  const [theme, setTheme] = useState<ThemeType>("light");

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (savedTheme) {
          setTheme(savedTheme as ThemeType);
        } else if (systemColorScheme) {
          setTheme(systemColorScheme);
        }
      } catch (e) {
        console.error("Failed to load theme", e);
      }
    };
    loadTheme();
  }, [systemColorScheme]);

  const toggleTheme = async () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, newTheme);
    } catch (e) {
      console.error("Failed to save theme", e);
    }
  };

  const colors = theme === "light" ? light : dark;

  return (
    <ThemeContext.Provider
      value={{
        theme,
        colors,
        toggleTheme,
        isDark: theme === "dark",
      }}
    >
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
