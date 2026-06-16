import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/src/context/AuthContext";
import { useExperts } from "@/src/context/ExpertsContext";
import { useRequests } from "@/src/context/RequestsContext";
import { useTheme } from "@/src/context/ThemeContext";
import { radius } from "@/src/design-system/radius";
import { minTapTarget, spacing } from "@/src/design-system/spacing";
import { typography } from "@/src/design-system/typography";
import type { Expert } from "@/src/types/expert";
import type { Request } from "@/src/types/requests";

function getTimeGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function getRequestBody(request: Request): string {
  const message = request.userMessage?.trim();
  if (message) return message;

  const description = request.description?.trim();
  const title = request.projectTitle?.trim();
  if (description) {
    return title && title !== description ? `${title}\n\n${description}` : description;
  }

  const summary = request.aiSummary?.trim();
  if (summary) return summary;

  return title || "Consultation request";
}

function isProfileComplete(expert: Expert | undefined): boolean {
  if (!expert) return false;
  const hasBio =
    Boolean(expert.tagline) &&
    expert.tagline !== "Experienced expert professional.";
  return Boolean(
    expert.title &&
      expert.title !== "Expert" &&
      (expert.skills?.length ?? 0) > 0 &&
      (expert.domain || hasBio)
  );
}

type PendingRequestCardProps = {
  request: Request;
  colors: ReturnType<typeof useTheme>["colors"];
  onAccept: (id: string) => void;
  onDecline: (id: string) => void;
};

function PendingRequestCard({
  request,
  colors,
  onAccept,
  onDecline,
}: PendingRequestCardProps) {
  const body = getRequestBody(request);

  return (
    <View
      style={[
        styles.requestCard,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      <Text style={[styles.requestName, { color: colors.textPrimary }]}>
        {request.userName ?? "Someone"}
      </Text>
      <Text style={[styles.requestNeed, { color: colors.textSecondary }]}>
        {body}
      </Text>
      <View style={styles.requestActions}>
        <Pressable
          style={[
            styles.requestBtn,
            styles.requestBtnGhost,
            { borderColor: colors.border },
          ]}
          onPress={() => onDecline(request.id)}
        >
          <Text style={[styles.requestBtnGhostText, { color: colors.textSecondary }]}>
            Decline
          </Text>
        </Pressable>
        <Pressable
          style={[styles.requestBtn, { backgroundColor: colors.primary }]}
          onPress={() => onAccept(request.id)}
        >
          <Text style={styles.requestBtnPrimaryText}>Accept</Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function ExpertDashboardScreen() {
  const { user } = useAuth();
  const { experts } = useExperts();
  const expertPersonaId = user?.managedExpertId ?? "";
  const { requests, updateRequestStatus, refreshRequests } = useRequests();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const tabBarOffset =
    (Platform.OS === "ios" ? 80 : 64) + Math.max(insets.bottom, 6);

  const me = experts.find((f) => f.id === expertPersonaId);
  const mine = requests.filter((r) => r.expertId === expertPersonaId);
  const pendingRequests = mine.filter((r) => r.status === "pending");
  const sessionsDone = mine.filter((r) => r.status === "completed").length;
  const peopleHelped = sessionsDone;

  const firstName = me?.name?.split(" ")[0] ?? user?.name?.split(" ")[0] ?? "there";
  const domainLabel = me?.domain || me?.title || "Expert";

  const profileComplete = isProfileComplete(me);

  const bottomMessage = useMemo(() => {
    if (!profileComplete) {
      return {
        icon: "sparkles" as const,
        text: "Complete your profile to start receiving requests.",
        action: () => router.push("/(expert)/(tabs)/profile"),
        actionLabel: "Complete profile",
      };
    }
    if (peopleHelped > 0) {
      return {
        icon: "heart" as const,
        text: `You've helped ${peopleHelped} ${peopleHelped === 1 ? "person" : "people"} through G(Old). Thank you for sharing your experience.`,
      };
    }
    if (pendingRequests.length > 0) {
      return {
        icon: "people" as const,
        text: `${pendingRequests.length} ${pendingRequests.length === 1 ? "person is" : "people are"} waiting to connect with you.`,
      };
    }
    return {
      icon: "checkmark-circle" as const,
      text: "Your profile is live. New requests will appear here when users reach out.",
    };
  }, [peopleHelped, pendingRequests.length, profileComplete]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await refreshRequests();
    setIsRefreshing(false);
  }, [refreshRequests]);

  const handleAccept = useCallback(
    (id: string) => {
      void updateRequestStatus(id, "accepted");
    },
    [updateRequestStatus]
  );

  const handleDecline = useCallback(
    (id: string) => {
      void updateRequestStatus(id, "rejected");
    },
    [updateRequestStatus]
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={["top"]}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: tabBarOffset + spacing.lg },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        <Text style={[styles.greeting, { color: colors.textPrimary }]}>
          {getTimeGreeting()}, {firstName}
        </Text>
        <Text style={[styles.domain, { color: colors.textSecondary }]}>
          {domainLabel}
        </Text>

        <View style={[styles.statsRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.stat}>
            <Text style={[styles.statValue, { color: colors.textPrimary }]}>
              {pendingRequests.length}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>
              Pending{"\n"}requests
            </Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.divider }]} />
          <View style={styles.stat}>
            <Text style={[styles.statValue, { color: colors.textPrimary }]}>
              {sessionsDone}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>
              Sessions{"\n"}done
            </Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.divider }]} />
          <View style={styles.stat}>
            <Text style={[styles.statValue, { color: colors.textPrimary }]}>
              {peopleHelped}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>
              People{"\n"}helped
            </Text>
          </View>
        </View>

        {pendingRequests.length > 0 ? (
          <>
            <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>
              Pending requests
            </Text>
            {pendingRequests.map((request) => (
              <PendingRequestCard
                key={request.id}
                request={request}
                colors={colors}
                onAccept={handleAccept}
                onDecline={handleDecline}
              />
            ))}
          </>
        ) : null}

        <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>
          Quick action
        </Text>
        <Pressable
          style={[styles.actionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => router.push("/(expert)/(tabs)/schedule")}
        >
          <View style={[styles.actionIcon, { backgroundColor: colors.primaryMuted }]}>
            <Ionicons name="time" size={22} color={colors.primary} />
          </View>
          <View style={styles.actionText}>
            <Text style={[styles.actionTitle, { color: colors.textPrimary }]}>
              Update availability
            </Text>
            <Text style={[styles.actionHint, { color: colors.textMuted }]}>
              Set your weekly hours for intro calls
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        </Pressable>

        <View style={[styles.tip, { backgroundColor: colors.primaryMuted }]}>
          <Ionicons name={bottomMessage.icon} size={20} color={colors.primary} />
          <View style={styles.tipContent}>
            <Text style={[styles.tipText, { color: colors.textSecondary }]}>
              {bottomMessage.text}
            </Text>
            {bottomMessage.action ? (
              <Pressable onPress={bottomMessage.action} style={styles.tipAction}>
                <Text style={[styles.tipActionText, { color: colors.primary }]}>
                  {bottomMessage.actionLabel}
                </Text>
              </Pressable>
            ) : null}
          </View>
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
  },
  greeting: {
    ...typography.displaySmall,
  },
  domain: {
    ...typography.bodyMedium,
    marginTop: spacing.xxs,
  },
  statsRow: {
    marginTop: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: radius.md,
    borderWidth: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
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
    textAlign: "center",
    lineHeight: 16,
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
  requestCard: {
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  requestName: {
    ...typography.bodyMedium,
  },
  requestNeed: {
    ...typography.body,
    marginTop: spacing.xxs,
    lineHeight: 22,
  },
  requestActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  requestBtn: {
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
    minWidth: 96,
    alignItems: "center",
  },
  requestBtnGhost: {
    borderWidth: 1,
  },
  requestBtnGhostText: {
    fontSize: 14,
    fontWeight: "600",
  },
  requestBtnPrimaryText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
  actionCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: radius.md,
    borderWidth: 1,
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
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: radius.md,
  },
  tipContent: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  tipText: {
    ...typography.body,
    lineHeight: 24,
  },
  tipAction: {
    marginTop: spacing.sm,
    alignSelf: "flex-start",
  },
  tipActionText: {
    ...typography.bodyMedium,
  },
});
