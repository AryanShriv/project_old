import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

import { useAuth } from "@/src/context/AuthContext";
import { useTheme } from "@/src/context/ThemeContext";
import { ThemeColors } from "@/src/design-system/colors";
import { radius } from "@/src/design-system/radius";
import { minTapTarget, spacing } from "@/src/design-system/spacing";
import { typography } from "@/src/design-system/typography";
import type { AdminExpert } from "@/src/types/auth";

/**
 * Admin Experts tab: every approved expert, including suspended ones.
 * Suspend or reactivate an account, and mark Founding Experts (PRD 5.4).
 */
export default function AdminExpertsScreen() {
  const { adminExperts, setExpertAccountStatus, setFounderBadge, refreshAdminData } = useAuth();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const run = async (expert: AdminExpert, action: () => Promise<void>, done: string) => {
    setBusyId(expert.id);
    try {
      await action();
      Toast.show({ type: "success", text1: done, text2: expert.name });
    } catch (error) {
      Toast.show({ type: "error", text1: "Not saved", text2: (error as Error).message });
    } finally {
      setBusyId(null);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshAdminData();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.title}>Experts</Text>
        <Text style={styles.subtitle}>
          Approved experts, including suspended ones. Founding Experts show a permanent badge on their profile.
        </Text>
      </View>
      <FlatList
        data={adminExperts}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} colors={[colors.primary]} />
        }
        ListEmptyComponent={<Text style={styles.empty}>No approved experts yet.</Text>}
        renderItem={({ item }) => {
          const suspended = item.status === "suspended";
          const busy = busyId === item.id;
          return (
            <View style={styles.card}>
              <View style={styles.row}>
                <View style={styles.grow}>
                  <Text style={styles.name}>{item.name}</Text>
                  <Text style={styles.meta}>
                    {[item.headline, item.domain, item.city].filter(Boolean).join(" · ") || "No details yet"}
                  </Text>
                </View>
                <View style={[styles.badge, suspended ? styles.badgeSuspended : styles.badgeActive]}>
                  <Text style={[styles.badgeText, suspended ? styles.badgeTextSuspended : styles.badgeTextActive]}>
                    {suspended ? "Suspended" : "Active"}
                  </Text>
                </View>
              </View>

              {item.founderBadge ? (
                <View style={styles.founderRow}>
                  <Ionicons name="ribbon" size={16} color={colors.primary} />
                  <Text style={styles.founderText}>Founding Expert</Text>
                </View>
              ) : null}

              <View style={styles.actions}>
                <Pressable
                  style={[styles.action, styles.actionSecondary, busy && styles.actionBusy]}
                  disabled={busy}
                  accessibilityRole="button"
                  onPress={() =>
                    run(
                      item,
                      () => setFounderBadge(item.id, !item.founderBadge),
                      item.founderBadge ? "Founding Expert badge removed" : "Marked as Founding Expert",
                    )
                  }
                >
                  <Text style={styles.actionSecondaryText}>
                    {item.founderBadge ? "Remove Founding badge" : "Mark as Founding Expert"}
                  </Text>
                </Pressable>
                <Pressable
                  style={[styles.action, suspended ? styles.reactivate : styles.suspend, busy && styles.actionBusy]}
                  disabled={busy}
                  accessibilityRole="button"
                  onPress={() =>
                    run(
                      item,
                      () => setExpertAccountStatus(item.id, suspended ? "active" : "suspended"),
                      suspended ? "Account reactivated" : "Account suspended",
                    )
                  }
                >
                  <Text style={suspended ? styles.reactivateText : styles.suspendText}>
                    {suspended ? "Reactivate account" : "Suspend account"}
                  </Text>
                </Pressable>
              </View>
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    header: {
      paddingHorizontal: spacing.md,
      paddingTop: spacing.md,
      paddingBottom: spacing.xs,
    },
    title: { ...typography.h1, color: colors.textPrimary },
    subtitle: { ...typography.body, marginTop: spacing.xxs, color: colors.textSecondary },
    list: { padding: spacing.md, paddingBottom: spacing.xl },
    empty: { ...typography.body, color: colors.textMuted, textAlign: "center", marginTop: spacing.xl },
    card: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      padding: spacing.md,
      marginBottom: spacing.sm,
    },
    row: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
    grow: { flex: 1, minWidth: 0 },
    name: { ...typography.bodyMedium, color: colors.textPrimary },
    meta: { ...typography.caption, marginTop: 2, color: colors.textSecondary },
    badge: { borderRadius: radius.full, paddingHorizontal: spacing.sm, paddingVertical: spacing.xxs },
    badgeActive: { backgroundColor: colors.successMuted },
    badgeSuspended: { backgroundColor: colors.errorMuted },
    badgeText: { ...typography.labelSmall },
    badgeTextActive: { color: colors.success },
    badgeTextSuspended: { color: colors.error },
    founderRow: { flexDirection: "row", alignItems: "center", gap: spacing.xxs, marginTop: spacing.sm },
    founderText: { ...typography.bodyMedium, color: colors.primary },
    actions: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs, marginTop: spacing.sm },
    action: {
      flexGrow: 1,
      minHeight: minTapTarget,
      borderRadius: radius.sm,
      paddingHorizontal: spacing.md,
      alignItems: "center",
      justifyContent: "center",
    },
    actionBusy: { opacity: 0.5 },
    actionSecondary: { borderWidth: 1, borderColor: colors.primary, backgroundColor: colors.surface },
    actionSecondaryText: { ...typography.button, color: colors.primary },
    suspend: { backgroundColor: colors.errorMuted },
    suspendText: { ...typography.button, color: colors.error },
    reactivate: { backgroundColor: colors.successMuted },
    reactivateText: { ...typography.button, color: colors.success },
  });
