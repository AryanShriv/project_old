import type { Href } from "expo-router";
import { Redirect, router, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import Toast from "react-native-toast-message";

import { useAuth } from "../../src/context/AuthContext";
import { useFreelancers } from "../../src/context/FreelancersContext";
import { useRequests } from "../../src/context/RequestsContext";
import { useTheme } from "../../src/context/ThemeContext";
import { ThemeColors } from "../../src/design-system/colors";
import { radius } from "../../src/design-system/radius";
import { spacing } from "../../src/design-system/spacing";

export default function BookingRequestScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user, isLoading } = useAuth();
  const { getById } = useFreelancers();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const freelancer = getById(id);

  const { addRequest } = useRequests();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [budget, setBudget] = useState("");

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!freelancer) {
    return (
      <View style={styles.center}>
        <Text style={{ color: colors.textPrimary }}>Freelancer not found</Text>
      </View>
    );
  }

  if (!user || user.role !== "client") {
    return (
      <Redirect
        href={
          {
            pathname: "/(auth)/login",
            params: {
              intent: "client",
              returnTo: `/booking/${id}`,
            },
          } as Href
        }
      />
    );
  }

  const handleSubmit = async () => {
    try {
      await addRequest({
        id: Date.now().toString(),
        freelancerId: freelancer.id,
        projectTitle: title || "Untitled Project",
        status: "pending",
        clientName: user.name,
      });

      Toast.show({
        type: "success",
        text1: "Request Sent",
        text2: `Your request was sent to ${freelancer.name}`,
      });

      setTimeout(() => {
        router.back();
      }, 1000);
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Could not send request",
        text2: (error as Error).message || "Please try again.",
      });
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={styles.heading}>Consultation Request</Text>

      <View style={styles.freelancerBlock}>
        <Text style={styles.freelancerName}>{freelancer.name}</Text>
        <Text style={styles.freelancerTitle}>{freelancer.title}</Text>
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Project Title</Text>
        <TextInput
          placeholder="Landing page redesign"
          placeholderTextColor={colors.textMuted}
          style={styles.input}
          value={title}
          onChangeText={setTitle}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Project Description</Text>
        <TextInput
          placeholder="Describe the project..."
          placeholderTextColor={colors.textMuted}
          style={[styles.input, styles.textarea]}
          multiline
          value={description}
          onChangeText={setDescription}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Budget</Text>
        <TextInput
          placeholder="$500"
          placeholderTextColor={colors.textMuted}
          style={styles.input}
          value={budget}
          onChangeText={setBudget}
        />
      </View>

      <Pressable style={styles.button} onPress={handleSubmit}>
        <Text style={styles.buttonText}>Send Request</Text>
      </Pressable>
    </ScrollView>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  content: {
    padding: spacing.xl,
  },

  heading: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: spacing.xl,
    color: colors.textPrimary,
  },

  freelancerBlock: {
    marginBottom: spacing.xl,
  },

  freelancerName: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.textPrimary,
  },

  freelancerTitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },

  field: {
    marginBottom: spacing.lg,
  },

  label: {
    fontSize: 13,
    marginBottom: spacing.sm,
    color: colors.textSecondary,
  },

  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: 14,
    backgroundColor: colors.surface,
    color: colors.textPrimary,
  },

  textarea: {
    height: 120,
    textAlignVertical: "top",
  },

  button: {
    marginTop: spacing.xl,
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: radius.md,
    alignItems: "center",
  },

  buttonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 15,
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
  },
});

