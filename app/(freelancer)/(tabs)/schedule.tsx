import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

import { EmptyState } from "@/src/components/EmptyState/EmptyState";
import { MonthExceptionCalendar } from "@/src/components/MonthExceptionCalendar/MonthExceptionCalendar";
import { WeeklyAvailabilityCalendar } from "@/src/components/WeeklyAvailabilityCalendar/WeeklyAvailabilityCalendar";
import { useAuth } from "@/src/context/AuthContext";
import { useTheme } from "@/src/context/ThemeContext";
import { ThemeColors } from "@/src/design-system/colors";
import { radius } from "@/src/design-system/radius";
import { spacing } from "@/src/design-system/spacing";
import { typography } from "@/src/design-system/typography";
import { fetchAvailability, saveAvailability } from "@/src/services/availabilityApi";
import { defaultDaySlots, WEEK_DAYS, type DaySlot } from "@/src/types/availability";

export default function FreelancerScheduleScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const freelancerId = user?.managedFreelancerId ?? "";
  const [slots, setSlots] = useState<DaySlot[]>(defaultDaySlots());
  const [timezone, setTimezone] = useState("UTC");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadAvailability = useCallback(async () => {
    if (!freelancerId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await fetchAvailability(freelancerId);
      setSlots(data.slots?.length === 7 ? data.slots : defaultDaySlots());
      setTimezone(data.timezone || "UTC");
    } catch {
      setSlots(defaultDaySlots());
      Toast.show({
        type: "error",
        text1: "Could not load availability",
        text2: "Using default schedule. You can still edit and save.",
      });
    } finally {
      setLoading(false);
    }
  }, [freelancerId]);

  useEffect(() => {
    loadAvailability();
  }, [loadAvailability]);

  const updateSlot = (day: DaySlot["day"], patch: Partial<DaySlot>) => {
    setSlots((prev) => prev.map((slot) => (slot.day === day ? { ...slot, ...patch } : slot)));
  };

  const handleSave = async () => {
    if (!freelancerId) return;

    for (const slot of slots) {
      if (!slot.enabled) continue;
      const timePattern = /^([01]\d|2[0-3]):([0-5]\d)$/;
      if (!timePattern.test(slot.startTime) || !timePattern.test(slot.endTime)) {
        Toast.show({
          type: "error",
          text1: "Invalid time format",
          text2: `Use HH:MM (24h) for ${slot.day}.`,
        });
        return;
      }
      if (slot.startTime >= slot.endTime) {
        Toast.show({
          type: "error",
          text1: "Invalid time range",
          text2: `End time must be after start time on ${slot.day}.`,
        });
        return;
      }
    }

    setSaving(true);
    try {
      await saveAvailability(freelancerId, { timezone: timezone.trim() || "UTC", slots });
      Toast.show({
        type: "success",
        text1: "Availability saved",
        text2: "Your weekly calendar has been updated.",
      });
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Save failed",
        text2: (error as Error).message || "Please try again.",
      });
    } finally {
      setSaving(false);
    }
  };

  const summary = useMemo(
    () =>
      WEEK_DAYS.map(({ key, label }) => {
        const slot = slots.find((s) => s.day === key);
        if (!slot?.enabled) return `${label}: Off`;
        return `${label}: ${slot.startTime} – ${slot.endTime}`;
      }),
    [slots]
  );

  if (!freelancerId) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <EmptyState
          icon="calendar-outline"
          title="Profile not linked"
          subtitle="Your freelancer profile must be approved and linked before you can set availability."
        />
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Schedule</Text>
        <Text style={styles.subtitle}>
          Weekly calendar — tap time blocks to mark when clients can book intro calls.
        </Text>

        <View style={styles.field}>
          <Text style={styles.label}>Timezone</Text>
          <TextInput
            style={styles.input}
            value={timezone}
            onChangeText={setTimezone}
            placeholder="e.g. Asia/Kolkata"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
          />
        </View>

        <View style={styles.calendarCard}>
          <Text style={styles.sectionTitle}>Weekly hours</Text>
          <WeeklyAvailabilityCalendar slots={slots} colors={colors} onChange={updateSlot} />
          <MonthExceptionCalendar freelancerId={freelancerId} colors={colors} />
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>This week at a glance</Text>
          {summary.map((line) => (
            <Text key={line} style={styles.summaryLine}>
              {line}
            </Text>
          ))}
        </View>

        <Pressable
          style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="save-outline" size={18} color="#fff" />
              <Text style={styles.saveBtnText}>Save calendar</Text>
            </>
          )}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: colors.background,
    },
    center: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    content: {
      padding: spacing.md,
      paddingBottom: 120, // Extra padding for tab bar + safe area
    },
    title: {
      ...typography.displaySmall,
      color: colors.textPrimary,
    },
    subtitle: {
      ...typography.body,
      color: colors.textMuted,
      marginTop: spacing.xxs,
      marginBottom: spacing.lg,
      lineHeight: 24,
    },
    field: {
      marginBottom: spacing.md,
    },
    label: {
      ...typography.labelSmall,
      color: colors.textMuted,
      marginBottom: spacing.xxs,
    },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.sm,
      padding: spacing.sm,
      ...typography.body,
      color: colors.textPrimary,
      backgroundColor: colors.surface,
    },
    calendarCard: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      padding: spacing.md,
      marginBottom: spacing.md,
    },
    sectionTitle: {
      ...typography.bodyMedium,
      color: colors.textPrimary,
      marginBottom: spacing.sm,
    },
    summaryCard: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      padding: spacing.md,
      marginBottom: spacing.md,
    },
    summaryTitle: {
      ...typography.label,
      color: colors.textPrimary,
      marginBottom: spacing.sm,
    },
    summaryLine: {
      ...typography.body,
      color: colors.textSecondary,
      marginBottom: spacing.xxs,
      lineHeight: 24,
    },
    saveBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.xs,
      backgroundColor: colors.primary,
      paddingVertical: spacing.md,
      borderRadius: radius.sm,
      minHeight: spacing.xl, // 48pt minimum tap target
    },
    saveBtnDisabled: {
      opacity: 0.7,
    },
    saveBtnText: {
      ...typography.button,
      color: "#fff",
    },
  });
