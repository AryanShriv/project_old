import { Stack } from "expo-router";

import { useTheme } from "@/src/context/ThemeContext";

export default function AuthLayout() {
  const { colors } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerShadowVisible: false,
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.textPrimary,
        headerTitleStyle: { fontWeight: "700" },
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen
        name="signup"
        options={{
          title: "Create account",
          headerBackTitle: "Back",
        }}
      />
    </Stack>
  );
}

