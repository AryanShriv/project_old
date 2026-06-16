import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "@/src/context/AuthContext";
import { useExperts } from "@/src/context/ExpertsContext";
import { useRequests } from "@/src/context/RequestsContext";
import { useTheme } from "@/src/context/ThemeContext";
import { radius } from "@/src/design-system/radius";
import { minTapTarget, spacing } from "@/src/design-system/spacing";
import { typography } from "@/src/design-system/typography";

export default function ExpertDashboardScreen() {
  const { user } = useAuth();
  const { experts } = useExperts();
  const expertPersonaId = user?.managedExpertId ?? "";
  const { requests, updateRequestStatus } = useRequests();
  const { colors } = useTheme();

  const me = experts.find((f) => f.id === expertPersonaId);
  const mine = requests.filter((r) => r.expertId === expertPersonaId);
  const pendingRequests = mine.filter((r) => r.status === "pending");
  const accepted = mine.filter((r) => r.status === "accepted").length;

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  }, []);

  const firstName = me?.name ? me.name.split(" ")[0] : "Expert";

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.kicker, { color: colors.textMuted }]}>{greeting}, {firstName}</Text>
        <Text style={[styles.title, { color: colors.textPrimary }]}>{me?.title ?? "Complete your profile"}</Text>

        <View style={[styles.statsRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.stat}>
            <Text style={[styles.statValue, { color: colors.textPrimary }]}>{pendingRequests.length}</Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Pending requests</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.divider }]} />
          <View style={styles.stat}>
            <Text style={[styles.statValue, { color: colors.textPrimary }]}>{accepted}</Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Sessions done</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.divider }]} />
          <View style={styles.stat}>
            <Text style={[styles.statValue, { color: colors.textPrimary }]}>{accepted}</Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>People helped</Text>
          </View>
        </View>

        {pendingRequests.length > 0 && (
          <>
            <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>Pending requests</Text>
            {pendingRequests.map((item) => (
              <View key={item.id} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={styles.cardTop}>
                  <Text style={[styles.clientName, { color: colors.textPrimary }]}>
                    {item.userName ?? "User"}
                  </Text>
                  <View style={[styles.badge, { backgroundColor: colors.primaryMuted }]}>
                    <Text style={[styles.badgeText, { color: colors.primary }]}>
                      {item.status}
                    </Text>
                  </View>
                </View>
                <Text style={[styles.projectTitle, { color: colors.textSecondary }]}>{item.projectTitle}</Text>
                <View style={styles.actions}>
                  <Pressable
                    style={[styles.btn, styles.btnGhost, styles.btnFirst, { borderColor: colors.border }]}
                    onPress={() => updateRequestStatus(item.id, "rejected")}
                  >
                    <Text style={[styles.btnGhostText, { color: colors.textSecondary }]}>Decline</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.btn, styles.btnPrimary, { backgroundColor: colors.primary }]}
                    onPress={() => updateRequestStatus(item.id, "accepted")}
                  >
                    <Text style={styles.btnPrimaryText}>Accept</Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </>
        )}

        <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>Quick actions</Text>

        <Pressable
          style={[styles.actionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => router.push("/(expert)/(tabs)/schedule")}
        >
          <View style={[styles.actionIcon, { backgroundColor: colors.primaryMuted }]}>
            <Ionicons name="time" size={22} color={colors.primary} />
          </View>
          <View style={styles.actionText}>
            <Text style={[styles.actionTitle, { color: colors.textPrimary }]}>Update Availability</Text>
            <Text style={[styles.actionHint, { color: colors.textMuted }]}>
              Set your weekly hours for intro calls
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        </Pressable>

        <View style={[styles.motivational, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.actionIcon, { backgroundColor: colors.primaryMuted }]}>
            <Ionicons name="trending-up" size={22} color={colors.primary} />
          </View>
          <Text style={[styles.motivationalText, { color: colors.textSecondary }]}>
            Your profile has been viewed 14 times this week
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  kicker: {
    ...typography.overline,
    textTransform: "none",
    fontSize: 14,
  },
  title: {
    ...typography.displaySmall,
    marginTop: spacing.xxs,
  },
  statsRow: {
    marginTop: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: radius.md,
    borderWidth: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  stat: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    ...typography.displaySmall,
  },
  statLabel: {
    ...typography.label,
    marginTop: spacing.xxs,
    textAlign: "center",
  },
  statDivider: {
    width: StyleSheet.hairlineWidth,
    alignSelf: "stretch",
  },
  sectionLabel: {
    ...typography.overline,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  card: {
    borderRadius: 14,
    padding: spacing.sm,
    borderWidth: 1,
    marginBottom: 12,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  clientName: {
    fontSize: 17,
    fontWeight: "600",
    flex: 1,
    marginRight: spacing.sm,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "capitalize",
  },
  projectTitle: {
    fontSize: 15,
    lineHeight: 22,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: spacing.sm,
  },
  btn: {
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
    borderRadius: 10,
    minWidth: 100,
    alignItems: "center",
    marginLeft: 10,
  },
  btnFirst: {
    marginLeft: 0,
  },
  btnGhost: {
    borderWidth: 1,
  },
  btnGhostText: {
    fontSize: 14,
    fontWeight: "600",
  },
  btnPrimary: {
  },
  btnPrimaryText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
  actionCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.md,
    marginBottom: spacing.sm,
    minHeight: minTapTarget,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  actionText: {
    flex: 1,
    minWidth: 0,
  },
  actionTitle: {
    ...typography.bodyMedium,
  },
  actionHint: {
    ...typography.body,
    marginTop: spacing.xxs,
    lineHeight: 22,
  },
  motivational: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  motivationalText: {
    ...typography.body,
    flex: 1,
    lineHeight: 24,
  },
});
