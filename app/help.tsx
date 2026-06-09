import { Ionicons } from "@expo/vector-icons";
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useTheme } from "@/src/context/ThemeContext";
import { ThemeColors } from "@/src/design-system/colors";
import { radius } from "@/src/design-system/radius";
import { spacing } from "@/src/design-system/spacing";
import { typography } from "@/src/design-system/typography";
import { useMemo } from "react";

type FaqItem = { q: string; a: string };

const FAQS: FaqItem[] = [
  {
    q: "How do I send a consultation request?",
    a: "Browse the Discover tab, open an expert's profile, and tap 'Consult Talent'. Fill in your project title and submit. The expert will accept or decline.",
  },
  {
    q: "How long does it take to hear back?",
    a: "Most experts respond within 24–48 hours. You'll see the status update in your Requests tab.",
  },
  {
    q: "Can I message an expert before booking?",
    a: "Once an expert accepts your request, a conversation is opened in your Messages tab where you can chat directly.",
  },
  {
    q: "How do I save an expert for later?",
    a: "Tap the bookmark icon on any expert card in Discover. Find all saved experts under the Saved tab.",
  },
  {
    q: "How do I update my profile?",
    a: "Go to Profile tab → tap 'Edit profile'. You can update your name, headline, bio, company, website, location, and phone.",
  },
  {
    q: "Why can't I find a freelancer I know signed up?",
    a: "New freelancers require admin approval before they appear in Discover. Once approved, pull down on the Discover screen to refresh.",
  },
  {
    q: "How do I cancel or withdraw a request?",
    a: "Currently, requests cannot be withdrawn once sent. Please contact support if you need to cancel an outstanding request.",
  },
];

type ContactRow = {
  icon: "mail-outline" | "logo-twitter" | "globe-outline";
  label: string;
  value: string;
  url: string;
};

const CONTACT: ContactRow[] = [
  { icon: "mail-outline", label: "Email support", value: "support@gold.com", url: "mailto:support@gold.com" },
  { icon: "globe-outline", label: "Visit our website", value: "gold.com", url: "https://gold.com" },
];

export default function HelpScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <SafeAreaView style={styles.safe} edges={["bottom"]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.headerCard}>
          <View style={styles.headerIcon}>
            <Ionicons name="help-buoy-outline" size={32} color={colors.primary} />
          </View>
          <Text style={styles.headerTitle}>Help & Support</Text>
          <Text style={styles.headerSub}>
            Find answers to common questions or reach out to the G(Old) team directly.
          </Text>
        </View>

        {/* FAQs */}
        <Text style={styles.sectionLabel}>Frequently Asked Questions</Text>
        <View style={styles.card}>
          {FAQS.map((item, index) => (
            <View key={index} style={[styles.faqItem, index < FAQS.length - 1 && styles.faqBorder]}>
              <View style={styles.faqQuestion}>
                <Ionicons name="chatbubble-ellipses-outline" size={18} color={colors.primary} style={styles.faqIcon} />
                <Text style={styles.faqQ}>{item.q}</Text>
              </View>
              <Text style={styles.faqA}>{item.a}</Text>
            </View>
          ))}
        </View>

        {/* Contact */}
        <Text style={styles.sectionLabel}>Contact Us</Text>
        <View style={styles.card}>
          {CONTACT.map((row, index) => (
            <Pressable
              key={row.label}
              style={[styles.contactRow, index < CONTACT.length - 1 && styles.rowBorder]}
              onPress={() => Linking.openURL(row.url).catch(() => undefined)}
            >
              <View style={styles.contactLeft}>
                <View style={styles.iconWrap}>
                  <Ionicons name={row.icon} size={20} color={colors.primary} />
                </View>
                <View>
                  <Text style={styles.contactLabel}>{row.label}</Text>
                  <Text style={styles.contactValue}>{row.value}</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </Pressable>
          ))}
        </View>

        {/* Response time note */}
        <View style={styles.noteRow}>
          <Ionicons name="time-outline" size={16} color={colors.textMuted} />
          <Text style={styles.noteText}>
            Our support team typically responds within 1–2 business days.
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
  headerCard: {
    backgroundColor: colors.primaryMuted,
    borderRadius: radius.lg,
    padding: spacing.lg,
    alignItems: "center",
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  headerIcon: {
    width: 64,
    height: 64,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  headerTitle: {
    ...typography.h1,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  headerSub: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: "center",
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
  faqItem: {
    padding: spacing.md,
  },
  faqBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.divider,
  },
  faqQuestion: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: spacing.xs,
  },
  faqIcon: {
    marginRight: spacing.xs,
    marginTop: 2,
  },
  faqQ: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
    flex: 1,
  },
  faqA: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 24,
    paddingLeft: 26, // align under question text
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing.md,
    minHeight: 56,
  },
  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.divider,
  },
  contactLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    backgroundColor: colors.primaryMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  contactLabel: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
  },
  contactValue: {
    ...typography.label,
    color: colors.textMuted,
    marginTop: 2,
  },
  noteRow: {
    flexDirection: "row",
    alignItems: "center",
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
