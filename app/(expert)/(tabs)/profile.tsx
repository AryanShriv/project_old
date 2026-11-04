import { Ionicons } from "@expo/vector-icons";
import type { Href } from "expo-router";
import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
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

import { Avatar } from "@/src/components/Avatar/Avatar";
import { isRegulatedTrade } from "@/src/constants/trust";
import { useAuth } from "@/src/context/AuthContext";
import { useExperts } from "@/src/context/ExpertsContext";
import { useTheme } from "@/src/context/ThemeContext";
import { ThemeColors, brand } from "@/src/design-system/colors";
import { radius } from "@/src/design-system/radius";
import { minTapTarget, spacing } from "@/src/design-system/spacing";
import { apiRequest } from "@/src/services/apiClient";
import { mapApiExpertToUi } from "@/src/services/expertsAdapter";
import type { Expert } from "@/src/types/expert";

type SessionMode = "remote" | "onsite";

const toForm = (me?: Expert) => {
  const cert = me?.certifications?.[0];
  const isIndia = me?.country === "India";
  return {
    fullName: me?.name ?? "",
    headline: me?.title === "Expert" ? "" : me?.title ?? "",
    bio: me?.tagline ?? "",
    yearsExperience: me?.yearsExperience ? parseInt(me.yearsExperience) : 0,
    skills: me?.skills?.join(", ") ?? "",
    experience: me?.experience ?? [],
    country: (me?.country === "India" ? "India" : "Canada") as "Canada" | "India",
    city: me?.city ?? "",
    engagementTypes: (me?.engagementTypes?.length ? me.engagementTypes : ["remote"]) as SessionMode[],
    price: (isIndia ? me?.pricingINR : me?.pricingCAD) ?? 0,
    languages: me?.languages?.join(", ") ?? "",
    linkedinUrl: me?.linkedinUrl ?? "",
    certType: cert?.type ?? "",
    certNumber: cert?.number ?? "",
    certBody: cert?.issuingBody ?? "",
    insuranceDeclared: Boolean(me?.insuranceDeclared),
  };
};

export default function ExpertProfileTabScreen() {
  const { user, logout } = useAuth();
  const { experts, refresh } = useExperts();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const personaId = user?.managedExpertId;
  const listed = experts.find((f) => f.id === personaId);

  // Pending and rejected experts are not in the public list, so load the profile as its owner
  const [own, setOwn] = useState<Expert | undefined>(undefined);
  const loadOwn = useCallback(
    () =>
      personaId
        ? apiRequest<Parameters<typeof mapApiExpertToUi>[0]>(`/experts/${personaId}`, { auth: true })
            .then((data) => setOwn(mapApiExpertToUi(data)))
            .catch(() => setOwn(undefined))
        : Promise.resolve(),
    [personaId]
  );
  useEffect(() => {
    loadOwn();
  }, [loadOwn]);
  const me = own ?? listed;

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form state — initialize from current profile
  const [formData, setFormData] = useState(() => toForm(me));

  // Track dynamic changes when 'me' object changes/loads
  useEffect(() => {
    if (me) {
      setFormData(toForm(me));
    }
  }, [me]);

  const regulated = me ? isRegulatedTrade(me) : false;
  const offersOnsite = formData.engagementTypes.includes("onsite");
  const toggleMode = (mode: SessionMode) => {
    const next = formData.engagementTypes.includes(mode)
      ? formData.engagementTypes.filter((m) => m !== mode)
      : [...formData.engagementTypes, mode];
    if (next.length > 0) setFormData({ ...formData, engagementTypes: next });
  };

  const handleSave = async () => {
    if (!personaId) return;

    if (regulated && (!formData.certType.trim() || !formData.certNumber.trim() || !formData.certBody.trim())) {
      Toast.show({ type: "error", text1: "Certificate needed", text2: "Regulated trades need the certificate type, number and issuing body." });
      return;
    }
    if (offersOnsite && !formData.insuranceDeclared) {
      Toast.show({ type: "error", text1: "Insurance needed", text2: "Please confirm your liability insurance to offer on-site sessions." });
      return;
    }

    setIsSaving(true);
    try {
      const price = Math.max(0, formData.price);
      const cert = { type: formData.certType.trim(), number: formData.certNumber.trim(), issuingBody: formData.certBody.trim() };
      const payload = {
        fullName: formData.fullName.trim(),
        headline: formData.headline.trim(),
        bio: formData.bio.trim(),
        country: formData.country,
        city: formData.city.trim(),
        location: [formData.city.trim(), formData.country].filter(Boolean).join(", "),
        engagementTypes: formData.country === "India" ? (["remote"] as SessionMode[]) : formData.engagementTypes,
        insuranceDeclared: offersOnsite && formData.insuranceDeclared,
        // Price per session in the expert's currency; hourlyRate is the legacy mirror used by filters
        ...(formData.country === "India" ? { pricingINR: price } : { pricingCAD: price }),
        hourlyRate: price,
        linkedinUrl: formData.linkedinUrl.trim(),
        languages: formData.languages.split(",").map((s) => s.trim()).filter(Boolean),
        ...(cert.type && cert.number && cert.issuingBody ? { certifications: [cert] } : {}),
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
      };

      await apiRequest(`/experts/${personaId}`, {
        method: "PATCH",
        auth: true,
        body: payload,
      });

      // Refresh experts list to get updated data
      await Promise.all([refresh(), loadOwn()]);

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
            <Text style={styles.kicker}>Signed in as expert</Text>
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
            <Avatar uri={me.avatar} name={me.name} size={88} verified={me.verified} />
            <Text style={styles.name}>{me.name}</Text>
            <Text style={styles.sub}>{me.title}</Text>
            <Text style={styles.tag}>{me.tagline}</Text>
          </View>
        ) : (
          <Text style={styles.missing}>Loading your profile…</Text>
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
              placeholder="e.g. Former CFO, 30 years in manufacturing finance"
              placeholderTextColor={colors.textMuted}
              value={formData.headline}
              onChangeText={(text) =>
                setFormData({ ...formData, headline: text })
              }
            />

            <Text style={styles.label}>Bio</Text>
            <TextInput
              style={[styles.input, styles.textarea]}
              placeholder="What can you help people with? Write it the way you would say it."
              placeholderTextColor={colors.textMuted}
              value={formData.bio}
              onChangeText={(text) => setFormData({ ...formData, bio: text })}
              multiline
            />

            <Text style={[styles.sectionLabel, { marginTop: spacing.md }]}>Sessions and credentials</Text>

            <Text style={styles.label}>Country</Text>
            <View style={styles.chips}>
              {(["Canada", "India"] as const).map((option) => (
                <Pressable
                  key={option}
                  style={[styles.chip, formData.country === option && styles.chipOn]}
                  onPress={() => setFormData({ ...formData, country: option })}
                  accessibilityRole="button"
                  accessibilityState={{ selected: formData.country === option }}
                >
                  <Text style={[styles.chipText, formData.country === option && styles.chipTextOn]}>{option}</Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.label}>City</Text>
            <TextInput
              style={styles.input}
              placeholder={formData.country === "India" ? "e.g. Pune" : "e.g. Toronto"}
              placeholderTextColor={colors.textMuted}
              value={formData.city}
              onChangeText={(text) => setFormData({ ...formData, city: text })}
            />

            <Text style={styles.label}>Session types</Text>
            <View style={styles.chips}>
              {(formData.country === "India" ? (["remote"] as SessionMode[]) : (["remote", "onsite"] as SessionMode[])).map((mode) => {
                const selected = formData.engagementTypes.includes(mode);
                return (
                  <Pressable
                    key={mode}
                    style={[styles.chip, selected && styles.chipOn]}
                    onPress={() => toggleMode(mode)}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                  >
                    <Text style={[styles.chipText, selected && styles.chipTextOn]}>{mode === "remote" ? "Remote" : "On-site"}</Text>
                  </Pressable>
                );
              })}
            </View>

            {offersOnsite && formData.country === "Canada" && (
              <Pressable
                style={styles.checkRow}
                onPress={() => setFormData({ ...formData, insuranceDeclared: !formData.insuranceDeclared })}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: formData.insuranceDeclared }}
              >
                <View style={[styles.checkbox, formData.insuranceDeclared && styles.checkboxOn]}>
                  {formData.insuranceDeclared && <Ionicons name="checkmark" size={18} color={colors.onPrimary} />}
                </View>
                <Text style={styles.checkLabel}>I hold valid liability insurance that covers on-site work.</Text>
              </Pressable>
            )}

            <Text style={styles.label}>
              Price per session ({formData.country === "India" ? "₹" : "CA$"})
            </Text>
            <TextInput
              style={styles.input}
              placeholder={formData.country === "India" ? "2500" : "120"}
              placeholderTextColor={colors.textMuted}
              value={formData.price ? formData.price.toString() : ""}
              onChangeText={(text) => setFormData({ ...formData, price: parseInt(text.replace(/\D/g, "")) || 0 })}
              keyboardType="number-pad"
            />

            {regulated && (
              <>
                <Text style={styles.label}>Certificate type</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 309A Construction and Maintenance Electrician"
                  placeholderTextColor={colors.textMuted}
                  value={formData.certType}
                  onChangeText={(text) => setFormData({ ...formData, certType: text })}
                />
                <Text style={styles.label}>Certificate number</Text>
                <TextInput
                  style={styles.input}
                  placeholder="As shown on your certificate"
                  placeholderTextColor={colors.textMuted}
                  value={formData.certNumber}
                  onChangeText={(text) => setFormData({ ...formData, certNumber: text })}
                  autoCapitalize="characters"
                />
                <Text style={styles.label}>Issuing body</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Skilled Trades Ontario, ESA, TSSA"
                  placeholderTextColor={colors.textMuted}
                  value={formData.certBody}
                  onChangeText={(text) => setFormData({ ...formData, certBody: text })}
                />
                <Text style={styles.hint}>Changing your certificate means our team checks it again before it shows as verified.</Text>
              </>
            )}

            <Text style={styles.label}>LinkedIn profile (optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="https://www.linkedin.com/in/your-name"
              placeholderTextColor={colors.textMuted}
              value={formData.linkedinUrl}
              onChangeText={(text) => setFormData({ ...formData, linkedinUrl: text })}
              autoCapitalize="none"
              keyboardType="url"
            />

            <Text style={styles.label}>Languages (comma-separated)</Text>
            <TextInput
              style={styles.input}
              placeholder="English, Hindi"
              placeholderTextColor={colors.textMuted}
              value={formData.languages}
              onChangeText={(text) => setFormData({ ...formData, languages: text })}
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

            <Text style={styles.label}>What people can ask you about (comma-separated)</Text>
            <TextInput
              style={[styles.input, styles.textarea, { height: 60 }]}
              placeholder="Cash flow, Investor pitch, Pricing strategy"
              placeholderTextColor={colors.textMuted}
              value={formData.skills}
              onChangeText={(text) =>
                setFormData({ ...formData, skills: text })
              }
              multiline
            />

            {/* Experience Sub-form */}
            <Text style={[styles.sectionLabel, { marginTop: spacing.md }]}>Career highlights</Text>
            {formData.experience.map((exp, index) => (
              <View key={exp.id || `exp-${index}`} style={styles.itemEditorCard}>
                <View style={styles.itemEditorHeader}>
                  <Text style={styles.itemEditorTitle}>Highlight {index + 1}</Text>
                  <Pressable
                    onPress={() => {
                      const updated = [...formData.experience];
                      updated.splice(index, 1);
                      setFormData({ ...formData, experience: updated });
                    }}
                  >
                    <Ionicons name="trash-outline" size={20} color={colors.error} />
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
                  placeholder="Role (e.g. Chief Financial Officer)"
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
                  placeholder="Organisation (e.g. Ontario Hydro)"
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
                  placeholder="What you achieved, in a sentence or two"
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
              <Text style={styles.addItemBtnText}>Add a career highlight</Text>
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
                  <ActivityIndicator color={brand.onPrimary} size="small" />
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
              router.replace("/(auth)/login?intent=user" as Href);
            }}
          >
            <View style={styles.rowLeft}>
              <View style={styles.rowIconWrap}>
                <Ionicons name="people" size={22} color={colors.primary} />
              </View>
              <View>
                <Text style={styles.rowLabel}>Sign in to find an expert</Text>
                <Text style={styles.rowHint}>
                  Logs you out here, then opens the user sign-in
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
            router.replace("/(user)/(tabs)" as Href);
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
      minHeight: minTapTarget,
      fontSize: 16,
      color: colors.textPrimary,
      backgroundColor: colors.background,
    },
    chips: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.xs,
      marginBottom: spacing.sm,
    },
    chip: {
      minHeight: minTapTarget,
      justifyContent: "center",
      paddingHorizontal: spacing.md,
      borderRadius: radius.full,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.background,
    },
    chipOn: {
      backgroundColor: colors.primaryMuted,
      borderColor: colors.primary,
    },
    chipText: {
      fontSize: 16,
      fontWeight: "500",
      color: colors.textSecondary,
    },
    chipTextOn: {
      color: colors.onPrimaryMuted,
    },
    checkRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: spacing.sm,
      minHeight: minTapTarget,
      marginBottom: spacing.sm,
    },
    checkbox: {
      width: 28,
      height: 28,
      borderRadius: 6,
      borderWidth: 2,
      borderColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.background,
    },
    checkboxOn: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    checkLabel: {
      flex: 1,
      fontSize: 16,
      lineHeight: 24,
      color: colors.textSecondary,
    },
    hint: {
      fontSize: 14,
      lineHeight: 20,
      color: colors.textMuted,
      marginBottom: spacing.sm,
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
      color: brand.onPrimary,
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
      paddingVertical: spacing.xs,
      paddingHorizontal: spacing.sm,
      fontSize: 16,
      marginBottom: spacing.xs,
    },
    smallTextarea: {
      height: 88,
      textAlignVertical: "top",
      paddingVertical: spacing.xs,
      paddingHorizontal: spacing.sm,
      fontSize: 16,
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
