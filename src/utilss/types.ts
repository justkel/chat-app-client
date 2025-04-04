export enum MessageStatus {
  SENT = "SENT",
  DELIVERED = "DELIVERED",
  READ = "READ",
}

export type User = {
  id: number | string;
  email: string;
  fullName: string;
  username: string;
  firstName?: string;
  lastName?: string;
  profilePicture?: string;
  phoneNumber?: string;
  isOnline: boolean;
};

export type ChatMessage = {
  id: string;
  repliedTo?: Partial<ChatMessage> | null;
  sender: User;
  receiver: User;
  content: string;
  timestamp: Date;
  status: MessageStatus;
  senderDFM: boolean;
  receiverDFM: boolean;
  delForAll: boolean;
  isEdited: boolean;
  deliveredAt?: Date | null;
  wasForwarded: boolean;
};

export type UserTypingEvent = {
  userId: string | number;
  typing: boolean;
};