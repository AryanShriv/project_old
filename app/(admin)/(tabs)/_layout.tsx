import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { Platform, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme } from "@/src/context/ThemeContext";

export default function AdminTabsLayout() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.tabBarActive,
        tabBarInactiveTintColor: colors.tabBarInactive,
        tabBarStyle: {
          position: "absolute",
          backgroundColor: colors.tabBarBackground,
          borderTopWidth: 0.5,
          borderTopColor: colors.tabBarBorder,
          elevation: 0,
          paddingTop: 6,
          paddingBottom: Math.max(insets.bottom, 6),
          height: (Platform.OS === "ios" ? 80 : 64) + Math.max(insets.bottom, 0),
        },
        tabBarLabelStyle: {
          fontSize: 13,
          fontWeight: "600",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Overview",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="analytics" size={size} color={color as string} />
          ),
        }}
      />
      <Tabs.Screen
        name="applications"
        options={{
          title: "Applications",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="document-text" size={size} color={color as string} />
          ),
        }}
      />
      <Tabs.Screen
        // Legacy route file name; this is the Experts tab. See "Naming" in backend/README.md.
        name="freelancers"
        options={{
          title: "Experts",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people" size={size} color={color as string} />
          ),
        }}
      />
      <Tabs.Screen
        name="audit"
        options={{
          title: "Audit",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="receipt" size={size} color={color as string} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Admin",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="shield-checkmark" size={size} color={color as string} />
          ),
        }}
      />
    </Tabs>
  );
}
