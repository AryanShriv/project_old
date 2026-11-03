import type { Href } from "expo-router";
import { Redirect, Stack } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

import { useAuth } from "@/src/context/AuthContext";
import { useTheme } from "@/src/context/ThemeContext";
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

  // Experts stay locked out of the dashboard until an admin approves their application
  if (user.accountStatus === "pending_review") {
    return <ApplicationStatusScreen />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}

function ApplicationStatusScreen() {
  const { user, refreshUser, logout } = useAuth();
  const { colors: themeColors } = useTheme();
  const [checking, setChecking] = useState(false);
  const isRejected = user?.approvalStatus === "rejected";

  const handleCheck = async () => {
    setChecking(true);
    await refreshUser();
    setChecking(false);
  };

  return (
    <View style={[styles.center, styles.padded, { backgroundColor: themeColors.background }]}>
      <Text style={[styles.title, { color: themeColors.textPrimary }]}>
        {isRejected ? "Application not approved" : "Application under review"}
      </Text>
      <Text style={[styles.body, { color: themeColors.textSecondary }]}>
        {isRejected
          ? user?.rejectionReason || "An admin reviewed your application and did not approve it."
          : "An admin is reviewing your expert application. You'll get access to your dashboard once it's approved."}
      </Text>
      <Pressable
        style={[styles.btn, { backgroundColor: themeColors.primary }]}
        onPress={handleCheck}
        disabled={checking}
      >
        {checking ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.btnPrimaryText}>Check status</Text>
        )}
      </Pressable>
      <Pressable
        style={[styles.btn, styles.btnGhost, { borderColor: themeColors.border }]}
        onPress={logout}
      >
        <Text style={[styles.btnGhostText, { color: themeColors.textSecondary }]}>Log out</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
  },
  padded: {
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
  },
  body: {
    marginTop: 8,
    marginBottom: 24,
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
  },
  btn: {
    width: "100%",
    maxWidth: 320,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 12,
  },
  btnGhost: {
    borderWidth: 1,
  },
  btnPrimaryText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 15,
  },
  btnGhostText: {
    fontWeight: "600",
    fontSize: 15,
  },
});
