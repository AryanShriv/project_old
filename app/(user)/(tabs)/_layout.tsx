import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { Platform, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useChat } from "@/src/context/ChatContext";
import { useTheme } from "@/src/context/ThemeContext";

export default function UserTabsLayout() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { totalUnreadCount } = useChat();

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
          title: "Discover",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="compass" size={size} color={color as string} />
          ),
        }}
      />

      <Tabs.Screen
        name="saved"
        options={{
          title: "Saved",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="bookmark" size={size} color={color as string} />
          ),
        }}
      />

      <Tabs.Screen
        name="requests"
        options={{
          title: "Requests",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="document-text" size={size} color={color as string} />
          ),
        }}
      />

      <Tabs.Screen
        name="messages"
        options={{
          title: "Messages",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubbles" size={size} color={color as string} />
          ),
          tabBarBadge: totalUnreadCount > 0 ? totalUnreadCount : undefined,
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-circle" size={size} color={color as string} />
          ),
        }}
      />
    </Tabs>
  );
}

