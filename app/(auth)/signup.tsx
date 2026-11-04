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

import { CANADA_CATEGORY_ORDER, INDIA_CATEGORY_ORDER } from "@/src/constants/filters";
import { isRegulatedCategory } from "@/src/constants/trust";
import { useAuth } from "@/src/context/AuthContext";
import { useTheme } from "@/src/context/ThemeContext";
import { ThemeColors } from "@/src/design-system/colors";
import { radius } from "@/src/design-system/radius";
import { minTapTarget, spacing } from "@/src/design-system/spacing";
import { typography } from "@/src/design-system/typography";
import type { AuthRoleIntent, RegisterInput } from "@/src/types/auth";

type Country = "Canada" | "India";
type SessionMode = "remote" | "onsite";

export default function SignupScreen() {
  const { register } = useAuth();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const params = useLocalSearchParams<{ intent?: string }>();
  const initialIntent: AuthRoleIntent = params.intent === "expert" ? "expert" : "user";

  const [intent, setIntent] = useState<AuthRoleIntent>(initialIntent);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Expert details (PRD 4.4)
  const [country, setCountry] = useState<Country | null>(null);
  const [city, setCity] = useState("");
  const [domain, setDomain] = useState<string | null>(null);
  const [modes, setModes] = useState<SessionMode[]>(["remote"]);
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [certType, setCertType] = useState("");
  const [certNumber, setCertNumber] = useState("");
  const [certBody, setCertBody] = useState("");
  const [insuranceDeclared, setInsuranceDeclared] = useState(false);

  // Acknowledgements (PRD 4.5), each stored with a timestamp by the backend
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [ackPlatformOnly, setAckPlatformOnly] = useState(false);
  const [ackOnsiteSafety, setAckOnsiteSafety] = useState(false);
  const [ackContractor, setAckContractor] = useState(false);
  const [ackInsurance, setAckInsurance] = useState(false);
  const [ackCredentials, setAckCredentials] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isExpert = intent === "expert";
  const regulated = domain !== null && isRegulatedCategory(domain);
  const offersOnsite = modes.includes("onsite");
  const categories = country === "India" ? INDIA_CATEGORY_ORDER : CANADA_CATEGORY_ORDER;

  const expertDetailsComplete =
    country !== null &&
    city.trim().length >= 2 &&
    domain !== null &&
    modes.length > 0 &&
    (!offersOnsite || insuranceDeclared) &&
    (!regulated || (certType.trim() && certNumber.trim() && certBody.trim()));

  const canSubmit =
    acceptedTerms &&
    (isExpert
      ? ackContractor && ackInsurance && ackCredentials && expertDetailsComplete
      : ackPlatformOnly && ackOnsiteSafety);

  const chooseCountry = (next: Country) => {
    setCountry(next);
    // On-site sessions are Canada only
    if (next === "India") setModes(["remote"]);
  };

  const toggleMode = (mode: SessionMode) =>
    setModes((prev) => (prev.includes(mode) ? prev.filter((m) => m !== mode) : [...prev, mode]));

  const onSubmit = async () => {
    setError(null);
    const trimmedName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();

    if (trimmedName.length < 2) return setError("Please enter your full name.");
    if (!normalizedEmail.includes("@")) return setError("Please enter a valid email address.");
    if (password.length < 6) return setError("Your password needs at least 6 characters.");
    if (linkedinUrl.trim() && !/^https?:\/\//i.test(linkedinUrl.trim())) {
      return setError("Your LinkedIn link should start with https://");
    }

    const input: RegisterInput = {
      name: trimmedName,
      email: normalizedEmail,
      password,
      role: intent,
      acceptedTerms,
      ...(isExpert
        ? {
            acceptedExpertCompliance: ackCredentials,
            acknowledgedIndependentContractor: ackContractor,
            acknowledgedInsurance: ackInsurance,
            expertProfile: {
              country: country!,
              city: city.trim(),
              domain: domain!,
              engagementTypes: modes,
              linkedinUrl: linkedinUrl.trim(),
              insuranceDeclared: offersOnsite && insuranceDeclared,
              ...(regulated
                ? { certification: { type: certType.trim(), number: certNumber.trim(), issuingBody: certBody.trim() } }
                : {}),
            },
          }
        : { acknowledgedPlatformOnly: ackPlatformOnly, acknowledgedOnsiteSafety: ackOnsiteSafety }),
    };

    setSubmitting(true);
    try {
      const result = await register(input);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      if (result.requiresApproval) {
        router.replace({ pathname: "/(auth)/login", params: { intent: "expert" } });
        return;
      }
      router.replace((isExpert ? "/(expert)/(tabs)" : "/(user)/(tabs)") as Href);
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
            {isExpert
              ? "Share your experience with people who need it. Our team personally reviews every expert before their profile goes live."
              : "Save experts and request sessions."}
          </Text>

          <View style={styles.segment}>
            <Pressable style={[styles.segBtn, !isExpert && styles.segBtnOn]} onPress={() => setIntent("user")}>
              <Text style={[styles.segLabel, !isExpert && styles.segLabelOn]}>I need an expert</Text>
            </Pressable>
            <Pressable style={[styles.segBtn, isExpert && styles.segBtnOn]} onPress={() => setIntent("expert")}>
              <Text style={[styles.segLabel, isExpert && styles.segLabelOn]}>{"I'm an expert"}</Text>
            </Pressable>
          </View>

          <Field styles={styles} label="Full name">
            <TextInput
              style={styles.input}
              placeholder="Your name"
              placeholderTextColor={colors.textMuted}
              value={name}
              onChangeText={setName}
              autoComplete="name"
            />
          </Field>

          <Field styles={styles} label="Email">
            <TextInput
              style={styles.input}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              placeholder="you@example.com"
              placeholderTextColor={colors.textMuted}
              value={email}
              onChangeText={setEmail}
            />
          </Field>

          <Field styles={styles} label="Password">
            <View style={styles.passwordWrap}>
              <TextInput
                style={[styles.input, styles.passwordInput]}
                secureTextEntry={!showPassword}
                placeholder="At least 6 characters"
                placeholderTextColor={colors.textMuted}
                value={password}
                onChangeText={setPassword}
              />
              <Pressable onPress={() => setShowPassword((prev) => !prev)} style={styles.passwordToggle}>
                <Text style={styles.passwordToggleText}>{showPassword ? "Hide" : "Show"}</Text>
              </Pressable>
            </View>
          </Field>

          {isExpert && (
            <View style={styles.section}>
              <Text style={styles.sectionHeading}>About your expertise</Text>

              <Field styles={styles} label="Where are you based?">
                <View style={styles.chips}>
                  {(["Canada", "India"] as Country[]).map((option) => (
                    <Chip key={option} styles={styles} label={option} selected={country === option} onPress={() => chooseCountry(option)} />
                  ))}
                </View>
              </Field>

              <Field styles={styles} label="City">
                <TextInput
                  style={styles.input}
                  placeholder={country === "India" ? "e.g. Pune" : "e.g. Toronto"}
                  placeholderTextColor={colors.textMuted}
                  value={city}
                  onChangeText={setCity}
                />
              </Field>

              <Field styles={styles} label="Your main field">
                <View style={styles.chips}>
                  {categories.map((category) => (
                    <Chip
                      key={category}
                      styles={styles}
                      label={category}
                      selected={domain === category}
                      onPress={() => setDomain(category)}
                    />
                  ))}
                </View>
              </Field>

              <Field styles={styles} label="How can you hold sessions?">
                <View style={styles.chips}>
                  <Chip styles={styles} label="Remote" selected={modes.includes("remote")} onPress={() => toggleMode("remote")} />
                  {country !== "India" && (
                    <Chip
                      styles={styles}
                      label="On-site (Canada)"
                      selected={offersOnsite}
                      onPress={() => toggleMode("onsite")}
                    />
                  )}
                </View>
              </Field>

              {offersOnsite && (
                <CheckRow
                  styles={styles}
                  checked={insuranceDeclared}
                  onToggle={() => setInsuranceDeclared((v) => !v)}
                  label="I hold valid liability insurance that covers on-site work, and I will keep it in force while I offer on-site sessions."
                />
              )}

              {regulated && (
                <View style={styles.certBox}>
                  <Text style={styles.certTitle}>{domain} is a regulated trade</Text>
                  <Text style={styles.help}>
                    Please add your licence or certificate. Our team checks it before your profile goes live.
                  </Text>
                  <Field styles={styles} label="Certificate type">
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. 309A Construction and Maintenance Electrician"
                      placeholderTextColor={colors.textMuted}
                      value={certType}
                      onChangeText={setCertType}
                    />
                  </Field>
                  <Field styles={styles} label="Certificate number">
                    <TextInput
                      style={styles.input}
                      placeholder="As shown on your certificate"
                      placeholderTextColor={colors.textMuted}
                      value={certNumber}
                      onChangeText={setCertNumber}
                      autoCapitalize="characters"
                    />
                  </Field>
                  <Field styles={styles} label="Issuing body">
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. Skilled Trades Ontario, ESA, TSSA"
                      placeholderTextColor={colors.textMuted}
                      value={certBody}
                      onChangeText={setCertBody}
                    />
                  </Field>
                </View>
              )}

              <Field styles={styles} label="LinkedIn profile (optional, helps us verify you)">
                <TextInput
                  style={styles.input}
                  autoCapitalize="none"
                  keyboardType="url"
                  placeholder="https://www.linkedin.com/in/your-name"
                  placeholderTextColor={colors.textMuted}
                  value={linkedinUrl}
                  onChangeText={setLinkedinUrl}
                />
              </Field>
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionHeading}>Please read and confirm</Text>

            <CheckRow
              styles={styles}
              checked={acceptedTerms}
              onToggle={() => setAcceptedTerms((v) => !v)}
              label={
                <>
                  I have read and agree to the{" "}
                  <Text style={styles.checkLink} onPress={() => router.push("/terms")}>
                    Terms and Conditions
                  </Text>
                  , including the Privacy section.
                </>
              }
            />

            {isExpert ? (
              <>
                <CheckRow
                  styles={styles}
                  checked={ackContractor}
                  onToggle={() => setAckContractor((v) => !v)}
                  label="I am an independent contractor, not an employee or agent of G(Old). I set my own rates and methods, and I am responsible for my own taxes and for what I say and do in sessions."
                />
                <CheckRow
                  styles={styles}
                  checked={ackInsurance}
                  onToggle={() => setAckInsurance((v) => !v)}
                  label="If I offer on-site sessions, I am responsible for my own liability insurance, safety, permits and compliance with local laws. G(Old) does not insure me or the people I meet."
                />
                <CheckRow
                  styles={styles}
                  checked={ackCredentials}
                  onToggle={() => setAckCredentials((v) => !v)}
                  label="Everything I share about my experience, licences and certificates is true and current. I will only give guidance within my experience, will not present it as professional advice where a licence is required, and will tell G(Old) promptly if a licence lapses or is revoked."
                />
              </>
            ) : (
              <>
                <CheckRow
                  styles={styles}
                  checked={ackPlatformOnly}
                  onToggle={() => setAckPlatformOnly((v) => !v)}
                  label="I understand G(Old) is a platform only. Experts are independent people sharing their experience. Sessions are not professional legal, medical, financial or other licensed advice, and I make my own decisions."
                />
                <CheckRow
                  styles={styles}
                  checked={ackOnsiteSafety}
                  onToggle={() => setAckOnsiteSafety((v) => !v)}
                  label="If I book an on-site session, I am responsible for the safety of the location, and I will not ask an expert to carry out regulated work (such as electrical, gas or plumbing) that requires a licence or permit."
                />
              </>
            )}
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable
            style={[styles.primary, (submitting || !canSubmit) && styles.primaryDisabled]}
            onPress={onSubmit}
            disabled={submitting || !canSubmit}
            accessibilityRole="button"
            accessibilityState={{ disabled: submitting || !canSubmit }}
          >
            {submitting ? (
              <ActivityIndicator color={colors.onPrimary} />
            ) : (
              <Text style={[styles.primaryText, !canSubmit && styles.primaryTextDisabled]}>
                {isExpert ? "Submit my application" : "Create account"}
              </Text>
            )}
          </Pressable>

          <Pressable style={styles.linkRow} onPress={() => router.back()}>
            <Text style={styles.link}>Already have an account? Sign in</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

type Styles = ReturnType<typeof createStyles>;

const Field = ({ styles, label, children }: { styles: Styles; label: string; children: React.ReactNode }) => (
  <View style={styles.field}>
    <Text style={styles.label}>{label}</Text>
    {children}
  </View>
);

const Chip = ({
  styles,
  label,
  selected,
  onPress,
}: {
  styles: Styles;
  label: string;
  selected: boolean;
  onPress: () => void;
}) => (
  <Pressable
    style={[styles.chip, selected && styles.chipOn]}
    onPress={onPress}
    accessibilityRole="button"
    accessibilityState={{ selected }}
  >
    <Text style={[styles.chipText, selected && styles.chipTextOn]}>{label}</Text>
  </Pressable>
);

const CheckRow = ({
  styles,
  checked,
  onToggle,
  label,
}: {
  styles: Styles;
  checked: boolean;
  onToggle: () => void;
  label: React.ReactNode;
}) => (
  <Pressable style={styles.checkRow} onPress={onToggle} accessibilityRole="checkbox" accessibilityState={{ checked }}>
    <View style={[styles.checkbox, checked && styles.checkboxOn]}>
      {checked ? <Text style={styles.checkmark}>✓</Text> : null}
    </View>
    <Text style={styles.checkLabel}>{label}</Text>
  </Pressable>
);

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: colors.background,
    },
    flex: {
      flex: 1,
    },
    scroll: {
      padding: spacing.md,
      paddingBottom: spacing.xxl,
    },
    title: {
      ...typography.h1,
      color: colors.textPrimary,
    },
    subtitle: {
      ...typography.body,
      color: colors.textSecondary,
      marginTop: spacing.xs,
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
      minHeight: minTapTarget,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: radius.md,
    },
    segBtnOn: {
      backgroundColor: colors.primary,
    },
    segLabel: {
      ...typography.button,
      color: colors.textSecondary,
    },
    segLabelOn: {
      color: colors.onPrimary,
    },
    field: {
      marginBottom: spacing.md,
    },
    label: {
      ...typography.bodyMedium,
      color: colors.textPrimary,
      marginBottom: spacing.xs,
    },
    help: {
      ...typography.body,
      color: colors.textSecondary,
      marginBottom: spacing.sm,
    },
    input: {
      ...typography.body,
      minHeight: 52,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
      color: colors.textPrimary,
      backgroundColor: colors.surface,
    },
    passwordWrap: {
      justifyContent: "center",
    },
    passwordInput: {
      paddingRight: 76,
    },
    passwordToggle: {
      position: "absolute",
      right: 0,
      top: 0,
      bottom: 0,
      minWidth: minTapTarget + spacing.md,
      alignItems: "center",
      justifyContent: "center",
    },
    passwordToggleText: {
      ...typography.button,
      color: colors.primary,
    },
    section: {
      marginTop: spacing.sm,
      marginBottom: spacing.md,
      padding: spacing.md,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    sectionHeading: {
      ...typography.h3,
      color: colors.textPrimary,
      marginBottom: spacing.md,
    },
    chips: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.xs,
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
      ...typography.bodyMedium,
      color: colors.textSecondary,
    },
    chipTextOn: {
      color: colors.onPrimaryMuted,
    },
    certBox: {
      padding: spacing.md,
      borderRadius: radius.md,
      backgroundColor: colors.primaryMuted,
      marginBottom: spacing.md,
    },
    certTitle: {
      ...typography.bodyMedium,
      color: colors.onPrimaryMuted,
      marginBottom: spacing.xxs,
    },
    checkRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      paddingVertical: spacing.xs,
      marginBottom: spacing.xs,
      minHeight: minTapTarget,
    },
    checkbox: {
      width: 28,
      height: 28,
      borderRadius: 6,
      borderWidth: 2,
      borderColor: colors.border,
      marginRight: spacing.sm,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.background,
    },
    checkboxOn: {
      borderColor: colors.primary,
      backgroundColor: colors.primary,
    },
    checkmark: {
      color: colors.onPrimary,
      fontSize: 16,
      fontWeight: "700",
    },
    checkLabel: {
      ...typography.body,
      flex: 1,
      color: colors.textSecondary,
    },
    checkLink: {
      color: colors.primary,
      fontWeight: "600",
      textDecorationLine: "underline",
    },
    error: {
      ...typography.body,
      color: colors.error,
      marginBottom: spacing.sm,
    },
    primary: {
      marginTop: spacing.sm,
      minHeight: 52,
      backgroundColor: colors.primary,
      borderRadius: radius.md,
      alignItems: "center",
      justifyContent: "center",
    },
    primaryDisabled: {
      backgroundColor: colors.border,
    },
    primaryText: {
      ...typography.button,
      color: colors.onPrimary,
    },
    primaryTextDisabled: {
      color: colors.textMuted,
    },
    linkRow: {
      marginTop: spacing.lg,
      minHeight: minTapTarget,
      alignItems: "center",
      justifyContent: "center",
    },
    link: {
      ...typography.button,
      color: colors.primary,
    },
  });
