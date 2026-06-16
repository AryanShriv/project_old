import { ThemeColors } from "@/src/design-system/colors";
import { radius } from "@/src/design-system/radius";
import { spacing } from "@/src/design-system/spacing";
import { typography } from "@/src/design-system/typography";
import { StyleSheet } from "react-native";

export const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      padding: spacing.md,
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      marginBottom: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: spacing.sm,
    },
    authorRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
    },
    avatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.primaryMuted,
      justifyContent: "center",
      alignItems: "center",
    },
    avatarText: {
      ...typography.bodyMedium,
      color: colors.primary,
      fontWeight: "700",
    },
    authorName: {
      ...typography.bodyMedium,
      color: colors.textPrimary,
      fontWeight: "600",
    },
    date: {
      ...typography.caption,
      color: colors.textMuted,
    },
    starsRow: {
      flexDirection: "row",
      gap: 2,
    },
    comment: {
      ...typography.body,
      color: colors.textSecondary,
      marginTop: spacing.xs,
      lineHeight: 22,
    },
    tagsContainer: {
      marginTop: spacing.md,
      gap: spacing.xs,
    },
    tagRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: spacing.xs,
    },
    tagLabel: {
      ...typography.caption,
      fontWeight: "600",
      color: colors.textPrimary,
      width: 90,
    },
    tagValue: {
      ...typography.caption,
      color: colors.textSecondary,
      flex: 1,
    },
    recommendBadge: {
      flexDirection: "row",
      alignItems: "center",
      alignSelf: "flex-start",
      backgroundColor: colors.successMuted,
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
      borderRadius: radius.full,
      marginTop: spacing.sm,
      gap: 4,
    },
    recommendText: {
      ...typography.caption,
      color: colors.success,
      fontWeight: "600",
    },
  });
