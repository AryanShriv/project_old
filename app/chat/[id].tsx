import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { FlatList, Keyboard, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "@/src/context/AuthContext";
import { useChat } from "@/src/context/ChatContext";
import { useTheme } from "@/src/context/ThemeContext";
import { spacing } from "@/src/design-system/spacing";
import { typography } from "@/src/design-system/typography";

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { 
    conversations, 
    messages, 
    sendMessage, 
    setActiveConversationId, 
    markAsRead, 
    emitTyping, 
    typingUsers 
  } = useChat();
  const { colors } = useTheme();

  const [inputText, setInputText] = useState("");
  const flatListRef = useRef<FlatList>(null);

  const conversation = conversations.find(c => c._id === id);
  const otherParticipant = conversation?.participants.find(p => p._id !== user?.id) || conversation?.participants[0];

  useEffect(() => {
    if (id) {
      setActiveConversationId(id);
      markAsRead(id);
    }
    return () => setActiveConversationId(null);
  }, [id, setActiveConversationId, markAsRead]);

  const handleSend = () => {
    if (inputText.trim() && id) {
      sendMessage(id, inputText.trim());
      setInputText("");
      Keyboard.dismiss();
    }
  };

  const handleTextChange = (text: string) => {
    setInputText(text);
    if (id) {
      emitTyping(id);
    }
  };

  const renderMessage = ({ item }: { item: any }) => {
    const isOwn = item.sender === user?.id;
    return (
      <View style={[
        styles.messageBubble, 
        isOwn ? [styles.ownMessage, { backgroundColor: colors.primary }] : [styles.otherMessage, { backgroundColor: colors.surface, borderColor: colors.border }]
      ]}>
        <Text style={[styles.messageText, isOwn ? styles.ownMessageText : { color: colors.textPrimary }]}>
          {item.text}
        </Text>
        <View style={styles.messageMeta}>
          <Text style={[styles.messageTime, isOwn ? styles.ownMessageTime : { color: colors.textMuted }]}>
            {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
          {isOwn && (
            <Ionicons 
              name="checkmark-done" 
              size={14} 
              color={item.readAt ? colors.primaryMuted : "rgba(255,255,255,0.6)"} 
              style={{ marginLeft: 4 }} 
            />
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={["bottom"]}>
      <Stack.Screen 
        options={{
          title: otherParticipant?.profile?.fullName || otherParticipant?.email || "Chat",
          headerTitleAlign: "center",
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.textPrimary,
          headerTitleStyle: { fontWeight: "600" },
          headerShadowVisible: false,
        }} 
      />
      
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item._id}
          renderItem={renderMessage}
          contentContainerStyle={styles.messageList}
          inverted={false}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
        />
        
        {typingUsers[id!] && (
          <View style={styles.typingIndicator}>
            <Text style={[styles.typingText, { color: colors.textMuted }]}>User is typing...</Text>
          </View>
        )}

        <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
          <TextInput
            style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.textPrimary }]}
            value={inputText}
            onChangeText={handleTextChange}
            placeholder="Type a message..."
            placeholderTextColor={colors.textMuted}
            multiline
            maxLength={2000}
          />
          <Pressable 
            style={[styles.sendButton, { backgroundColor: colors.primary }, !inputText.trim() && { backgroundColor: colors.border }]}
            onPress={handleSend}
            disabled={!inputText.trim()}
          >
            <Ionicons name="send" size={20} color="#fff" />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  messageList: {
    padding: spacing.md,
    flexGrow: 1,
    justifyContent: "flex-end",
  },
  messageBubble: {
    maxWidth: "80%",
    padding: 12,
    borderRadius: 16,
    marginBottom: spacing.sm,
  },
  ownMessage: {
    alignSelf: "flex-end",
    borderBottomRightRadius: 4,
  },
  otherMessage: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    ...typography.body,
    marginBottom: 4,
  },
  ownMessageText: {
    color: "#fff",
  },
  otherMessageText: {
  },
  messageMeta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  messageTime: {
    ...typography.caption,
  },
  ownMessageTime: {
    color: "rgba(255, 255, 255, 0.7)",
  },
  otherMessageTime: {
  },
  typingIndicator: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xs,
  },
  typingText: {
    ...typography.caption,
    fontStyle: "italic",
  },
  inputContainer: {
    flexDirection: "row",
    padding: spacing.sm,
    borderTopWidth: 1,
    alignItems: "flex-end",
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: spacing.md,
    paddingTop: 10,
    paddingBottom: 10,
    minHeight: 40,
    maxHeight: 120,
    ...typography.body,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: spacing.sm,
    marginBottom: 2,
  },
  sendButtonDisabled: {
  },
});
