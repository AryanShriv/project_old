import { Ionicons } from "@expo/vector-icons";
import type { Href } from "expo-router";
import { router } from "expo-router";
import type { ComponentProps } from "react";
import React, { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Linking,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

import { useAuth } from "@/src/context/AuthContext";
import { useTheme } from "@/src/context/ThemeContext";
import { ThemeColors } from "@/src/design-system/colors";
import { radius } from "@/src/design-system/radius";
import { spacing } from "@/src/design-system/spacing";

const settingsRows: {
  id: string;
  label: string;
  icon: ComponentProps<typeof Ionicons>["name"];
}[] = [
  { id: "notif", label: "Notifications", icon: "notifications-outline" },
  { id: "help", label: "Help & support", icon: "help-circle-outline" },
  { id: "terms", label: "Terms & Conditions", icon: "document-text-outline" },
];

export default function ClientProfileScreen() {
  const { user, logout, updateProfile, refreshUser } = useAuth();
  const { colors, toggleTheme, isDark } = useTheme();

  const styles = useMemo(() => createStyles(colors), [colors]);

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    fullName: user?.name ?? "",
    headline: user?.profile?.headline ?? "",
    bio: user?.profile?.bio ?? "",
    company: user?.profile?.company ?? "",
    website: user?.profile?.website ?? "",
    location: user?.profile?.location ?? "",
    phone: user?.profile?.phone ?? "",
  });

  // Sync form when user object updates (e.g. after refreshUser)
  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.name ?? "",
        headline: user.profile?.headline ?? "",
        bio: user.profile?.bio ?? "",
        company: user.profile?.company ?? "",
        website: user.profile?.website ?? "",
        location: user.profile?.location ?? "",
        phone: user.profile?.phone ?? "",
      });
    }
  }, [user]);

  // Refresh user profile from server on mount
  useEffect(() => {
    if (user) {
      refreshUser();
    }
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const payload: Record<string, string> = {};
      if (formData.fullName.trim()) payload.fullName = formData.fullName.trim();
      if (formData.headline.trim()) payload.headline = formData.headline.trim();
      payload.bio = formData.bio.trim();
      payload.company = formData.company.trim();
      payload.website = formData.website.trim();
      payload.location = formData.location.trim();
      payload.phone = formData.phone.trim();

      await updateProfile(payload);

      Toast.show({
        type: "success",
        text1: "Profile updated",
        text2: "Your changes have been saved",
      });

      setIsEditing(false);
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Failed to update profile",
        text2: (error as Error).message || "Please try again",
      });
    } finally {
      setIsSaving(false);
    }
  };

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
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
        {/* ─── Hero / Avatar ─── */}
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
          {user.profile?.headline ? (
            <Text style={styles.headline}>{user.profile.headline}</Text>
          ) : null}
          <Text style={styles.email}>{user.email}</Text>

          {!isEditing && (
            <Pressable
              style={styles.editBtn}
              onPress={() => setIsEditing(true)}
            >
              <Ionicons name="pencil" size={16} color={colors.primary} />
              <Text style={styles.editBtnText}>Edit profile</Text>
            </Pressable>
          )}
        </View>

        {/* ─── Profile Summary (read-only) ─── */}
        {!isEditing && (
          <View style={styles.summaryCard}>
            {user.profile?.bio ? (
              <View style={styles.summaryRow}>
                <Ionicons name="person-outline" size={18} color={colors.primary} />
                <View style={styles.summaryTextBlock}>
                  <Text style={styles.summaryLabel}>About</Text>
                  <Text style={styles.summaryValue}>{user.profile.bio}</Text>
                </View>
              </View>
            ) : null}
            {user.profile?.company ? (
              <View style={styles.summaryRow}>
                <Ionicons name="business-outline" size={18} color={colors.primary} />
                <View style={styles.summaryTextBlock}>
                  <Text style={styles.summaryLabel}>Company</Text>
                  <Text style={styles.summaryValue}>{user.profile.company}</Text>
                </View>
              </View>
            ) : null}
            {user.profile?.location ? (
              <View style={styles.summaryRow}>
                <Ionicons name="location-outline" size={18} color={colors.primary} />
                <View style={styles.summaryTextBlock}>
                  <Text style={styles.summaryLabel}>Location</Text>
                  <Text style={styles.summaryValue}>{user.profile.location}</Text>
                </View>
              </View>
            ) : null}
            {user.profile?.website ? (
              <View style={styles.summaryRow}>
                <Ionicons name="globe-outline" size={18} color={colors.primary} />
                <View style={styles.summaryTextBlock}>
                  <Text style={styles.summaryLabel}>Website</Text>
                  <Text
                    style={[styles.summaryValue, { color: colors.primary }]}
                    onPress={() => Linking.openURL(user.profile!.website!)}
                  >
                    {user.profile.website}
                  </Text>
                </View>
              </View>
            ) : null}
            {user.profile?.phone ? (
              <View style={styles.summaryRow}>
                <Ionicons name="call-outline" size={18} color={colors.primary} />
                <View style={styles.summaryTextBlock}>
                  <Text style={styles.summaryLabel}>Phone</Text>
                  <Text style={styles.summaryValue}>{user.profile.phone}</Text>
                </View>
              </View>
            ) : null}
            {!user.profile?.bio && !user.profile?.company && !user.profile?.location && !user.profile?.website && !user.profile?.phone ? (
              <View style={styles.summaryRow}>
                <Ionicons name="information-circle-outline" size={18} color={colors.textMuted} />
                <Text style={[styles.summaryValue, { color: colors.textMuted }]}>
                  Tap "Edit profile" to add your details
                </Text>
              </View>
            ) : null}
          </View>
        )}

        {/* ─── Edit Form ─── */}
        {isEditing && (
          <View style={styles.formSection}>
            <Text style={styles.sectionLabel}>Edit Profile</Text>

            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Your full name"
              placeholderTextColor={colors.textMuted}
              value={formData.fullName}
              onChangeText={(text) =>
                setFormData({ ...formData, fullName: text })
              }
            />

            <Text style={styles.label}>Headline</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. CEO at Acme Corp"
              placeholderTextColor={colors.textMuted}
              value={formData.headline}
              onChangeText={(text) =>
                setFormData({ ...formData, headline: text })
              }
            />

            <Text style={styles.label}>About</Text>
            <TextInput
              style={[styles.input, styles.textarea]}
              placeholder="Tell freelancers about yourself and your business"
              placeholderTextColor={colors.textMuted}
              value={formData.bio}
              onChangeText={(text) =>
                setFormData({ ...formData, bio: text })
              }
              multiline
            />

            <Text style={styles.label}>Company</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Acme Corporation"
              placeholderTextColor={colors.textMuted}
              value={formData.company}
              onChangeText={(text) =>
                setFormData({ ...formData, company: text })
              }
            />

            <Text style={styles.label}>Website</Text>
            <TextInput
              style={styles.input}
              placeholder="https://yourcompany.com"
              placeholderTextColor={colors.textMuted}
              value={formData.website}
              onChangeText={(text) =>
                setFormData({ ...formData, website: text })
              }
              keyboardType="url"
              autoCapitalize="none"
            />

            <Text style={styles.label}>Location</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. San Francisco, CA"
              placeholderTextColor={colors.textMuted}
              value={formData.location}
              onChangeText={(text) =>
                setFormData({ ...formData, location: text })
              }
            />

            <Text style={styles.label}>Phone</Text>
            <TextInput
              style={styles.input}
              placeholder="+1 (555) 123-4567"
              placeholderTextColor={colors.textMuted}
              value={formData.phone}
              onChangeText={(text) =>
                setFormData({ ...formData, phone: text })
              }
              keyboardType="phone-pad"
            />

            <View style={styles.actions}>
              <Pressable
                style={[styles.btn, styles.btnCancel]}
                onPress={() => setIsEditing(false)}
                disabled={isSaving}
              >
                <Text style={styles.btnCancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.btn, styles.btnSave, isSaving && styles.btnDisabled]}
                onPress={handleSave}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.btnSaveText}>Save Changes</Text>
                )}
              </Pressable>
            </View>
          </View>
        )}

        {/* ─── Freelancing ─── */}
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

        {/* ─── Account Settings ─── */}
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

          {settingsRows.map((row, index) => (
            <Pressable
              key={row.id}
              style={[styles.row, index < settingsRows.length - 1 && styles.rowBorder]}
              onPress={() => {
                if (row.id === "notif") {
                  router.push("/notifications" as Href);
                  return;
                }
                if (row.id === "help") {
                  router.push("/help" as Href);
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
      </KeyboardAvoidingView>
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
    headline: {
      marginTop: 4,
      fontSize: 15,
      color: colors.textSecondary,
      textAlign: "center",
    },
    email: {
      marginTop: 6,
      fontSize: 15,
      color: colors.textMuted,
    },
    editBtn: {
      marginTop: spacing.md,
      paddingVertical: 10,
      paddingHorizontal: spacing.md,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    editBtnText: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.primary,
    },
    // ─── Summary card (read-only profile info) ───
    summaryCard: {
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.md,
      marginBottom: spacing.md,
    },
    summaryRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      paddingVertical: 10,
      gap: spacing.sm,
    },
    summaryTextBlock: {
      flex: 1,
    },
    summaryLabel: {
      fontSize: 12,
      fontWeight: "600",
      color: colors.textMuted,
      textTransform: "uppercase",
      letterSpacing: 0.4,
      marginBottom: 2,
    },
    summaryValue: {
      fontSize: 15,
      color: colors.textPrimary,
      lineHeight: 22,
    },
    // ─── Edit form ───
    formSection: {
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.md,
      marginBottom: spacing.lg,
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
    label: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.textSecondary,
      marginBottom: 6,
      marginTop: spacing.sm,
    },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      padding: spacing.sm,
      fontSize: 14,
      color: colors.textPrimary,
      backgroundColor: colors.background,
    },
    textarea: {
      height: 100,
      textAlignVertical: "top",
    },
    actions: {
      flexDirection: "row",
      gap: spacing.sm,
      marginTop: spacing.lg,
    },
    btn: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: radius.md,
      alignItems: "center",
      justifyContent: "center",
    },
    btnCancel: {
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.background,
    },
    btnCancelText: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.textSecondary,
    },
    btnSave: {
      backgroundColor: colors.primary,
    },
    btnSaveText: {
      fontSize: 14,
      fontWeight: "600",
      color: "#fff",
    },
    btnDisabled: {
      opacity: 0.6,
    },
    // ─── Settings cards ───
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
