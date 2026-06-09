import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import { io, Socket } from "socket.io-client";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ACCESS_TOKEN_KEY } from "../services/apiClient";
import { getConversations, getMessages, markAsRead as markAsReadApi } from "../services/chatApi";
import { Conversation, Message } from "../types/chat";
import { useAuth } from "./AuthContext";

const API_BASE =
  process.env.EXPO_PUBLIC_API_BASE_URL?.replace("/api/v1", "") ||
  (Platform.OS === "android"
    ? "http://10.0.2.2:4000"
    : "http://localhost:4000");

type ChatContextType = {
  conversations: Conversation[];
  activeConversationId: string | null;
  setActiveConversationId: (id: string | null) => void;
  messages: Message[];
  totalUnreadCount: number;
  typingUsers: Record<string, string>; // conversationId -> userId
  sendMessage: (conversationId: string, text: string) => void;
  emitTyping: (conversationId: string) => void;
  markAsRead: (conversationId: string) => void;
  loadMoreMessages: (conversationId: string) => Promise<void>;
};

const ChatContext = createContext<ChatContextType | null>(null);

export const ChatProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [typingUsers, setTypingUsers] = useState<Record<string, string>>({});
  
  // Refresh conversations
  const fetchConversations = useCallback(async () => {
    try {
      const data = await getConversations();
      // Sort by most recent message first (newest at top)
      const sorted = data.sort((a, b) => {
        const aTime = a.lastMessage?.sentAt ? new Date(a.lastMessage.sentAt).getTime() : 0;
        const bTime = b.lastMessage?.sentAt ? new Date(b.lastMessage.sentAt).getTime() : 0;
        return bTime - aTime;
      });
      setConversations(sorted);
    } catch (err) {
      console.log("Failed to fetch conversations", err);
    }
  }, []);

  useEffect(() => {
    if (!user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      setConversations([]);
      setMessages([]);
      return;
    }

    let newSocket: Socket;
    (async () => {
      const token = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
      if (!token) return;

      newSocket = io(API_BASE, {
        auth: { token },
        transports: ["websocket"],
      });

      newSocket.on("connect", () => {
        fetchConversations();
      });

      newSocket.on("chat:receive", (message: Message) => {
        setMessages((prev) => {
          if (prev.find((m) => m._id === message._id)) return prev;
          return [...prev, message].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        });
        fetchConversations();
      });

      newSocket.on("chat:new_conversation", (conversation: Conversation) => {
        fetchConversations();
      });

      newSocket.on("chat:read", (data: { conversationId: string, readAt: string }) => {
        setMessages((prev) => 
          prev.map((m) => 
            m.conversation === data.conversationId && !m.readAt 
              ? { ...m, readAt: data.readAt } 
              : m
          )
        );
      });

      newSocket.on("chat:typing", (data: { conversationId: string, userId: string }) => {
        setTypingUsers((prev) => ({ ...prev, [data.conversationId]: data.userId }));
        setTimeout(() => {
          setTypingUsers((prev) => {
            const next = { ...prev };
            delete next[data.conversationId];
            return next;
          });
        }, 3000);
      });

      setSocket(newSocket);
    })();

    return () => {
      if (newSocket) newSocket.disconnect();
    };
  }, [user, fetchConversations]);

  useEffect(() => {
    if (activeConversationId) {
      getMessages(activeConversationId).then((data) => {
        setMessages(data); // Sorted chronologically by the backend
      }).catch(console.error);
    }
  }, [activeConversationId]);

  const sendMessage = useCallback((conversationId: string, text: string) => {
    if (socket) {
      socket.emit("chat:send", { conversationId, text }, (response: any) => {
        // Optional acknowledgment handling
      });
    }
  }, [socket]);

  const emitTyping = useCallback((conversationId: string) => {
    if (socket) {
      socket.emit("chat:typing", { conversationId });
    }
  }, [socket]);

  const markAsRead = useCallback((conversationId: string) => {
    if (socket) {
      socket.emit("chat:read", { conversationId });
      markAsReadApi(conversationId).then(() => fetchConversations()).catch(console.error);
    }
  }, [socket, fetchConversations]);

  const loadMoreMessages = useCallback(async (conversationId: string) => {
    if (messages.length > 0) {
      const oldestMessage = messages[0];
      const olderMessages = await getMessages(conversationId, oldestMessage._id);
      if (olderMessages.length > 0) {
        setMessages((prev) => [...olderMessages, ...prev]);
      }
    }
  }, [messages]);

  const totalUnreadCount = useMemo(() => {
    return conversations.reduce((acc, conv) => acc + (conv.unreadCount || 0), 0);
  }, [conversations]);

  return (
    <ChatContext.Provider value={{
      conversations,
      activeConversationId,
      setActiveConversationId,
      messages: messages.filter(m => m.conversation === activeConversationId),
      totalUnreadCount,
      typingUsers,
      sendMessage,
      emitTyping,
      markAsRead,
      loadMoreMessages,
    }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) throw new Error("useChat must be used within ChatProvider");
  return context;
};
