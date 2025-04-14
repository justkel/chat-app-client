import React from "react";

interface ReplyCardProps {
  showReplyCard: boolean;
  storedReplyMessage: {
    senderId: string;
    content: string;
  } | null;
  userId: string | null;
  otherUserId: string | null;
  setShowReplyCard: (val: boolean) => void;
  openImage: (url: string) => void;
}

const ReplyCard: React.FC<ReplyCardProps> = ({
  showReplyCard,
  storedReplyMessage,
  userId,
  otherUserId,
  setShowReplyCard,
  openImage,
}) => {
  if (!showReplyCard || !storedReplyMessage) return null;

  const handleClose = () => {
    localStorage.removeItem(`replyMessage_${userId}_${otherUserId}`);
    setShowReplyCard(false);
  };

  return (
    <div className="absolute bottom-16 w-full flex justify-center">
      <div className="relative bg-gray-100 p-3 rounded-lg shadow-md max-w-4xl w-full mx-auto text-sm text-gray-700 opacity-70 pointer-events-auto">
        <button
          onClick={handleClose}
          className="absolute top-2 right-2 text-xl text-gray-500 hover:text-gray-700 transition duration-200 ease-in-out"
        >
          ✖
        </button>

        <p className="font-semibold">
          {storedReplyMessage.senderId === userId ? "You" : "Other User"}
        </p>

        {storedReplyMessage.content.startsWith("/chat-uploads") ? (
          <img
            src={`http://localhost:5002${storedReplyMessage.content}`}
            alt="Reply preview"
            className="w-20 h-20 object-cover object-top rounded-lg border border-gray-300 shadow-md cursor-pointer transition-transform hover:scale-105"
            onClick={() =>
              openImage(`http://localhost:5002${storedReplyMessage.content}`)
            }
          />
        ) : (
          <p>{storedReplyMessage.content}</p>
        )}
      </div>
    </div>
  );
};

export default ReplyCard;
