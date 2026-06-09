import React, { useMemo, useState } from "react";
import { FlatList, RefreshControl, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { DiscoverHeader } from "@/src/components/DiscoverHeader/DiscoverHeader";
import { FreelancerCard } from "@/src/components/FreelancerCard/FreelancerCard";
import { useFreelancers } from "@/src/context/FreelancersContext";
import { useTheme } from "@/src/context/ThemeContext";
import { ThemeColors } from "@/src/design-system/colors";
import { spacing } from "@/src/design-system/spacing";
import { typography } from "@/src/design-system/typography";

const FILTER_MAP: Record<string, string[]> = {
  Design: ["Figma", "UX", "Design Systems", "UI"],
  Mobile: ["React Native", "Expo", "iOS", "Android"],
  Backend: ["Node.js", "GraphQL", "AWS", "Python", "Go"],
  AI: ["Machine Learning", "AI", "Data Science", "LLM"],
  Product: ["Product Strategy", "Growth", "Analytics", "PM"],
};

export default function DiscoverScreen() {
  const { freelancers, refresh: refreshFreelancers } = useFreelancers();
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshFreelancers();
    setIsRefreshing(false);
  };

  const filtered = useMemo(() => {
    let results = freelancers;

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
  }, [search, activeFilter]);

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
            />
          }
          contentContainerStyle={styles.listContent}
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <FreelancerCard {...item} />}
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
            <View style={styles.empty}>
              <Text style={styles.emptyText}>
                No experts found for "{search || activeFilter}"
              </Text>
              <Text style={styles.emptyHint}>
                Try a different search term or filter
              </Text>
            </View>
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
});

