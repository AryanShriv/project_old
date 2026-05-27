import { Ionicons } from "@expo/vector-icons";
import { ScrollView, StyleSheet, Text, View, type ViewStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "@/src/context/AuthContext";
import { colors } from "@/src/design-system/colors";
import { radius } from "@/src/design-system/radius";
import { spacing } from "@/src/design-system/spacing";

export default function AdminOverviewScreen() {
  const { applications, freelancerStatus, auditLogs } = useAuth();

  const pending = applications.filter((a) => a.status === "pending").length;
  const approved = applications.filter((a) => a.status === "approved").length;
  const rejected = applications.filter((a) => a.status === "rejected").length;
  const active = Object.values(freelancerStatus).filter(
    (s) => s === "active",
  ).length;
  const suspended = Object.values(freelancerStatus).filter(
    (s) => s === "suspended",
  ).length;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.kicker}>Super Admin</Text>
        <Text style={styles.title}>Platform control center</Text>

        <View style={styles.row}>
          <MetricCard
            label="Pending"
            value={pending}
            icon="time-outline"
            style={styles.metricSpacing}
          />
          <MetricCard label="Approved" value={approved} icon="checkmark" />
        </View>
        <View style={styles.row}>
          <MetricCard
            label="Rejected"
            value={rejected}
            icon="close"
            style={styles.metricSpacing}
          />
          <MetricCard label="Suspended" value={suspended} icon="ban" />
        </View>
        <View style={styles.row}>
          <MetricCard label="Audit events" value={auditLogs.length} icon="receipt" />
        </View>

        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={20} color={colors.primary} />
          <Text style={styles.infoText}>
            Active freelancer accounts: {active}. Review incoming applications
            in the Applications tab and suspend accounts when needed.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function MetricCard({
  label,
  value,
  icon,
  style,
}: {
  label: string;
  value: number;
  icon: keyof typeof Ionicons.glyphMap;
  style?: ViewStyle;
}) {
  return (
    <View style={[styles.metric, style]}>
      <View style={styles.metricIcon}>
        <Ionicons name={icon} size={18} color={colors.primary} />
      </View>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.sm, paddingBottom: spacing.xl },
  kicker: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  title: {
    marginTop: 4,
    marginBottom: spacing.md,
    fontSize: 28,
    fontWeight: "700",
    color: colors.textPrimary,
    letterSpacing: -0.4,
  },
  row: { flexDirection: "row", marginBottom: 12 },
  metric: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
  },
  metricSpacing: {
    marginRight: 12,
  },
  metricIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: colors.primaryMuted,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  metricValue: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  metricLabel: {
    marginTop: 2,
    fontSize: 13,
    color: colors.textMuted,
  },
  infoCard: {
    marginTop: spacing.sm,
    backgroundColor: colors.primaryMuted,
    borderRadius: radius.md,
    padding: spacing.sm,
    flexDirection: "row",
  },
  infoText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 20,
  },
});
