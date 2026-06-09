import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "@/src/context/AuthContext";
import { useFreelancers } from "@/src/context/FreelancersContext";
import { useRequests } from "@/src/context/RequestsContext";
import { useTheme } from "@/src/context/ThemeContext";
import { radius } from "@/src/design-system/radius";
import { minTapTarget, spacing } from "@/src/design-system/spacing";
import { typography } from "@/src/design-system/typography";

export default function FreelancerDashboardScreen() {
  const { user } = useAuth();
  const { freelancers } = useFreelancers();
  const freelancerPersonaId = user?.managedFreelancerId ?? "";
  const { requests } = useRequests();
  const { colors } = useTheme();

  const me = freelancers.find((f) => f.id === freelancerPersonaId);
  const mine = requests.filter((r) => r.freelancerId === freelancerPersonaId);
  const pending = mine.filter((r) => r.status === "pending").length;
  const accepted = mine.filter((r) => r.status === "accepted").length;
  const rejected = mine.filter((r) => r.status === "rejected").length;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.kicker, { color: colors.textMuted }]}>Freelancer</Text>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Hello{me ? `, ${me.name.split(" ")[0]}` : ""}</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {me?.title ?? "Your workspace"} · manage incoming client leads
        </Text>

        <View style={[styles.statsRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.stat}>
            <Text style={[styles.statValue, { color: colors.textPrimary }]}>{pending}</Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Pending</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.divider }]} />
          <View style={styles.stat}>
            <Text style={[styles.statValue, { color: colors.textPrimary }]}>{accepted}</Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Won</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.divider }]} />
          <View style={styles.stat}>
            <Text style={[styles.statValue, { color: colors.textPrimary }]}>{rejected}</Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Declined</Text>
          </View>
        </View>

        <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>Quick actions</Text>
        <Pressable
          style={[styles.actionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => router.push("/(freelancer)/(tabs)/inbox")}
        >
          <View style={[styles.actionIcon, { backgroundColor: colors.primaryMuted }]}>
            <Ionicons name="mail-unread" size={22} color={colors.primary} />
          </View>
          <View style={styles.actionText}>
            <Text style={[styles.actionTitle, { color: colors.textPrimary }]}>Review inbox</Text>
            <Text style={[styles.actionHint, { color: colors.textMuted }]}>
              Accept or decline new consultation leads
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        </Pressable>

        <Pressable
          style={[styles.actionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => router.push("/(freelancer)/(tabs)/schedule")}
        >
          <View style={[styles.actionIcon, { backgroundColor: colors.primaryMuted }]}>
            <Ionicons name="time" size={22} color={colors.primary} />
          </View>
          <View style={styles.actionText}>
            <Text style={[styles.actionTitle, { color: colors.textPrimary }]}>Availability</Text>
            <Text style={[styles.actionHint, { color: colors.textMuted }]}>
              Set your weekly hours for intro calls
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        </Pressable>

        <View style={[styles.tip, { backgroundColor: colors.primaryMuted }]}>
          <Ionicons name="information-circle" size={20} color={colors.primary} />
          <Text style={[styles.tipText, { color: colors.textSecondary }]}>
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
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  kicker: {
    ...typography.overline,
  },
  title: {
    ...typography.displaySmall,
    marginTop: spacing.xxs,
  },
  subtitle: {
    ...typography.body,
    marginTop: spacing.xs,
    lineHeight: 24,
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
  actionCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.md,
    marginBottom: spacing.sm,
    minHeight: minTapTarget, // Accessibility: 44pt minimum
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
  tip: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
  },
  tipText: {
    ...typography.body,
    flex: 1,
    marginLeft: spacing.sm,
    lineHeight: 24,
  },
});
