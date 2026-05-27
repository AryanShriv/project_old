import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import type { Href } from "expo-router";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

import { useAuth } from "@/src/context/AuthContext";
import { useFreelancers } from "@/src/context/FreelancersContext";
import { useTheme } from "@/src/context/ThemeContext";
import { ThemeColors } from "@/src/design-system/colors";
import { radius } from "@/src/design-system/radius";
import { spacing } from "@/src/design-system/spacing";
import { apiRequest } from "@/src/services/apiClient";

export default function FreelancerProfileTabScreen() {
  const { user, logout } = useAuth();
  const { freelancers, refresh } = useFreelancers();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const personaId = user?.managedFreelancerId;
  const me = freelancers.find((f) => f.id === personaId);

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form state — initialize from current profile
  const [formData, setFormData] = useState({
    fullName: me?.name ?? "",
    headline: me?.title ?? "",
    bio: "",
    hourlyRate: me?.rate ? parseInt(me.rate.replace(/\D/g, "")) : 0,
    location: "",
    yearsExperience: 0,
    skills: me?.skills?.join(", ") ?? "",
  });

  const handleSave = async () => {
    if (!personaId) return;

    setIsSaving(true);
    try {
      const payload = {
        fullName: formData.fullName.trim(),
        headline: formData.headline.trim(),
        bio: formData.bio.trim(),
        hourlyRate: Math.max(0, formData.hourlyRate),
        location: formData.location.trim(),
        yearsExperience: Math.max(0, formData.yearsExperience),
        skills: formData.skills
          .split(",")
          .map((s) => s.trim())
          .filter((s) => s.length > 0),
      };

      await apiRequest(`/freelancers/${personaId}`, {
        method: "PATCH",
        auth: true,
        body: payload,
      });

      // Refresh freelancers list to get updated data
      await refresh();

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

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.kicker}>Signed in as freelancer</Text>
            <Text style={styles.title}>Your public profile</Text>
          </View>
          {!isEditing && (
            <Pressable
              style={styles.editBtn}
              onPress={() => setIsEditing(true)}
            >
              <Ionicons name="pencil" size={18} color={colors.primary} />
            </Pressable>
          )}
        </View>

        {user ? (
          <View style={styles.account}>
            <Text style={styles.accountName}>{user.name}</Text>
            <Text style={styles.accountEmail}>{user.email}</Text>
          </View>
        ) : null}

        {me ? (
          <View style={styles.hero}>
            <Image source={{ uri: me.avatar }} style={styles.avatar} />
            <Text style={styles.name}>{me.name}</Text>
            <Text style={styles.sub}>{me.title}</Text>
            <Text style={styles.tag}>{me.tagline}</Text>
          </View>
        ) : (
          <Text style={styles.missing}>
            Your account is not linked to a demo profile.
          </Text>
        )}

        {isEditing ? (
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
              placeholder="e.g. Senior React Developer"
              placeholderTextColor={colors.textMuted}
              value={formData.headline}
              onChangeText={(text) =>
                setFormData({ ...formData, headline: text })
              }
            />

            <Text style={styles.label}>Bio</Text>
            <TextInput
              style={[styles.input, styles.textarea]}
              placeholder="Tell clients about yourself"
              placeholderTextColor={colors.textMuted}
              value={formData.bio}
              onChangeText={(text) => setFormData({ ...formData, bio: text })}
              multiline
            />

            <Text style={styles.label}>Hourly Rate ($)</Text>
            <TextInput
              style={styles.input}
              placeholder="50"
              placeholderTextColor={colors.textMuted}
              value={formData.hourlyRate.toString()}
              onChangeText={(text) =>
                setFormData({
                  ...formData,
                  hourlyRate: parseInt(text) || 0,
                })
              }
              keyboardType="number-pad"
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

            <Text style={styles.label}>Years of Experience</Text>
            <TextInput
              style={styles.input}
              placeholder="5"
              placeholderTextColor={colors.textMuted}
              value={formData.yearsExperience.toString()}
              onChangeText={(text) =>
                setFormData({
                  ...formData,
                  yearsExperience: parseInt(text) || 0,
                })
              }
              keyboardType="number-pad"
            />

            <Text style={styles.label}>Skills (comma-separated)</Text>
            <TextInput
              style={[styles.input, styles.textarea]}
              placeholder="React, TypeScript, Node.js"
              placeholderTextColor={colors.textMuted}
              value={formData.skills}
              onChangeText={(text) =>
                setFormData({ ...formData, skills: text })
              }
              multiline
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
        ) : null}

        <Text style={styles.sectionLabel}>Account</Text>
        <View style={styles.card}>
          <Pressable
            style={[styles.row, styles.rowBorder]}
            onPress={() => router.push("/terms" as Href)}
          >
            <View style={styles.rowLeft}>
              <View style={styles.rowIconWrap}>
                <Ionicons name="document-text-outline" size={22} color={colors.primary} />
              </View>
              <View>
                <Text style={styles.rowLabel}>Terms & Conditions</Text>
                <Text style={styles.rowHint}>Review platform legal terms and policies</Text>
              </View>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={colors.textMuted}
            />
          </Pressable>

          <Pressable
            style={styles.row}
            onPress={async () => {
              await logout();
              router.replace("/(auth)/login?intent=client" as Href);
            }}
          >
            <View style={styles.rowLeft}>
              <View style={styles.rowIconWrap}>
                <Ionicons name="people" size={22} color={colors.primary} />
              </View>
              <View>
                <Text style={styles.rowLabel}>Sign in to hire talent</Text>
                <Text style={styles.rowHint}>
                  Logs you out here, then opens the client sign-in
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
    content: {
      padding: spacing.sm,
      paddingBottom: spacing.xl,
    },
    header: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      marginBottom: spacing.md,
    },
    editBtn: {
      width: 40,
      height: 40,
      borderRadius: 10,
      backgroundColor: colors.primaryMuted,
      alignItems: "center",
      justifyContent: "center",
    },
    kicker: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.textMuted,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    title: {
      marginTop: 4,
      fontSize: 22,
      fontWeight: "700",
      color: colors.textPrimary,
    },
    account: {
      marginTop: spacing.md,
      marginBottom: spacing.sm,
    },
    accountName: {
      fontSize: 17,
      fontWeight: "600",
      color: colors.textPrimary,
    },
    accountEmail: {
      marginTop: 4,
      fontSize: 14,
      color: colors.textSecondary,
    },
    hero: {
      alignItems: "center",
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.md,
      marginBottom: spacing.lg,
    },
    avatar: {
      width: 80,
      height: 80,
      borderRadius: 40,
      marginBottom: spacing.sm,
    },
    name: {
      fontSize: 20,
      fontWeight: "700",
      color: colors.textPrimary,
    },
    sub: {
      marginTop: 4,
      fontSize: 14,
      color: colors.textSecondary,
    },
    tag: {
      marginTop: spacing.sm,
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: "center",
      lineHeight: 20,
    },
    missing: {
      marginTop: spacing.md,
      color: colors.textMuted,
    },
    formSection: {
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.md,
      marginBottom: spacing.lg,
    },
    sectionLabel: {
      marginTop: spacing.lg,
      marginBottom: spacing.sm,
      fontSize: 13,
      fontWeight: "600",
      color: colors.textMuted,
      textTransform: "uppercase",
      letterSpacing: 0.6,
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
    card: {
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: "hidden",
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      padding: spacing.sm,
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
      width: 44,
      height: 44,
      borderRadius: 12,
      backgroundColor: colors.primaryMuted,
      alignItems: "center",
      justifyContent: "center",
      marginRight: spacing.sm,
    },
    rowLabel: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.textPrimary,
    },
    rowHint: {
      marginTop: 2,
      fontSize: 13,
      color: colors.textMuted,
    },
    logout: {
      marginTop: spacing.lg,
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
