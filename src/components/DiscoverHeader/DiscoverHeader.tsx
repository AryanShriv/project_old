import { useTheme } from "@/src/context/ThemeContext";
import React, { useMemo } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { createStyles } from "./styles";



type Props = {
  search: string;
  onSearchChange: (text: string) => void;
  activeFilter: string;
  onFilterChange: (filter: string) => void;
  filters: string[];
  /** Second row (PRD 5.1): the skills within the chosen category. Hidden when empty. */
  subFilters?: string[];
  activeSubFilter?: string | null;
  onSubFilterChange?: (skill: string | null) => void;
};

const ChipRow = ({
  items,
  isActive,
  onPress,
  styles,
  label,
}: {
  items: { key: string; label: string }[];
  isActive: (key: string) => boolean;
  onPress: (key: string) => void;
  styles: ReturnType<typeof createStyles>;
  label: string;
}) => (
  <ScrollView
    horizontal
    showsHorizontalScrollIndicator={false}
    style={styles.filtersContainer}
    accessibilityLabel={label}
  >
    {items.map((item) => {
      const active = isActive(item.key);
      return (
        <Pressable
          key={item.key}
          style={[styles.filterChip, active && styles.filterChipActive]}
          onPress={() => onPress(item.key)}
          accessibilityRole="button"
          accessibilityState={{ selected: active }}
        >
          <Text style={[styles.filterText, active && styles.filterTextActive]}>{item.label}</Text>
        </Pressable>
      );
    })}
  </ScrollView>
);

const ALL_SKILLS = "__all__";

export const DiscoverHeader = ({
  search,
  onSearchChange,
  activeFilter,
  onFilterChange,
  filters,
  subFilters = [],
  activeSubFilter = null,
  onSubFilterChange,
}: Props) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Curated Experts</Text>
      <Text style={styles.subtitle}>{"Learn from someone who's already done it"}</Text>

      <TextInput
        placeholder="Search experts..."
        style={styles.searchInput}
        placeholderTextColor={colors.textMuted}
        value={search}
        onChangeText={onSearchChange}
        autoCapitalize="none"
        autoCorrect={false}
      />

      <ChipRow
        styles={styles}
        label="Categories"
        items={filters.map((filter) => ({ key: filter, label: filter }))}
        isActive={(key) => key === activeFilter}
        onPress={onFilterChange}
      />

      {subFilters.length > 0 && onSubFilterChange ? (
        <View style={styles.subRow}>
          <ChipRow
            styles={styles}
            label={`Skills in ${activeFilter}`}
            items={[
              { key: ALL_SKILLS, label: `All ${activeFilter}` },
              ...subFilters.map((skill) => ({ key: skill, label: skill })),
            ]}
            isActive={(key) => (key === ALL_SKILLS ? activeSubFilter === null : key === activeSubFilter)}
            onPress={(key) => onSubFilterChange(key === ALL_SKILLS ? null : key)}
          />
        </View>
      ) : null}
    </View>
  );
};

