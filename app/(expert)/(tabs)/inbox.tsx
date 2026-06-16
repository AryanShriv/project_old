import React, { useState } from "react";
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View, Modal, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { EmptyState } from "@/src/components/EmptyState/EmptyState";
import { useAuth } from "@/src/context/AuthContext";
import { useRequests } from "@/src/context/RequestsContext";
import { useTheme } from "@/src/context/ThemeContext";
import { spacing } from "@/src/design-system/spacing";
import type { Request } from "@/src/types/requests";

function statusStyle(status: Request["status"], colors: any) {
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
  const expertPersonaId = user?.managedExpertId ?? "";
  const { requests, updateRequestStatus, refreshRequests } = useRequests();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const { colors } = useTheme();

  const mine = requests.filter((r) => r.expertId === expertPersonaId);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshRequests();
    setIsRefreshing(false);
  };

  if (mine.length === 0) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={["top"]}>
        <EmptyState
          icon="mail-open-outline"
          title="Inbox is quiet"
          subtitle="When users send you a consultation request, it will appear here for you to accept or decline."
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={["top"]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Inbox</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>
          {mine.length} lead{mine.length === 1 ? "" : "s"} for you
        </Text>
      </View>
      <FlatList
        contentContainerStyle={styles.list}
        data={mine}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const badge = statusStyle(item.status, colors);
          const isPending = item.status === "pending";
          const isAccepted = item.status === "accepted";

          return (
            <Pressable 
              style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => setSelectedRequest(item)}
            >
              <View style={styles.cardTop}>
                <Text style={[styles.clientName, { color: colors.textPrimary }]}>
                  {item.userName ?? "User"}
                </Text>
                <View style={[styles.badge, { backgroundColor: badge.bg }]}>
                  <Text style={[styles.badgeText, { color: badge.fg }]}>
                    {item.status}
                  </Text>
                </View>
              </View>
              <Text style={[styles.projectTitle, { color: colors.textSecondary }]}>{item.projectTitle}</Text>
              {isPending ? (
                <View style={styles.actions}>
                  <Pressable
                    style={[styles.btn, styles.btnGhost, styles.btnFirst, { borderColor: colors.border, backgroundColor: colors.surface }]}
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
              ) : null}
              {isAccepted ? (
                <View style={styles.actions}>
                  <Pressable
                    style={[styles.btn, styles.btnPrimary, { backgroundColor: colors.primary, width: "100%" }]}
                    onPress={() => updateRequestStatus(item.id, "completed")}
                  >
                    <Text style={styles.btnPrimaryText}>Mark as Completed</Text>
                  </Pressable>
                </View>
              ) : null}
            </Pressable>
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

      <Modal
        visible={!!selectedRequest}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedRequest(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Request Details</Text>
              <Pressable onPress={() => setSelectedRequest(null)} style={styles.closeButton}>
                <Text style={{ color: colors.textSecondary, fontSize: 24, lineHeight: 28 }}>×</Text>
              </Pressable>
            </View>
            
            <ScrollView style={styles.modalScroll}>
              <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>From</Text>
              <Text style={[styles.modalValue, { color: colors.textPrimary }]}>{selectedRequest?.userName ?? "User"}</Text>

              <Text style={[styles.modalLabel, { color: colors.textSecondary, marginTop: 16 }]}>Project Title</Text>
              <Text style={[styles.modalValue, { color: colors.textPrimary }]}>{selectedRequest?.projectTitle}</Text>

              <Text style={[styles.modalLabel, { color: colors.textSecondary, marginTop: 16 }]}>Description / Message</Text>
              <Text style={[styles.modalValue, { color: colors.textPrimary, lineHeight: 22 }]}>
                {selectedRequest?.userMessage || selectedRequest?.description || "No further details provided."}
              </Text>

              <View style={styles.row}>
                <View style={styles.col}>
                  <Text style={[styles.modalLabel, { color: colors.textSecondary, marginTop: 16 }]}>Session Type</Text>
                  <Text style={[styles.modalValue, { color: colors.textPrimary, textTransform: 'capitalize' }]}>
                    {selectedRequest?.engagementType || "Remote"}
                  </Text>
                </View>
                <View style={styles.col}>
                  <Text style={[styles.modalLabel, { color: colors.textSecondary, marginTop: 16 }]}>Timing</Text>
                  <Text style={[styles.modalValue, { color: colors.textPrimary, textTransform: 'capitalize' }]}>
                    {selectedRequest?.timingPreference?.replace('_', ' ') || "Flexible"}
                  </Text>
                </View>
              </View>
            </ScrollView>

            {selectedRequest?.status === "pending" && (
              <View style={[styles.modalActions, { borderTopColor: colors.border }]}>
                <Pressable
                  style={[styles.btn, styles.btnGhost, { flex: 1, borderColor: colors.border }]}
                  onPress={() => {
                    updateRequestStatus(selectedRequest.id, "rejected");
                    setSelectedRequest(null);
                  }}
                >
                  <Text style={[styles.btnGhostText, { color: colors.textSecondary }]}>Decline</Text>
                </Pressable>
                <Pressable
                  style={[styles.btn, styles.btnPrimary, { flex: 1, backgroundColor: colors.primary }]}
                  onPress={() => {
                    updateRequestStatus(selectedRequest.id, "accepted");
                    setSelectedRequest(null);
                  }}
                >
                  <Text style={styles.btnPrimaryText}>Accept</Text>
                </Pressable>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  header: {
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    letterSpacing: -0.4,
  },
  subtitle: {
    marginTop: 4,
    fontSize: 15,
  },
  list: {
    padding: spacing.sm,
    paddingBottom: spacing.xl,
  },
  card: {
    borderRadius: 14,
    padding: spacing.sm,
    borderWidth: 1,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingBottom: spacing.xl,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  closeButton: {
    padding: 4,
  },
  modalScroll: {
    padding: spacing.lg,
  },
  modalLabel: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  modalValue: {
    fontSize: 16,
  },
  row: {
    flexDirection: 'row',
  },
  col: {
    flex: 1,
  },
  modalActions: {
    flexDirection: 'row',
    padding: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: spacing.md,
  },
});
