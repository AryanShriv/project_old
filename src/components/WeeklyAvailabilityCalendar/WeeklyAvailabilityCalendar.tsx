import { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { ThemeColors } from "@/src/design-system/colors";
import { radius } from "@/src/design-system/radius";
import { spacing } from "@/src/design-system/spacing";
import {
  CALENDAR_HOUR_END,
  CALENDAR_HOUR_START,
  formatHour,
  formatHourLabel,
  getCurrentWeekDates,
  isHourInSlot,
  parseHour,
  WEEK_DAYS,
  type DaySlot,
  type Weekday,
} from "@/src/types/availability";

const HOURS = Array.from(
  { length: CALENDAR_HOUR_END - CALENDAR_HOUR_START },
  (_, i) => CALENDAR_HOUR_START + i
);

type Props = {
  slots: DaySlot[];
  colors: ThemeColors;
  onChange: (day: Weekday, patch: Partial<DaySlot>) => void;
};

export function WeeklyAvailabilityCalendar({ slots, colors, onChange }: Props) {
  const styles = useMemo(() => createStyles(colors), [colors]);
  const weekDates = useMemo(() => getCurrentWeekDates(), []);

  const getSlot = (day: Weekday) =>
    slots.find((slot) => slot.day === day) ?? {
      day,
      enabled: false,
      startTime: "09:00",
      endTime: "17:00",
    };

  const handleHourPress = (day: Weekday, hour: number) => {
    const slot = getSlot(day);
    const startH = parseHour(slot.startTime);
    const endH = parseHour(slot.endTime);

    if (!slot.enabled) {
      onChange(day, {
        enabled: true,
        startTime: formatHour(hour),
        endTime: formatHour(hour + 1),
      });
      return;
    }

    if (hour < startH) {
      onChange(day, { startTime: formatHour(hour) });
      return;
    }

    if (hour >= endH) {
      onChange(day, { endTime: formatHour(hour + 1) });
      return;
    }

    if (endH - startH <= 1) {
      onChange(day, { enabled: false });
      return;
    }

    if (hour === startH) {
      onChange(day, { startTime: formatHour(hour + 1) });
      return;
    }

    if (hour === endH - 1) {
      onChange(day, { endTime: formatHour(hour) });
    }
  };

  const toggleDay = (day: Weekday) => {
    const slot = getSlot(day);
    if (slot.enabled) {
      onChange(day, { enabled: false });
      return;
    }
    onChange(day, {
      enabled: true,
      startTime: "09:00",
      endTime: "17:00",
    });
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.hint}>
        Tap hours on the calendar to set when you are available. Tap a day header to turn it on or off.
      </Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View>
          <View style={styles.headerRow}>
            <View style={styles.timeGutter} />
            {WEEK_DAYS.map(({ key, short }, index) => {
              const slot = getSlot(key);
              const date = weekDates[index];
              return (
                <Pressable
                  key={key}
                  style={[styles.dayHeader, slot.enabled && styles.dayHeaderOn]}
                  onPress={() => toggleDay(key)}
                >
                  <Text style={[styles.dayShort, slot.enabled && styles.dayShortOn]}>{short}</Text>
                  <Text style={[styles.dayDate, slot.enabled && styles.dayDateOn]}>
                    {date.getDate()}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {HOURS.map((hour) => (
            <View key={hour} style={styles.hourRow}>
              <View style={styles.timeGutter}>
                <Text style={styles.timeLabel}>{formatHourLabel(hour)}</Text>
              </View>
              {WEEK_DAYS.map(({ key }) => {
                const slot = getSlot(key);
                const active = isHourInSlot(hour, slot);
                return (
                  <Pressable
                    key={`${key}-${hour}`}
                    style={[styles.cell, active && styles.cellActive]}
                    onPress={() => handleHourPress(key, hour)}
                  />
                );
              })}
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={styles.legend}>
        <View style={[styles.legendSwatch, styles.cellActive]} />
        <Text style={styles.legendText}>Available</Text>
        <View style={[styles.legendSwatch, styles.cell]} />
        <Text style={styles.legendText}>Unavailable</Text>
      </View>
    </View>
  );
}

const CELL_SIZE = 36;

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    wrap: {
      marginBottom: spacing.md,
    },
    hint: {
      fontSize: 13,
      color: colors.textSecondary,
      lineHeight: 18,
      marginBottom: spacing.sm,
    },
    headerRow: {
      flexDirection: "row",
      marginBottom: 4,
    },
    timeGutter: {
      width: 52,
      justifyContent: "center",
    },
    dayHeader: {
      width: CELL_SIZE,
      marginHorizontal: 2,
      alignItems: "center",
      paddingVertical: 8,
      borderRadius: radius.sm,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    dayHeaderOn: {
      backgroundColor: colors.primaryMuted,
      borderColor: colors.primary,
    },
    dayShort: {
      fontSize: 12,
      fontWeight: "700",
      color: colors.textMuted,
    },
    dayShortOn: {
      color: colors.primary,
    },
    dayDate: {
      marginTop: 2,
      fontSize: 11,
      color: colors.textMuted,
    },
    dayDateOn: {
      color: colors.textSecondary,
    },
    hourRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 2,
    },
    timeLabel: {
      fontSize: 10,
      color: colors.textMuted,
      textAlign: "right",
      paddingRight: 6,
    },
    cell: {
      width: CELL_SIZE,
      height: 28,
      marginHorizontal: 2,
      borderRadius: 6,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    cellActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
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
