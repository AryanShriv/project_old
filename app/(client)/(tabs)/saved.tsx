import type { Href } from "expo-router";
import { router } from "expo-router";
import { useMemo } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { EmptyState } from "@/src/components/EmptyState/EmptyState";
import { FreelancerCard } from "@/src/components/FreelancerCard/FreelancerCard";
import { useAuth } from "@/src/context/AuthContext";
import { useFreelancers } from "@/src/context/FreelancersContext";
import { useSaved } from "@/src/context/SavedContext";
import { useTheme } from "@/src/context/ThemeContext";
import { ThemeColors } from "@/src/design-system/colors";
import { radius } from "@/src/design-system/radius";
import { minTapTarget, spacing } from "@/src/design-system/spacing";
import { typography } from "@/src/design-system/typography";

export default function SavedScreen() {
  const { user } = useAuth();
  const { freelancers } = useFreelancers();
  const { savedIds } = useSaved();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  if (!user || user.role !== "client") {
    return (
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <View style={styles.locked}>
          <EmptyState
            icon="lock-closed-outline"
            title="Sign in to save experts"
            subtitle="Create an account to bookmark freelancers and find them later."
          />
          <Pressable
            style={styles.primaryBtn}
            onPress={() =>
              router.push({
                pathname: "/(auth)/login",
                params: { intent: "client" },
              } as Href)
            }
          >
            <Text style={styles.primaryBtnText}>Sign in</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const savedFreelancers = freelancers.filter((f) => savedIds.includes(f.id));

  if (savedFreelancers.length === 0) {
    return (
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <EmptyState
          icon="bookmark-outline"
          title="No saved experts yet"
          subtitle="Tap the star on a profile card to save freelancers you want to revisit."
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <Text style={styles.title}>Saved</Text>
        <Text style={styles.subtitle}>
          {savedFreelancers.length} expert
          {savedFreelancers.length === 1 ? "" : "s"} bookmarked
        </Text>
      </View>
      <FlatList
        contentContainerStyle={styles.list}
        data={savedFreelancers}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <FreelancerCard {...item} />}
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
    color: "#FFFFFF",
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

