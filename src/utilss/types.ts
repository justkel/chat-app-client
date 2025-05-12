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
  caption?: string | null;
  fileOriginalName?: string | null;
  timestamp: Date;
  status: MessageStatus;
  senderDFM: boolean;
  receiverDFM: boolean;
  delForAll: boolean;
  isEdited: boolean;
  deliveredAt?: Date | null;
  wasForwarded: boolean;
  isStarred: boolean;
  wasSentWhileCurrentlyBlocked: boolean;
  deliveredThenBlocked: boolean;
};

export type UserTypingEvent = {
  userId: string | number;
  typing: boolean;
};

export const CHAT_UPLOAD_PREFIX = "/chat-uploads/";
export const CHAT_UPLOAD_FILE_PREFIX = "/chat-files/";
export const CHAT_UPLOAD_AUDIO_PREFIX = "/chat-audios/";