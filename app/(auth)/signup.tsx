import type { Href } from "expo-router";
import { router, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "@/src/context/AuthContext";
import type { AuthRoleIntent } from "@/src/types/auth";
import { useTheme } from "@/src/context/ThemeContext";
import { ThemeColors } from "@/src/design-system/colors";
import { radius } from "@/src/design-system/radius";
import { spacing } from "@/src/design-system/spacing";

export default function SignupScreen() {
  const { register } = useAuth();
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const params = useLocalSearchParams<{ intent?: string }>();
  const intentParam =
    typeof params.intent === "string" ? params.intent : undefined;
  const initialIntent: AuthRoleIntent =
    intentParam === "freelancer" ? "freelancer" : "client";

  const [intent, setIntent] = useState<AuthRoleIntent>(initialIntent);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedFreelancerCompliance, setAcceptedFreelancerCompliance] =
    useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit =
    acceptedTerms && (intent !== "freelancer" || acceptedFreelancerCompliance);

  const onSubmit = async () => {
    setError(null);
    const trimmedName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();

    if (trimmedName.length < 2) {
      setError("Full name must be at least 2 characters.");
      return;
    }
    if (!normalizedEmail.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (!acceptedTerms) {
      setError("You must accept the Terms and Conditions to create an account.");
      return;
    }
    if (intent === "freelancer" && !acceptedFreelancerCompliance) {
      setError(
        "You must confirm the professional credentials declaration to apply as a freelancer.",
      );
      return;
    }

    setSubmitting(true);
    try {
      const result = await register({
        name: trimmedName,
        email: normalizedEmail,
        password,
        role: intent,
        managedFreelancerId: undefined,
        acceptedTerms: true,
        acceptedFreelancerCompliance:
          intent === "freelancer" ? true : undefined,
      });
      if (!result.ok) {
        setError(result.message);
        return;
      }
      if (result.requiresApproval) {
        router.replace({
          pathname: "/(auth)/login",
          params: { intent: "freelancer" },
        });
        return;
      }
      if (intent === "freelancer") {
        router.replace("/(freelancer)/(tabs)" as Href);
      } else {
        router.replace("/(client)/(tabs)" as Href);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["bottom"]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>Create account</Text>
          <Text style={styles.subtitle}>
            {intent === "client"
              ? "Save profiles and send consultation requests."
              : "Apply to claim your freelancer profile. Admin approval is required before you can sign in."}
          </Text>

          <View style={styles.segment}>
            <Pressable
              style={[styles.segBtn, intent === "client" && styles.segBtnOn]}
              onPress={() => {
                setIntent("client");
                setAcceptedFreelancerCompliance(false);
              }}
            >
              <Text
                style={[
                  styles.segLabel,
                  intent === "client" && styles.segLabelOn,
                ]}
              >
                Hiring
              </Text>
            </Pressable>
            <Pressable
              style={[
                styles.segBtn,
                intent === "freelancer" && styles.segBtnOn,
              ]}
              onPress={() => setIntent("freelancer")}
            >
              <Text
                style={[
                  styles.segLabel,
                  intent === "freelancer" && styles.segLabelOn,
                ]}
              >
                Freelancer
              </Text>
            </Pressable>
          </View>

          <Text style={styles.label}>Full name</Text>
          <TextInput
            style={styles.input}
            placeholder="Your name"
            placeholderTextColor={colors.textMuted}
            value={name}
            onChangeText={setName}
          />

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="you@company.com"
            placeholderTextColor={colors.textMuted}
            value={email}
            onChangeText={setEmail}
          />

          <Text style={styles.label}>Password</Text>
          <View style={styles.passwordWrap}>
            <TextInput
              style={[styles.input, styles.passwordInput]}
              secureTextEntry={!showPassword}
              placeholder="At least 6 characters"
              placeholderTextColor={colors.textMuted}
              value={password}
              onChangeText={setPassword}
            />
            <Pressable
              onPress={() => setShowPassword((prev) => !prev)}
              hitSlop={8}
              style={styles.passwordToggle}
            >
              <Text style={styles.passwordToggleText}>
                {showPassword ? "Hide" : "Show"}
              </Text>
            </Pressable>
          </View>

          {intent === "freelancer" ? (
            <Text style={styles.help}>
              Freelancer registrations are reviewed by admin before sign-in is enabled.
            </Text>
          ) : null}

          <View style={styles.legalSection}>
            <Text style={styles.legalHeading}>Acknowledgements</Text>

            <Pressable
              style={styles.checkRow}
              onPress={() => setAcceptedTerms((prev) => !prev)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: acceptedTerms }}
            >
              <View
                style={[styles.checkbox, acceptedTerms && styles.checkboxOn]}
              >
                {acceptedTerms ? <Text style={styles.checkmark}>✓</Text> : null}
              </View>
              <Text style={styles.checkLabel}>
                I have read and agree to the{" "}
                <Text
                  style={styles.checkLink}
                  onPress={() => router.push("/terms")}
                >
                  Terms and Conditions
                </Text>
                .
              </Text>
            </Pressable>

            {intent === "freelancer" ? (
              <Pressable
                style={styles.checkRow}
                onPress={() =>
                  setAcceptedFreelancerCompliance((prev) => !prev)
                }
                accessibilityRole="checkbox"
                accessibilityState={{ checked: acceptedFreelancerCompliance }}
              >
                <View
                  style={[
                    styles.checkbox,
                    acceptedFreelancerCompliance && styles.checkboxOn,
                  ]}
                >
                  {acceptedFreelancerCompliance ? (
                    <Text style={styles.checkmark}>✓</Text>
                  ) : null}
                </View>
                <Text style={styles.checkLabel}>
                  I declare that all professional licences, certifications, and
                  qualifications I provide are valid, current, and appropriate
                  for the services I intend to offer through the Platform. I
                  understand that I am solely responsible for compliance with
                  applicable laws and professional standards, including any
                  requirements for regulated occupations in Ontario. I agree to
                  provide supporting documentation upon request and to notify
                  G(Old) promptly if my credentials lapse or are revoked.
                </Text>
              </Pressable>
            ) : null}
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable
            style={[
              styles.primary,
              (submitting || !canSubmit) && styles.primaryDisabled,
            ]}
            onPress={onSubmit}
            disabled={submitting || !canSubmit}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryText}>Create account</Text>
            )}
          </Pressable>

          <Pressable
            style={styles.linkRow}
            onPress={() => router.back()}
          >
            <Text style={styles.link}>Already have an account? Sign in</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  scroll: {
    padding: spacing.sm,
    paddingBottom: spacing.xl,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  subtitle: {
    marginTop: spacing.sm,
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  segment: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
  },
  segBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: radius.md,
  },
  segBtnOn: {
    backgroundColor: colors.primary,
  },
  segLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  segLabelOn: {
    color: "#fff",
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textMuted,
    marginBottom: 6,
  },
  help: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    lineHeight: 18,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.sm,
    fontSize: 16,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
    marginBottom: spacing.sm,
  },
  passwordWrap: {
    position: "relative",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  passwordInput: {
    marginBottom: 0,
    paddingRight: 68,
  },
  passwordToggle: {
    position: "absolute",
    right: 12,
    top: 0,
    bottom: 0,
    justifyContent: "center",
  },
  passwordToggleText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.primary,
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: spacing.md,
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    marginRight: 8,
    marginBottom: 8,
  },
  chipOn: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  chipTextOn: {
    color: "#fff",
  },
  error: {
    color: "#b91c1c",
    marginBottom: spacing.sm,
    fontSize: 14,
  },
  primary: {
    marginTop: spacing.sm,
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: radius.md,
    alignItems: "center",
  },
  primaryDisabled: {
    opacity: 0.7,
  },
  primaryText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  linkRow: {
    marginTop: spacing.lg,
    alignItems: "center",
  },
  link: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.primary,
  },
  legalSection: {
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
    padding: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  legalHeading: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginBottom: spacing.sm,
  },
  checkRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: spacing.sm,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.border,
    marginRight: 10,
    marginTop: 2,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
  },
  checkboxOn: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  checkmark: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 16,
  },
  checkLabel: {
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
    color: colors.textSecondary,
  },
  checkLink: {
    color: colors.primary,
    fontWeight: "600",
    textDecorationLine: "underline",
  },
});

