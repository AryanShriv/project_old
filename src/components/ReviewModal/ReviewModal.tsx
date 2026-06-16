import { Ionicons } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";

import { useTheme } from "@/src/context/ThemeContext";
import { reviewsApi } from "@/src/services/reviewsApi";
import { createStyles } from "./styles";

type Props = {
  visible: boolean;
  expertId: string;
  requestId: string;
  onClose: () => void;
  onSuccess: () => void;
};

export const ReviewModal = ({ visible, expertId, requestId, onClose, onSuccess }: Props) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [comment, setComment] = useState("");
  const [whatILearned, setWhatILearned] = useState("");
  const [expertStyle, setExpertStyle] = useState("");
  const [wouldRecommend, setWouldRecommend] = useState(true);
  const [sessionType, setSessionType] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isFormValid = comment.trim().length >= 10;

  const handleSubmit = async () => {
    if (!isFormValid) return;
    setIsSubmitting(true);
    try {
      await reviewsApi.submitReview(expertId, {
        requestId,
        comment: comment.trim(),
        whatILearned: whatILearned.trim(),
        expertStyle: expertStyle.trim(),
        wouldRecommend,
        sessionType: sessionType.trim(),
      });
      Alert.alert("Success", "Thank you for sharing your experience!");
      onSuccess();
      onClose();
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to submit review.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Write a Review</Text>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </Pressable>
          </View>

          <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>


            <Text style={styles.sectionTitle}>General Feedback *</Text>
            <TextInput
              style={styles.input}
              placeholder="How was your session? (Min 10 chars)"
              placeholderTextColor={colors.textMuted}
              value={comment}
              onChangeText={setComment}
              multiline
            />

            <Text style={styles.sectionTitle}>What did you learn?</Text>
            <TextInput
              style={[styles.input, styles.smallInput]}
              placeholder="Key takeaways..."
              placeholderTextColor={colors.textMuted}
              value={whatILearned}
              onChangeText={setWhatILearned}
              multiline
            />

            <Text style={styles.sectionTitle}>Expert's Style</Text>
            <TextInput
              style={[styles.input, styles.smallInput]}
              placeholder="e.g. Hands-on, theoretical, patient..."
              placeholderTextColor={colors.textMuted}
              value={expertStyle}
              onChangeText={setExpertStyle}
            />

            <Text style={styles.sectionTitle}>Session Type</Text>
            <TextInput
              style={[styles.input, styles.smallInput]}
              placeholder="e.g. Architecture review, Pair programming..."
              placeholderTextColor={colors.textMuted}
              value={sessionType}
              onChangeText={setSessionType}
            />

            <View style={styles.toggleRow}>
              <Text style={styles.toggleLabel}>Would you recommend this expert?</Text>
              <Switch
                value={wouldRecommend}
                onValueChange={setWouldRecommend}
                trackColor={{ false: colors.border, true: colors.primary }}
              />
            </View>
            <View style={{ height: 40 }} />
          </ScrollView>

          <View style={styles.footer}>
            <Pressable
              style={[styles.submitButton, (!isFormValid || isSubmitting) && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={!isFormValid || isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitText}>Submit Review</Text>
              )}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};
