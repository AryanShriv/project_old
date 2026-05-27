import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "@/src/context/AuthContext";
import { useFreelancers } from "@/src/context/FreelancersContext";
import { useRequests } from "@/src/context/RequestsContext";
import { colors } from "@/src/design-system/colors";
import { radius } from "@/src/design-system/radius";
import { minTapTarget, spacing } from "@/src/design-system/spacing";
import { typography } from "@/src/design-system/typography";

export default function FreelancerDashboardScreen() {
  const { user } = useAuth();
  const { freelancers } = useFreelancers();
  const freelancerPersonaId = user?.managedFreelancerId ?? "";
  const { requests } = useRequests();

  const me = freelancers.find((f) => f.id === freelancerPersonaId);
  const mine = requests.filter((r) => r.freelancerId === freelancerPersonaId);
  const pending = mine.filter((r) => r.status === "pending").length;
  const accepted = mine.filter((r) => r.status === "accepted").length;
  const rejected = mine.filter((r) => r.status === "rejected").length;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.kicker}>Freelancer</Text>
        <Text style={styles.title}>Hello{me ? `, ${me.name.split(" ")[0]}` : ""}</Text>
        <Text style={styles.subtitle}>
          {me?.title ?? "Your workspace"} · manage incoming client leads
        </Text>

        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{pending}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statValue}>{accepted}</Text>
            <Text style={styles.statLabel}>Won</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statValue}>{rejected}</Text>
            <Text style={styles.statLabel}>Declined</Text>
          </View>
        </View>

        <Text style={styles.sectionLabel}>Quick actions</Text>
        <Pressable
          style={styles.actionCard}
          onPress={() => router.push("/(freelancer)/(tabs)/inbox")}
        >
          <View style={styles.actionIcon}>
            <Ionicons name="mail-unread" size={22} color={colors.primary} />
          </View>
          <View style={styles.actionText}>
            <Text style={styles.actionTitle}>Review inbox</Text>
            <Text style={styles.actionHint}>
              Accept or decline new consultation leads
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        </Pressable>

        <Pressable
          style={styles.actionCard}
          onPress={() => router.push("/(freelancer)/(tabs)/schedule")}
        >
          <View style={styles.actionIcon}>
            <Ionicons name="time" size={22} color={colors.primary} />
          </View>
          <View style={styles.actionText}>
            <Text style={styles.actionTitle}>Availability</Text>
            <Text style={styles.actionHint}>
              Set your weekly hours for intro calls
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        </Pressable>

        <View style={styles.tip}>
          <Ionicons name="information-circle" size={20} color={colors.primary} />
          <Text style={styles.tipText}>
            Applications are reviewed by admin. If your account is suspended,
            freelancer access is blocked until reactivated.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  kicker: {
    ...typography.overline,
    color: colors.textMuted,
  },
  title: {
    ...typography.displaySmall,
    marginTop: spacing.xxs,
    color: colors.textPrimary,
  },
  subtitle: {
    ...typography.body,
    marginTop: spacing.xs,
    color: colors.textSecondary,
    lineHeight: 24,
  },
  statsRow: {
    marginTop: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  stat: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    ...typography.displaySmall,
    color: colors.textPrimary,
  },
  statLabel: {
    ...typography.label,
    marginTop: spacing.xxs,
    color: colors.textMuted,
  },
  statDivider: {
    width: StyleSheet.hairlineWidth,
    alignSelf: "stretch",
    backgroundColor: colors.divider,
  },
  sectionLabel: {
    ...typography.overline,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
    color: colors.textMuted,
  },
  actionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
    minHeight: minTapTarget, // Accessibility: 44pt minimum
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.sm,
    backgroundColor: colors.primaryMuted,
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
    color: colors.textPrimary,
  },
  actionHint: {
    ...typography.body,
    marginTop: spacing.xxs,
    color: colors.textMuted,
    lineHeight: 22,
  },
  tip: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.primaryMuted,
    borderRadius: radius.md,
  },
  tipText: {
    ...typography.body,
    flex: 1,
    marginLeft: spacing.sm,
    color: colors.textSecondary,
    lineHeight: 24,
  },
});
