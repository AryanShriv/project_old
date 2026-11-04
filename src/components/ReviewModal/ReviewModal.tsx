import { Ionicons } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import Toast from "react-native-toast-message";

import { useTheme } from "@/src/context/ThemeContext";
import { ExpertStyle, reviewsApi } from "@/src/services/reviewsApi";
import { createStyles } from "./styles";

type Props = {
  visible: boolean;
  expertId: string;
  expertName?: string;
  requestId: string;
  onClose: () => void;
  onSuccess: () => void;
};

const MIN_LEARNED = 20;
const MAX_LEARNED = 1000;

const STYLE_OPTIONS: { id: ExpertStyle; label: string; hint: string }[] = [
  { id: "structured", label: "Structured", hint: "Clear steps and a plan" },
  { id: "conversational", label: "Conversational", hint: "Talked it through with me" },
  { id: "hands_on", label: "Hands-on", hint: "Showed me how" },
];

/** PRD 4.1: only reachable from a completed session. No star rating. */
export const ReviewModal = ({ visible, expertId, expertName, requestId, onClose, onSuccess }: Props) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [whatILearned, setWhatILearned] = useState("");
  const [expertStyle, setExpertStyle] = useState<ExpertStyle | null>(null);
  const [wouldRecommend, setWouldRecommend] = useState<boolean | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const learnedLength = whatILearned.trim().length;
  const isFormValid = learnedLength >= MIN_LEARNED && expertStyle !== null && wouldRecommend !== null;
  const firstName = expertName?.split(" ")[0] || "your expert";

  const handleSubmit = async () => {
    if (!isFormValid || isSubmitting || expertStyle === null || wouldRecommend === null) return;
    setIsSubmitting(true);
    try {
      await reviewsApi.submitReview(expertId, {
        requestId,
        whatILearned: whatILearned.trim(),
        expertStyle,
        wouldRecommend,
      });
      Toast.show({ type: "success", text1: "Thank you", text2: "Your review helps others find the right person." });
      onSuccess();
      onClose();
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Your review was not sent",
        text2: (error as Error).message || "Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>How was your session with {firstName}?</Text>
            <Pressable onPress={onClose} style={styles.closeButton} accessibilityRole="button" accessibilityLabel="Close">
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
            <Text style={styles.sectionTitle}>What did you learn?</Text>
            <Text style={styles.hint}>In your own words. This is what others will read first.</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. How to read a cash flow statement and spot problems early"
              placeholderTextColor={colors.textMuted}
              value={whatILearned}
              onChangeText={setWhatILearned}
              maxLength={MAX_LEARNED}
              multiline
              accessibilityLabel="What did you learn?"
            />
            <Text style={[styles.counter, learnedLength > 0 && learnedLength < MIN_LEARNED && styles.counterWarn]}>
              {learnedLength < MIN_LEARNED
                ? `${MIN_LEARNED - learnedLength} more characters needed`
                : `${whatILearned.length}/${MAX_LEARNED}`}
            </Text>

            <Text style={styles.sectionTitle}>{"How would you describe their style?"}</Text>
            <View accessibilityRole="radiogroup">
              {STYLE_OPTIONS.map((option) => {
                const selected = expertStyle === option.id;
                return (
                  <Pressable
                    key={option.id}
                    style={[styles.option, selected && styles.optionSelected]}
                    onPress={() => setExpertStyle(option.id)}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                  >
                    <Text style={[styles.optionLabel, selected && styles.optionLabelSelected]}>{option.label}</Text>
                    <Text style={styles.optionHint}>{option.hint}</Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={styles.sectionTitle}>Would you recommend {firstName}?</Text>
            <View style={styles.choiceRow} accessibilityRole="radiogroup">
              {[
                { value: true, label: "Yes" },
                { value: false, label: "No" },
              ].map(({ value, label }) => {
                const selected = wouldRecommend === value;
                return (
                  <Pressable
                    key={label}
                    style={[styles.choice, selected && styles.optionSelected]}
                    onPress={() => setWouldRecommend(value)}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                  >
                    <Ionicons
                      name={value ? "thumbs-up-outline" : "thumbs-down-outline"}
                      size={20}
                      color={selected ? colors.onPrimaryMuted : colors.textSecondary}
                    />
                    <Text style={[styles.optionLabel, selected && styles.optionLabelSelected]}>{label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <Pressable
              style={[styles.submitButton, !isFormValid && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={!isFormValid || isSubmitting}
              accessibilityRole="button"
              accessibilityState={{ disabled: !isFormValid || isSubmitting }}
            >
              {isSubmitting ? (
                <ActivityIndicator color={colors.onPrimary} />
              ) : (
                <Text style={[styles.submitText, !isFormValid && styles.submitTextDisabled]}>Share my review</Text>
              )}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};
