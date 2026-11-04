import React, { useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { DiscoverHeader } from "@/src/components/DiscoverHeader/DiscoverHeader";
import { ExpertCard } from "@/src/components/ExpertCard/ExpertCard";
import FILTER_MAP, { categoryOrderFor, expertHasSkill, expertInCategory } from "@/src/constants/filters";
import { useAuth } from "@/src/context/AuthContext";
import { useExperts } from "@/src/context/ExpertsContext";
import { useTheme } from "@/src/context/ThemeContext";
import { ThemeColors } from "@/src/design-system/colors";
import { radius } from "@/src/design-system/radius";
import { minTapTarget, spacing } from "@/src/design-system/spacing";
import { typography } from "@/src/design-system/typography";
import { deviceCountry } from "@/src/utils/region";

export default function DiscoverScreen() {
  const { user } = useAuth();
  const { experts, isLoading, error, refresh: refreshExperts } = useExperts();
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [activeSkill, setActiveSkill] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshExperts();
    setIsRefreshing(false);
  };

  // A country on the profile wins; otherwise the phone's region decides (trades first for Canada)
  const profileCountry = user?.profile?.country?.toLowerCase();
  const country = profileCountry === "india" ? "India" : profileCountry === "canada" ? "Canada" : deviceCountry();
  const availableFilters = ["All", ...categoryOrderFor(country)];
  const skillsInCategory = activeFilter === "All" ? [] : FILTER_MAP[activeFilter] ?? [];

  const chooseCategory = (category: string) => {
    setActiveFilter(category);
    setActiveSkill(null);
  };

  const filtered = useMemo(() => {
    let results = experts;

    // Category, then skill within it (PRD 5.1)
    if (activeFilter !== "All") {
      results = results.filter((expert) => expertInCategory(expert, activeFilter));
      if (activeSkill) {
        results = results.filter((expert) => expertHasSkill(expert, activeSkill));
      }
    }

    // Filter by search text
    const q = search.trim().toLowerCase();
    if (q.length > 0) {
      results = results.filter(
        (f) =>
          f.name.toLowerCase().includes(q) ||
          f.title.toLowerCase().includes(q) ||
          f.tagline.toLowerCase().includes(q) ||
          f.skills?.some((s) => s.toLowerCase().includes(q))
      );
    }

    return results;
  }, [experts, search, activeFilter, activeSkill]);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.inner}>
        <FlatList
          ListHeaderComponent={
            <DiscoverHeader
              search={search}
              onSearchChange={setSearch}
              activeFilter={activeFilter}
              onFilterChange={chooseCategory}
              filters={availableFilters}
              subFilters={skillsInCategory}
              activeSubFilter={activeSkill}
              onSubFilterChange={setActiveSkill}
            />
          }
          contentContainerStyle={styles.listContent}
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <ExpertCard {...item} />}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            isLoading ? (
              <View style={styles.empty}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[styles.emptyHint, styles.centerText]}>Finding experts for you…</Text>
              </View>
            ) : error && experts.length === 0 ? (
              <View style={styles.empty}>
                <Text style={[styles.emptyText, styles.centerText]}>{"We couldn't load experts"}</Text>
                <Text style={[styles.emptyHint, styles.centerText]}>{error}</Text>
                <Pressable style={styles.retryButton} onPress={handleRefresh} accessibilityRole="button">
                  <Text style={styles.retryText}>Try again</Text>
                </Pressable>
              </View>
            ) : (
              <View style={styles.empty}>
                <Text style={[styles.emptyText, styles.centerText]}>
                  {`No experts found for "${search || activeSkill || activeFilter}"`}
                </Text>
                <Text style={[styles.emptyHint, styles.centerText]}>Try a different search term or filter</Text>
              </View>
            )
          }
        />
      </View>
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  inner: {
    flex: 1,
  },
  listContent: {
    padding: spacing.md,
    paddingBottom: 100,
  },
  empty: {
    paddingVertical: spacing.xxxl,
    alignItems: "center",
  },
  emptyText: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
  },
  emptyHint: {
    ...typography.body,
    marginTop: spacing.xs,
    color: colors.textMuted,
  },
  centerText: {
    textAlign: "center",
  },
  retryButton: {
    marginTop: spacing.md,
    minHeight: minTapTarget,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  retryText: {
    ...typography.button,
    color: colors.onPrimary,
  },
});

