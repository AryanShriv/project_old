import { FlatList, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { EmptyState } from "@/src/components/EmptyState/EmptyState";
import { useAuth } from "@/src/context/AuthContext";
import { colors } from "@/src/design-system/colors";
import { spacing } from "@/src/design-system/spacing";

export default function AdminAuditScreen() {
  const { auditLogs } = useAuth();

  if (auditLogs.length === 0) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <EmptyState
          icon="document-text-outline"
          title="No audit events yet"
          subtitle="Application and account moderation actions will appear here."
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.title}>Audit log</Text>
        <Text style={styles.subtitle}>Latest moderation actions</Text>
      </View>
      <FlatList
        data={auditLogs}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.action}>{formatAction(item.action)}</Text>
            <Text style={styles.meta}>Target: {item.target}</Text>
            <Text style={styles.meta}>By: {item.actor}</Text>
            <Text style={styles.meta}>
              At: {new Date(item.at).toLocaleString()}
            </Text>
            {item.details ? <Text style={styles.details}>{item.details}</Text> : null}
          </View>
        )}
      />
    </SafeAreaView>
  );
}

function formatAction(action: string) {
  switch (action) {
    case "application_approved":
      return "Application approved";
    case "application_rejected":
      return "Application rejected";
    case "freelancer_suspended":
      return "Freelancer suspended";
    case "freelancer_reactivated":
      return "Freelancer reactivated";
    default:
      return action;
  }
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
  },
  title: { fontSize: 26, fontWeight: "700", color: colors.textPrimary },
  subtitle: { marginTop: 4, fontSize: 14, color: colors.textMuted },
  list: { padding: spacing.sm, paddingBottom: spacing.xl },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: spacing.sm,
    marginBottom: 12,
  },
  action: { fontSize: 16, fontWeight: "700", color: colors.textPrimary },
  meta: { marginTop: 4, fontSize: 13, color: colors.textSecondary },
  details: { marginTop: 6, fontSize: 12, color: colors.textMuted },
});
