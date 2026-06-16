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
import { useTheme } from "@/src/context/ThemeContext";
import { useSaved } from "../../context/SavedContext";

import { createStyles } from "./styles";

type ExpertCardProps = {
  id: string;
  name: string;
  title: string;
  yearsExperience: string;
  tagline: string;
  rate: string;
  avatar: string;
  recommendedCount?: number;
  reviewCount?: number;
  verified?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
};

export const ExpertCard: React.FC<ExpertCardProps> = ({
  id,
  name,
  title,
  yearsExperience,
  tagline,
  rate,
  avatar,
  recommendedCount = 0,
  reviewCount = 0,
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
    if (!user || user.role !== "user") {
      router.push({
        pathname: "/(auth)/login",
        params: {
          intent: "user",
          returnTo: "/(user)/(tabs)",
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
            pathname: "/expert/[id]",
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
        {reviewCount > 0 && (
          <View style={[styles.badge, { backgroundColor: 'rgba(34, 197, 94, 0.12)', flexDirection: 'row', alignItems: 'center', gap: 4 }]}>
            <Ionicons name="thumbs-up" size={12} color="#15803d" />
            <Text style={[styles.badgeText, { color: '#15803d' }]}>
              {Math.round((recommendedCount / reviewCount) * 100)}% recommend
            </Text>
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
