import { Ionicons } from "@expo/vector-icons";
import type { Href } from "expo-router";
import { router, Stack, useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

import { Avatar } from "@/src/components/Avatar/Avatar";
import { DisclaimerCard } from "@/src/components/DisclaimerCard/DisclaimerCard";
import { isRegulatedTrade, isTrade, profileDisclaimers } from "@/src/constants/trust";
import { ReviewList } from "@/src/components/ReviewList/ReviewList";
import { useAuth } from "@/src/context/AuthContext";
import { useExperts } from "@/src/context/ExpertsContext";
import { useSaved } from "@/src/context/SavedContext";
import { useTheme } from "@/src/context/ThemeContext";
import { ThemeColors } from "@/src/design-system/colors";
import { radius } from "@/src/design-system/radius";
import { minTapTarget, spacing } from "@/src/design-system/spacing";
import { typography } from "@/src/design-system/typography";
import { Review, reviewsApi } from "@/src/services/reviewsApi";

const ENGAGEMENT_LABELS: Record<string, string> = { remote: "Remote", onsite: "On-site" };

const STYLE_LABELS = [
  { key: "structured", label: "Structured" },
  { key: "conversational", label: "Conversational" },
  { key: "hands_on", label: "Hands-on" },
] as const;

export default function ExpertProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { getById } = useExperts();
  const { toggleSave, isSaved } = useSaved();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [reviews, setReviews] = useState<Review[]>([]);
  const expert = getById(id);

  useEffect(() => {
    if (id) {
      reviewsApi.getExpertReviews(id).then(setReviews).catch(console.error);
    }
  }, [id]);

  if (!expert) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.body}>Expert not found</Text>
      </View>
    );
  }

  const isUser = user?.role === "user";
  const saved = isSaved(expert.id);
  const reviewCount = expert.reviewCount ?? 0;
  const recommendPercent = reviewCount > 0 ? expert.recommendPercentage : null;
  const engagementChips = expert.engagementTypes.map((type) => ENGAGEMENT_LABELS[type]);
  const styleCounts = STYLE_LABELS.filter(({ key }) => expert.styleBreakdown[key] > 0);
  const disclaimers = profileDisclaimers(expert);

  // PRD 4.4: a licence is only claimed once an admin has checked it. Unregulated trades get
  // an "experience verified" note instead of a licence claim.
  const verifiedLicence = expert.verified && isRegulatedTrade(expert)
    ? expert.certifications?.find((c) => c.verified)
    : undefined;
  const experienceVerifiedTrade = expert.verified && isTrade(expert) && !isRegulatedTrade(expert);

  // Signed-out visitors come back to this profile after login (PRD 5.3)
  const goToLogin = () =>
    router.push({
      pathname: "/(auth)/login",
      params: { intent: "user", returnTo: `/expert/${expert.id}` },
    } as Href);

  const requestSession = () => {
    if (!isUser) return goToLogin();
    router.push({ pathname: "/booking/[id]", params: { id: expert.id } });
  };

  const onSave = async () => {
    if (!isUser) return goToLogin();
    try {
      await toggleSave(expert.id);
      Toast.show({
        type: "success",
        text1: saved ? "Removed from Saved" : "Saved",
        text2: saved ? undefined : "Find them any time in your Saved tab.",
      });
    } catch (error) {
      Toast.show({ type: "error", text1: "Couldn't update Saved", text2: (error as Error).message });
    }
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 140 + insets.bottom }}
        showsVerticalScrollIndicator={false}
      >
        <Pressable
          style={[styles.backButton, { top: insets.top + spacing.xs }]}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </Pressable>

        {/* 1. Hero */}
        <View style={[styles.hero, { paddingTop: insets.top + spacing.xxl }]}>
          <Avatar uri={expert.avatar} name={expert.name} size={112} verified={expert.verified} />
          <Text style={styles.name}>{expert.name}</Text>
          <Text style={styles.headline}>{expert.title}</Text>

          {/* 2. Trust bar */}
          <View style={styles.trustBar}>
            <TrustChip
              styles={styles}
              icon="thumbs-up-outline"
              iconColor={colors.success}
              label={recommendPercent === null ? "New expert" : `${recommendPercent}% recommend (${reviewCount})`}
            />
            {expert.verified && (
              <TrustChip styles={styles} icon="shield-checkmark" iconColor={colors.primary} label="Verified" />
            )}
            {Number(expert.yearsExperience) > 0 && (
              <TrustChip styles={styles} icon="briefcase-outline" label={`${expert.yearsExperience} yrs experience`} />
            )}
            {expert.sessionPrice ? (
              <TrustChip styles={styles} icon="pricetag-outline" label={`${expert.sessionPrice} / session`} />
            ) : null}
            {expert.city ? <TrustChip styles={styles} icon="location-outline" label={expert.city} /> : null}
            {engagementChips.map((chip) => (
              <TrustChip
                key={chip}
                styles={styles}
                icon={chip === "Remote" ? "videocam-outline" : "home-outline"}
                label={chip}
              />
            ))}
          </View>
        </View>

        {/* 3. What I can help you with */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What I can help you with</Text>
          {expert.tagline ? <Text style={styles.body}>{expert.tagline}</Text> : null}
          {expert.skills.length > 0 && (
            <View style={styles.tags}>
              {expert.skills.map((skill) => (
                <View key={skill} style={styles.tag}>
                  <Text style={styles.tagText}>{skill}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {(verifiedLicence || experienceVerifiedTrade) && (
          <View style={styles.section}>
            <View style={styles.credential}>
              <Ionicons name="ribbon-outline" size={22} color={colors.primary} />
              <View style={styles.credentialText}>
                {verifiedLicence ? (
                  <>
                    <Text style={styles.credentialTitle}>Licence checked by G(Old)</Text>
                    <Text style={styles.body}>
                      {verifiedLicence.type} · {verifiedLicence.issuingBody}
                    </Text>
                  </>
                ) : (
                  <>
                    <Text style={styles.credentialTitle}>Experience verified by G(Old)</Text>
                    <Text style={styles.body}>
                      Our team reviewed this expert&apos;s work history. This trade does not require a licence in Ontario.
                    </Text>
                  </>
                )}
              </View>
            </View>
          </View>
        )}

        {disclaimers.length > 0 && (
          <View style={styles.section}>
            {disclaimers.map((disclaimer) => (
              <DisclaimerCard key={disclaimer.id} disclaimer={disclaimer} />
            ))}
          </View>
        )}

        {/* 4. Career highlights */}
        {expert.experience.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Career highlights</Text>
            {expert.experience.map((job, index) => (
              <View key={job.id} style={styles.timelineItem}>
                <View style={styles.timelineLeft}>
                  <View style={styles.timelineDot} />
                  {index < expert.experience.length - 1 && <View style={styles.timelineLine} />}
                </View>
                <View style={styles.timelineContent}>
                  {job.year ? <Text style={styles.timelineYear}>{job.year}</Text> : null}
                  <Text style={styles.timelineRole}>
                    {job.role}
                    {job.company ? <Text style={styles.timelineCompany}> · {job.company}</Text> : null}
                  </Text>
                  {job.description ? <Text style={styles.timelineDesc}>{job.description}</Text> : null}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* 5. Reviews */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Reviews</Text>
          {recommendPercent !== null && (
            <View style={styles.reviewSummary}>
              <Text style={styles.reviewSummaryHeadline}>
                {recommendPercent}% recommend · {reviewCount} {reviewCount === 1 ? "review" : "reviews"}
              </Text>
              {styleCounts.length > 0 && (
                <Text style={styles.reviewSummaryStyles}>
                  Style: {styleCounts.map(({ key, label }) => `${label} ${expert.styleBreakdown[key]}`).join(" · ")}
                </Text>
              )}
            </View>
          )}
          <ReviewList reviews={reviews} />
        </View>
      </ScrollView>

      {/* 6. Sticky action bar, always visible */}
      <View style={[styles.stickyBar, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
        <Pressable
          style={styles.saveButton}
          onPress={onSave}
          accessibilityRole="button"
          accessibilityLabel={saved ? "Remove from saved" : "Save expert"}
          accessibilityState={{ selected: saved }}
        >
          <Ionicons
            name={saved ? "bookmark" : "bookmark-outline"}
            size={22}
            color={saved ? colors.primary : colors.textSecondary}
          />
          <Text style={[styles.saveText, saved && { color: colors.primary }]}>{saved ? "Saved" : "Save"}</Text>
        </Pressable>
        <Pressable style={styles.requestButton} onPress={requestSession} accessibilityRole="button">
          <Text style={styles.requestButtonText}>Request a Session</Text>
        </Pressable>
      </View>
    </>
  );
}

type Styles = ReturnType<typeof createStyles>;

const TrustChip = ({
  styles,
  icon,
  label,
  iconColor,
}: {
  styles: Styles;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  iconColor?: string;
}) => (
  <View style={styles.trustChip}>
    <Ionicons name={icon} size={16} color={iconColor ?? styles.trustChipText.color} />
    <Text style={styles.trustChipText}>{label}</Text>
  </View>
);

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    centered: {
      alignItems: "center",
      justifyContent: "center",
    },
    backButton: {
      position: "absolute",
      left: spacing.md,
      zIndex: 10,
      width: minTapTarget,
      height: minTapTarget,
      borderRadius: minTapTarget / 2,
      backgroundColor: colors.surfaceElevated,
      borderWidth: 1,
      borderColor: colors.divider,
      alignItems: "center",
      justifyContent: "center",
    },
    hero: {
      alignItems: "center",
      paddingHorizontal: spacing.md,
      paddingBottom: spacing.lg,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.divider,
    },
    name: {
      ...typography.h1,
      color: colors.textPrimary,
      marginTop: spacing.md,
      textAlign: "center",
    },
    headline: {
      ...typography.body,
      color: colors.textSecondary,
      marginTop: spacing.xxs,
      textAlign: "center",
    },
    trustBar: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "center",
      gap: spacing.xs,
      marginTop: spacing.md,
    },
    trustChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xxs,
      paddingHorizontal: spacing.sm,
      paddingVertical: 6,
      borderRadius: radius.full,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.background,
    },
    trustChipText: {
      ...typography.label,
      color: colors.textSecondary,
    },
    section: {
      paddingHorizontal: spacing.md,
      marginTop: spacing.xl,
    },
    sectionTitle: {
      ...typography.h2,
      color: colors.textPrimary,
      marginBottom: spacing.sm,
    },
    body: {
      ...typography.body,
      color: colors.textSecondary,
    },
    tags: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.xs,
      marginTop: spacing.md,
    },
    tag: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      borderRadius: radius.full,
      backgroundColor: colors.primaryMuted,
    },
    tagText: {
      ...typography.bodyMedium,
      color: colors.onPrimaryMuted,
    },
    credential: {
      flexDirection: "row",
      gap: spacing.sm,
      padding: spacing.md,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    credentialText: {
      flex: 1,
    },
    credentialTitle: {
      ...typography.bodyMedium,
      color: colors.textPrimary,
    },
    reviewSummary: {
      marginBottom: spacing.md,
    },
    reviewSummaryHeadline: {
      ...typography.bodyMedium,
      color: colors.textPrimary,
    },
    reviewSummaryStyles: {
      ...typography.body,
      color: colors.textSecondary,
    },
    timelineItem: {
      flexDirection: "row",
    },
    timelineLeft: {
      width: 20,
      alignItems: "center",
    },
    timelineDot: {
      width: 10,
      height: 10,
      borderRadius: radius.full,
      backgroundColor: colors.primary,
      marginTop: 7,
    },
    timelineLine: {
      width: 2,
      flex: 1,
      backgroundColor: colors.divider,
      marginTop: spacing.xxs,
    },
    timelineContent: {
      flex: 1,
      paddingLeft: spacing.sm,
      paddingBottom: spacing.lg,
    },
    timelineYear: {
      ...typography.label,
      color: colors.textMuted,
    },
    timelineRole: {
      ...typography.bodyMedium,
      color: colors.textPrimary,
    },
    timelineCompany: {
      ...typography.body,
      color: colors.textSecondary,
    },
    timelineDesc: {
      ...typography.body,
      color: colors.textSecondary,
      marginTop: spacing.xxs,
    },
    stickyBar: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      flexDirection: "row",
      gap: spacing.sm,
      paddingHorizontal: spacing.md,
      paddingTop: spacing.sm,
      backgroundColor: colors.background,
      borderTopWidth: 1,
      borderTopColor: colors.divider,
    },
    saveButton: {
      minHeight: 52,
      paddingHorizontal: spacing.md,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.xxs,
    },
    saveText: {
      ...typography.button,
      color: colors.textSecondary,
    },
    requestButton: {
      flex: 1,
      minHeight: 52,
      borderRadius: radius.md,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.primary,
    },
    requestButtonText: {
      ...typography.button,
      color: colors.onPrimary,
    },
  });
