import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { EmptyState } from "@/src/components/EmptyState/EmptyState";
import { useAuth } from "@/src/context/AuthContext";
import { colors } from "@/src/design-system/colors";
import { spacing } from "@/src/design-system/spacing";

export default function AdminApplicationsScreen() {
  const { applications, reviewApplication } = useAuth();
  const pending = applications.filter((a) => a.status === "pending");

  if (pending.length === 0) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <EmptyState
          icon="checkmark-done-outline"
          title="All caught up"
          subtitle="No freelancer applications are waiting for review."
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.title}>Freelancer applications</Text>
        <Text style={styles.subtitle}>{pending.length} pending review</Text>
      </View>
      <FlatList
        data={pending}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          return (
            <View style={styles.card}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.email}>{item.email}</Text>
              <Text style={styles.meta}>
                Profile id: {item.managedFreelancerId}
              </Text>
              <Text style={styles.meta}>
                Submitted: {new Date(item.createdAt).toLocaleDateString()}
              </Text>

              <View style={styles.actions}>
                <Pressable
                  style={[styles.btn, styles.reject]}
                  onPress={() => reviewApplication(item.id, "rejected")}
                >
                  <Text style={styles.rejectText}>Reject</Text>
                </Pressable>
                <Pressable
                  style={[styles.btn, styles.approve]}
                  onPress={() => reviewApplication(item.id, "approved")}
                >
                  <Text style={styles.approveText}>Approve</Text>
                </Pressable>
              </View>
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  subtitle: {
    marginTop: 4,
    color: colors.textMuted,
    fontSize: 14,
  },
  list: { padding: spacing.sm, paddingBottom: spacing.xl },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: spacing.sm,
    marginBottom: 12,
  },
  name: { fontSize: 18, fontWeight: "600", color: colors.textPrimary },
  email: { marginTop: 2, fontSize: 14, color: colors.textSecondary },
  meta: { marginTop: 4, fontSize: 13, color: colors.textMuted },
  actions: { flexDirection: "row", justifyContent: "flex-end", marginTop: 12 },
  btn: {
    minWidth: 96,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
    marginLeft: 10,
  },
  reject: { borderWidth: 1, borderColor: colors.border, backgroundColor: "#fff" },
  approve: { backgroundColor: colors.primary },
  rejectText: { color: colors.textSecondary, fontWeight: "600" },
  approveText: { color: "#fff", fontWeight: "600" },
});
