// app/booking/[id].tsx — "Request a Session" (PRD 3.5). The screen title comes from the root Stack.

import { VerifyEmailNotice, useNeedsEmailVerification } from "@/src/components/VerifyEmailNotice/VerifyEmailNotice";
import { router, useLocalSearchParams } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Toast from 'react-native-toast-message';

import { Avatar } from '@/src/components/Avatar/Avatar';
import { DisclaimerCard } from '@/src/components/DisclaimerCard/DisclaimerCard';
import { DISCLAIMER_VERSION, DisclaimerId, requestDisclaimers } from '@/src/constants/trust';
import { useExperts } from '@/src/context/ExpertsContext';
import { useRequests } from '@/src/context/RequestsContext';
import { useTheme } from '@/src/context/ThemeContext';
import { ThemeColors } from '@/src/design-system/colors';
import { radius } from '@/src/design-system/radius';
import { minTapTarget, spacing } from '@/src/design-system/spacing';
import { typography } from '@/src/design-system/typography';
import type { SessionType, TimingPreference } from '@/src/types/requests';

const HEADLINE_MIN = 10;
const HEADLINE_MAX = 100;
const DESCRIPTION_MIN = 50;
const DESCRIPTION_MAX = 500;

const SESSION_TYPES: { id: SessionType; label: string; sub: string }[] = [
  { id: 'remote', label: 'Remote', sub: 'Video or phone call' },
  { id: 'onsite', label: 'On-site', sub: 'The expert comes to you (Canada only)' },
  { id: 'ongoing', label: 'Ongoing mentorship', sub: 'Regular check-ins over time' },
];

const TIMING_OPTIONS: { id: TimingPreference; label: string }[] = [
  { id: 'asap', label: 'ASAP' },
  { id: 'week', label: 'This week' },
  { id: 'month', label: 'This month' },
  { id: 'flexible', label: 'Flexible' },
];

export default function RequestSessionScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getById, isLoading } = useExperts();
  const { addRequest } = useRequests();
  const needsEmailVerification = useNeedsEmailVerification();
  const expert = getById(id);

  const [headline, setHeadline] = useState('');
  const [description, setDescription] = useState('');
  const [sessionType, setSessionType] = useState<SessionType | null>(null);
  const [timing, setTiming] = useState<TimingPreference | null>(null);
  const [focused, setFocused] = useState<'headline' | 'description' | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [acknowledged, setAcknowledged] = useState<Set<DisclaimerId>>(new Set());

  const firstName = expert?.name.split(' ')[0] || 'The expert';
  const offersOnsite = expert?.country?.toLowerCase() === 'canada';
  const sessionTypes = SESSION_TYPES.filter((t) => t.id !== 'onsite' || offersOnsite);

  // PRD 4.6: every note that applies to this expert and session type must be ticked
  const disclaimers = expert ? requestDisclaimers(expert, sessionType) : [];
  const allAcknowledged = disclaimers.every((d) => acknowledged.has(d.id));
  const toggleAcknowledged = (id: DisclaimerId) =>
    setAcknowledged((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const headlineLength = headline.trim().length;
  const descriptionLength = description.trim().length;
  const isValid =
    headlineLength >= HEADLINE_MIN &&
    descriptionLength >= DESCRIPTION_MIN &&
    sessionType !== null &&
    timing !== null &&
    allAcknowledged &&
    !needsEmailVerification;

  const handleSubmit = async () => {
    if (!isValid || !expert || submitting || !sessionType || !timing) return;
    setSubmitting(true);
    try {
      await addRequest({
        expertId: expert.id,
        headline: headline.trim(),
        description: description.trim(),
        sessionType,
        timingPreference: timing,
        acknowledgedDisclaimers: disclaimers.map((d) => d.id),
        disclaimerVersion: DISCLAIMER_VERSION,
      });
      Toast.show({
        type: 'success',
        text1: 'Request sent',
        text2: `${firstName} will be notified and usually replies within 24 hours.`,
      });
      router.replace('/(user)/(tabs)/requests');
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Your request was not sent',
        text2: (error as Error).message || 'Please try again.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!expert) {
    return (
      <View style={styles.centered}>
        <Text style={styles.notFound}>Expert not found</Text>
      </View>
    );
  }

  const headlineHint =
    headlineLength > 0 && headlineLength < HEADLINE_MIN
      ? `${HEADLINE_MIN - headlineLength} more characters needed`
      : `${headline.length}/${HEADLINE_MAX}`;
  const descriptionHint =
    descriptionLength < DESCRIPTION_MIN
      ? `${DESCRIPTION_MIN - descriptionLength} more characters needed`
      : `${description.length}/${DESCRIPTION_MAX}`;

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* The expert being written to */}
        <View style={styles.expertCard}>
          <Avatar uri={expert.avatar} name={expert.name} size={52} verified={expert.verified} />
          <View style={styles.expertInfo}>
            <Text style={styles.expertCardKicker}>Your request to</Text>
            <Text style={styles.expertCardName}>{expert.name}</Text>
            <Text style={styles.expertCardHeadline} numberOfLines={2}>{expert.title}</Text>
          </View>
        </View>

        <Text style={styles.intro}>
          Tell {firstName} what you need help with. The more specific you are, the more useful your
          session will be.
        </Text>

        {/* 1. What do you need help with */}
        <View style={styles.field}>
          <Text style={styles.label}>What do you need help with?</Text>
          <TextInput
            value={headline}
            onChangeText={setHeadline}
            onFocus={() => setFocused('headline')}
            onBlur={() => setFocused(null)}
            placeholder="e.g. Understanding cash flow for my early-stage startup"
            placeholderTextColor={colors.textMuted}
            maxLength={HEADLINE_MAX}
            returnKeyType="next"
            style={[styles.input, focused === 'headline' && styles.inputFocused]}
            accessibilityLabel="What do you need help with?"
          />
          <Text style={styles.counter}>{headlineHint}</Text>
        </View>

        {/* 2. More detail */}
        <View style={styles.field}>
          <Text style={styles.label}>Tell us more about your situation</Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            onFocus={() => setFocused('description')}
            onBlur={() => setFocused(null)}
            placeholder={
              "What have you already tried? What's the specific challenge? " +
              'A little background goes a long way.'
            }
            placeholderTextColor={colors.textMuted}
            multiline
            maxLength={DESCRIPTION_MAX}
            textAlignVertical="top"
            style={[styles.input, styles.textarea, focused === 'description' && styles.inputFocused]}
            accessibilityLabel="Tell us more about your situation"
          />
          <Text style={[styles.counter, descriptionLength < DESCRIPTION_MIN && description.length > 0 && styles.counterWarn]}>
            {descriptionHint}
          </Text>
        </View>

        {/* 3. Session type */}
        <View style={styles.field} accessibilityRole="radiogroup">
          <Text style={styles.label}>Session type</Text>
          {sessionTypes.map((type) => {
            const isSelected = sessionType === type.id;
            return (
              <TouchableOpacity
                key={type.id}
                onPress={() => setSessionType(type.id)}
                style={[styles.optionRow, isSelected && styles.optionSelected]}
                accessibilityRole="radio"
                accessibilityState={{ selected: isSelected }}
              >
                <View style={styles.optionText}>
                  <Text style={[styles.optionLabel, isSelected && styles.textSelected]}>{type.label}</Text>
                  <Text style={styles.optionSub}>{type.sub}</Text>
                </View>
                <View style={[styles.radio, isSelected && styles.radioSelected]}>
                  {isSelected && <View style={styles.radioDot} />}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* 4. Timing */}
        <View style={styles.field} accessibilityRole="radiogroup">
          <Text style={styles.label}>When do you need help?</Text>
          <View style={styles.timingGrid}>
            {TIMING_OPTIONS.map((option) => {
              const isSelected = timing === option.id;
              return (
                <TouchableOpacity
                  key={option.id}
                  onPress={() => setTiming(option.id)}
                  style={[styles.timingChip, isSelected && styles.optionSelected]}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: isSelected }}
                >
                  <Text style={[styles.timingLabel, isSelected && styles.textSelected]}>{option.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* 5. Notes to acknowledge */}
        <View style={styles.field}>
          <Text style={styles.label}>Before you send</Text>
          {disclaimers.map((disclaimer) => (
            <DisclaimerCard
              key={disclaimer.id}
              disclaimer={disclaimer}
              acknowledged={acknowledged.has(disclaimer.id)}
              onToggle={() => toggleAcknowledged(disclaimer.id)}
            />
          ))}
        </View>
      </ScrollView>

      {/* Sticky submit */}
      <View style={styles.footer}>
        <VerifyEmailNotice message="Please confirm your email before sending a request. It only takes a minute." />
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={!isValid || submitting}
          style={[styles.submitBtn, !isValid && styles.submitBtnDisabled]}
          accessibilityRole="button"
          accessibilityLabel="Send session request"
          accessibilityState={{ disabled: !isValid || submitting }}
        >
          {submitting ? (
            <ActivityIndicator color={colors.onPrimary} />
          ) : (
            <Text style={[styles.submitText, !isValid && styles.submitTextDisabled]}>Send request</Text>
          )}
        </TouchableOpacity>
        <Text style={styles.footerNote}>{firstName} typically responds within 24 hours.</Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.background,
    },
    centered: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background,
    },
    notFound: {
      ...typography.body,
      color: colors.textPrimary,
    },
    scroll: {
      padding: spacing.md,
      paddingBottom: spacing.xl,
    },
    expertCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      padding: spacing.md,
      borderRadius: radius.md,
      backgroundColor: colors.primaryMuted,
      marginBottom: spacing.md,
    },
    expertInfo: { flex: 1 },
    expertCardKicker: {
      ...typography.label,
      color: colors.onPrimaryMuted,
    },
    expertCardName: {
      ...typography.h3,
      color: colors.textPrimary,
    },
    expertCardHeadline: {
      ...typography.label,
      color: colors.textSecondary,
    },
    intro: {
      ...typography.body,
      color: colors.textSecondary,
      marginBottom: spacing.lg,
    },
    field: {
      marginBottom: spacing.lg,
    },
    label: {
      ...typography.bodyMedium,
      color: colors.textPrimary,
      marginBottom: spacing.xs,
    },
    input: {
      ...typography.body, // 16px minimum: also prevents iOS zoom on focus
      minHeight: 52,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      backgroundColor: colors.surface,
      color: colors.textPrimary,
    },
    inputFocused: {
      borderColor: colors.primary,
      borderWidth: 2,
    },
    textarea: {
      height: 160,
    },
    counter: {
      ...typography.label,
      color: colors.textMuted,
      marginTop: spacing.xxs,
      textAlign: 'right',
    },
    counterWarn: {
      color: colors.warning,
    },
    optionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      minHeight: 64,
      padding: spacing.md,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      marginBottom: spacing.xs,
    },
    optionSelected: {
      backgroundColor: colors.primaryMuted,
      borderColor: colors.primary,
    },
    optionText: { flex: 1 },
    optionLabel: {
      ...typography.bodyMedium,
      color: colors.textPrimary,
    },
    optionSub: {
      ...typography.label,
      color: colors.textMuted,
    },
    textSelected: {
      color: colors.onPrimaryMuted,
    },
    radio: {
      width: 24,
      height: 24,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    radioSelected: {
      borderColor: colors.primary,
      backgroundColor: colors.primary,
    },
    radioDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.onPrimary,
    },
    timingGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.xs,
    },
    timingChip: {
      minHeight: minTapTarget,
      justifyContent: 'center',
      paddingHorizontal: spacing.md,
      borderRadius: radius.full,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    timingLabel: {
      ...typography.bodyMedium,
      color: colors.textSecondary,
    },
    footer: {
      padding: spacing.md,
      paddingBottom: spacing.xl,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
      backgroundColor: colors.background,
    },
    submitBtn: {
      minHeight: 52,
      borderRadius: radius.md,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primary,
      marginBottom: spacing.xs,
    },
    submitBtnDisabled: {
      backgroundColor: colors.border,
    },
    submitText: {
      ...typography.button,
      color: colors.onPrimary,
    },
    submitTextDisabled: {
      color: colors.textMuted,
    },
    footerNote: {
      ...typography.label,
      color: colors.textMuted,
      textAlign: 'center',
    },
  });
