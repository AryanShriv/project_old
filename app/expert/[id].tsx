import { Ionicons } from "@expo/vector-icons";
import type { Href } from "expo-router";
import { router, Stack, useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { ReviewList } from "@/src/components/ReviewList/ReviewList";
import { Review, reviewsApi } from "@/src/services/reviewsApi";
import { useAuth } from "../../src/context/AuthContext";
import { useExperts } from "../../src/context/ExpertsContext";
import { useTheme } from "../../src/context/ThemeContext";
import { ThemeColors } from "../../src/design-system/colors";
import { radius } from "../../src/design-system/radius";
import { spacing } from "../../src/design-system/spacing";
import { typography } from "../../src/design-system/typography";

export default function ExpertProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { getById } = useExperts();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [reviews, setReviews] = useState<Review[]>([]);

  const expert = getById(id);

  useEffect(() => {
    if (id) {
      reviewsApi.getExpertReviews(id)
        .then(setReviews)
        .catch(console.error);
    }
  }, [id]);

  if (!expert) {
    return (
      <View style={styles.container}>
        <Text style={[typography.body, { color: colors.textPrimary }]}>
          Expert not found
        </Text>
      </View>
    );
  }

  const goConsult = () => {
    if (!user || user.role !== "user") {
      router.push({
        pathname: "/(auth)/login",
        params: {
          intent: "user",
          returnTo: `/booking/${expert.id}`,
        },
      } as Href);
      return;
    }
    router.push({
      pathname: "/booking/[id]",
      params: { id: expert.id },
    });
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Pressable style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
      </Pressable>
      <View style={styles.hero}>
        <Image source={{ uri: expert.avatar }} style={styles.avatar} />

        <Text style={styles.name}>{expert.name}</Text>

        <Text style={styles.title}>
          {expert.title}
        </Text>

        <View style={styles.trustSignals}>
          <View style={styles.trustSignal}>
            {(expert.reviewCount ?? 0) > 0 ? (
              <>
                <Ionicons name="thumbs-up" size={14} color={colors.success} />
                <Text style={styles.trustSignalText}>
                  {Math.round(((expert.recommendedCount ?? 0) / expert.reviewCount!) * 100)}% recommend ({expert.reviewCount})
                </Text>
              </>
            ) : (
              <Text style={styles.trustSignalText}>👍 New expert</Text>
            )}
          </View>
          <Text style={styles.trustDot}>·</Text>
          <View style={styles.trustSignal}>
            <Ionicons name="checkmark-circle" size={14} color={colors.primary} />
            <Text style={styles.trustSignalText}>Verified</Text>
          </View>
          <Text style={styles.trustDot}>·</Text>
          <View style={styles.trustSignal}>
            <Text style={styles.trustSignalText}>{expert.yearsExperience} yrs exp</Text>
          </View>
          <Text style={styles.trustDot}>·</Text>
          <View style={styles.trustSignal}>
            <Text style={styles.trustSignalText}>{expert.rate}</Text>
          </View>
        </View>

        <Text style={styles.tagline}>{expert.tagline}</Text>
      </View>

      {/* What I can help you with */}
      {expert.skills && expert.skills.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What I can help you with</Text>
          <View style={styles.skillsContainer}>
            {expert.skills.map((skill) => (
              <View key={skill} style={[styles.skillBadge, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.skillText, { color: colors.textPrimary }]}>{skill}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Experience */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Experience</Text>

        {expert.experience?.map((job) => (
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

      {/* Reviews Section */}
      <View style={[styles.section, { paddingBottom: 120 }]}>
        <Text style={styles.sectionTitle}>Reviews</Text>
        <ReviewList reviews={reviews} />
      </View>
    </ScrollView>

    {/* Sticky Consult CTA */}
    <View style={[styles.stickyCta, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
      <Pressable style={[styles.hireButton, { backgroundColor: '#BA7517' }]} onPress={goConsult}>
        <Text style={styles.hireButtonText}>Request a Session →</Text>
      </Pressable>
    </View>
  </>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  backButton: {
    position: "absolute",
    top: spacing.xl,
    left: spacing.lg,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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

  trustSignals: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 6,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },

  trustSignal: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  trustSignalText: {
    ...typography.labelSmall,
    color: colors.textSecondary,
    fontWeight: "500",
  },

  trustDot: {
    ...typography.labelSmall,
    color: colors.textMuted,
  },

  skillsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },

  skillBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    borderWidth: 1,
  },

  skillText: {
    ...typography.bodyMedium,
    fontSize: 14,
  },

  stickyCta: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.xl,
    paddingBottom: spacing.xxl,
    borderTopWidth: 1,
  },

  hireButton: {
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    alignItems: "center",
  },

  hireButtonText: {
    ...typography.button,
    color: "#FFFFFF",
  },
});

