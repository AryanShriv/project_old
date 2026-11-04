import { ThemeColors } from "@/src/design-system/colors";
import { radius } from "@/src/design-system/radius";
import { spacing } from "@/src/design-system/spacing";
import { typography } from "@/src/design-system/typography";
import { StyleSheet } from "react-native";

export const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    empty: {
      padding: spacing.lg,
      alignItems: "center",
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.divider,
      backgroundColor: colors.surface,
    },
    emptyText: {
      ...typography.body,
      color: colors.textMuted,
      textAlign: "center",
    },
    container: {
      padding: spacing.md,
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      marginBottom: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    recommendBadge: {
      flexDirection: "row",
      alignItems: "center",
      alignSelf: "flex-start",
      backgroundColor: colors.successMuted,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xxs,
      borderRadius: radius.full,
      marginBottom: spacing.sm,
      gap: spacing.xxs,
    },
    recommendText: {
      ...typography.label,
      color: colors.success,
    },
    words: {
      ...typography.bodyLarge,
      fontFamily: typography.h3.fontFamily,
      color: colors.textPrimary,
    },
    comment: {
      ...typography.body,
      color: colors.textSecondary,
      marginTop: spacing.xs,
    },
    metaRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      marginTop: spacing.md,
      paddingTop: spacing.sm,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.divider,
    },
    metaText: {
      flex: 1,
    },
    authorName: {
      ...typography.label,
      color: colors.textSecondary,
    },
    meta: {
      ...typography.label,
      color: colors.textMuted,
    },
  });
