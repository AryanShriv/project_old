import { StyleSheet } from "react-native";
import { ThemeColors } from "../../design-system/colors";
import { radius } from "../../design-system/radius";
import { shadows } from "../../design-system/shadows";
import { spacing } from "../../design-system/spacing";
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
        height: 48,
        width: 48,
        borderRadius: radius.full,
        borderWidth: 2,
        borderColor: colors.border,
        marginRight: spacing.sm,
        overflow: "hidden",
    },
    avatar: {
        width: "100%",
        height: "100%",
    },
    nameBlock: {
        flex: 1,
    },
    nameRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    name: {
        ...typography.bodyMedium,
        color: colors.textPrimary,
        flex: 1,
        marginRight: spacing.xs,
    },
    saveButton: {
        padding: spacing.xxs,
    },
    title: {
        ...typography.label,
        color: colors.textSecondary,
        marginTop: 2,
    },
    badgeRow: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: spacing.sm,
        gap: spacing.sm,
    },
    badge: {
        backgroundColor: colors.overlay,
        paddingHorizontal: spacing.xs,
        paddingVertical: spacing.xxs,
        borderRadius: radius.xs,
    },
    badgeText: {
        ...typography.labelSmall,
        color: colors.textSecondary,
    },
    experienceContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.xxs,
    },
    experienceText: {
        ...typography.labelSmall,
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
        ...typography.labelSmall,
        color: colors.textSecondary,
    },
    button: {
        backgroundColor: colors.primary,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        borderRadius: radius.sm,
    },
    buttonText: {
        ...typography.buttonSmall,
        color: "#FFFFFF",
    },
});