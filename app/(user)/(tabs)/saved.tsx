import type { Href } from "expo-router";
import { router } from "expo-router";
import { useMemo } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { EmptyState } from "@/src/components/EmptyState/EmptyState";
import { ExpertCard } from "@/src/components/ExpertCard/ExpertCard";
import { useAuth } from "@/src/context/AuthContext";
import { useExperts } from "@/src/context/ExpertsContext";
import { useSaved } from "@/src/context/SavedContext";
import { useTheme } from "@/src/context/ThemeContext";
import { ThemeColors, brand } from "@/src/design-system/colors";
import { radius } from "@/src/design-system/radius";
import { minTapTarget, spacing } from "@/src/design-system/spacing";
import { typography } from "@/src/design-system/typography";

export default function SavedScreen() {
  const { user } = useAuth();
  const { experts } = useExperts();
  const { savedIds } = useSaved();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  if (!user || user.role !== "user") {
    return (
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <View style={styles.locked}>
          <EmptyState
            icon="lock-closed-outline"
            title="Sign in to save experts"
            subtitle="Create an account to bookmark experts and find them later."
          />
          <Pressable
            style={styles.primaryBtn}
            onPress={() =>
              router.push({
                pathname: "/(auth)/login",
                params: { intent: "user" },
              } as Href)
            }
          >
            <Text style={styles.primaryBtnText}>Sign in</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const savedExperts = experts.filter((f) => savedIds.includes(f.id));

  if (savedExperts.length === 0) {
    return (
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <EmptyState
          icon="bookmark-outline"
          title="No saved experts yet"
          subtitle="Tap the bookmark on a profile to save experts you want to come back to."
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <Text style={styles.title}>Saved</Text>
        <Text style={styles.subtitle}>
          {savedExperts.length} expert
          {savedExperts.length === 1 ? "" : "s"} bookmarked
        </Text>
      </View>
      <FlatList
        contentContainerStyle={styles.list}
        data={savedExperts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ExpertCard {...item} />}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  locked: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingBottom: 120,
  },
  primaryBtn: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: radius.sm,
    alignItems: "center",
    minHeight: minTapTarget,
  },
  primaryBtnText: {
    ...typography.button,
    color: brand.onPrimary,
  },
  header: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
  },
  title: {
    ...typography.displaySmall,
    color: colors.textPrimary,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.xxs,
  },
  list: {
    padding: spacing.md,
    paddingBottom: 120,
  },
});

