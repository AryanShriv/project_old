import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { EmptyState } from "@/src/components/EmptyState/EmptyState";
import { useAuth } from "@/src/context/AuthContext";
import { useChat } from "@/src/context/ChatContext";
import { useTheme } from "@/src/context/ThemeContext";
import { spacing } from "@/src/design-system/spacing";
import { typography } from "@/src/design-system/typography";

export default function ClientMessagesScreen() {
  const { conversations } = useChat();
  const { user } = useAuth();
  const router = useRouter();
  const { colors } = useTheme();

  if (conversations.length === 0) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={["top"]}>
        <EmptyState
          icon="chatbubbles-outline"
          title="No messages yet"
          subtitle="When a freelancer accepts your request, you can start chatting here."
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={["top"]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Messages</Text>
      </View>
      <FlatList
        contentContainerStyle={styles.list}
        data={conversations}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => {
          const otherParticipant = item.participants.find((p) => p._id !== user?.id) || item.participants[0];
          const hasUnread = (item.unreadCount || 0) > 0;
          
          let lastMessageText = item.lastMessage?.text || "No messages yet";
          if (item.lastMessage?.sender === user?.id) {
            lastMessageText = `You: ${lastMessageText}`;
          }

          return (
            <Pressable
              style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => {
                // @ts-ignore
                router.push(`/chat/${item._id}`);
              }}
            >
              <Image
                source={{
                  uri: otherParticipant?.profile?.avatarUrl || 
                       `https://ui-avatars.com/api/?name=${encodeURIComponent(otherParticipant?.profile?.fullName || otherParticipant?.email || 'User')}&background=F4CF87&color=58360B`
                }}
                style={styles.avatar}
              />
              <View style={styles.content}>
                <View style={styles.topRow}>
                  <Text style={[styles.name, { color: colors.textPrimary }, hasUnread && styles.nameUnread]} numberOfLines={1}>
                    {otherParticipant?.profile?.fullName || otherParticipant?.email}
                  </Text>
                  {item.lastMessage?.sentAt && (
                    <Text style={[styles.time, { color: colors.textMuted }]}>
                      {new Date(item.lastMessage.sentAt).toLocaleDateString()}
                    </Text>
                  )}
                </View>
                <View style={styles.bottomRow}>
                  <Text style={[styles.preview, { color: colors.textSecondary }, hasUnread && [styles.previewUnread, { color: colors.textPrimary }]]} numberOfLines={1}>
                    {lastMessageText}
                  </Text>
                  {hasUnread && (
                    <View style={[styles.unreadBadge, { backgroundColor: colors.primary }]}>
                      <Text style={styles.unreadText}>{item.unreadCount}</Text>
                    </View>
                  )}
                </View>
              </View>
            </Pressable>
          );
        }}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  header: {
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
  },
  title: {
    ...typography.displaySmall,
  },
  list: {
    padding: spacing.sm,
    paddingBottom: 100, // accommodate tab bar
  },
  card: {
    flexDirection: "row",
    padding: spacing.sm,
    borderRadius: 14,
    marginBottom: spacing.sm,
    borderWidth: 1,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: spacing.sm,
  },
  content: {
    flex: 1,
    justifyContent: "center",
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  name: {
    ...typography.bodyLarge,
    fontWeight: "600",
    flex: 1,
    marginRight: spacing.xs,
  },
  nameUnread: {
    fontWeight: "700",
  },
  time: {
    ...typography.caption,
  },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  preview: {
    ...typography.body,
    flex: 1,
    marginRight: spacing.xs,
  },
  previewUnread: {
    fontWeight: "600",
  },
  unreadBadge: {
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 6,
  },
  unreadText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
});
