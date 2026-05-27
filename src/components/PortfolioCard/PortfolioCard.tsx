import { useMemo, useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import { useTheme } from "@/src/context/ThemeContext";
import { ThemeColors } from "../../design-system/colors";
import { radius } from "../../design-system/radius";
import { shadows } from "../../design-system/shadows";
import { spacing } from "../../design-system/spacing";
import { typography } from "../../design-system/typography";

type PortfolioItem = {
  id: string;
  title: string;
  description: string;
  image: string;
};

type Props = {
  item: PortfolioItem;
};

export const PortfolioCard = ({ item }: Props) => {
  const [hovered, setHovered] = useState(false);
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <Pressable
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={({ pressed }) => [
        styles.card,
        hovered && styles.cardHover,
        pressed && styles.cardPressed,
      ]}
    >
      <View style={{ overflow: "hidden" }}>
        <Image
          source={{ uri: item.image }}
          style={[styles.image, hovered && styles.imageHover]}
        />
      </View>
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.description}>{item.description}</Text>
    </Pressable>
  );
};

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  card: {
    width: 260,
    marginRight: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  cardHover: {
    transform: [{ scale: 1.02 }],
    ...shadows.md,
  },
  cardPressed: {
    opacity: 0.96,
  },
  image: {
    width: "100%",
    height: 160,
    backgroundColor: colors.overlay,
  },
  imageHover: {
    transform: [{ scale: 1.04 }],
  },
  title: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
    paddingHorizontal: spacing.md,
    marginTop: spacing.md,
  },
  description: {
    ...typography.body,
    color: colors.textSecondary,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    marginTop: spacing.xxs,
  },
});

