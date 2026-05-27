import { StyleSheet } from "react-native";
import { ThemeColors } from "../../design-system/colors";
import { radius } from "../../design-system/radius";
import { minTapTarget, spacing } from "../../design-system/spacing";
import { typography } from "../../design-system/typography";

export const createStyles = (colors: ThemeColors) => StyleSheet.create({
    container: {
        marginBottom: spacing.md,
    },
    title: {
        ...typography.displaySmall,
        color: colors.textPrimary,
    },
    subtitle: {
        ...typography.body,
        color: colors.textSecondary,
        marginTop: spacing.xxs,
        marginBottom: spacing.md,
    },
    searchInput: {
        ...typography.body,
        backgroundColor: colors.surface,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        borderRadius: radius.sm,
        color: colors.textPrimary,
        borderWidth: 1,
        borderColor: colors.border,
        marginBottom: spacing.md,
        minHeight: minTapTarget, // Accessibility: 44pt minimum
    },
    filtersContainer: {
        flexDirection: "row",
    },
    filterChip: {
        backgroundColor: colors.surface,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        borderRadius: radius.full,
        marginRight: spacing.xs,
        borderWidth: 1,
        borderColor: colors.border,
        minHeight: 36, // Comfortable tap target
    },
    filterChipActive: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    filterText: {
        ...typography.label,
        color: colors.textSecondary,
    },
    filterTextActive: {
        color: "#FFFFFF",
    },
});