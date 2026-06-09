import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useTheme } from "@/src/context/ThemeContext";
import { ThemeColors } from "@/src/design-system/colors";
import { radius } from "@/src/design-system/radius";
import { spacing } from "@/src/design-system/spacing";
import { typography } from "@/src/design-system/typography";

const PREFS_KEY = "@notif_prefs_v1";

type NotifPrefs = {
  requestUpdates: boolean;
  newMessages: boolean;
  appUpdates: boolean;
};

const DEFAULT_PREFS: NotifPrefs = {
  requestUpdates: true,
  newMessages: true,
  appUpdates: false,
};

type NotifRow = {
  key: keyof NotifPrefs;
  icon: "paper-plane-outline" | "chatbubble-outline" | "megaphone-outline";
  label: string;
  description: string;
};

const ROWS: NotifRow[] = [
  {
    key: "requestUpdates",
    icon: "paper-plane-outline",
    label: "Request updates",
    description: "Get notified when an expert accepts or declines your consultation request.",
  },
  {
    key: "newMessages",
    icon: "chatbubble-outline",
    label: "New messages",
    description: "Get notified when you receive a new message in a conversation.",
  },
  {
    key: "appUpdates",
    icon: "megaphone-outline",
    label: "Product announcements",
    description: "Occasional updates about new features and improvements to G(Old).",
  },
];

export default function NotificationsScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [prefs, setPrefs] = useState<NotifPrefs>(DEFAULT_PREFS);

  // Load saved prefs on mount
  useEffect(() => {
    AsyncStorage.getItem(PREFS_KEY).then((raw) => {
      if (raw) {
        try {
          setPrefs({ ...DEFAULT_PREFS, ...JSON.parse(raw) });
        } catch {
          // use defaults
        }
      }
    });
  }, []);

  const toggle = async (key: keyof NotifPrefs) => {
    const next = { ...prefs, [key]: !prefs[key] };
    setPrefs(next);
    await AsyncStorage.setItem(PREFS_KEY, JSON.stringify(next));
  };

  return (
    <SafeAreaView style={styles.safe} edges={["bottom"]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Header info */}
        <View style={styles.infoCard}>
          <Ionicons name="notifications-outline" size={28} color={colors.primary} />
          <Text style={styles.infoText}>
            Control which notifications you receive from G(Old). Push notifications
            are only delivered on real devices with a development build.
          </Text>
        </View>

        {/* Notification rows */}
        <Text style={styles.sectionLabel}>Notification Preferences</Text>
        <View style={styles.card}>
          {ROWS.map((row, index) => (
            <View
              key={row.key}
              style={[styles.row, index < ROWS.length - 1 && styles.rowBorder]}
            >
              <View style={styles.rowIconWrap}>
                <Ionicons name={row.icon} size={20} color={colors.primary} />
              </View>
              <View style={styles.rowText}>
                <Text style={styles.rowLabel}>{row.label}</Text>
                <Text style={styles.rowDesc}>{row.description}</Text>
              </View>
              <Switch
                value={prefs[row.key]}
                onValueChange={() => toggle(row.key)}
                trackColor={{ false: colors.divider, true: colors.primary }}
                thumbColor="#FFFFFF"
              />
            </View>
          ))}
        </View>

        {/* Note */}
        <View style={styles.noteRow}>
          <Ionicons name="information-circle-outline" size={16} color={colors.textMuted} />
          <Text style={styles.noteText}>
            Preferences are saved on this device. To stop all notifications, you
            can also manage them in your device's system Settings app.
          </Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  infoCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    backgroundColor: colors.primaryMuted,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.divider,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  infoText: {
    ...typography.body,
    color: colors.textSecondary,
    flex: 1,
    lineHeight: 24,
  },
  sectionLabel: {
    ...typography.overline,
    color: colors.textMuted,
    marginBottom: spacing.sm,
    marginLeft: spacing.xxs,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
    marginBottom: spacing.lg,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    gap: spacing.sm,
  },
  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.divider,
  },
  rowIconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    backgroundColor: colors.primaryMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  rowText: {
    flex: 1,
    minWidth: 0,
  },
  rowLabel: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
  },
  rowDesc: {
    ...typography.label,
    color: colors.textMuted,
    marginTop: 2,
    lineHeight: 20,
  },
  noteRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.xs,
    paddingHorizontal: spacing.xxs,
  },
  noteText: {
    ...typography.body,
    color: colors.textMuted,
    flex: 1,
    lineHeight: 22,
  },
});
