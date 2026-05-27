import type { Href } from "expo-router";
import { router } from "expo-router";
import { useMemo } from "react";
import {
    FlatList,
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { EmptyState } from "@/src/components/EmptyState/EmptyState";
import { useAuth } from "@/src/context/AuthContext";
import { useFreelancers } from "@/src/context/FreelancersContext";
import { useRequests } from "@/src/context/RequestsContext";
import { useTheme } from "@/src/context/ThemeContext";
import { ThemeColors } from "@/src/design-system/colors";
import { radius } from "@/src/design-system/radius";
import { shadows } from "@/src/design-system/shadows";
import { minTapTarget, spacing } from "@/src/design-system/spacing";
import { typography } from "@/src/design-system/typography";
import type { Request } from "@/src/types/requests";

function statusStyle(status: Request["status"], colors: ThemeColors) {
  switch (status) {
    case "accepted":
      return { bg: colors.successMuted, fg: colors.success };
    case "rejected":
      return { bg: colors.errorMuted, fg: colors.error };
    default:
      return { bg: colors.primaryMuted, fg: colors.primary };
  }
}

export default function ClientRequestsScreen() {
  const { user } = useAuth();
  const { freelancers } = useFreelancers();
  const { requests } = useRequests();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const getFreelancer = (id: string) => freelancers.find((f) => f.id === id);

  if (!user || user.role !== "client") {
    return (
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <View style={styles.locked}>
          <EmptyState
            icon="lock-closed-outline"
            title="Sign in to track requests"
            subtitle="Log in as a client to see consultation requests you have sent."
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

  if (requests.length === 0) {
    return (
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <EmptyState
          icon="paper-plane-outline"
          title="No requests yet"
          subtitle="When you send a consultation request from a profile, it will show up here."
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <Text style={styles.title}>Requests</Text>
        <Text style={styles.subtitle}>Track your consultation outreach</Text>
      </View>
      <FlatList
        contentContainerStyle={styles.list}
        data={requests}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const freelancer = getFreelancer(item.freelancerId);
          const badge = statusStyle(item.status, colors);

          return (
            <View style={styles.card}>
              <View style={styles.cardTop}>
                <Text style={styles.freelancerName}>
                  {freelancer?.name ?? "Unknown expert"}
                </Text>
                <View style={[styles.badge, { backgroundColor: badge.bg }]}>
                  <Text style={[styles.badgeText, { color: badge.fg }]}>
                    {item.status}
                  </Text>
                </View>
              </View>
              <Text style={styles.projectTitle}>{item.projectTitle}</Text>
              {freelancer?.title ? (
                <Text style={styles.meta}>{freelancer.title}</Text>
              ) : null}
            </View>
          );
        }}
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
  freelancerName: {
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

