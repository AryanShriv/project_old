import { Ionicons } from "@expo/vector-icons";
import { router, Stack } from "expo-router";
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
 * Delete account (required by the App Store and Google Play). Explains what happens,
 * then asks for the password to confirm. The backend erases personal details.
 */
export default function DeleteAccountScreen() {
  const { user, deleteAccount } = useAuth();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isExpert = user?.role === "expert";
  const points = [
    "Your name, email, phone and profile details are erased, and you are signed out.",
    isExpert
      ? "Your expert profile is removed from G(Old), and open requests are cancelled."
      : "Your saved experts are removed, and open requests are cancelled.",
    "Reviews and messages you wrote stay for the people they were for, shown as from a “Former member”.",
    "We keep a record of the Terms you agreed to, as the law requires.",
    "This can't be undone. You're welcome to sign up again later with the same email.",
  ];

  const confirm = async () => {
    setError(null);
    if (!password) return setError("Please enter your password to confirm.");
    setBusy(true);
    try {
      await deleteAccount(password);
      Toast.show({ type: "success", text1: "Your account has been deleted", text2: "Thank you for being part of G(Old)." });
      router.replace("/");
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scroll}>
          <Pressable style={styles.back} onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Back">
            <Ionicons name="arrow-back" size={26} color={colors.textPrimary} />
          </Pressable>

          <Text style={styles.title}>Delete your account</Text>
          <Text style={styles.subtitle}>{"We're sorry to see you go. Here is what happens:"}</Text>

          <View style={styles.card}>
            {points.map((point) => (
              <View key={point} style={styles.point}>
                <Ionicons name="ellipse" size={8} color={colors.textSecondary} style={styles.bullet} />
                <Text style={styles.pointText}>{point}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.label}>Enter your password to confirm</Text>
          <View style={styles.passwordWrap}>
            <TextInput
              style={[styles.input, styles.passwordInput]}
              secureTextEntry={!showPassword}
              autoComplete="current-password"
              textContentType="password"
              placeholder="Your password"
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
              <Text style={styles.toggleText}>{showPassword ? "Hide" : "Show"}</Text>
            </Pressable>
          </View>
          <Pressable
            style={styles.forgot}
            onPress={() => router.push({ pathname: "/(auth)/forgot-password", params: { email: user?.email ?? "" } })}
            accessibilityRole="link"
          >
            <Text style={styles.toggleText}>Forgot your password?</Text>
          </Pressable>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable style={[styles.danger, busy && styles.busy]} onPress={confirm} disabled={busy} accessibilityRole="button">
            {busy ? <ActivityIndicator color={colors.error} /> : <Text style={styles.dangerText}>Delete my account</Text>}
          </Pressable>
          <Pressable style={styles.cancel} onPress={() => router.back()} accessibilityRole="button">
            <Text style={styles.cancelText}>Keep my account</Text>
          </Pressable>
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
    subtitle: { ...typography.body, color: colors.textSecondary, marginTop: spacing.xs, marginBottom: spacing.md },
    card: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      padding: spacing.md,
      marginBottom: spacing.lg,
      gap: spacing.sm,
    },
    point: { flexDirection: "row", alignItems: "flex-start" },
    bullet: { marginTop: 8, marginRight: spacing.sm },
    pointText: { ...typography.body, flex: 1, color: colors.textPrimary },
    label: { ...typography.bodyMedium, color: colors.textPrimary, marginBottom: spacing.xs },
    passwordWrap: { justifyContent: "center" },
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
    passwordInput: { paddingRight: 76 },
    passwordToggle: {
      position: "absolute",
      right: 0,
      top: 0,
      bottom: 0,
      minWidth: minTapTarget + spacing.md,
      alignItems: "center",
      justifyContent: "center",
    },
    toggleText: { ...typography.button, color: colors.primary },
    forgot: { minHeight: minTapTarget, justifyContent: "center", alignSelf: "flex-start" },
    error: { ...typography.body, color: colors.error, marginBottom: spacing.sm },
    danger: {
      minHeight: 52,
      borderRadius: radius.md,
      backgroundColor: colors.errorMuted,
      borderWidth: 1,
      borderColor: colors.error,
      alignItems: "center",
      justifyContent: "center",
      marginTop: spacing.sm,
    },
    busy: { opacity: 0.7 },
    dangerText: { ...typography.button, color: colors.error },
    cancel: { minHeight: minTapTarget, alignItems: "center", justifyContent: "center", marginTop: spacing.sm },
    cancelText: { ...typography.button, color: colors.textSecondary },
  });
