import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useAuth } from "@/src/context/AuthContext";
import { useTheme } from "@/src/context/ThemeContext";
import { ThemeColors } from "@/src/design-system/colors";
import { radius } from "@/src/design-system/radius";
import { minTapTarget, spacing } from "@/src/design-system/spacing";
import { typography } from "@/src/design-system/typography";

/** True when the signed-in person still needs to verify their email */
export const useNeedsEmailVerification = () => {
  const { user } = useAuth();
  return Boolean(user && user.emailVerificationRequired && !user.emailVerified);
};

/**
 * A warm reminder to verify the email, with a button to the code screen.
 * Renders nothing once verified, or when the server doesn't require verification.
 */
export function VerifyEmailNotice({ message }: { message?: string }) {
  const { user } = useAuth();
  const needed = useNeedsEmailVerification();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  if (!needed) return null;

  const text =
    message ??
    (user?.role === "expert"
      ? "Please confirm your email so our team can approve your profile."
      : "Please confirm your email so you can request sessions.");

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <Ionicons name="mail-unread-outline" size={22} color={colors.onPrimaryMuted} />
        <View style={styles.textWrap}>
          <Text style={styles.title}>Verify your email</Text>
          <Text style={styles.body}>{text}</Text>
        </View>
      </View>
      <Pressable style={styles.button} onPress={() => router.push("/verify-email")} accessibilityRole="button">
        <Text style={styles.buttonText}>Enter my code</Text>
      </Pressable>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.primaryMuted,
      borderRadius: radius.md,
      padding: spacing.md,
      marginBottom: spacing.md,
    },
    row: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm },
    textWrap: { flex: 1 },
    title: { ...typography.bodyMedium, color: colors.onPrimaryMuted },
    body: { ...typography.body, color: colors.onPrimaryMuted, marginTop: spacing.xxs },
    button: {
      marginTop: spacing.sm,
      minHeight: minTapTarget,
      borderRadius: radius.sm,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    buttonText: { ...typography.button, color: colors.onPrimary },
  });
