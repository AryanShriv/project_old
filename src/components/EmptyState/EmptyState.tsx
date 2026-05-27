import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { Text, View } from "react-native";

import { useTheme } from "@/src/context/ThemeContext";
import { spacing } from "../../design-system/spacing";
import { typography } from "../../design-system/typography";

type EmptyStateProps = {
  icon: ComponentProps<typeof Ionicons>["name"];
  title: string;
  subtitle?: string;
};

export const EmptyState = ({ icon, title, subtitle }: EmptyStateProps) => {
  const { colors } = useTheme();

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.xl,
      }}
    >
      <View
        style={{
          width: 72,
          height: 72,
          borderRadius: 36,
          backgroundColor: colors.primaryMuted,
          alignItems: "center",
          justifyContent: "center",
          marginBottom: spacing.md,
        }}
      >
        <Ionicons name={icon} size={32} color={colors.primary} />
      </View>
      <Text
        style={{
          ...typography.bodyMedium,
          color: colors.textPrimary,
          textAlign: "center",
        }}
      >
        {title}
      </Text>
      {subtitle ? (
        <Text
          style={{
            ...typography.body,
            color: colors.textSecondary,
            textAlign: "center",
            marginTop: spacing.xxs,
            lineHeight: 24,
          }}
        >
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
};

