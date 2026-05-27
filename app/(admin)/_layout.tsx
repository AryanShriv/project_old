import type { Href } from "expo-router";
import { Redirect, Stack } from "expo-router";
import { ActivityIndicator, Platform, StyleSheet, Text, View } from "react-native";

import { useAuth } from "@/src/context/AuthContext";
import { colors } from "@/src/design-system/colors";

export default function AdminLayout() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!user || user.role !== "admin") {
    return <Redirect href={"/(auth)/login?intent=admin" as Href} />;
  }

  if (Platform.OS !== "web") {
    return (
      <View style={styles.center}>
        <Text style={styles.blockedTitle}>Admin portal is web-only</Text>
        <Text style={styles.blockedSub}>
          Open this route in the web app to access moderation tools.
        </Text>
      </View>
    );
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
  blockedTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  blockedSub: {
    marginTop: 8,
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    paddingHorizontal: 24,
  },
});
