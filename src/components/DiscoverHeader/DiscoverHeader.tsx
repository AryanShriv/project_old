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
};

export const DiscoverHeader = ({
  search,
  onSearchChange,
  activeFilter,
  onFilterChange,
  filters,
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

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filtersContainer}
      >
        {filters.map((filter) => {
          const isActive = filter === activeFilter;
          return (
            <Pressable
              key={filter}
              style={[styles.filterChip, isActive && styles.filterChipActive]}
              onPress={() => onFilterChange(filter)}
            >
              <Text
                style={[
                  styles.filterText,
                  isActive && styles.filterTextActive,
                ]}
              >
                {filter}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
};

