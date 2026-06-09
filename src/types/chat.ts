export type Conversation = {
  _id: string;
  participants: Array<{
    _id: string;
    profile?: { fullName?: string; avatarUrl?: string };
    email: string;
    role: string;
  }>;
  request: string;
  lastMessage?: {
    text: string;
    sender: string;
    sentAt: string;
  };
  unreadCount?: number;
  updatedAt: string;
};

export type Message = {
  _id: string;
  conversation: string;
  sender: string;
  text: string;
  createdAt: string;
  readAt: string | null;
};
