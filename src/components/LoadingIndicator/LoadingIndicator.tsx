import { useTheme } from "@/src/context/ThemeContext";
import { spacing } from "@/src/design-system/spacing";
import { typography } from "@/src/design-system/typography";
import React from "react";
import { ActivityIndicator, StyleSheet, Text, View, ViewStyle } from "react-native";

interface LoadingIndicatorProps {
  message?: string;
  size?: "small" | "large";
  style?: ViewStyle;
}

export function LoadingIndicator({ message, size = "large", style }: LoadingIndicatorProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, style]}>
      <ActivityIndicator size={size} color={colors.primary} />
      {message && (
        <Text style={[styles.message, { color: colors.textSecondary }]}>{message}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.lg,
  },
  message: {
    ...typography.body,
    marginTop: spacing.md,
    textAlign: "center",
  },
});
