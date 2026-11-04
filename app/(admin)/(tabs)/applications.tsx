import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

import { EmptyState } from "@/src/components/EmptyState/EmptyState";
import { useAuth } from "@/src/context/AuthContext";
import { useTheme } from "@/src/context/ThemeContext";
import { ThemeColors } from "@/src/design-system/colors";
import { radius } from "@/src/design-system/radius";
import { minTapTarget, spacing } from "@/src/design-system/spacing";
import { typography } from "@/src/design-system/typography";
import type { ExpertApplication, VerificationChecklist } from "@/src/types/auth";

const CHECKLIST_ITEMS: { key: keyof VerificationChecklist; label: string; hint: string }[] = [
  { key: "idVerified", label: "ID checked", hint: "Government photo ID matches the name on the profile" },
  { key: "certificateVerified", label: "Certificate checked", hint: "Licence number confirmed with the issuing body's public registry" },
  { key: "insuranceConfirmed", label: "Insurance declared", hint: "Expert declared liability insurance for on-site work" },
  { key: "linkedinVerified", label: "LinkedIn checked", hint: "Profile matches the career history described" },
];

const EMPTY_CHECKLIST: VerificationChecklist = {
  idVerified: false,
  certificateVerified: false,
  insuranceConfirmed: false,
  linkedinVerified: false,
};

const MIN_REASON = 10;

export default function AdminApplicationsScreen() {
  const { applications } = useAuth();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const pending = applications.filter((a) => a.status === "pending");

  if (pending.length === 0) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <EmptyState
          icon="checkmark-done-outline"
          title="All caught up"
          subtitle="No expert applications are waiting for review."
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.title}>Expert applications</Text>
        <Text style={styles.subtitle}>{pending.length} waiting for review</Text>
      </View>
      <FlatList
        data={pending}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => <ApplicationCard application={item} styles={styles} colors={colors} />}
      />
    </SafeAreaView>
  );
}

type Styles = ReturnType<typeof createStyles>;

function ApplicationCard({
  application,
  styles,
  colors,
}: {
  application: ExpertApplication;
  styles: Styles;
  colors: ThemeColors;
}) {
  const { reviewApplication } = useAuth();
  const [checklist, setChecklist] = useState<VerificationChecklist>(EMPTY_CHECKLIST);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  const details = application.details;
  const required = application.requirements ?? { ...EMPTY_CHECKLIST, idVerified: true };
  const missing = CHECKLIST_ITEMS.filter(({ key }) => required[key] && !checklist[key]);
  const canApprove = missing.length === 0;

  const submit = async (decision: "approved" | "rejected") => {
    setBusy(true);
    try {
      await reviewApplication(application.id, decision, { note: reason.trim(), checklist });
      Toast.show({
        type: "success",
        text1: decision === "approved" ? "Expert approved" : "Application rejected",
        text2: `${application.name} has been emailed.`,
      });
    } catch (error) {
      Toast.show({ type: "error", text1: "Not saved", text2: (error as Error).message });
    } finally {
      setBusy(false);
    }
  };

  const cert = details?.certifications?.[0];

  return (
    <View style={styles.card}>
      <View style={styles.nameRow}>
        <Text style={styles.name}>{application.name}</Text>
        {application.isResubmission && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Resubmission (final review)</Text>
          </View>
        )}
      </View>
      <Text style={styles.meta}>{application.email}</Text>
      <Text style={styles.meta}>Submitted {new Date(application.createdAt).toLocaleDateString()}</Text>

      {details && (
        <View style={styles.details}>
          <Detail styles={styles} label="Field" value={details.domain} />
          <Detail styles={styles} label="Location" value={[details.city, details.country].filter(Boolean).join(", ")} />
          <Detail
            styles={styles}
            label="Sessions"
            value={(details.engagementTypes ?? []).map((t) => (t === "onsite" ? "On-site" : "Remote")).join(", ")}
          />
          <Detail
            styles={styles}
            label="Certificate"
            value={cert ? `${cert.type} · #${cert.number} · ${cert.issuingBody}` : required.certificateVerified ? "Missing" : "Not required"}
          />
          <Detail
            styles={styles}
            label="Insurance"
            value={details.insuranceDeclared ? "Declared by expert" : required.insuranceConfirmed ? "Not declared" : "Not required"}
          />
          <Detail styles={styles} label="LinkedIn" value={details.linkedinUrl || "Not provided"} />
        </View>
      )}

      <Text style={styles.sectionLabel}>Verification checklist</Text>
      {CHECKLIST_ITEMS.map(({ key, label, hint }) => {
        const checked = checklist[key];
        return (
          <Pressable
            key={key}
            style={styles.checkRow}
            onPress={() => setChecklist({ ...checklist, [key]: !checked })}
            accessibilityRole="checkbox"
            accessibilityState={{ checked }}
          >
            <View style={[styles.checkbox, checked && styles.checkboxOn]}>
              {checked && <Ionicons name="checkmark" size={18} color={colors.onPrimary} />}
            </View>
            <View style={styles.checkText}>
              <Text style={styles.checkLabel}>
                {label}
                {required[key] ? <Text style={styles.required}>  Required</Text> : null}
              </Text>
              <Text style={styles.meta}>{hint}</Text>
            </View>
          </Pressable>
        );
      })}

      {rejecting ? (
        <View style={styles.rejectBox}>
          <Text style={styles.sectionLabel}>Reason for rejection (emailed to the expert)</Text>
          <TextInput
            style={styles.input}
            value={reason}
            onChangeText={setReason}
            placeholder="Be specific and kind, e.g. what to add or correct before resubmitting."
            placeholderTextColor={colors.textMuted}
            multiline
          />
          <View style={styles.actions}>
            <Pressable style={[styles.btn, styles.btnGhost]} onPress={() => setRejecting(false)} disabled={busy}>
              <Text style={styles.btnGhostText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={[styles.btn, styles.btnDanger, reason.trim().length < MIN_REASON && styles.btnDisabled]}
              onPress={() => submit("rejected")}
              disabled={busy || reason.trim().length < MIN_REASON}
            >
              {busy ? <ActivityIndicator color={colors.onPrimary} /> : <Text style={styles.btnPrimaryText}>Send rejection</Text>}
            </Pressable>
          </View>
        </View>
      ) : (
        <>
          {!canApprove && (
            <Text style={styles.missing}>To approve, tick: {missing.map((m) => m.label).join(", ")}</Text>
          )}
          <View style={styles.actions}>
            <Pressable style={[styles.btn, styles.btnGhost]} onPress={() => setRejecting(true)} disabled={busy}>
              <Text style={styles.btnGhostText}>Reject</Text>
            </Pressable>
            <Pressable
              style={[styles.btn, styles.btnPrimary, !canApprove && styles.btnDisabled]}
              onPress={() => submit("approved")}
              disabled={busy || !canApprove}
            >
              {busy ? <ActivityIndicator color={colors.onPrimary} /> : <Text style={styles.btnPrimaryText}>Approve</Text>}
            </Pressable>
          </View>
        </>
      )}
    </View>
  );
}

const Detail = ({ styles, label, value }: { styles: Styles; label: string; value?: string }) => (
  <View style={styles.detailRow}>
    <Text style={styles.detailLabel}>{label}</Text>
    <Text style={styles.detailValue}>{value || "—"}</Text>
  </View>
);

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    header: {
      paddingHorizontal: spacing.md,
      paddingTop: spacing.md,
      paddingBottom: spacing.xs,
    },
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
    nameRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: spacing.xs },
    name: { ...typography.h3, color: colors.textPrimary },
    badge: {
      paddingHorizontal: spacing.xs,
      paddingVertical: 2,
      borderRadius: radius.full,
      backgroundColor: colors.warningMuted,
    },
    badgeText: { ...typography.label, color: colors.warning },
    meta: { ...typography.label, color: colors.textMuted, marginTop: 2 },
    details: {
      marginTop: spacing.sm,
      paddingTop: spacing.sm,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.divider,
    },
    detailRow: { flexDirection: "row", paddingVertical: 4 },
    detailLabel: { ...typography.label, color: colors.textMuted, width: 96 },
    detailValue: { ...typography.body, color: colors.textPrimary, flex: 1 },
    sectionLabel: { ...typography.bodyMedium, color: colors.textPrimary, marginTop: spacing.md, marginBottom: spacing.xs },
    checkRow: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm, minHeight: minTapTarget, paddingVertical: 4 },
    checkbox: {
      width: 28,
      height: 28,
      borderRadius: 6,
      borderWidth: 2,
      borderColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.background,
    },
    checkboxOn: { backgroundColor: colors.primary, borderColor: colors.primary },
    checkText: { flex: 1 },
    checkLabel: { ...typography.bodyMedium, color: colors.textPrimary },
    required: { ...typography.label, color: colors.warning },
    missing: { ...typography.label, color: colors.textMuted, marginTop: spacing.sm },
    rejectBox: { marginTop: spacing.xs },
    input: {
      ...typography.body,
      minHeight: 96,
      textAlignVertical: "top",
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      padding: spacing.sm,
      color: colors.textPrimary,
      backgroundColor: colors.background,
    },
    actions: { flexDirection: "row", justifyContent: "flex-end", gap: spacing.sm, marginTop: spacing.md },
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
    btnDanger: { backgroundColor: colors.error },
    btnDisabled: { opacity: 0.5 },
    btnPrimaryText: { ...typography.button, color: colors.onPrimary },
  });
