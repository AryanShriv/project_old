import { Ionicons } from "@expo/vector-icons";
import React, { useMemo } from "react";
import { Image, Text, View } from "react-native";

import { useTheme } from "@/src/context/ThemeContext";
import { Review } from "@/src/services/reviewsApi";
import { createStyles } from "./styles";

type Props = {
  reviews: Review[];
};

export const ReviewList = ({ reviews }: Props) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  if (!reviews || reviews.length === 0) {
    return (
      <View style={{ padding: 20, alignItems: "center" }}>
        <Text style={{ color: colors.textMuted }}>No reviews yet.</Text>
      </View>
    );
  }

  return (
    <View>
      {reviews.map((review) => {
        const authorName = review.userId?.profile?.fullName || "Anonymous";
        const avatarUrl = review.userId?.profile?.avatarUrl;
        
        return (
          <View key={review._id} style={styles.container}>
            <View style={styles.header}>
              <View style={styles.authorRow}>
                {avatarUrl ? (
                  <Image source={{ uri: avatarUrl }} style={styles.avatar} />
                ) : (
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{authorName.charAt(0).toUpperCase()}</Text>
                  </View>
                )}
                <View>
                  <Text style={styles.authorName}>{authorName}</Text>
                  <Text style={styles.date}>
                    {new Date(review.createdAt).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </Text>
                </View>
              </View>

            </View>

            <Text style={styles.comment}>{review.comment}</Text>

            <View style={styles.tagsContainer}>
              {review.sessionType ? (
                <View style={styles.tagRow}>
                  <Text style={styles.tagLabel}>Session Type:</Text>
                  <Text style={styles.tagValue}>{review.sessionType}</Text>
                </View>
              ) : null}
              {review.whatILearned ? (
                <View style={styles.tagRow}>
                  <Text style={styles.tagLabel}>Learned:</Text>
                  <Text style={styles.tagValue}>{review.whatILearned}</Text>
                </View>
              ) : null}
              {review.expertStyle ? (
                <View style={styles.tagRow}>
                  <Text style={styles.tagLabel}>Style:</Text>
                  <Text style={styles.tagValue}>{review.expertStyle}</Text>
                </View>
              ) : null}
            </View>

            {review.wouldRecommend && (
              <View style={styles.recommendBadge}>
                <Ionicons name="checkmark-circle" size={14} color={colors.success} />
                <Text style={styles.recommendText}>Highly Recommends</Text>
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
};
