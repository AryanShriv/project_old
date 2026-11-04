import { Ionicons } from "@expo/vector-icons";
import React, { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import type { Disclaimer } from "@/src/constants/trust";
import { useTheme } from "@/src/context/ThemeContext";
import { ThemeColors } from "@/src/design-system/colors";
import { radius } from "@/src/design-system/radius";
import { minTapTarget, spacing } from "@/src/design-system/spacing";
import { typography } from "@/src/design-system/typography";

type Props = {
  disclaimer: Disclaimer;
  /** When provided, the card shows an "I understand" checkbox */
  acknowledged?: boolean;
  onToggle?: () => void;
};

/** A sensitive-category or safety note (PRD 4.6), optionally with an acknowledgement tick. */
export const DisclaimerCard = ({ disclaimer, acknowledged, onToggle }: Props) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.card}>
      <View style={styles.titleRow}>
        <Ionicons name="information-circle-outline" size={22} color={colors.onPrimaryMuted} />
        <Text style={styles.title}>{disclaimer.title}</Text>
      </View>
      <Text style={styles.body}>{disclaimer.body}</Text>
      {onToggle && (
        <Pressable
          style={styles.checkRow}
          onPress={onToggle}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: Boolean(acknowledged) }}
          accessibilityLabel={`I understand: ${disclaimer.title}`}
        >
          <View style={[styles.checkbox, acknowledged && styles.checkboxOn]}>
            {acknowledged && <Ionicons name="checkmark" size={18} color={colors.onPrimary} />}
          </View>
          <Text style={styles.checkLabel}>I understand</Text>
        </Pressable>
      )}
    </View>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    card: {
      padding: spacing.md,
      borderRadius: radius.md,
      backgroundColor: colors.primaryMuted,
      marginBottom: spacing.sm,
    },
    titleRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: spacing.xs,
    },
    title: {
      ...typography.bodyMedium,
      color: colors.onPrimaryMuted,
      flex: 1,
    },
    body: {
      ...typography.body,
      color: colors.textSecondary,
      marginTop: spacing.xxs,
    },
    checkRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      minHeight: minTapTarget,
      marginTop: spacing.xs,
      alignSelf: "flex-start",
    },
    checkbox: {
      width: 28,
      height: 28,
      borderRadius: 6,
      borderWidth: 2,
      borderColor: colors.onPrimaryMuted,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.background,
    },
    checkboxOn: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    checkLabel: {
      ...typography.bodyMedium,
      color: colors.textPrimary,
    },
  });
