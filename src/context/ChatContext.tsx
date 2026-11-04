import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import { io, Socket } from "socket.io-client";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ACCESS_TOKEN_KEY, API_ORIGIN, refreshAccessToken } from "../services/apiClient";
import { getConversations, getMessages, markAsRead as markAsReadApi } from "../services/chatApi";
import { Conversation, Message } from "../types/chat";
import { useAuth } from "./AuthContext";

// The socket lives on the same server as the API unless .env says otherwise
const API_BASE = process.env.EXPO_PUBLIC_SOCKET_URL || API_ORIGIN;

type ChatContextType = {
  conversations: Conversation[];
  activeConversationId: string | null;
  setActiveConversationId: (id: string | null) => void;
  messages: Message[];
  totalUnreadCount: number;
  typingUsers: Record<string, string>; // conversationId -> userId
  /** Resolves true once the server has stored the message, false if it could not be sent */
  sendMessage: (conversationId: string, text: string) => Promise<boolean>;
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

      let authRetries = 0;
      newSocket = io(API_BASE, {
        // Read the token on every (re)connect so a refreshed access token is picked up
        auth: async (cb) => cb({ token: await AsyncStorage.getItem(ACCESS_TOKEN_KEY) }),
        transports: ["websocket"],
      });

      newSocket.on("connect", () => {
        authRetries = 0;
        fetchConversations();
      });

      // The server rejected the handshake (usually an expired access token); the client
      // does not retry these on its own, so refresh the token and reconnect.
      newSocket.on("connect_error", async () => {
        if (newSocket.active || authRetries >= 1) return;
        authRetries += 1;
        const nextToken = await refreshAccessToken();
        if (nextToken) newSocket.connect();
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

  const sendMessage = useCallback(
    (conversationId: string, text: string) =>
      new Promise<boolean>((resolve) => {
        if (!socket?.connected) {
          resolve(false);
          return;
        }
        // No answer from the server within 10s counts as not sent
        const timer = setTimeout(() => resolve(false), 10_000);
        socket.emit("chat:send", { conversationId, text }, (response: any) => {
          clearTimeout(timer);
          if (response?.success && response?.message) {
            setMessages((prev) => {
              if (prev.find((m) => m._id === response.message._id)) return prev;
              return [...prev, response.message].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
            });
            fetchConversations();
            resolve(true);
          } else {
            resolve(false);
          }
        });
      }),
    [socket, fetchConversations]
  );

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
