import { Ionicons } from "@expo/vector-icons";
import React, { useMemo } from "react";
import { Text, View } from "react-native";

import { Avatar } from "@/src/components/Avatar/Avatar";
import { useTheme } from "@/src/context/ThemeContext";
import { Review } from "@/src/services/reviewsApi";
import { createStyles } from "./styles";

type Props = {
  reviews: Review[];
};

const capitalise = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

/** Reviews lead with the learner's own words; who, when and how sit underneath (PRD 4.1). No stars. */
export const ReviewList = ({ reviews }: Props) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  if (!reviews || reviews.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>
          No reviews yet. Reviews come only from people who have completed a session.
        </Text>
      </View>
    );
  }

  return (
    <View>
      {reviews.map((review) => {
        const authorName = review.userId?.profile?.fullName || "G(Old) learner";
        const words = review.whatILearned || review.comment;
        const date = new Date(review.createdAt).toLocaleDateString(undefined, {
          year: "numeric",
          month: "short",
        });
        const details = [
          review.expertStyle ? `${capitalise(review.expertStyle)} style` : null,
          review.sessionType ? `${capitalise(review.sessionType)} session` : null,
        ].filter(Boolean);

        return (
          <View key={review._id} style={styles.container}>
            {review.wouldRecommend && (
              <View style={styles.recommendBadge}>
                <Ionicons name="thumbs-up" size={14} color={colors.success} />
                <Text style={styles.recommendText}>Highly recommends</Text>
              </View>
            )}

            <Text style={styles.words}>“{words}”</Text>
            {review.whatILearned && review.comment && review.comment !== review.whatILearned ? (
              <Text style={styles.comment}>{review.comment}</Text>
            ) : null}

            <View style={styles.metaRow}>
              <Avatar uri={review.userId?.profile?.avatarUrl} name={authorName} size={32} />
              <View style={styles.metaText}>
                <Text style={styles.authorName}>{authorName}</Text>
                <Text style={styles.meta}>{[date, ...details].join(" · ")}</Text>
              </View>
            </View>
          </View>
        );
      })}
    </View>
  );
};
