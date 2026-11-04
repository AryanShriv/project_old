import { Ionicons } from "@expo/vector-icons";
import { router, Stack, useLocalSearchParams } from "expo-router";
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
import { finishAuth } from "@/src/utils/reentry";

const RESEND_WAIT_SECONDS = 60;

/**
 * Enter the 6-digit code we emailed. Shown straight after sign-up, and from the
 * "Verify your email" notices. People can skip it for now, but requesting a session
 * (and, for experts, being approved) needs a verified email.
 *
 * Params: `afterSignup` = "1" when shown after sign-up (then "Continue" goes on with sign-up),
 * plus `returnTo` / `origin` to bring a new user back to the expert they were viewing.
 */
export default function VerifyEmailScreen() {
  const { user, verifyEmail, sendVerificationCode } = useAuth();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const params = useLocalSearchParams<{ afterSignup?: string; returnTo?: string; origin?: string }>();
  const afterSignup = params.afterSignup === "1";

  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Sign-up has just sent a code, so start with the wait already running
  const [wait, setWait] = useState(afterSignup ? RESEND_WAIT_SECONDS : 0);

  useEffect(() => {
    if (wait <= 0) return;
    const timer = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(timer);
  }, [wait]);

  const carryOn = () => {
    if (afterSignup && user) {
      finishAuth(user.role, { returnTo: params.returnTo, origin: params.origin });
    } else if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/");
    }
  };

  const submit = async () => {
    setError(null);
    if (!/^\d{6}$/.test(code.trim())) return setError("Please enter the 6-digit code from the email.");
    setBusy(true);
    try {
      await verifyEmail(code.trim());
      Toast.show({ type: "success", text1: "Email verified", text2: "Thank you. You're all set." });
      carryOn();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const resend = async () => {
    setError(null);
    try {
      await sendVerificationCode();
      setWait(RESEND_WAIT_SECONDS);
      Toast.show({ type: "success", text1: "New code sent", text2: "Please check your email." });
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scroll}>
          <View style={styles.iconWrap}>
            <Ionicons name="mail-open-outline" size={32} color={colors.onPrimaryMuted} />
          </View>
          <Text style={styles.title}>Check your email</Text>
          <Text style={styles.subtitle}>
            {`We've sent a 6-digit code to ${user?.email ?? "your email"}. Enter it below to confirm it's you. If it's not there, check your spam folder.`}
          </Text>

          <TextInput
            style={styles.codeInput}
            keyboardType="number-pad"
            autoComplete="one-time-code"
            textContentType="oneTimeCode"
            maxLength={6}
            placeholder="123456"
            placeholderTextColor={colors.textMuted}
            value={code}
            onChangeText={(text) => setCode(text.replace(/\D/g, ""))}
            accessibilityLabel="6-digit code"
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable style={[styles.primary, busy && styles.busy]} onPress={submit} disabled={busy} accessibilityRole="button">
            {busy ? <ActivityIndicator color={colors.onPrimary} /> : <Text style={styles.primaryText}>Verify email</Text>}
          </Pressable>

          <Pressable style={styles.linkRow} onPress={resend} disabled={wait > 0} accessibilityRole="button">
            <Text style={[styles.link, wait > 0 && styles.linkDisabled]}>
              {wait > 0 ? `Send a new code in ${wait}s` : "Send a new code"}
            </Text>
          </Pressable>

          <Pressable style={styles.linkRow} onPress={carryOn} accessibilityRole="button">
            <Text style={styles.skip}>Do this later</Text>
          </Pressable>
          <Text style={styles.note}>
            {user?.role === "expert"
              ? "Our team can approve your profile once your email is verified."
              : "You'll need a verified email to request a session."}
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    flex: { flex: 1 },
    scroll: { padding: spacing.md, paddingTop: spacing.xl, paddingBottom: spacing.xxl },
    iconWrap: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: colors.primaryMuted,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: spacing.md,
    },
    title: { ...typography.h1, color: colors.textPrimary },
    subtitle: { ...typography.body, color: colors.textSecondary, marginTop: spacing.xs, marginBottom: spacing.lg },
    codeInput: {
      ...typography.h2,
      letterSpacing: 8,
      textAlign: "center",
      minHeight: 60,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      color: colors.textPrimary,
      backgroundColor: colors.surface,
      marginBottom: spacing.md,
    },
    error: { ...typography.body, color: colors.error, marginBottom: spacing.sm },
    primary: {
      minHeight: 52,
      backgroundColor: colors.primary,
      borderRadius: radius.md,
      alignItems: "center",
      justifyContent: "center",
    },
    busy: { opacity: 0.7 },
    primaryText: { ...typography.button, color: colors.onPrimary },
    linkRow: { marginTop: spacing.sm, minHeight: minTapTarget, alignItems: "center", justifyContent: "center" },
    link: { ...typography.button, color: colors.primary },
    linkDisabled: { color: colors.textMuted },
    skip: { ...typography.button, color: colors.textSecondary },
    note: { ...typography.body, color: colors.textMuted, textAlign: "center", marginTop: spacing.xs },
  });
