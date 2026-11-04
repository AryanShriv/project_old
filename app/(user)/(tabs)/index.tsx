import React, { useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { DiscoverHeader } from "@/src/components/DiscoverHeader/DiscoverHeader";
import { ExpertCard } from "@/src/components/ExpertCard/ExpertCard";
import FILTER_MAP, { CANADA_CATEGORY_ORDER, INDIA_CATEGORY_ORDER } from "@/src/constants/filters";
import { useAuth } from "@/src/context/AuthContext";
import { useExperts } from "@/src/context/ExpertsContext";
import { useTheme } from "@/src/context/ThemeContext";
import { ThemeColors } from "@/src/design-system/colors";
import { radius } from "@/src/design-system/radius";
import { minTapTarget, spacing } from "@/src/design-system/spacing";
import { typography } from "@/src/design-system/typography";

export default function DiscoverScreen() {
  const { user } = useAuth();
  const { experts, isLoading, error, refresh: refreshExperts } = useExperts();
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshExperts();
    setIsRefreshing(false);
  };

  const userCountry = user?.profile?.country?.toLowerCase();
  const orderedCategories = userCountry === "canada" ? CANADA_CATEGORY_ORDER : INDIA_CATEGORY_ORDER;
  const availableFilters = ["All", ...orderedCategories];

  const filtered = useMemo(() => {
    let results = experts;

    // Filter by category chip
    if (activeFilter !== "All") {
      const keywords = FILTER_MAP[activeFilter] ?? [];
      results = results.filter((f) =>
        f.skills?.some((s) =>
          keywords.some((kw) => s.toLowerCase().includes(kw.toLowerCase()))
        ) ||
        f.title.toLowerCase().includes(activeFilter.toLowerCase())
      );
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
  }, [experts, search, activeFilter]);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.inner}>
        <FlatList
          ListHeaderComponent={
            <DiscoverHeader
              search={search}
              onSearchChange={setSearch}
              activeFilter={activeFilter}
              onFilterChange={setActiveFilter}
              filters={availableFilters}
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
                  {`No experts found for "${search || activeFilter}"`}
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

