import { ThemeColors } from "@/src/design-system/colors";
import { radius } from "@/src/design-system/radius";
import { minTapTarget, spacing } from "@/src/design-system/spacing";
import { typography } from "@/src/design-system/typography";
import { StyleSheet } from "react-native";

export const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: colors.overlay,
      justifyContent: "flex-end",
    },
    container: {
      backgroundColor: colors.background,
      borderTopLeftRadius: radius.xl,
      borderTopRightRadius: radius.xl,
      maxHeight: "92%",
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      gap: spacing.sm,
      padding: spacing.md,
      paddingHorizontal: spacing.lg,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    title: {
      ...typography.h2,
      color: colors.textPrimary,
      flex: 1,
    },
    closeButton: {
      width: minTapTarget,
      height: minTapTarget,
      alignItems: "center",
      justifyContent: "center",
    },
    scroll: {
      padding: spacing.lg,
    },
    sectionTitle: {
      ...typography.h3,
      color: colors.textPrimary,
      marginTop: spacing.md,
      marginBottom: spacing.xxs,
    },
    hint: {
      ...typography.body,
      color: colors.textMuted,
      marginBottom: spacing.sm,
    },
    input: {
      ...typography.body,
      color: colors.textPrimary,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      padding: spacing.md,
      backgroundColor: colors.surface,
      minHeight: 120,
      textAlignVertical: "top",
    },
    counter: {
      ...typography.label,
      color: colors.textMuted,
      textAlign: "right",
      marginTop: spacing.xxs,
    },
    counterWarn: {
      color: colors.warning,
    },
    option: {
      minHeight: 64,
      justifyContent: "center",
      padding: spacing.md,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      marginTop: spacing.xs,
    },
    optionSelected: {
      backgroundColor: colors.primaryMuted,
      borderColor: colors.primary,
    },
    optionLabel: {
      ...typography.bodyMedium,
      color: colors.textPrimary,
    },
    optionLabelSelected: {
      color: colors.onPrimaryMuted,
    },
    optionHint: {
      ...typography.label,
      color: colors.textMuted,
    },
    choiceRow: {
      flexDirection: "row",
      gap: spacing.sm,
      marginTop: spacing.xs,
    },
    choice: {
      flex: 1,
      flexDirection: "row",
      gap: spacing.xs,
      minHeight: 56,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    footer: {
      padding: spacing.lg,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
      backgroundColor: colors.background,
    },
    submitButton: {
      minHeight: 52,
      backgroundColor: colors.primary,
      borderRadius: radius.md,
      alignItems: "center",
      justifyContent: "center",
    },
    submitButtonDisabled: {
      backgroundColor: colors.border,
    },
    submitText: {
      ...typography.button,
      color: colors.onPrimary,
    },
    submitTextDisabled: {
      color: colors.textMuted,
    },
  });
