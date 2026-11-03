import { Ionicons } from "@expo/vector-icons";
import type { Href } from "expo-router";
import { Redirect, router, Stack } from "expo-router";
import { useMemo } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

import { useAuth } from "@/src/context/AuthContext";
import { useTheme } from "@/src/context/ThemeContext";
import { ThemeColors } from "@/src/design-system/colors";
import { radius } from "@/src/design-system/radius";
import { minTapTarget, spacing } from "@/src/design-system/spacing";
import { typography } from "@/src/design-system/typography";

export default function ExpertLayout() {
  const { user, isLoading, expertStatus } = useAuth();
  const { colors } = useTheme();

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!user || user.role !== "expert") {
    return <Redirect href={"/(auth)/login?intent=expert" as Href} />;
  }

  const isSuspended =
    user.accountStatus === "suspended" ||
    (user.managedExpertId !== undefined && expertStatus[user.managedExpertId] === "suspended");
  if (isSuspended) {
    return <SuspendedScreen />;
  }

  // Pending and rejected experts can use the app to finish their profile and availability.
  // The dashboard shows a warm status banner; the backend keeps them out of Discover until approved.
  return <Stack screenOptions={{ headerShown: false }} />;
}

function SuspendedScreen() {
  const { logout } = useAuth();
  const { colors } = useTheme();
  const themed = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={[styles.center, themed.container]}>
      <View style={themed.iconWrap}>
        <Ionicons name="pause-circle-outline" size={32} color={colors.onPrimaryMuted} />
      </View>
      <Text style={themed.title}>Your profile is paused</Text>
      <Text style={themed.body}>
        Your expert profile is not visible to people right now. This can happen while our team looks
        into something on your account. We would like to help sort it out.
      </Text>
      <Pressable style={[themed.btn, themed.btnPrimary]} onPress={() => router.push("/help" as Href)}>
        <Text style={themed.btnPrimaryText}>Contact support</Text>
      </Pressable>
      <Pressable style={[themed.btn, themed.btnGhost]} onPress={logout}>
        <Text style={themed.btnGhostText}>Log out</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      backgroundColor: colors.background,
      paddingHorizontal: spacing.lg,
    },
    iconWrap: {
      width: 64,
      height: 64,
      borderRadius: radius.full,
      backgroundColor: colors.primaryMuted,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: spacing.md,
    },
    title: {
      ...typography.h1,
      color: colors.textPrimary,
      textAlign: "center",
    },
    body: {
      ...typography.body,
      color: colors.textSecondary,
      textAlign: "center",
      marginTop: spacing.xs,
      marginBottom: spacing.lg,
      maxWidth: 360,
    },
    btn: {
      width: "100%",
      maxWidth: 320,
      minHeight: minTapTarget,
      borderRadius: radius.md,
      alignItems: "center",
      justifyContent: "center",
      marginTop: spacing.sm,
    },
    btnPrimary: {
      backgroundColor: colors.primary,
    },
    btnPrimaryText: {
      ...typography.button,
      color: colors.onPrimary,
    },
    btnGhost: {
      borderWidth: 1,
      borderColor: colors.border,
    },
    btnGhostText: {
      ...typography.button,
      color: colors.textSecondary,
    },
  });
