import { Ionicons } from "@expo/vector-icons";
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
import Toast from "react-native-toast-message";

import { useAuth } from "@/src/context/AuthContext";
import { useTheme } from "@/src/context/ThemeContext";
import { ThemeColors } from "@/src/design-system/colors";
import { radius } from "@/src/design-system/radius";
import { minTapTarget, spacing } from "@/src/design-system/spacing";
import { typography } from "@/src/design-system/typography";

/**
 * Forgot password: enter your email, get a 6-digit code, choose a new password.
 * Changing the password signs out every other device.
 */
export default function ForgotPasswordScreen() {
  const { requestPasswordReset, resetPassword } = useAuth();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const params = useLocalSearchParams<{ email?: string }>();

  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState(typeof params.email === "string" ? params.email : "");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendCode = async () => {
    setError(null);
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setError("Please enter a valid email address.");
    setBusy(true);
    try {
      const message = await requestPasswordReset(email);
      Toast.show({ type: "success", text1: "Check your email", text2: message });
      setStep("code");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const changePassword = async () => {
    setError(null);
    if (!/^\d{6}$/.test(code.trim())) return setError("Please enter the 6-digit code from the email.");
    if (password.length < 6) return setError("Your new password needs at least 6 characters.");
    setBusy(true);
    try {
      const message = await resetPassword(email, code, password);
      Toast.show({ type: "success", text1: "Password changed", text2: message });
      router.replace({ pathname: "/(auth)/login", params: { email: email.trim().toLowerCase() } });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scroll}>
          <Pressable
            style={styles.back}
            onPress={() => (step === "code" ? setStep("email") : router.back())}
            accessibilityRole="button"
            accessibilityLabel="Back"
          >
            <Ionicons name="arrow-back" size={26} color={colors.textPrimary} />
          </Pressable>

          <Text style={styles.title}>{step === "email" ? "Forgot your password?" : "Choose a new password"}</Text>
          <Text style={styles.subtitle}>
            {step === "email"
              ? "Enter the email you signed up with and we'll send you a 6-digit code."
              : `We've sent a code to ${email.trim()}. It works for 15 minutes. If it's not there, check your spam folder.`}
          </Text>

          {step === "email" ? (
            <>
              <Text style={styles.label}>Email</Text>
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
            </>
          ) : (
            <>
              <Text style={styles.label}>6-digit code</Text>
              <TextInput
                style={[styles.input, styles.codeInput]}
                keyboardType="number-pad"
                autoComplete="one-time-code"
                textContentType="oneTimeCode"
                maxLength={6}
                placeholder="123456"
                placeholderTextColor={colors.textMuted}
                value={code}
                onChangeText={(text) => setCode(text.replace(/\D/g, ""))}
              />
              <Text style={styles.label}>New password</Text>
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
                  onPress={() => setShowPassword((v) => !v)}
                  style={styles.passwordToggle}
                  accessibilityRole="button"
                  accessibilityLabel={showPassword ? "Hide password" : "Show password"}
                >
                  <Text style={styles.link}>{showPassword ? "Hide" : "Show"}</Text>
                </Pressable>
              </View>
            </>
          )}

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable
            style={[styles.primary, busy && styles.primaryBusy]}
            onPress={step === "email" ? sendCode : changePassword}
            disabled={busy}
            accessibilityRole="button"
          >
            {busy ? (
              <ActivityIndicator color={colors.onPrimary} />
            ) : (
              <Text style={styles.primaryText}>{step === "email" ? "Send code" : "Change password"}</Text>
            )}
          </Pressable>

          {step === "code" ? (
            <Pressable style={styles.linkRow} onPress={sendCode} disabled={busy} accessibilityRole="button">
              <Text style={styles.link}>Send a new code</Text>
            </Pressable>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    flex: { flex: 1 },
    scroll: { padding: spacing.md, paddingBottom: spacing.xxl },
    back: { width: minTapTarget, height: minTapTarget, justifyContent: "center", marginBottom: spacing.sm },
    title: { ...typography.h1, color: colors.textPrimary },
    subtitle: { ...typography.body, color: colors.textSecondary, marginTop: spacing.xs, marginBottom: spacing.lg },
    label: { ...typography.bodyMedium, color: colors.textPrimary, marginBottom: spacing.xs },
    input: {
      ...typography.body,
      minHeight: 52,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
      color: colors.textPrimary,
      backgroundColor: colors.surface,
      marginBottom: spacing.md,
    },
    codeInput: { ...typography.h2, letterSpacing: 8, textAlign: "center" },
    passwordWrap: { justifyContent: "center" },
    passwordInput: { paddingRight: 76 },
    passwordToggle: {
      position: "absolute",
      right: 0,
      top: 0,
      bottom: spacing.md,
      minWidth: minTapTarget + spacing.md,
      alignItems: "center",
      justifyContent: "center",
    },
    error: { ...typography.body, color: colors.error, marginBottom: spacing.sm },
    primary: {
      minHeight: 52,
      backgroundColor: colors.primary,
      borderRadius: radius.md,
      alignItems: "center",
      justifyContent: "center",
    },
    primaryBusy: { opacity: 0.7 },
    primaryText: { ...typography.button, color: colors.onPrimary },
    linkRow: { marginTop: spacing.lg, minHeight: minTapTarget, alignItems: "center", justifyContent: "center" },
    link: { ...typography.button, color: colors.primary },
  });
