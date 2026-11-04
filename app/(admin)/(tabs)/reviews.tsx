import { useCallback, useEffect, useMemo, useState } from "react";
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

import { EmptyState } from "@/src/components/EmptyState/EmptyState";
import { useTheme } from "@/src/context/ThemeContext";
import { ThemeColors } from "@/src/design-system/colors";
import { radius } from "@/src/design-system/radius";
import { minTapTarget, spacing } from "@/src/design-system/spacing";
import { typography } from "@/src/design-system/typography";
import { apiRequest } from "@/src/services/apiClient";

type AdminReview = {
  _id: string;
  whatILearned: string;
  comment?: string;
  expertStyle: string;
  wouldRecommend: boolean;
  hidden?: boolean;
  hiddenNote?: string;
  createdAt: string;
  userId?: { email?: string; profile?: { fullName?: string } };
  expertId?: { fullName?: string };
};

const MIN_NOTE = 5;

/** PRD 4.1: admins can hide a review with a note. Hidden reviews leave the profile and the stats. */
export default function AdminReviewsScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [note, setNote] = useState("");

  const load = useCallback(
    () =>
      apiRequest<{ items: AdminReview[] }>("/admin/reviews", { auth: true })
        .then((data) => setReviews(data.items))
        .catch((error: Error) => Toast.show({ type: "error", text1: "Couldn't load reviews", text2: error.message })),
    []
  );

  useEffect(() => {
    load();
  }, [load]);

  const setVisibility = async (review: AdminReview, hidden: boolean) => {
    try {
      await apiRequest(`/admin/reviews/${review._id}/visibility`, {
        method: "PATCH",
        auth: true,
        body: { hidden, note: note.trim() },
      });
      Toast.show({ type: "success", text1: hidden ? "Review hidden" : "Review visible again" });
      setEditingId(null);
      setNote("");
      await load();
    } catch (error) {
      Toast.show({ type: "error", text1: "Not saved", text2: (error as Error).message });
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.title}>Reviews</Text>
        <Text style={styles.subtitle}>Hide a review if it breaks the review guidelines. Add a note so the decision is recorded.</Text>
      </View>
      <FlatList
        data={reviews}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true);
              await load();
              setRefreshing(false);
            }}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        ListEmptyComponent={<EmptyState icon="chatbox-ellipses-outline" title="No reviews yet" subtitle="Reviews appear here once people complete sessions." />}
        renderItem={({ item }) => {
          const editing = editingId === item._id;
          return (
            <View style={[styles.card, item.hidden && styles.cardHidden]}>
              <Text style={styles.meta}>
                {item.userId?.profile?.fullName || item.userId?.email || "User"} → {item.expertId?.fullName || "Expert"} ·{" "}
                {new Date(item.createdAt).toLocaleDateString()}
              </Text>
              <Text style={styles.words}>“{item.whatILearned || item.comment}”</Text>
              <Text style={styles.meta}>
                {item.wouldRecommend ? "Recommends" : "Does not recommend"}
                {item.expertStyle ? ` · ${item.expertStyle.replace("_", "-")}` : ""}
              </Text>
              {item.hidden && <Text style={styles.hiddenNote}>Hidden: {item.hiddenNote || "no note"}</Text>}

              {editing ? (
                <>
                  <TextInput
                    style={styles.input}
                    value={note}
                    onChangeText={setNote}
                    placeholder={item.hidden ? "Why are you showing it again? (optional)" : "Why is this review being hidden?"}
                    placeholderTextColor={colors.textMuted}
                    multiline
                  />
                  <View style={styles.actions}>
                    <Pressable style={[styles.btn, styles.btnGhost]} onPress={() => setEditingId(null)}>
                      <Text style={styles.btnGhostText}>Cancel</Text>
                    </Pressable>
                    <Pressable
                      style={[styles.btn, styles.btnPrimary, !item.hidden && note.trim().length < MIN_NOTE && styles.btnDisabled]}
                      disabled={!item.hidden && note.trim().length < MIN_NOTE}
                      onPress={() => setVisibility(item, !item.hidden)}
                    >
                      <Text style={styles.btnPrimaryText}>{item.hidden ? "Show review" : "Hide review"}</Text>
                    </Pressable>
                  </View>
                </>
              ) : (
                <View style={styles.actions}>
                  <Pressable
                    style={[styles.btn, styles.btnGhost]}
                    onPress={() => {
                      setEditingId(item._id);
                      setNote("");
                    }}
                  >
                    <Text style={styles.btnGhostText}>{item.hidden ? "Show again" : "Hide"}</Text>
                  </Pressable>
                </View>
              )}
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
    header: { paddingHorizontal: spacing.md, paddingTop: spacing.md, paddingBottom: spacing.xs },
    title: { ...typography.h1, color: colors.textPrimary },
    subtitle: { ...typography.body, color: colors.textMuted, marginTop: spacing.xxs },
    list: { padding: spacing.md, paddingBottom: spacing.xxl },
    card: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      padding: spacing.md,
      marginBottom: spacing.md,
    },
    cardHidden: { opacity: 0.7, borderStyle: "dashed" },
    meta: { ...typography.label, color: colors.textMuted },
    words: { ...typography.body, color: colors.textPrimary, marginVertical: spacing.xs },
    hiddenNote: { ...typography.label, color: colors.warning, marginTop: spacing.xxs },
    input: {
      ...typography.body,
      minHeight: 72,
      textAlignVertical: "top",
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      padding: spacing.sm,
      marginTop: spacing.sm,
      color: colors.textPrimary,
      backgroundColor: colors.background,
    },
    actions: { flexDirection: "row", justifyContent: "flex-end", gap: spacing.sm, marginTop: spacing.sm },
    btn: {
      minWidth: 112,
      minHeight: minTapTarget,
      paddingHorizontal: spacing.md,
      borderRadius: radius.md,
      alignItems: "center",
      justifyContent: "center",
    },
    btnGhost: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.background },
    btnGhostText: { ...typography.button, color: colors.textSecondary },
    btnPrimary: { backgroundColor: colors.primary },
    btnDisabled: { opacity: 0.5 },
    btnPrimaryText: { ...typography.button, color: colors.onPrimary },
  });
