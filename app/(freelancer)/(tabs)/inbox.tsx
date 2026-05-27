import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { EmptyState } from "@/src/components/EmptyState/EmptyState";
import { useAuth } from "@/src/context/AuthContext";
import { useRequests } from "@/src/context/RequestsContext";
import { colors } from "@/src/design-system/colors";
import { spacing } from "@/src/design-system/spacing";
import type { Request } from "@/src/types/requests";

function statusStyle(status: Request["status"]) {
  switch (status) {
    case "accepted":
      return { bg: "rgba(34, 197, 94, 0.12)", fg: "#15803d" };
    case "rejected":
      return { bg: "rgba(239, 68, 68, 0.1)", fg: "#b91c1c" };
    default:
      return { bg: colors.primaryMuted, fg: colors.primary };
  }
}

export default function FreelancerInboxScreen() {
  const { user } = useAuth();
  const freelancerPersonaId = user?.managedFreelancerId ?? "";
  const { requests, updateRequestStatus } = useRequests();

  const mine = requests.filter((r) => r.freelancerId === freelancerPersonaId);

  if (mine.length === 0) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <EmptyState
          icon="mail-open-outline"
          title="Inbox is quiet"
          subtitle="When clients send you a consultation request, it will appear here for you to accept or decline."
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.title}>Inbox</Text>
        <Text style={styles.subtitle}>
          {mine.length} lead{mine.length === 1 ? "" : "s"} for you
        </Text>
      </View>
      <FlatList
        contentContainerStyle={styles.list}
        data={mine}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const badge = statusStyle(item.status);
          const isPending = item.status === "pending";

          return (
            <View style={styles.card}>
              <View style={styles.cardTop}>
                <Text style={styles.clientName}>
                  {item.clientName ?? "Client"}
                </Text>
                <View style={[styles.badge, { backgroundColor: badge.bg }]}>
                  <Text style={[styles.badgeText, { color: badge.fg }]}>
                    {item.status}
                  </Text>
                </View>
              </View>
              <Text style={styles.projectTitle}>{item.projectTitle}</Text>
              {isPending ? (
                <View style={styles.actions}>
                  <Pressable
                    style={[styles.btn, styles.btnGhost, styles.btnFirst]}
                    onPress={() => updateRequestStatus(item.id, "rejected")}
                  >
                    <Text style={styles.btnGhostText}>Decline</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.btn, styles.btnPrimary]}
                    onPress={() => updateRequestStatus(item.id, "accepted")}
                  >
                    <Text style={styles.btnPrimaryText}>Accept</Text>
                  </Pressable>
                </View>
              ) : null}
            </View>
          );
        }}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.textPrimary,
    letterSpacing: -0.4,
  },
  subtitle: {
    marginTop: 4,
    fontSize: 15,
    color: colors.textMuted,
  },
  list: {
    padding: spacing.sm,
    paddingBottom: spacing.xl,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
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
    color: colors.textPrimary,
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
    color: colors.textSecondary,
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
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  btnGhostText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  btnPrimary: {
    backgroundColor: colors.primary,
  },
  btnPrimaryText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
});
