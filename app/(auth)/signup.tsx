import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { type ComponentRef, useCallback, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  BackHandler,
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
import { finishAuth } from "@/src/utils/reentry";

type Country = "Canada" | "India";
type SessionMode = "remote" | "onsite";
type Step = "role" | "account" | "expertise" | "confirm";

/**
 * Sign-up in short steps:
 *   1. role      – looking for guidance, or sharing experience (one email = one account and one role)
 *   2. account   – name, email, password
 *   3. expertise – experts only (PRD 4.4)
 *   4. confirm   – Terms and the acknowledgements for that role (PRD 4.5)
 */
export default function SignupScreen() {
  const { register } = useAuth();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);

  const params = useLocalSearchParams<{ intent?: string; returnTo?: string; origin?: string }>();
  const reentry = params.returnTo ? { returnTo: params.returnTo, origin: params.origin ?? "" } : {};
  const [role, setRole] = useState<AuthRoleIntent | null>(
    params.intent === "expert" ? "expert" : params.intent === "user" ? "user" : null,
  );
  const [step, setStep] = useState<Step>("role");

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
  // One checkbox for on-site experts: declares insurance and accepts responsibility for on-site work
  const [onsiteInsurance, setOnsiteInsurance] = useState(false);

  // Acknowledgements (PRD 4.5), each stored with a timestamp by the backend
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [ackPlatformOnly, setAckPlatformOnly] = useState(false);
  const [ackOnsiteSafety, setAckOnsiteSafety] = useState(false);
  const [ackContractor, setAckContractor] = useState(false);
  const [ackCredentials, setAckCredentials] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isExpert = role === "expert";
  const steps = useMemo<Step[]>(
    () => (isExpert ? ["role", "account", "expertise", "confirm"] : ["role", "account", "confirm"]),
    [isExpert],
  );
  const stepIndex = steps.indexOf(step);
  const regulated = domain !== null && isRegulatedCategory(domain);
  const offersOnsite = modes.includes("onsite");
  const categories = country === "India" ? INDIA_CATEGORY_ORDER : CANADA_CATEGORY_ORDER;

  const expertiseComplete =
    country !== null &&
    city.trim().length >= 2 &&
    domain !== null &&
    modes.length > 0 &&
    (!offersOnsite || onsiteInsurance) &&
    (!regulated || Boolean(certType.trim() && certNumber.trim() && certBody.trim()));

  const confirmComplete =
    acceptedTerms && (isExpert ? ackContractor && ackCredentials : ackPlatformOnly && ackOnsiteSafety);

  const goTo = (next: Step) => {
    setError(null);
    setStep(next);
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  };

  const goBack = useCallback(() => {
    const index = steps.indexOf(step);
    if (index <= 0) {
      if (router.canGoBack()) router.back();
      else router.replace("/(auth)/login");
      return;
    }
    setError(null);
    setStep(steps[index - 1]);
  }, [step, steps]);

  // Android back button steps back through the form instead of leaving it
  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener("hardwareBackPress", () => {
        if (step === "role") return false;
        goBack();
        return true;
      });
      return () => sub.remove();
    }, [step, goBack]),
  );

  const chooseRole = (next: AuthRoleIntent) => {
    if (next !== role) {
      // Acknowledgements are role-specific, so a change of mind starts them fresh
      setAcceptedTerms(false);
      setAckPlatformOnly(false);
      setAckOnsiteSafety(false);
      setAckContractor(false);
      setAckCredentials(false);
      setRole(next);
    }
    goTo("account");
  };

  const chooseCountry = (next: Country) => {
    setCountry(next);
    // On-site sessions are Canada only
    if (next === "India") {
      setModes(["remote"]);
      setOnsiteInsurance(false);
    }
  };

  const toggleMode = (mode: SessionMode) =>
    setModes((prev) => (prev.includes(mode) ? prev.filter((m) => m !== mode) : [...prev, mode]));

  const continueFromAccount = () => {
    if (name.trim().length < 2) return setError("Please enter your full name.");
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setError("Please enter a valid email address.");
    if (password.length < 6) return setError("Your password needs at least 6 characters.");
    goTo(isExpert ? "expertise" : "confirm");
  };

  const continueFromExpertise = () => {
    if (linkedinUrl.trim() && !/^https?:\/\//i.test(linkedinUrl.trim())) {
      return setError("Your LinkedIn link should start with https://");
    }
    goTo("confirm");
  };

  const onSubmit = async () => {
    if (!role) return;
    setError(null);
    const onsiteCovered = offersOnsite && onsiteInsurance;

    const input: RegisterInput = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
      role,
      acceptedTerms,
      ...(isExpert
        ? {
            acceptedExpertCompliance: ackCredentials,
            acknowledgedIndependentContractor: ackContractor,
            acknowledgedInsurance: onsiteCovered,
            expertProfile: {
              country: country!,
              city: city.trim(),
              domain: domain!,
              engagementTypes: modes,
              linkedinUrl: linkedinUrl.trim(),
              insuranceDeclared: onsiteCovered,
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
      // New experts land on their dashboard, which explains that the application is being reviewed.
      // New users go back to the expert they were looking at, if any (PRD 5.3).
      finishAuth(isExpert ? "expert" : "user", reentry);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <ScrollView
          ref={scrollRef}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.topRow}>
            <Pressable
              style={styles.backButton}
              onPress={goBack}
              accessibilityRole="button"
              accessibilityLabel={step === "role" ? "Close" : "Back to the previous step"}
            >
              <Ionicons name={step === "role" ? "close" : "arrow-back"} size={26} color={colors.textPrimary} />
            </Pressable>
            {step !== "role" ? (
              <Text style={styles.stepCount}>
                Step {stepIndex + 1} of {steps.length}
              </Text>
            ) : null}
          </View>

          {step === "role" && (
            <>
              <Text style={styles.title}>Create your account</Text>
              <Text style={styles.subtitle}>How would you like to use G(Old)?</Text>

              <RoleCard
                styles={styles}
                colors={colors}
                icon="search-outline"
                title="I'm looking for guidance"
                body="Find experienced people and request a session with them."
                selected={role === "user"}
                onPress={() => chooseRole("user")}
              />
              <RoleCard
                styles={styles}
                colors={colors}
                icon="ribbon-outline"
                title="I want to share my experience"
                body="Apply as an expert. Our team personally reviews every application before your profile goes live."
                selected={role === "expert"}
                onPress={() => chooseRole("expert")}
              />

              <Text style={styles.note}>
                Each email address is used for one account, either to find experts or to offer your experience.
              </Text>
            </>
          )}

          {step === "account" && (
            <>
              <Text style={styles.title}>Your details</Text>
              <Text style={styles.subtitle}>
                {isExpert ? "You're applying as an expert. " : "You're joining to find experts. "}
                <Text style={styles.inlineLink} onPress={() => goTo("role")}>
                  Change
                </Text>
              </Text>

              <Field styles={styles} label="Full name">
                <TextInput
                  style={styles.input}
                  placeholder="Your name"
                  placeholderTextColor={colors.textMuted}
                  value={name}
                  onChangeText={setName}
                  autoComplete="name"
                  textContentType="name"
                />
              </Field>

              <Field styles={styles} label="Email">
                <TextInput
                  style={styles.input}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoComplete="email"
                  textContentType="emailAddress"
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
                    autoComplete="new-password"
                    textContentType="newPassword"
                    placeholder="At least 6 characters"
                    placeholderTextColor={colors.textMuted}
                    value={password}
                    onChangeText={setPassword}
                  />
                  <Pressable
                    onPress={() => setShowPassword((prev) => !prev)}
                    style={styles.passwordToggle}
                    accessibilityRole="button"
                    accessibilityLabel={showPassword ? "Hide password" : "Show password"}
                  >
                    <Text style={styles.passwordToggleText}>{showPassword ? "Hide" : "Show"}</Text>
                  </Pressable>
                </View>
              </Field>
            </>
          )}

          {step === "expertise" && (
            <>
              <Text style={styles.title}>About your expertise</Text>
              <Text style={styles.subtitle}>
                This helps our team review your application and helps people find you.
              </Text>

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
                  checked={onsiteInsurance}
                  onToggle={() => setOnsiteInsurance((v) => !v)}
                  label="I hold valid liability insurance that covers on-site work, and I will keep it in force while I offer on-site sessions. I am responsible for my own safety, permits and following local laws on-site. G(Old) does not insure me or the people I meet."
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
            </>
          )}

          {step === "confirm" && (
            <>
              <Text style={styles.title}>Please read and confirm</Text>
              <Text style={styles.subtitle}>We keep a record of what you agree to and when.</Text>

              <CheckRow
                styles={styles}
                checked={acceptedTerms}
                onToggle={() => setAcceptedTerms((v) => !v)}
                label={
                  <>
                    I have read and agree to the{" "}
                    <Text style={styles.inlineLink} onPress={() => router.push("/terms")}>
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
            </>
          )}

          {error ? <Text style={styles.error}>{error}</Text> : null}

          {step === "account" && <PrimaryButton styles={styles} label="Continue" onPress={continueFromAccount} />}
          {step === "expertise" && (
            <PrimaryButton styles={styles} label="Continue" onPress={continueFromExpertise} disabled={!expertiseComplete} />
          )}
          {step === "confirm" && (
            <PrimaryButton
              styles={styles}
              label={isExpert ? "Submit my application" : "Create account"}
              onPress={onSubmit}
              disabled={!confirmComplete}
              loading={submitting}
              spinnerColor={colors.onPrimary}
            />
          )}

          <Pressable
            style={styles.linkRow}
            onPress={() => router.replace({ pathname: "/(auth)/login", params: reentry })}
            accessibilityRole="link"
          >
            <Text style={styles.link}>Already have an account? Sign in</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

type Styles = ReturnType<typeof createStyles>;

const RoleCard = ({
  styles,
  colors,
  icon,
  title,
  body,
  selected,
  onPress,
}: {
  styles: Styles;
  colors: ThemeColors;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  body: string;
  selected: boolean;
  onPress: () => void;
}) => (
  <Pressable
    style={[styles.roleCard, selected && styles.roleCardOn]}
    onPress={onPress}
    accessibilityRole="button"
    accessibilityState={{ selected }}
    accessibilityHint="Continues to the next step"
  >
    <View style={styles.roleIcon}>
      <Ionicons name={icon} size={26} color={colors.onPrimaryMuted} />
    </View>
    <View style={styles.flex}>
      <Text style={styles.roleTitle}>{title}</Text>
      <Text style={styles.roleBody}>{body}</Text>
    </View>
    <Ionicons name="chevron-forward" size={22} color={colors.textMuted} />
  </Pressable>
);

const PrimaryButton = ({
  styles,
  label,
  onPress,
  disabled = false,
  loading = false,
  spinnerColor,
}: {
  styles: Styles;
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  spinnerColor?: string;
}) => (
  <Pressable
    style={[styles.primary, (disabled || loading) && styles.primaryDisabled]}
    onPress={onPress}
    disabled={disabled || loading}
    accessibilityRole="button"
    accessibilityState={{ disabled: disabled || loading }}
  >
    {loading ? (
      <ActivityIndicator color={spinnerColor} />
    ) : (
      <Text style={[styles.primaryText, disabled && styles.primaryTextDisabled]}>{label}</Text>
    )}
  </Pressable>
);

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
    topRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: spacing.sm,
    },
    backButton: {
      width: minTapTarget,
      height: minTapTarget,
      alignItems: "flex-start",
      justifyContent: "center",
    },
    stepCount: {
      ...typography.bodyMedium,
      color: colors.textSecondary,
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
    note: {
      ...typography.body,
      color: colors.textMuted,
      marginTop: spacing.sm,
    },
    roleCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
      padding: spacing.md,
      minHeight: 96,
      marginBottom: spacing.md,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    roleCardOn: {
      borderColor: colors.primary,
      borderWidth: 2,
    },
    roleIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.primaryMuted,
    },
    roleTitle: {
      ...typography.h3,
      color: colors.textPrimary,
    },
    roleBody: {
      ...typography.body,
      color: colors.textSecondary,
      marginTop: spacing.xxs,
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
      backgroundColor: colors.surface,
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
      marginBottom: spacing.sm,
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
      backgroundColor: colors.surface,
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
    inlineLink: {
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
