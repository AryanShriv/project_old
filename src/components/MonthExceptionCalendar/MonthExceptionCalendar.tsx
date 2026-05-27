import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import Toast from "react-native-toast-message";

import { ThemeColors } from "@/src/design-system/colors";
import { radius } from "@/src/design-system/radius";
import { spacing } from "@/src/design-system/spacing";
import {
  deleteAvailabilityException,
  fetchAvailabilityExceptions,
  upsertAvailabilityException,
} from "@/src/services/availabilityApi";
import {
  buildMonthGrid,
  toDateKey,
  toMonthKey,
  type AvailabilityException,
} from "@/src/types/availability";

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

type Props = {
  freelancerId: string;
  colors: ThemeColors;
};

export function MonthExceptionCalendar({ freelancerId, colors }: Props) {
  const styles = useMemo(() => createStyles(colors), [colors]);
  const today = useMemo(() => new Date(), []);

  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [exceptions, setExceptions] = useState<AvailabilityException[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyDate, setBusyDate] = useState<string | null>(null);

  const monthKey = toMonthKey(viewYear, viewMonth);
  const monthLabel = new Date(viewYear, viewMonth, 1).toLocaleString("default", {
    month: "long",
    year: "numeric",
  });

  const exceptionMap = useMemo(() => {
    const map = new Map<string, AvailabilityException>();
    exceptions.forEach((item) => map.set(item.date, item));
    return map;
  }, [exceptions]);

  const loadExceptions = useCallback(async () => {
    setLoading(true);
    try {
      const items = await fetchAvailabilityExceptions(freelancerId, monthKey);
      setExceptions(items);
    } catch {
      setExceptions([]);
      Toast.show({
        type: "error",
        text1: "Could not load month exceptions",
      });
    } finally {
      setLoading(false);
    }
  }, [freelancerId, monthKey]);

  useEffect(() => {
    loadExceptions();
  }, [loadExceptions]);

  const shiftMonth = (delta: number) => {
    const next = new Date(viewYear, viewMonth + delta, 1);
    setViewYear(next.getFullYear());
    setViewMonth(next.getMonth());
  };

  const handleDatePress = async (dateKey: string) => {
    const existing = exceptionMap.get(dateKey);
    setBusyDate(dateKey);
    try {
      if (existing) {
        await deleteAvailabilityException(freelancerId, dateKey);
        setExceptions((prev) => prev.filter((item) => item.date !== dateKey));
        Toast.show({
          type: "success",
          text1: "Exception removed",
          text2: "Day restored to your weekly schedule.",
        });
        return;
      }

      const saved = await upsertAvailabilityException(freelancerId, dateKey, {
        kind: "blocked",
        note: "Day off",
      });
      setExceptions((prev) => [...prev.filter((item) => item.date !== dateKey), saved]);
      Toast.show({
        type: "success",
        text1: "Day marked off",
        text2: "Clients will not see you as available on this date.",
      });
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Update failed",
        text2: (error as Error).message || "Please try again.",
      });
    } finally {
      setBusyDate(null);
    }
  };

  const cells = buildMonthGrid(viewYear, viewMonth);

  return (
    <View style={styles.wrap}>
      <Text style={styles.sectionTitle}>Month exceptions</Text>
      <Text style={styles.hint}>
        Tap a date to mark it as a day off (vacation, holiday). Tap again to remove the exception.
      </Text>

      <View style={styles.monthNav}>
        <Pressable onPress={() => shiftMonth(-1)} hitSlop={12} style={styles.navBtn}>
          <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.monthLabel}>{monthLabel}</Text>
        <Pressable onPress={() => shiftMonth(1)} hitSlop={12} style={styles.navBtn}>
          <Ionicons name="chevron-forward" size={22} color={colors.textPrimary} />
        </Pressable>
      </View>

      <View style={styles.weekdayRow}>
        {WEEKDAY_LABELS.map((label) => (
          <Text key={label} style={styles.weekdayLabel}>
            {label}
          </Text>
        ))}
      </View>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <View style={styles.grid}>
          {cells.map((cell, index) => {
            if (!cell.date || !cell.key) {
              return <View key={`empty-${index}`} style={styles.dayCellEmpty} />;
            }

            const exception = exceptionMap.get(cell.key);
            const isBlocked = exception?.kind === "blocked";
            const isCustom = exception?.kind === "custom";
            const isToday = cell.key === toDateKey(today);
            const isBusy = busyDate === cell.key;

            return (
              <Pressable
                key={cell.key}
                style={[
                  styles.dayCell,
                  isToday && styles.dayCellToday,
                  isBlocked && styles.dayCellBlocked,
                  isCustom && styles.dayCellCustom,
                ]}
                onPress={() => handleDatePress(cell.key!)}
                disabled={isBusy}
              >
                {isBusy ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <Text
                    style={[
                      styles.dayNumber,
                      (isBlocked || isCustom) && styles.dayNumberOn,
                    ]}
                  >
                    {cell.date.getDate()}
                  </Text>
                )}
              </Pressable>
            );
          })}
        </View>
      )}

      <View style={styles.legend}>
        <View style={[styles.legendSwatch, styles.dayCellBlocked]} />
        <Text style={styles.legendText}>Day off</Text>
        <View style={[styles.legendSwatch, styles.dayCellToday]} />
        <Text style={styles.legendText}>Today</Text>
      </View>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    wrap: {
      marginTop: spacing.md,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: "700",
      color: colors.textPrimary,
      marginBottom: 4,
    },
    hint: {
      fontSize: 13,
      color: colors.textSecondary,
      lineHeight: 18,
      marginBottom: spacing.sm,
    },
    monthNav: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: spacing.sm,
    },
    navBtn: {
      padding: 4,
    },
    monthLabel: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.textPrimary,
    },
    weekdayRow: {
      flexDirection: "row",
      marginBottom: 4,
    },
    weekdayLabel: {
      flex: 1,
      textAlign: "center",
      fontSize: 11,
      fontWeight: "600",
      color: colors.textMuted,
    },
    loadingBox: {
      height: 220,
      alignItems: "center",
      justifyContent: "center",
    },
    grid: {
      flexDirection: "row",
      flexWrap: "wrap",
    },
    dayCell: {
      width: `${100 / 7}%`,
      aspectRatio: 1,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: radius.sm,
      marginBottom: 4,
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
    },
    dayCellEmpty: {
      width: `${100 / 7}%`,
      aspectRatio: 1,
      marginBottom: 4,
    },
    dayCellToday: {
      borderColor: colors.primary,
      borderWidth: 2,
    },
    dayCellBlocked: {
      backgroundColor: "#fecaca",
      borderColor: "#ef4444",
    },
    dayCellCustom: {
      backgroundColor: colors.primaryMuted,
      borderColor: colors.primary,
    },
    dayNumber: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.textPrimary,
    },
    dayNumberOn: {
      color: colors.textPrimary,
    },
    legend: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: spacing.sm,
      gap: 8,
    },
    legendSwatch: {
      width: 14,
      height: 14,
      borderRadius: 4,
      borderWidth: 1,
      borderColor: colors.border,
    },
    legendText: {
      fontSize: 12,
      color: colors.textMuted,
      marginRight: spacing.sm,
    },
  });
