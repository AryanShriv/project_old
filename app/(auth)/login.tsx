import { Ionicons } from "@expo/vector-icons";
import type { Href } from "expo-router";
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

import { DEMO_PASSWORD } from "@/src/auth/demoAccounts";
import { useAuth } from "@/src/context/AuthContext";
import { useTheme } from "@/src/context/ThemeContext";
import { ThemeColors } from "@/src/design-system/colors";
import { radius } from "@/src/design-system/radius";
import { spacing } from "@/src/design-system/spacing";
import type { AuthRoleIntent } from "@/src/types/auth";

export default function LoginScreen() {
  const { login, isLoading: authBoot } = useAuth();
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const params = useLocalSearchParams<{
    intent?: string;
    returnTo?: string;
  }>();

  const intentParam =
    typeof params.intent === "string" ? params.intent : undefined;
  const isAdminEntry = Platform.OS === "web" && intentParam === "admin";
  const initialIntent: AuthRoleIntent =
    isAdminEntry
      ? "admin"
      : intentParam === "freelancer"
      ? "freelancer"
      : "client";

  const [intent, setIntent] = useState<AuthRoleIntent>(initialIntent);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const goAfterLogin = useCallback(
    (role: AuthRoleIntent) => {
      const returnTo = params.returnTo;
      if (returnTo && typeof returnTo === "string") {
        router.replace(returnTo as Href);
        return;
      }
      if (role === "freelancer") {
        router.replace("/(freelancer)/(tabs)");
      } else if (role === "admin") {
        router.replace("/(admin)/(tabs)");
      } else {
        router.replace("/(client)/(tabs)");
      }
    },
    [params.returnTo],
  );

  const onSubmit = async () => {
    setError(null);
    setSubmitting(true);
    try {
      const result = await login(email, password, intent);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      goAfterLogin(intent);
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
              else router.replace("/(client)/(tabs)");
            }}
            hitSlop={12}
          >
            <Ionicons name="close" size={28} color={colors.textPrimary} />
          </Pressable>

          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.subtitle}>
            {isAdminEntry
              ? "Admin access for freelancer moderation and platform control."
              : "Sign in to save experts, send requests, or manage your freelancer inbox."}
          </Text>

          {!isAdminEntry ? (
            <View style={styles.segment}>
              <Pressable
                style={[styles.segBtn, intent === "client" && styles.segBtnOn]}
                onPress={() => setIntent("client")}
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
          ) : null}

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            placeholder={
              intent === "client"
                ? "client@demo.com"
                : intent === "freelancer"
                  ? "john@demo.com"
                  : "admin@demo.com"
            }
            placeholderTextColor={colors.textMuted}
            value={email}
            onChangeText={setEmail}
          />

          <Text style={styles.label}>Password</Text>
          <View style={styles.passwordWrap}>
            <TextInput
              style={[styles.input, styles.passwordInput]}
              secureTextEntry={!showPassword}
              placeholder={`Try "${DEMO_PASSWORD}"`}
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
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryText}>Sign in</Text>
            )}
          </Pressable>
          {!isAdminEntry ? (
            <Pressable
              style={styles.linkRow}
              onPress={() =>
                router.push({
                  pathname: "/(auth)/signup",
                  params: { intent },
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
    color: "#fff",
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
    fontSize: 15,
    fontWeight: "600",
    color: colors.primary,
  },
});

