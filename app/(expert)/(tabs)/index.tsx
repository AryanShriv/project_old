import { Ionicons } from "@expo/vector-icons";
import type { Href } from "expo-router";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

import { SESSION_TYPE_LABELS, TIMING_LABELS } from "@/src/constants/requests";
import { useAuth } from "@/src/context/AuthContext";
import { useExperts } from "@/src/context/ExpertsContext";
import { useRequests } from "@/src/context/RequestsContext";
import { useTheme } from "@/src/context/ThemeContext";
import { brand, ThemeColors } from "@/src/design-system/colors";
import { radius } from "@/src/design-system/radius";
import { minTapTarget, spacing } from "@/src/design-system/spacing";
import { typography } from "@/src/design-system/typography";
import type { Request } from "@/src/types/requests";

const greetingForHour = (hour: number) => {
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
};

export default function ExpertDashboardScreen() {
  const { user, refreshUser, resubmitApplication } = useAuth();
  const { experts } = useExperts();
  const expertPersonaId = user?.managedExpertId ?? "";
  const { requests, updateRequestStatus } = useRequests();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [respondingId, setRespondingId] = useState<string | null>(null);
  const [resubmitting, setResubmitting] = useState(false);

  // Pending experts are not in the public experts list yet, so fall back to the session profile
  const me = experts.find((f) => f.id === expertPersonaId);
  const mine = requests.filter((r) => r.expertId === expertPersonaId);
  const pendingRequests = mine.filter((r) => r.status === "pending");
  const completed = mine.filter((r) => r.status === "completed");
  const peopleHelped = new Set(completed.map((r) => r.userId).filter(Boolean)).size;

  const greeting = useMemo(() => greetingForHour(new Date().getHours()), []);
  const firstName = (me?.name || user?.name || "").split(" ")[0];

  const isPendingApproval = user?.accountStatus === "pending_review" && user?.approvalStatus !== "rejected";
  const isRejected = user?.accountStatus === "pending_review" && user?.approvalStatus === "rejected";
  // PRD 4.4: one resubmission after a rejection; a second rejection is final
  const canResubmit = isRejected && (user?.resubmissionCount ?? 0) < 1;

  const resubmit = async () => {
    setResubmitting(true);
    try {
      await resubmitApplication();
      Toast.show({ type: "success", text1: "Sent for review", text2: "Our team will take another look, usually within 48 hours." });
    } catch (error) {
      Toast.show({ type: "error", text1: "Not sent", text2: (error as Error).message || "Please try again." });
    } finally {
      setResubmitting(false);
    }
  };

  const profileComplete = Boolean(
    (me?.title && me.title !== "Expert") || user?.profile?.headline
  ) && Boolean(me?.skills?.length || user?.profile?.bio);

  const respond = async (item: Request, status: "accepted" | "rejected") => {
    setRespondingId(item.id);
    try {
      await updateRequestStatus(item.id, status);
      const name = item.userName?.split(" ")[0] || "They";
      Toast.show(
        status === "accepted"
          ? { type: "success", text1: "Request accepted", text2: `${name} can now message you in Messages.` }
          : { type: "success", text1: "Request declined", text2: `We'll let ${name} know.` }
      );
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "That didn't go through",
        text2: (error as Error).message || "Please try again.",
      });
    } finally {
      setRespondingId(null);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>
          {greeting}{firstName ? `, ${firstName}` : ""}
        </Text>

        {(isPendingApproval || isRejected) && (
          <View style={styles.banner}>
            <Ionicons
              name={isRejected ? "create-outline" : "hourglass-outline"}
              size={22}
              color={colors.onPrimaryMuted}
            />
            <View style={styles.bannerText}>
              <Text style={styles.bannerTitle}>
                {isRejected ? "Your profile needs a few changes" : "Your profile is with our team"}
              </Text>
              <Text style={styles.bannerBody}>
                {isRejected
                  ? user?.rejectionReason ||
                    "Our team reviewed your application and would like a few details updated before it goes live."
                  : "We personally review every expert, usually within 48 hours. In the meantime you can finish your profile and set your availability."}
              </Text>
              {isRejected && !canResubmit ? (
                <Text style={styles.bannerBody}>
                  This application was already resubmitted once, so it can&apos;t be reviewed again. If you think
                  something went wrong, please contact support.
                </Text>
              ) : (
                <Pressable
                  onPress={isRejected ? () => router.push("/(expert)/(tabs)/profile" as Href) : refreshUser}
                  hitSlop={8}
                  style={styles.bannerLink}
                >
                  <Text style={styles.bannerLinkText}>
                    {isRejected ? "Update my profile" : "Check my status"}
                  </Text>
                </Pressable>
              )}
              {canResubmit && (
                <>
                  <Text style={styles.bannerBody}>
                    When your profile is updated, send it back to us. You can resubmit once.
                  </Text>
                  <Pressable
                    style={[styles.btn, styles.btnPrimary, styles.bannerBtn]}
                    onPress={resubmit}
                    disabled={resubmitting}
                    accessibilityRole="button"
                  >
                    {resubmitting ? (
                      <ActivityIndicator color={brand.onPrimary} />
                    ) : (
                      <Text style={styles.btnPrimaryText}>Resubmit for review</Text>
                    )}
                  </Pressable>
                </>
              )}
            </View>
          </View>
        )}

        <View style={styles.statsRow}>
          <Stat styles={styles} value={pendingRequests.length} label="Pending requests" />
          <View style={styles.statDivider} />
          <Stat styles={styles} value={completed.length} label="Sessions completed" />
          <View style={styles.statDivider} />
          <Stat styles={styles} value={peopleHelped} label="People helped" />
        </View>

        <Text style={styles.sectionLabel}>Pending requests</Text>
        {pendingRequests.length > 0 ? (
          pendingRequests.map((item) => {
            const busy = respondingId === item.id;
            return (
              <View key={item.id} style={styles.card}>
                <Text style={styles.requesterName}>{item.userName ?? "Someone"}</Text>
                <Text style={styles.headline}>{item.headline}</Text>
                <Text style={styles.meta}>
                  {[
                    SESSION_TYPE_LABELS[item.sessionType],
                    item.timingPreference ? TIMING_LABELS[item.timingPreference] : null,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </Text>
                <View style={styles.actions}>
                  <Pressable
                    style={[styles.btn, styles.btnGhost]}
                    onPress={() => respond(item, "rejected")}
                    disabled={busy}
                    accessibilityRole="button"
                  >
                    <Text style={styles.btnGhostText}>Decline</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.btn, styles.btnPrimary]}
                    onPress={() => respond(item, "accepted")}
                    disabled={busy}
                    accessibilityRole="button"
                  >
                    {busy ? (
                      <ActivityIndicator color={brand.onPrimary} />
                    ) : (
                      <Text style={styles.btnPrimaryText}>Accept</Text>
                    )}
                  </Pressable>
                </View>
              </View>
            );
          })
        ) : (
          <View style={styles.emptyCard}>
            <Ionicons
              name={profileComplete ? "mail-open-outline" : "person-add-outline"}
              size={28}
              color={colors.primary}
            />
            <Text style={styles.emptyTitle}>
              {profileComplete ? "No new requests right now" : "Complete your profile to start receiving requests"}
            </Text>
            <Text style={styles.emptyBody}>
              {profileComplete
                ? "We'll let you know as soon as someone asks for your help."
                : "People choose experts whose story they can see. Add your career headline and what you can help with."}
            </Text>
            {!profileComplete && (
              <Pressable
                style={[styles.btn, styles.btnPrimary, styles.emptyBtn]}
                onPress={() => router.push("/(expert)/(tabs)/profile" as Href)}
              >
                <Text style={styles.btnPrimaryText}>Complete my profile</Text>
              </Pressable>
            )}
          </View>
        )}

        <Text style={styles.sectionLabel}>Quick actions</Text>
        <Pressable
          style={styles.actionCard}
          onPress={() => router.push("/(expert)/(tabs)/schedule" as Href)}
          accessibilityRole="button"
        >
          <View style={styles.actionIcon}>
            <Ionicons name="time" size={22} color={colors.onPrimaryMuted} />
          </View>
          <View style={styles.actionText}>
            <Text style={styles.actionTitle}>Set your availability for sessions</Text>
            <Text style={styles.actionHint}>Choose the hours people can request time with you</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

type Styles = ReturnType<typeof createStyles>;

const Stat = ({ styles, value, label }: { styles: Styles; value: number; label: string }) => (
  <View style={styles.stat}>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      padding: spacing.md,
      paddingBottom: spacing.xxl * 2,
    },
    title: {
      ...typography.displaySmall,
      color: colors.textPrimary,
      marginTop: spacing.xs,
    },
    banner: {
      flexDirection: "row",
      gap: spacing.sm,
      marginTop: spacing.lg,
      padding: spacing.md,
      borderRadius: radius.md,
      backgroundColor: colors.primaryMuted,
    },
    bannerText: {
      flex: 1,
    },
    bannerTitle: {
      ...typography.bodyMedium,
      color: colors.onPrimaryMuted,
    },
    bannerBody: {
      ...typography.body,
      color: colors.textSecondary,
      marginTop: spacing.xxs,
    },
    bannerLink: {
      marginTop: spacing.sm,
      minHeight: minTapTarget,
      justifyContent: "center",
      alignSelf: "flex-start",
    },
    bannerBtn: {
      marginTop: spacing.sm,
      alignSelf: "flex-start",
    },
    bannerLinkText: {
      ...typography.button,
      color: colors.onPrimaryMuted,
      textDecorationLine: "underline",
    },
    statsRow: {
      marginTop: spacing.lg,
      flexDirection: "row",
      alignItems: "center",
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.xs,
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
      color: colors.textMuted,
      marginTop: spacing.xxs,
      textAlign: "center",
    },
    statDivider: {
      width: StyleSheet.hairlineWidth,
      alignSelf: "stretch",
      backgroundColor: colors.divider,
    },
    sectionLabel: {
      ...typography.overline,
      fontSize: 13,
      color: colors.textMuted,
      marginTop: spacing.lg,
      marginBottom: spacing.sm,
    },
    card: {
      borderRadius: radius.md,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      marginBottom: spacing.sm,
    },
    requesterName: {
      ...typography.h3,
      color: colors.textPrimary,
    },
    headline: {
      ...typography.body,
      color: colors.textSecondary,
      marginTop: spacing.xxs,
    },
    meta: {
      ...typography.label,
      color: colors.textMuted,
      marginTop: spacing.xxs,
    },
    actions: {
      flexDirection: "row",
      justifyContent: "flex-end",
      gap: spacing.sm,
      marginTop: spacing.md,
    },
    btn: {
      minHeight: minTapTarget,
      paddingHorizontal: spacing.lg,
      borderRadius: radius.md,
      alignItems: "center",
      justifyContent: "center",
      minWidth: 112,
    },
    btnGhost: {
      borderWidth: 1,
      borderColor: colors.border,
    },
    btnGhostText: {
      ...typography.button,
      color: colors.textSecondary,
    },
    btnPrimary: {
      backgroundColor: colors.primary,
    },
    btnPrimaryText: {
      ...typography.button,
      color: colors.onPrimary,
    },
    emptyCard: {
      alignItems: "center",
      padding: spacing.lg,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    emptyTitle: {
      ...typography.h3,
      color: colors.textPrimary,
      textAlign: "center",
      marginTop: spacing.sm,
    },
    emptyBody: {
      ...typography.body,
      color: colors.textSecondary,
      textAlign: "center",
      marginTop: spacing.xxs,
    },
    emptyBtn: {
      marginTop: spacing.md,
      alignSelf: "stretch",
    },
    actionCard: {
      flexDirection: "row",
      alignItems: "center",
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      padding: spacing.md,
      minHeight: minTapTarget,
    },
    actionIcon: {
      width: 48,
      height: 48,
      borderRadius: radius.sm,
      alignItems: "center",
      justifyContent: "center",
      marginRight: spacing.md,
      backgroundColor: colors.primaryMuted,
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
      color: colors.textMuted,
      marginTop: spacing.xxs,
    },
  });
