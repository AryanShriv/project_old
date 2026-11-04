import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useMemo } from "react";
import {
    Pressable,
    StyleProp,
    Text,
    View,
    ViewStyle,
} from "react-native";
import Toast from "react-native-toast-message";

import { Avatar } from "@/src/components/Avatar/Avatar";
import { useAuth } from "@/src/context/AuthContext";
import { useTheme } from "@/src/context/ThemeContext";
import { useSaved } from "../../context/SavedContext";

import { signInToContinue } from "../../utils/reentry";
import { createStyles } from "./styles";

type ExpertCardProps = {
  id: string;
  name: string;
  title: string;
  yearsExperience: string;
  tagline: string;
  sessionPrice: string;
  avatar: string;
  recommendedCount?: number;
  reviewCount?: number;
  verified?: boolean;
  /** PRD 5.4 */
  founderBadge?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
};

export const ExpertCard: React.FC<ExpertCardProps> = ({
  id,
  name,
  title,
  yearsExperience,
  tagline,
  sessionPrice,
  avatar,
  recommendedCount = 0,
  reviewCount = 0,
  verified = false,
  founderBadge = false,
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
      // Signs in, then lands on this expert's profile with them saved (PRD 5.3)
      signInToContinue(id, "save", "list");
      return;
    }
    toggleSave(id)
      .then(() =>
        Toast.show({
          type: "success",
          text1: saved ? "Removed from Saved" : "Saved",
          text2: saved ? undefined : "Find them any time in your Saved tab.",
        })
      )
      .catch((error: Error) => Toast.show({ type: "error", text1: "Couldn't update Saved", text2: error.message }));
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
          <Avatar uri={avatar} name={name} size={56} verified={verified} />
        </View>
        <View style={styles.nameBlock}>
          <Text style={styles.name} numberOfLines={1}>
            {name}
          </Text>
          <Text style={styles.title} numberOfLines={2}>
            {title}
          </Text>
        </View>
        <Pressable
          onPress={onSave}
          style={styles.saveButton}
          accessibilityRole="button"
          accessibilityLabel={saved ? `Remove ${name} from saved` : `Save ${name}`}
        >
          <Ionicons
            name={saved ? "bookmark" : "bookmark-outline"}
            size={22}
            color={saved ? colors.primary : colors.textSecondary}
          />
        </Pressable>
      </View>

      <View style={styles.badgeRow}>
        {founderBadge && (
          <View style={styles.badge}>
            <Ionicons name="ribbon" size={14} color={colors.primary} />
            <Text style={styles.badgeText}>Founding Expert</Text>
          </View>
        )}
        {verified && (
          <View style={styles.badge}>
            <Ionicons name="shield-checkmark" size={14} color={colors.primary} />
            <Text style={styles.badgeText}>Verified</Text>
          </View>
        )}
        <View style={styles.badge}>
          <Ionicons name="thumbs-up-outline" size={14} color={colors.success} />
          <Text style={styles.badgeText}>
            {reviewCount > 0 ? `${Math.round((recommendedCount / reviewCount) * 100)}% recommend` : "New expert"}
          </Text>
        </View>
        {Number(yearsExperience) > 0 && (
          <View style={styles.badge}>
            <Ionicons name="briefcase-outline" size={14} color={colors.textSecondary} />
            <Text style={styles.badgeText}>{yearsExperience} yrs</Text>
          </View>
        )}
      </View>

      <Text numberOfLines={2} style={styles.tagline}>
        {tagline}
      </Text>

      <View style={styles.footer}>
        {sessionPrice ? (
          <Text style={styles.rate}>
            {sessionPrice}
            <Text style={styles.rateSuffix}> / session</Text>
          </Text>
        ) : (
          <View />
        )}
        <View style={styles.button}>
          <Text style={styles.buttonText}>View profile</Text>
        </View>
      </View>
    </Pressable>
  );
};
