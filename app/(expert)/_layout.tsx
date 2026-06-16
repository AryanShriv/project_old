import type { Href } from "expo-router";
import { Redirect, Stack } from "expo-router";
import { ActivityIndicator, StyleSheet, View } from "react-native";

import { useAuth } from "@/src/context/AuthContext";
import { colors } from "@/src/design-system/colors";

export default function ExpertLayout() {
  const { user, isLoading, expertStatus } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!user || user.role !== "expert") {
    return (
      <Redirect href={"/(auth)/login?intent=expert" as Href} />
    );
  }

  if (
    user.managedExpertId &&
    expertStatus[user.managedExpertId] === "suspended"
  ) {
    return <Redirect href={"/(auth)/login?intent=expert" as Href} />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
  },
});
