import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import React, { useMemo } from "react";
import type { Href } from "expo-router";
import { router } from "expo-router";
import {
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Switch,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "@/src/context/AuthContext";
import { useTheme } from "@/src/context/ThemeContext";
import { ThemeColors } from "@/src/design-system/colors";
import { radius } from "@/src/design-system/radius";
import { spacing } from "@/src/design-system/spacing";

const rows: {
  id: string;
  label: string;
  icon: ComponentProps<typeof Ionicons>["name"];
}[] = [
  { id: "notif", label: "Notifications", icon: "notifications-outline" },
  { id: "help", label: "Help & support", icon: "help-circle-outline" },
  { id: "terms", label: "Terms & Conditions", icon: "document-text-outline" },
];

export default function ClientProfileScreen() {
  const { user, logout } = useAuth();
  const { colors, toggleTheme, isDark } = useTheme();

  const styles = useMemo(() => createStyles(colors), [colors]);

  if (!user || user.role !== "client") {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <ScrollView contentContainerStyle={styles.guestContent}>
          <Text style={styles.guestTitle}>Sign in to hire</Text>
          <Text style={styles.guestSub}>
            Create an account or sign in to save experts and send consultation
            requests.
          </Text>
          <Pressable
            style={styles.primaryBtn}
            onPress={() =>
              router.push({
                pathname: "/(auth)/login",
                params: { intent: "client" },
              } as Href)
            }
          >
            <Text style={styles.primaryBtnText}>Sign in</Text>
          </Pressable>
          <Pressable
            style={styles.secondaryBtn}
            onPress={() =>
              router.push({
                pathname: "/(auth)/signup",
                params: { intent: "client" },
              } as Href)
            }
          >
            <Text style={styles.secondaryBtnText}>Create account</Text>
          </Pressable>

          <View style={styles.divider} />

          <Text style={styles.guestTitle}>Freelancer?</Text>
          <Text style={styles.guestSub}>
            Sign in with your freelancer account to manage leads and inbox.
          </Text>
          <Pressable
            style={styles.secondaryBtn}
            onPress={() =>
              router.push({
                pathname: "/(auth)/login",
                params: { intent: "freelancer" },
              } as Href)
            }
          >
            <Text style={styles.secondaryBtnText}>Freelancer sign in</Text>
          </Pressable>

          <View style={styles.divider} />

          <View style={styles.guestThemeRow}>
            <View style={styles.rowLeft}>
              <View style={styles.rowIconWrap}>
                <Ionicons
                  name={isDark ? "moon" : "sunny"}
                  size={22}
                  color={colors.primary}
                />
              </View>
              <Text style={styles.rowLabel}>Dark Mode</Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: colors.divider, true: colors.primary }}
              thumbColor={"#fff"}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user.name
                .split(" ")
                .map((s) => s[0])
                .join("")
                .slice(0, 2)
                .toUpperCase()}
            </Text>
          </View>
          <Text style={styles.name}>{user.name}</Text>
          <Text style={styles.email}>{user.email}</Text>
          <Pressable style={styles.editBtn}>
            <Text style={styles.editBtnText}>Edit profile</Text>
          </Pressable>
        </View>

        <Text style={styles.sectionLabel}>Freelancing</Text>
        <View style={styles.card}>
          <Pressable
            style={styles.roleRow}
            onPress={() =>
              router.push({
                pathname: "/(auth)/login",
                params: { intent: "freelancer" },
              } as Href)
            }
          >
            <View style={styles.rowLeft}>
              <View style={styles.rowIconWrap}>
                <Ionicons name="briefcase" size={22} color={colors.primary} />
              </View>
              <View style={styles.roleTextBlock}>
                <Text style={styles.rowLabel}>Freelancer dashboard</Text>
                <Text style={styles.roleHint}>
                  Opens sign-in for your freelancer account
                </Text>
              </View>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={colors.textMuted}
            />
          </Pressable>
        </View>

        <Text style={styles.sectionLabel}>Account</Text>
        <View style={styles.card}>
          {/* Theme Toggle Row */}
          <View style={[styles.row, styles.rowBorder]}>
            <View style={styles.rowLeft}>
              <View style={styles.rowIconWrap}>
                <Ionicons
                  name={isDark ? "moon" : "sunny"}
                  size={22}
                  color={colors.primary}
                />
              </View>
              <Text style={styles.rowLabel}>Dark Mode</Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: colors.divider, true: colors.primary }}
              thumbColor={"#fff"}
            />
          </View>

          {rows.map((row, index) => (
            <Pressable
              key={row.id}
              style={[styles.row, index < rows.length - 1 && styles.rowBorder]}
              onPress={() => {
                if (row.id === "help") {
                  Linking.openURL("https://expo.dev").catch(() => undefined);
                  return;
                }
                if (row.id === "terms") {
                  router.push("/terms" as Href);
                }
              }}
            >
              <View style={styles.rowLeft}>
                <View style={styles.rowIconWrap}>
                  <Ionicons name={row.icon} size={22} color={colors.primary} />
                </View>
                <Text style={styles.rowLabel}>{row.label}</Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={colors.textMuted}
              />
            </Pressable>
          ))}
        </View>

        <Pressable
          style={styles.logout}
          onPress={async () => {
            await logout();
            router.replace("/(client)/(tabs)" as Href);
          }}
        >
          <Text style={styles.logoutText}>Log out</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scroll: {
      flex: 1,
    },
    content: {
      paddingHorizontal: spacing.sm,
      paddingBottom: 100,
    },
    guestContent: {
      padding: spacing.lg,
      paddingTop: spacing.xl,
    },
    guestTitle: {
      fontSize: 24,
      fontWeight: "700",
      color: colors.textPrimary,
    },
    guestSub: {
      marginTop: spacing.sm,
      fontSize: 16,
      color: colors.textSecondary,
      lineHeight: 24,
      marginBottom: spacing.lg,
    },
    guestThemeRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 14,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      paddingHorizontal: spacing.sm,
      marginTop: spacing.sm,
    },
    primaryBtn: {
      backgroundColor: colors.primary,
      paddingVertical: 16,
      borderRadius: radius.md,
      alignItems: "center",
      marginBottom: spacing.sm,
    },
    primaryBtnText: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "700",
    },
    secondaryBtn: {
      paddingVertical: 16,
      borderRadius: radius.md,
      alignItems: "center",
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    secondaryBtnText: {
      color: colors.primary,
      fontSize: 16,
      fontWeight: "600",
    },
    divider: {
      height: 1,
      backgroundColor: colors.divider,
      marginVertical: spacing.lg,
    },
    hero: {
      alignItems: "center",
      paddingVertical: spacing.lg,
      marginBottom: spacing.sm,
    },
    avatar: {
      width: 88,
      height: 88,
      borderRadius: 44,
      backgroundColor: colors.primaryMuted,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: spacing.md,
      borderWidth: 3,
      borderColor: colors.surface,
      shadowColor: "#000",
      shadowOpacity: 0.08,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 4 },
      elevation: 3,
    },
    avatarText: {
      fontSize: 28,
      fontWeight: "700",
      color: colors.primary,
      letterSpacing: 1,
    },
    name: {
      fontSize: 22,
      fontWeight: "700",
      color: colors.textPrimary,
      letterSpacing: -0.3,
    },
    email: {
      marginTop: 6,
      fontSize: 15,
      color: colors.textSecondary,
    },
    editBtn: {
      marginTop: spacing.md,
      paddingVertical: 10,
      paddingHorizontal: spacing.md,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    editBtnText: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.primary,
    },
    sectionLabel: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.textMuted,
      textTransform: "uppercase",
      letterSpacing: 0.6,
      marginBottom: spacing.xs,
      marginTop: spacing.sm,
      marginLeft: 4,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: "hidden",
      marginBottom: spacing.md,
    },
    roleRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 14,
      paddingHorizontal: spacing.sm,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 14,
      paddingHorizontal: spacing.sm,
    },
    rowBorder: {
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.divider,
    },
    rowLeft: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
    },
    rowIconWrap: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: colors.primaryMuted,
      alignItems: "center",
      justifyContent: "center",
      marginRight: spacing.sm,
    },
    roleTextBlock: {
      flex: 1,
      minWidth: 0,
    },
    rowLabel: {
      fontSize: 16,
      color: colors.textPrimary,
      fontWeight: "500",
    },
    roleHint: {
      marginTop: 4,
      fontSize: 13,
      color: colors.textMuted,
      lineHeight: 18,
    },
    logout: {
      marginTop: spacing.md,
      paddingVertical: 14,
      alignItems: "center",
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    logoutText: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.textSecondary,
    },
  });
