import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useMemo, useState } from "react";
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
import { useTheme } from "@/src/context/ThemeContext";
import { ThemeColors, brand } from "@/src/design-system/colors";
import { radius } from "@/src/design-system/radius";
import { spacing } from "@/src/design-system/spacing";
import type { AuthRoleIntent } from "@/src/types/auth";
import { finishAuth } from "@/src/utils/reentry";

export default function LoginScreen() {
  const { login, isLoading: authBoot } = useAuth();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const params = useLocalSearchParams<{
    intent?: string;
    returnTo?: string;
    origin?: string;
  }>();

  const intentParam =
    typeof params.intent === "string" ? params.intent : undefined;
  const isAdminEntry = Platform.OS === "web" && intentParam === "admin";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Back to the expert the visitor was looking at, if any (PRD 5.3)
  const goAfterLogin = useCallback(
    (role: AuthRoleIntent) => finishAuth(role, { returnTo: params.returnTo, origin: params.origin }),
    [params.returnTo, params.origin],
  );

  const onSubmit = async () => {
    setError(null);
    setSubmitting(true);
    try {
      const result = await login(email, password);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      goAfterLogin(result.role);
    } finally {
      setSubmitting(false);
    }
  };

  if (authBoot) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
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
          <Pressable
            style={styles.back}
            onPress={() => {
              if (router.canGoBack?.()) router.back();
              else router.replace("/(user)/(tabs)");
            }}
            hitSlop={12}
          >
            <Ionicons name="close" size={28} color={colors.textPrimary} />
          </Pressable>

          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.subtitle}>
            {isAdminEntry
              ? "Admin access for expert moderation and platform control."
              : "Sign in with your email and password. We'll take you to the right place, whether you're looking for an expert or you are one."}
          </Text>


          <Text style={styles.label}>Email</Text>
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

          <Text style={styles.label}>Password</Text>
          <View style={styles.passwordWrap}>
            <TextInput
              style={[styles.input, styles.passwordInput]}
              secureTextEntry={!showPassword}
              placeholder="Your password"
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

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable
            style={[styles.primary, submitting && styles.primaryDisabled]}
            onPress={onSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color={brand.onPrimary} />
            ) : (
              <Text style={styles.primaryText}>Sign in</Text>
            )}
          </Pressable>
          {!isAdminEntry ? (
            <Pressable
              style={styles.linkRow}
              onPress={() =>
                // Replace rather than stack, so "back" after signing up returns to where the visitor started
                router.replace({
                  pathname: "/(auth)/signup",
                  params: {
                    ...(intentParam === "expert" || intentParam === "user" ? { intent: intentParam } : {}),
                    ...(params.returnTo ? { returnTo: params.returnTo, origin: params.origin ?? "" } : {}),
                  },
                })
              }
            >
              <Text style={styles.link}>Need an account? Register</Text>
            </Pressable>
          ) : null}
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
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
  },
  scroll: {
    padding: spacing.sm,
    paddingBottom: spacing.xl,
  },
  back: {
    alignSelf: "flex-start",
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.textPrimary,
    letterSpacing: -0.4,
  },
  subtitle: {
    marginTop: spacing.sm,
    fontSize: 16,
    color: colors.textSecondary,
    lineHeight: 24,
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textMuted,
    marginBottom: 6,
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
    color: brand.onPrimary,
    fontSize: 16,
    fontWeight: "700",
  },
  hint: {
    marginTop: spacing.lg,
    padding: spacing.sm,
    backgroundColor: colors.primaryMuted,
    borderRadius: radius.md,
  },
  hintTitle: {
    fontWeight: "700",
    color: colors.primary,
    marginBottom: 6,
    fontSize: 13,
  },
  hintLine: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  linkRow: {
    marginTop: spacing.lg,
    alignItems: "center",
  },
  link: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.primary,
  },
});

