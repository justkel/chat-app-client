import React, { RefObject } from "react";

interface Message {
  id: string;
  sender: { id: string };
  timestamp: string;
  content: string;
}

interface Props {
  showCard: boolean;
  cardRef: RefObject<HTMLDivElement>;
  selectedMessages: string[];
  messages: Message[];
  userId: string | null;
  currentSelectedMessage: Message;
  isWithinTimeLimit: (timestamp: string) => boolean;
  messageEdit: () => void;
  messageReply: () => void;
  viewMessageInfo: () => void;
}

const MessageActionCard: React.FC<Props> = ({
  showCard,
  cardRef,
  selectedMessages,
  messages,
  userId,
  currentSelectedMessage,
  isWithinTimeLimit,
  messageEdit,
  messageReply,
  viewMessageInfo,
}) => {
  if (!showCard) return null;

  const firstSelectedMessage = messages.find(
    (msg) =>
      msg.id === selectedMessages[0] &&
      !currentSelectedMessage.content.startsWith("/chat-uploads")
  );

  const showEdit =
    selectedMessages.length === 1 &&
    firstSelectedMessage &&
    isWithinTimeLimit(firstSelectedMessage.timestamp);

  const showReply =
    selectedMessages.length === 1 &&
    messages.find((msg) => msg.id === selectedMessages[0]);

  const showInfo =
    selectedMessages.length === 1 &&
    messages.find(
      (msg) => msg.id === selectedMessages[0] && msg.sender.id === userId
    );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div
        ref={cardRef}
        className="absolute top-44 right-4 bg-white shadow-md rounded-lg p-4 z-20 w-48"
      >
        <ul className="space-y-8">
          {showEdit && (
            <li
              className="cursor-pointer hover:text-blue-500"
              onClick={messageEdit}
            >
              Edit
            </li>
          )}
          {showReply && (
            <li
              className="cursor-pointer hover:text-blue-500"
              onClick={messageReply}
            >
              Reply
            </li>
          )}
          {showInfo && (
            <li
              className="cursor-pointer hover:text-blue-500"
              onClick={viewMessageInfo}
            >
              Info
            </li>
          )}
          <li className="cursor-pointer hover:text-blue-500">Copy</li>
          <li className="cursor-pointer hover:text-blue-500">Pin</li>
        </ul>
      </div>
    </div>
  );
};

export default MessageActionCard;
