import type { Href } from "expo-router";
import { router, useLocalSearchParams } from "expo-router";
import { useMemo } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { PortfolioCard } from "../../src/components/PortfolioCard/PortfolioCard";
import { useAuth } from "../../src/context/AuthContext";
import { useFreelancers } from "../../src/context/FreelancersContext";
import { useTheme } from "../../src/context/ThemeContext";
import { ThemeColors } from "../../src/design-system/colors";
import { radius } from "../../src/design-system/radius";
import { minTapTarget, spacing } from "../../src/design-system/spacing";
import { typography } from "../../src/design-system/typography";

export default function FreelancerProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { getById } = useFreelancers();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const freelancer = getById(id);

  if (!freelancer) {
    return (
      <View style={styles.container}>
        <Text style={[typography.body, { color: colors.textPrimary }]}>
          Freelancer not found
        </Text>
      </View>
    );
  }

  const goConsult = () => {
    if (!user || user.role !== "client") {
      router.push({
        pathname: "/(auth)/login",
        params: {
          intent: "client",
          returnTo: `/booking/${freelancer.id}`,
        },
      } as Href);
      return;
    }
    router.push({
      pathname: "/booking/[id]",
      params: { id: freelancer.id },
    });
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.hero}>
        <Image source={{ uri: freelancer.avatar }} style={styles.avatar} />

        <Text style={styles.name}>{freelancer.name}</Text>

        <Text style={styles.title}>
          {freelancer.title}
        </Text>

        <Text style={styles.tagline}>{freelancer.tagline}</Text>
      </View>

      {/* Experience */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Experience</Text>

        {freelancer.experience?.map((job) => (
          <View key={job.id} style={styles.timelineItem}>
            <View style={styles.timelineLeft}>
              <View style={styles.timelineDot} />
              <View style={styles.timelineLine} />
            </View>

            <View style={styles.timelineContent}>
              <Text style={styles.timelineYear}>{job.year}</Text>

              <Text style={styles.timelineRole}>{job.role}</Text>

              <Text style={styles.timelineCompany}>{job.company}</Text>

              <Text style={styles.timelineDesc}>{job.description}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Portfolio */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notable Work</Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.portfolioRow}
        >
          {freelancer.portfolio.map((item) => (
            <PortfolioCard key={item.id} item={item} />
          ))}
        </ScrollView>
      </View>

      {/* Consult CTA */}
      <View style={styles.cta}>
        <Pressable style={styles.hireButton} onPress={goConsult}>
          <Text style={styles.hireButtonText}>Consult Talent</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  hero: {
    alignItems: "center",
    padding: spacing.xl,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },

  avatar: {
    width: 100,
    height: 100,
    borderRadius: radius.full,
    marginBottom: spacing.lg,
  },

  name: {
    ...typography.h1,
    color: colors.textPrimary,
  },

  title: {
    ...typography.label,
    color: colors.textSecondary,
    marginTop: spacing.xxs,
  },

  tagline: {
    ...typography.body,
    textAlign: "center",
    marginTop: spacing.md,
    color: colors.textSecondary,
  },

  section: {
    paddingHorizontal: spacing.md,
    marginTop: spacing.xl,
  },

  sectionTitle: {
    ...typography.h2,
    marginBottom: spacing.md,
    color: colors.textPrimary,
  },

  cta: {
    padding: spacing.xl,
    paddingBottom: spacing.xxl,
  },

  timelineItem: {
    flexDirection: "row",
    marginBottom: spacing.lg,
  },

  timelineLeft: {
    width: 24,
    alignItems: "center",
  },

  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
  },

  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: colors.divider,
    marginTop: spacing.xxs,
  },

  timelineContent: {
    flex: 1,
    paddingLeft: spacing.md,
  },

  timelineYear: {
    ...typography.labelSmall,
    color: colors.textMuted,
  },

  timelineRole: {
    ...typography.bodyMedium,
    marginTop: 2,
    color: colors.textPrimary,
  },

  timelineCompany: {
    ...typography.label,
    color: colors.textSecondary,
  },

  timelineDesc: {
    ...typography.body,
    marginTop: spacing.xxs,
    color: colors.textSecondary,
  },
  
  portfolioRow: {
    paddingVertical: spacing.xxs,
    paddingRight: spacing.md,
  },

  hireButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: radius.sm,
    alignItems: "center",
    minHeight: minTapTarget, // Accessibility: 44pt minimum
  },

  hireButtonText: {
    ...typography.button,
    color: "#FFFFFF",
  },
});

