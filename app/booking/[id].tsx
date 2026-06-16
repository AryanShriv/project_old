// app/booking/[id].tsx

import React, { useState } from 'react';
import {
  View, Text, ScrollView, TextInput,
  TouchableOpacity, StyleSheet, KeyboardAvoidingView,
  Platform, ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useTheme } from '@/src/context/ThemeContext';
import { useExperts } from '@/src/context/ExpertsContext';
import { useRequests } from '@/src/context/RequestsContext';
import Toast from 'react-native-toast-message';

const SESSION_TYPES = [
  { id: 'remote',   label: 'Remote session',    sub: 'Video or phone call' },
  { id: 'onsite',   label: 'On-site help',       sub: 'Expert comes to you' },
  { id: 'ongoing',  label: 'Ongoing mentorship', sub: 'Regular check-ins' },
];

const TIMING_OPTIONS = [
  { id: 'asap',    label: 'As soon as possible' },
  { id: 'week',    label: 'Within the next week' },
  { id: 'month',   label: 'Within the next month' },
  { id: 'flexible', label: "I'm flexible" },
];

export default function RequestSessionScreen() {
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getById, isLoading } = useExperts();
  const expert = getById(id);

  const expertName = expert?.name ?? '';
  const expertHeadline = expert?.title ?? '';

  const [headline, setHeadline] = useState('');
  const [description, setDescription] = useState('');
  const [sessionType, setSessionType] = useState<string | null>(null);
  const [timing, setTiming] = useState<string | null>(null);
  const [headlineFocused, setHeadlineFocused] = useState(false);
  const [descFocused, setDescFocused] = useState(false);
  const [descTouched, setDescTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { addRequest } = useRequests();

  const isValid =
    headline.trim().length > 10 &&
    description.trim().length >= 50 &&
    sessionType !== null &&
    timing !== null;

  const handleSubmit = async () => {
    if (!isValid || !expert || submitting) return;
    setSubmitting(true);
    try {
      await addRequest({
        id: '', // Will be assigned by backend
        expertId: expert.id,
        userMessage: `${headline.trim()}\n\n${description.trim()}`,
        engagementType: sessionType as 'remote' | 'onsite' | 'ongoing',
        timingPreference: timing as 'asap' | 'week' | 'month' | 'flexible',
        projectTitle: headline.trim(),
        status: 'pending',
      });
      Toast.show({
        type: 'success',
        text1: 'Request sent!',
        text2: `${expertName.split(' ')[0]} will be notified`,
      });
      setTimeout(() => router.replace('/(user)/(tabs)'), 800);
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Could not send request',
        text2: (error as Error).message || 'Please try again.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!expert) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <Text style={{ color: colors.textPrimary, fontSize: 16 }}>Expert not found</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >

        {/* Expert mini card — who they're writing TO */}
        <View style={[styles.expertCard, { backgroundColor: '#FAEEDA' }]}>
          <View style={styles.expertAvatar}>
            <Text style={styles.expertInitials}>
              {String(expertName || '').charAt(0)}
            </Text>
          </View>
          <View style={styles.expertInfo}>
            <Text style={[styles.expertCardName, { color: '#412402' }]}>
              {expertName}
            </Text>
            <Text style={[styles.expertCardHeadline, { color: '#633806' }]}>
              {expertHeadline}
            </Text>
          </View>
        </View>

        {/* Intro line */}
        <Text style={[styles.intro, { color: colors.textSecondary }]}>
          Tell {String(expertName || 'the expert').split(' ')[0]} what 
          you need help with. Be as specific as you can.
        </Text>

        {/* Field 1 — What do you need help with */}
        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>
            What do you need help with?
          </Text>
          <TextInput
            value={headline}
            onChangeText={setHeadline}
            onFocus={() => setHeadlineFocused(true)}
            onBlur={() => setHeadlineFocused(false)}
            placeholder="e.g. Understanding cash flow for my early stage startup"
            placeholderTextColor={colors.textMuted}
            maxLength={100}
            style={[
              styles.input,
              {
                backgroundColor: colors.surface,
                borderColor: headlineFocused ? '#BA7517' : colors.border,
                color: colors.textPrimary,
                // Focus ring
                shadowColor: headlineFocused ? '#BA7517' : 'transparent',
                shadowOpacity: headlineFocused ? 0.15 : 0,
                shadowRadius: 4,
                elevation: 0,
              },
            ]}
          />
          <Text style={[styles.counter, { color: colors.textMuted }]}>
            {headline.length}/100
          </Text>
        </View>

        {/* Field 2 — More detail */}
        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>
            Tell us more about your situation
          </Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            onFocus={() => { setDescFocused(true); setDescTouched(true); }}
            onBlur={() => setDescFocused(false)}
            placeholder={
              "Share as much context as you can.\n\n" +
              "What have you already tried? What's the specific challenge? " +
              "The more detail you give, the more valuable your session will be."
            }
            placeholderTextColor={colors.textMuted}
            multiline
            maxLength={500}
            textAlignVertical="top"
            style={[
              styles.textarea,
              {
                backgroundColor: colors.surface,
                borderColor: descFocused ? '#BA7517' : colors.border,
                color: colors.textPrimary,
                shadowColor: descFocused ? '#BA7517' : 'transparent',
                shadowOpacity: descFocused ? 0.15 : 0,
                shadowRadius: 4,
              },
            ]}
          />
          {(descTouched || description.length > 0) && (
            <Text style={[
              styles.counter,
              {
                color: description.length < 50
                  ? '#E24B4A'
                  : colors.textMuted
              }
            ]}>
              {description.length < 50
                ? `${50 - description.length} more characters needed`
                : `${description.length}/500`
              }
            </Text>
          )}
        </View>

        {/* Field 3 — Session type */}
        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>
            What type of session are you looking for?
          </Text>
          {SESSION_TYPES.map((type) => {
            const isSelected = sessionType === type.id;
            return (
              <TouchableOpacity
                key={type.id}
                onPress={() => setSessionType(type.id)}
                style={[
                  styles.optionRow,
                  {
                    backgroundColor: isSelected ? '#FAEEDA' : colors.surface,
                    borderColor: isSelected ? '#BA7517' : colors.border,
                  },
                ]}
                accessibilityRole="radio"
                accessibilityState={{ selected: isSelected }}
              >
                <View style={styles.optionText}>
                  <Text style={[
                    styles.optionLabel,
                    { color: isSelected ? '#412402' : colors.textPrimary }
                  ]}>
                    {type.label}
                  </Text>
                  <Text style={[
                    styles.optionSub,
                    { color: isSelected ? '#633806' : colors.textMuted }
                  ]}>
                    {type.sub}
                  </Text>
                </View>
                <View style={[
                  styles.radio,
                  {
                    borderColor: isSelected ? '#BA7517' : colors.border,
                    backgroundColor: isSelected ? '#BA7517' : 'transparent',
                  }
                ]}>
                  {isSelected && (
                    <View style={styles.radioDot} />
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Field 4 — Timing */}
        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>
            When do you need help?
          </Text>
          <View style={styles.timingGrid}>
            {TIMING_OPTIONS.map((option) => {
              const isSelected = timing === option.id;
              return (
                <TouchableOpacity
                  key={option.id}
                  onPress={() => setTiming(option.id)}
                  style={[
                    styles.timingChip,
                    {
                      backgroundColor: isSelected ? '#FAEEDA' : colors.surface,
                      borderColor: isSelected ? '#BA7517' : colors.border,
                    },
                  ]}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: isSelected }}
                >
                  <Text style={[
                    styles.timingLabel,
                    { color: isSelected ? '#633806' : colors.textSecondary }
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Bottom spacing for button */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Sticky submit button */}
      <View style={[
        styles.footer,
        { backgroundColor: colors.background, borderTopColor: colors.border }
      ]}>
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={!isValid}
          style={[
            styles.submitBtn,
            { backgroundColor: isValid ? '#BA7517' : '#E4E2DB' }
          ]}
          accessibilityRole="button"
          accessibilityLabel="Send session request"
          accessibilityState={{ disabled: !isValid }}
        >
          <Text style={[
            styles.submitText,
            { color: isValid ? '#FFFFFF' : '#9E9B91' }
          ]}>
            Send Request →
          </Text>
        </TouchableOpacity>
        <Text style={[styles.footerNote, { color: colors.textMuted }]}>
          {expertName.split(' ')[0] || 'The expert'} typically
          responds within 24 hours
        </Text>
      </View>

    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    padding: 20,
    paddingTop: 16,
  },
  expertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 12,
    marginBottom: 20,
  },
  expertAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#BA7517',
    alignItems: 'center',
    justifyContent: 'center',
  },
  expertInitials: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 18,
    color: '#FFFFFF',
  },
  expertInfo: { flex: 1 },
  expertCardName: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 15,
    marginBottom: 2,
  },
  expertCardHeadline: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 12,
    lineHeight: 17,
  },
  intro: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 24,
  },
  field: {
    marginBottom: 24,
  },
  label: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 14,
    marginBottom: 8,
  },
  input: {
    height: 48,
    paddingHorizontal: 14,
    borderWidth: 0.5,
    borderRadius: 10,
    fontSize: 16,       // Never below 16 — prevents iOS zoom
    fontFamily: 'DMSans_400Regular',
  },
  textarea: {
    height: 140,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 0.5,
    borderRadius: 10,
    fontSize: 16,
    fontFamily: 'DMSans_400Regular',
    lineHeight: 24,
  },
  counter: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 11,
    marginTop: 4,
    textAlign: 'right',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 10,
    borderWidth: 0.5,
    marginBottom: 8,
  },
  optionText: { flex: 1 },
  optionLabel: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 14,
    marginBottom: 2,
  },
  optionSub: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 12,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  timingGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timingChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 9999,
    borderWidth: 0.5,
  },
  timingLabel: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 13,
  },
  footer: {
    padding: 16,
    paddingBottom: 32,
    borderTopWidth: 0.5,
  },
  submitBtn: {
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  submitText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 16,
  },
  footerNote: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 12,
    textAlign: 'center',
  },
});
