import React from "react";
import { CHAT_UPLOAD_PREFIX, CHAT_UPLOAD_FILE_PREFIX, CHAT_UPLOAD_AUDIO_PREFIX } from "../utilss/types";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileAlt, faHeadphones } from '@fortawesome/free-solid-svg-icons';

interface ReplyCardProps {
    showReplyCard: boolean;
    storedReplyMessage: {
        senderId: string;
        content: string;
        fileOriginalName: string;
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

                <p className="font-semibold mb-2">
                    {storedReplyMessage.senderId === userId ? "You" : "Other User"}
                </p>

                {storedReplyMessage.content.startsWith(CHAT_UPLOAD_PREFIX) ? (
                    <img
                        src={`http://localhost:5002${storedReplyMessage.content}`}
                        alt="Reply preview"
                        className="w-20 h-20 object-cover object-top rounded-lg border border-gray-300 shadow-md cursor-pointer transition-transform hover:scale-105"
                        onClick={() =>
                            openImage(`http://localhost:5002${storedReplyMessage.content}`)
                        }
                    />
                ) : storedReplyMessage.content.startsWith(CHAT_UPLOAD_FILE_PREFIX) ? (
                    <div className="flex items-center gap-3 overflow-hidden">
                        <FontAwesomeIcon icon={faFileAlt} className="text-blue-600 text-xl" />
                        <span
                            onClick={() =>
                                window.open(`http://localhost:5002${storedReplyMessage.content}`, "_blank")
                            }
                            className="text-sm text-gray-700 truncate max-w-xs focus:outline-none bg-transparent border-none p-0 text-left hover:bg-gray-100"
                        >
                            {storedReplyMessage.fileOriginalName || "View File"}
                        </span>
                    </div>

                ) : storedReplyMessage.content.startsWith(CHAT_UPLOAD_AUDIO_PREFIX) ? (
                    <div className="flex items-center gap-3 overflow-hidden">
                        <FontAwesomeIcon icon={faHeadphones} className="text-blue-600 text-xl" />
                        <span className="text-sm text-gray-600">Audio - {storedReplyMessage.fileOriginalName}</span>
                    </div>

                ) : (
                    <p>{storedReplyMessage.content}</p>
                )}
            </div>
        </div>
    );
};

export default ReplyCard;
