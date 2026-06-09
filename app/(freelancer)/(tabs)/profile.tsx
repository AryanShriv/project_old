import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import type { Href } from "expo-router";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View
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
    bio: me?.tagline ?? "",
    hourlyRate: me?.rate ? parseInt(me.rate.replace(/\D/g, "")) : 0,
    location: "",
    yearsExperience: me?.yearsExperience ? parseInt(me.yearsExperience) : 0,
    skills: me?.skills?.join(", ") ?? "",
    experience: me?.experience ?? [],
    portfolio: me?.portfolio ?? [],
  });

  // Track dynamic changes when 'me' object changes/loads
  useEffect(() => {
    if (me) {
      setFormData({
        fullName: me.name ?? "",
        headline: me.title ?? "",
        bio: me.tagline ?? "",
        hourlyRate: me.rate ? parseInt(me.rate.replace(/\D/g, "")) : 0,
        location: "",
        yearsExperience: me.yearsExperience ? parseInt(me.yearsExperience) : 0,
        skills: me.skills?.join(", ") ?? "",
        experience: me.experience ?? [],
        portfolio: me.portfolio ?? [],
      });
    }
  }, [me]);

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
        experience: formData.experience.map((exp) => ({
          year: exp.year.trim(),
          role: exp.role.trim(),
          company: exp.company.trim(),
          description: exp.description.trim(),
        })),
        portfolio: formData.portfolio.map((p) => ({
          title: p.title.trim(),
          description: p.description.trim(),
          link: p.image.trim(),
        })),
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
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
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
              style={[styles.input, styles.textarea, { height: 60 }]}
              placeholder="React, TypeScript, Node.js"
              placeholderTextColor={colors.textMuted}
              value={formData.skills}
              onChangeText={(text) =>
                setFormData({ ...formData, skills: text })
              }
              multiline
            />

            {/* Experience Sub-form */}
            <Text style={[styles.sectionLabel, { marginTop: spacing.md }]}>Work History</Text>
            {formData.experience.map((exp, index) => (
              <View key={exp.id || `exp-${index}`} style={styles.itemEditorCard}>
                <View style={styles.itemEditorHeader}>
                  <Text style={styles.itemEditorTitle}>Job #{index + 1}</Text>
                  <Pressable
                    onPress={() => {
                      const updated = [...formData.experience];
                      updated.splice(index, 1);
                      setFormData({ ...formData, experience: updated });
                    }}
                  >
                    <Ionicons name="trash-outline" size={18} color="#FF4D4D" />
                  </Pressable>
                </View>
                
                <TextInput
                  style={[styles.input, styles.smallInput]}
                  placeholder="Years (e.g. 2021 - Present)"
                  placeholderTextColor={colors.textMuted}
                  value={exp.year}
                  onChangeText={(text) => {
                    const updated = [...formData.experience];
                    updated[index] = { ...exp, year: text };
                    setFormData({ ...formData, experience: updated });
                  }}
                />
                <TextInput
                  style={[styles.input, styles.smallInput]}
                  placeholder="Role (e.g. Senior Frontend Engineer)"
                  placeholderTextColor={colors.textMuted}
                  value={exp.role}
                  onChangeText={(text) => {
                    const updated = [...formData.experience];
                    updated[index] = { ...exp, role: text };
                    setFormData({ ...formData, experience: updated });
                  }}
                />
                <TextInput
                  style={[styles.input, styles.smallInput]}
                  placeholder="Company (e.g. Google)"
                  placeholderTextColor={colors.textMuted}
                  value={exp.company}
                  onChangeText={(text) => {
                    const updated = [...formData.experience];
                    updated[index] = { ...exp, company: text };
                    setFormData({ ...formData, experience: updated });
                  }}
                />
                <TextInput
                  style={[styles.input, styles.smallTextarea]}
                  placeholder="Job Description..."
                  placeholderTextColor={colors.textMuted}
                  value={exp.description}
                  onChangeText={(text) => {
                    const updated = [...formData.experience];
                    updated[index] = { ...exp, description: text };
                    setFormData({ ...formData, experience: updated });
                  }}
                  multiline
                />
              </View>
            ))}
            <Pressable
              style={styles.addItemBtn}
              onPress={() => {
                setFormData({
                  ...formData,
                  experience: [
                    ...formData.experience,
                    { id: `new-exp-${Date.now()}`, year: "", role: "", company: "", description: "" }
                  ]
                });
              }}
            >
              <Ionicons name="add" size={16} color={colors.primary} />
              <Text style={styles.addItemBtnText}>Add Job Experience</Text>
            </Pressable>

            {/* Portfolio / Notable Work Sub-form */}
            <Text style={[styles.sectionLabel, { marginTop: spacing.md }]}>Notable Work / Portfolio</Text>
            {formData.portfolio.map((p, index) => (
              <View key={p.id || `portfolio-${index}`} style={styles.itemEditorCard}>
                <View style={styles.itemEditorHeader}>
                  <Text style={styles.itemEditorTitle}>Project #{index + 1}</Text>
                  <Pressable
                    onPress={() => {
                      const updated = [...formData.portfolio];
                      updated.splice(index, 1);
                      setFormData({ ...formData, portfolio: updated });
                    }}
                  >
                    <Ionicons name="trash-outline" size={18} color="#FF4D4D" />
                  </Pressable>
                </View>
                
                <TextInput
                  style={[styles.input, styles.smallInput]}
                  placeholder="Project Title"
                  placeholderTextColor={colors.textMuted}
                  value={p.title}
                  onChangeText={(text) => {
                    const updated = [...formData.portfolio];
                    updated[index] = { ...p, title: text };
                    setFormData({ ...formData, portfolio: updated });
                  }}
                />
                <TextInput
                  style={[styles.input, styles.smallTextarea]}
                  placeholder="Description"
                  placeholderTextColor={colors.textMuted}
                  value={p.description}
                  onChangeText={(text) => {
                    const updated = [...formData.portfolio];
                    updated[index] = { ...p, description: text };
                    setFormData({ ...formData, portfolio: updated });
                  }}
                  multiline
                />
                <TextInput
                  style={[styles.input, styles.smallInput]}
                  placeholder="Image URL (or mock placeholder URL)"
                  placeholderTextColor={colors.textMuted}
                  value={p.image}
                  onChangeText={(text) => {
                    const updated = [...formData.portfolio];
                    updated[index] = { ...p, image: text };
                    setFormData({ ...formData, portfolio: updated });
                  }}
                />
              </View>
            ))}
            <Pressable
              style={styles.addItemBtn}
              onPress={() => {
                setFormData({
                  ...formData,
                  portfolio: [
                    ...formData.portfolio,
                    { id: `new-portfolio-${Date.now()}`, title: "", description: "", image: "" }
                  ]
                });
              }}
            >
              <Ionicons name="add" size={16} color={colors.primary} />
              <Text style={styles.addItemBtnText}>Add Portfolio Project</Text>
            </Pressable>

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
    itemEditorCard: {
      backgroundColor: colors.background,
      borderColor: colors.border,
      borderWidth: 1,
      borderRadius: radius.md,
      padding: spacing.sm,
      marginTop: spacing.sm,
      marginBottom: spacing.sm,
    },
    itemEditorHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: spacing.xs,
    },
    itemEditorTitle: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.textPrimary,
    },
    smallInput: {
      paddingVertical: 6,
      paddingHorizontal: spacing.xs,
      fontSize: 13,
      marginBottom: spacing.xs,
    },
    smallTextarea: {
      height: 60,
      textAlignVertical: "top",
      paddingVertical: 6,
      paddingHorizontal: spacing.xs,
      fontSize: 13,
      marginBottom: spacing.xs,
    },
    addItemBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: colors.primary,
      borderStyle: "dashed",
      borderRadius: radius.md,
      paddingVertical: 10,
      marginTop: spacing.xs,
      marginBottom: spacing.md,
      gap: 6,
    },
    addItemBtnText: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.primary,
    },
  });
