import { Ionicons } from "@expo/vector-icons";
import type { Href } from "expo-router";
import { router } from "expo-router";
import React, { useMemo } from "react";
import {
  Image,
  Pressable,
  StyleProp,
  Text,
  View,
  ViewStyle,
} from "react-native";

import { useAuth } from "@/src/context/AuthContext";
import { useSaved } from "../../context/SavedContext";
import { useTheme } from "@/src/context/ThemeContext";

import { createStyles } from "./styles";

type FreelancerCardProps = {
  id: string;
  name: string;
  title: string;
  yearsExperience: string;
  tagline: string;
  rate: string;
  avatar: string;
  verified?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
};

export const FreelancerCard: React.FC<FreelancerCardProps> = ({
  id,
  name,
  title,
  yearsExperience,
  tagline,
  rate,
  avatar,
  verified = false,
  onPress,
  style,
}) => {
  const { user } = useAuth();
  const { toggleSave, isSaved } = useSaved();
  const saved = isSaved(id);
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const onSave = () => {
    if (!user || user.role !== "client") {
      router.push({
        pathname: "/(auth)/login",
        params: {
          intent: "client",
          returnTo: "/(client)/(tabs)",
        },
      } as Href);
      return;
    }
    toggleSave(id);
  };

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.pressed, style]}
      onPress={
        onPress ??
        (() =>
          router.push({
            pathname: "/freelancer/[id]",
            params: { id },
          }))
      }
    >
      <View style={styles.headerRow}>
        <View style={styles.avatarContainer}>
          <Image source={{ uri: avatar }} style={styles.avatar} />
        </View>
        <View style={styles.nameBlock}>
          <View style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={1}>
              {name}
            </Text>
            <Pressable onPress={onSave} style={styles.saveButton} hitSlop={8}>
              <Ionicons 
                name={saved ? "bookmark" : "bookmark-outline"} 
                size={20} 
                color={saved ? colors.primary : colors.textSecondary} 
              />
            </Pressable>
          </View>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
        </View>
      </View>

      <View style={styles.badgeRow}>
        {verified && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Verified</Text>
          </View>
        )}
        <View style={styles.experienceContainer}>
          <Ionicons name="briefcase-outline" size={14} color={colors.textSecondary} />
          <Text style={styles.experienceText}>{yearsExperience} yrs</Text>
        </View>
      </View>

      <Text numberOfLines={2} style={styles.tagline}>
        {tagline}
      </Text>

      <View style={styles.footer}>
        <Text style={styles.rate}>
          {rate}<Text style={styles.rateSuffix}>/hr</Text>
        </Text>
        <View style={styles.button}>
          <Text style={styles.buttonText}>View Profile</Text>
        </View>
      </View>
    </Pressable>
  );
};

