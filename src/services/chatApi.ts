import { apiRequest } from "./apiClient";
import { Conversation, Message } from "../types/chat";

export const getConversations = async (): Promise<Conversation[]> => {
  const data = await apiRequest<{ items: Conversation[] }>("/chat/conversations", { auth: true });
  return data.items;
};

export const getMessages = async (conversationId: string, cursor?: string): Promise<Message[]> => {
  const query = cursor ? `?cursor=${cursor}` : "";
  const data = await apiRequest<{ items: Message[] }>(`/chat/conversations/${conversationId}/messages${query}`, { auth: true });
  return data.items;
};

export const markAsRead = async (conversationId: string): Promise<void> => {
  await apiRequest(`/chat/conversations/${conversationId}/read`, {
    method: "POST",
    auth: true,
  });
};
