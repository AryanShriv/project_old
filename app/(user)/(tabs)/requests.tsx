import type { Href } from "expo-router";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import {
    FlatList,
    Pressable,
    RefreshControl,
    StyleSheet,
    Text,
    View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { EmptyState } from "@/src/components/EmptyState/EmptyState";
import { useAuth } from "@/src/context/AuthContext";
import { useExperts } from "@/src/context/ExpertsContext";
import { useRequests } from "@/src/context/RequestsContext";
import { useTheme } from "@/src/context/ThemeContext";
import { ThemeColors, brand } from "@/src/design-system/colors";
import { radius } from "@/src/design-system/radius";
import { shadows } from "@/src/design-system/shadows";
import { minTapTarget, spacing } from "@/src/design-system/spacing";
import { typography } from "@/src/design-system/typography";
import { SESSION_TYPE_LABELS, STATUS_LABELS, TIMING_LABELS, statusBadgeColors } from "@/src/constants/requests";
import type { Request } from "@/src/types/requests";
import { ReviewModal } from "@/src/components/ReviewModal/ReviewModal";

export default function UserRequestsScreen() {
  const { user } = useAuth();
  const { experts } = useExperts();
  const { requests, refreshRequests } = useRequests();
  const { colors } = useTheme();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedRequestForReview, setSelectedRequestForReview] = useState<Request | null>(null);
  const styles = useMemo(() => createStyles(colors), [colors]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshRequests();
    setIsRefreshing(false);
  };

  const getExpert = (id: string) => experts.find((f) => f.id === id);

  if (!user || user.role !== "user") {
    return (
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <View style={styles.locked}>
          <EmptyState
            icon="lock-closed-outline"
            title="Sign in to track requests"
            subtitle="Sign in to see the session requests you have sent."
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

  if (requests.length === 0) {
    return (
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <EmptyState
          icon="paper-plane-outline"
          title="No requests yet"
          subtitle="When you request a session from an expert's profile, it will show up here."
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <Text style={styles.title}>Requests</Text>
        <Text style={styles.subtitle}>Your session requests and their status</Text>
      </View>
      <FlatList
        contentContainerStyle={styles.list}
        data={requests}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const expert = getExpert(item.expertId);
          const badge = statusBadgeColors(item.status, colors);

          return (
            <View style={styles.card}>
              <View style={styles.cardTop}>
                <Text style={styles.expertName}>
                  {expert?.name ?? "Unknown expert"}
                </Text>
                <View style={[styles.badge, { backgroundColor: badge.bg }]}>
                  <Text style={[styles.badgeText, { color: badge.fg }]}>
                    {STATUS_LABELS[item.status]}
                  </Text>
                </View>
              </View>
              <Text style={styles.projectTitle} numberOfLines={2}>{item.headline}</Text>
              <Text style={[styles.meta, { marginBottom: 4 }]}>
                {[
                  SESSION_TYPE_LABELS[item.sessionType],
                  item.timingPreference ? TIMING_LABELS[item.timingPreference] : null,
                ].filter(Boolean).join(" • ")}
              </Text>
              {expert?.title ? (
                <Text style={styles.meta}>{expert.title}</Text>
              ) : null}
              {(item.status === "completed") && (
                <Pressable
                  style={[styles.btn, styles.btnPrimary, { marginTop: 12 }]}
                  onPress={() => setSelectedRequestForReview(item)}
                >
                  <Text style={styles.btnPrimaryText}>Write a Review</Text>
                </Pressable>
              )}
            </View>
          );
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      />

      {selectedRequestForReview && (
        <ReviewModal
          visible={!!selectedRequestForReview}
          expertId={selectedRequestForReview.expertId}
          requestId={selectedRequestForReview.id}
          onClose={() => setSelectedRequestForReview(null)}
          onSuccess={() => {
            refreshRequests();
          }}
        />
      )}
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
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
    marginBottom: spacing.md,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.xs,
  },
  expertName: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
    flex: 1,
    marginRight: spacing.sm,
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: radius.full,
  },
  btn: {
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
    borderRadius: 10,
    alignItems: "center",
  },
  btnPrimary: {
    backgroundColor: colors.primary,
  },
  btnPrimaryText: {
    fontSize: 14,
    fontWeight: "600",
    color: brand.onPrimary,
  },
  badgeText: {
    ...typography.labelSmall,
    textTransform: "capitalize",
  },
  projectTitle: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 24,
  },
  meta: {
    ...typography.body,
    marginTop: spacing.xxs,
    color: colors.textMuted,
  },
});

