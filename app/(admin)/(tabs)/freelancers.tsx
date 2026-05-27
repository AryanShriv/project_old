import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "@/src/context/AuthContext";
import { useFreelancers } from "@/src/context/FreelancersContext";
import { colors } from "@/src/design-system/colors";
import { spacing } from "@/src/design-system/spacing";

export default function AdminFreelancersScreen() {
  const { freelancerStatus, setFreelancerAccountStatus } = useAuth();
  const { freelancers } = useFreelancers();

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.title}>Freelancer accounts</Text>
        <Text style={styles.subtitle}>Suspend or reactivate visibility</Text>
      </View>
      <FlatList
        data={freelancers}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const status = freelancerStatus[item.id] ?? "active";
          const suspended = status === "suspended";
          return (
            <View style={styles.card}>
              <View style={styles.row}>
                <View style={styles.grow}>
                  <Text style={styles.name}>{item.name}</Text>
                  <Text style={styles.meta}>{item.title}</Text>
                </View>
                <View
                  style={[
                    styles.badge,
                    suspended ? styles.badgeSuspended : styles.badgeActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.badgeText,
                      suspended
                        ? styles.badgeTextSuspended
                        : styles.badgeTextActive,
                    ]}
                  >
                    {status}
                  </Text>
                </View>
              </View>

              <Pressable
                style={[styles.action, suspended ? styles.reactivate : styles.suspend]}
                onPress={() =>
                  setFreelancerAccountStatus(
                    item.id,
                    suspended ? "active" : "suspended",
                  )
                }
              >
                <Text style={styles.actionText}>
                  {suspended ? "Reactivate account" : "Suspend account"}
                </Text>
              </Pressable>
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
  row: { flexDirection: "row", alignItems: "center" },
  grow: { flex: 1, minWidth: 0 },
  name: { fontSize: 17, fontWeight: "600", color: colors.textPrimary },
  meta: { marginTop: 2, fontSize: 13, color: colors.textMuted },
  badge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  badgeActive: { backgroundColor: "rgba(34, 197, 94, 0.14)" },
  badgeSuspended: { backgroundColor: "rgba(239, 68, 68, 0.12)" },
  badgeText: { textTransform: "capitalize", fontWeight: "700", fontSize: 12 },
  badgeTextActive: { color: "#166534" },
  badgeTextSuspended: { color: "#991b1b" },
  action: {
    marginTop: 12,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
  },
  suspend: { backgroundColor: "#fee2e2" },
  reactivate: { backgroundColor: "rgba(34, 197, 94, 0.14)" },
  actionText: { fontWeight: "600", color: colors.textPrimary },
});
