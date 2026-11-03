import { StyleSheet } from "react-native";
import { ThemeColors } from "../../design-system/colors";
import { radius } from "../../design-system/radius";
import { shadows } from "../../design-system/shadows";
import { minTapTarget, spacing } from "../../design-system/spacing";
import { typography } from "../../design-system/typography";

export const createStyles = (colors: ThemeColors) => StyleSheet.create({
    card: {
        backgroundColor: colors.surfaceElevated,
        padding: spacing.md,
        borderRadius: radius.md,
        marginBottom: spacing.md,
        borderWidth: 1,
        borderColor: colors.border,
        ...shadows.sm,
    },
    pressed: {
        opacity: 0.9,
    },
    headerRow: {
        flexDirection: "row",
        alignItems: "flex-start",
    },
    avatarContainer: {
        marginRight: spacing.sm,
    },
    nameBlock: {
        flex: 1,
    },
    name: {
        ...typography.h3,
        color: colors.textPrimary,
    },
    saveButton: {
        width: minTapTarget,
        height: minTapTarget,
        alignItems: "center",
        justifyContent: "center",
        marginTop: -spacing.xs,
        marginRight: -spacing.xs,
    },
    title: {
        ...typography.label,
        color: colors.textSecondary,
        marginTop: 2,
    },
    badgeRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        alignItems: "center",
        marginTop: spacing.sm,
        gap: spacing.xs,
    },
    badge: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.xxs,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.divider,
        paddingHorizontal: spacing.xs,
        paddingVertical: spacing.xxs,
        borderRadius: radius.full,
    },
    badgeText: {
        ...typography.label,
        color: colors.textSecondary,
    },
    tagline: {
        ...typography.body,
        color: colors.textSecondary,
        marginTop: spacing.sm,
        lineHeight: 24,
    },
    footer: {
        marginTop: spacing.md,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    rate: {
        ...typography.bodyMedium,
        color: colors.textPrimary,
    },
    rateSuffix: {
        ...typography.label,
        color: colors.textSecondary,
    },
    button: {
        backgroundColor: colors.primary,
        minHeight: minTapTarget,
        justifyContent: "center",
        paddingHorizontal: spacing.md,
        borderRadius: radius.md,
    },
    buttonText: {
        ...typography.button,
        color: colors.onPrimary,
    },
});