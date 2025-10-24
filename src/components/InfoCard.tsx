// components/InfoCard.tsx
import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFileAlt, faHeadphones, faShare } from "@fortawesome/free-solid-svg-icons";
import { CHAT_UPLOAD_AUDIO_PREFIX, CHAT_UPLOAD_FILE_PREFIX, CHAT_UPLOAD_PREFIX } from "../utilss/types";
import AudioPlayerCustom from "./AudioPlayerCustom";

interface RepliedTo {
    id: string;
    content: string;
    fileOriginalName: string;
}

interface Message {
    id: string;
    content: string;
    timestamp: string;
    status: string;
    wasForwarded?: boolean;
    deliveredAt?: string;
    repliedTo?: RepliedTo;
    sender: {
        id: string;
    };
    fileOriginalName: string;
}

interface OtherUserData {
    getOtherUserById?: {
        username?: string;
    };
}

interface ChatSettings {
    customUsername?: string;
}

interface Props {
    showInfoCard: boolean;
    closeInfoCard: () => void;
    currentSelectedMessage: Message;
    messagesAll: Message[];
    userId: string | null;
    chatSettings?: ChatSettings;
    otherUserData?: OtherUserData;
    formatTimestamp: (timestamp: string) => string;
    formatTimestampV2: (timestamp: string) => JSX.Element;
}

const InfoCard: React.FC<Props> = ({
    showInfoCard,
    closeInfoCard,
    currentSelectedMessage,
    messagesAll,
    userId,
    chatSettings,
    otherUserData,
    formatTimestamp,
    formatTimestampV2,
}) => {
    if (!showInfoCard) return null;

    const isImage = currentSelectedMessage.content.startsWith("/chat-uploads");
    const isFile = currentSelectedMessage.content.startsWith(CHAT_UPLOAD_FILE_PREFIX);
    const isAudio = currentSelectedMessage.content.startsWith(CHAT_UPLOAD_AUDIO_PREFIX);

    const repliedToContent = currentSelectedMessage.repliedTo?.content;
    const repliedToSenderId = messagesAll.find(
        (m) => m.id === currentSelectedMessage.repliedTo?.id
    )?.sender?.id;

    const repliedToUsername =
        repliedToSenderId === userId
            ? "You"
            : chatSettings?.customUsername || otherUserData?.getOtherUserById?.username;

    const renderStatusIcon = () => {
        const status = currentSelectedMessage.status.toLowerCase() as "sent" | "delivered" | "read";
        const icons = {
            sent: (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                </svg>
            ),
            delivered: (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                    <polyline points="26 6 15 17 20 12" />
                </svg>
            ),
            read: (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-900">
                    <polyline points="20 6 9 17 4 12" />
                    <polyline points="26 6 15 17 20 12" />
                </svg>
            ),
        };

        return icons[status] || null;
    };

    return (
        <div className="absolute inset-0 h-screen w-full bg-black/50 flex justify-center z-[9999] font-montserrat">
            <div className="relative bg-gray-100 p-3 rounded-lg shadow-md w-full mx-auto text-sm text-gray-700 opacity-100 pointer-events-auto">
                <button
                    onClick={closeInfoCard}
                    className="absolute top-2 right-2 sm:top-4 sm:right-4 text-xl sm:text-2xl text-gray-500 mr-10 hover:text-gray-700 transition duration-200 ease-in-out"
                >
                    ✖
                </button>

                <p className="font-semibold text-center text-3xl mb-5">Message info</p>
                <p className="font-semibold text-center text-xl">
                    {currentSelectedMessage.timestamp && formatTimestamp(currentSelectedMessage.timestamp)}
                </p>

                <div className="flex justify-end mt-5 mr-10">
                    {isImage ? (
                        <div className="relative max-w-xs p-2 rounded-lg border border-blue-400 shadow-md transition-transform hover:scale-105">
                            {repliedToContent && (
                                <div className="p-1 mb-2 border-l-4 rounded-md text-sm w-full bg-blue-100 text-blue-900">
                                    <span className="block font-semibold opacity-80">{repliedToUsername}</span>
                                    {repliedToContent.startsWith("/chat-uploads") ? (
                                        <img
                                            src={`http://localhost:5002${repliedToContent}`}
                                            alt="reply"
                                            className="w-20 h-20 object-cover object-top rounded-md shadow"
                                        />
                                    ) : repliedToContent.startsWith(CHAT_UPLOAD_FILE_PREFIX) ? (
                                        <span
                                            onClick={() => window.open(`http://localhost:5002${repliedToContent}`, "_blank")}
                                            className="text-blue-700 underline mt-1 block truncate max-w-xs cursor-pointer hover:text-blue-800"
                                        >
                                            {currentSelectedMessage.repliedTo?.fileOriginalName || "View File"}
                                        </span>
                                    ) : repliedToContent.startsWith(CHAT_UPLOAD_AUDIO_PREFIX) ? (
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <FontAwesomeIcon icon={faHeadphones} className="text-blue-600 text-xl" />
                                            <span className="text-sm text-gray-600">Audio - {currentSelectedMessage.repliedTo?.fileOriginalName}</span>
                                        </div>
                                    ) : repliedToContent.length > 30 ? (
                                        repliedToContent.slice(0, 30) + "..."
                                    ) : (
                                        repliedToContent
                                    )}
                                </div>
                            )}

                            <img
                                src={`http://localhost:5002${currentSelectedMessage.content}`}
                                alt=""
                                className="w-full h-32 object-cover object-top rounded-lg border border-gray-300 shadow-md hover:scale-105 transition-transform"
                            />

                            <small className="block text-xs mt-1 text-right text-gray-600">
                                {new Date(currentSelectedMessage.timestamp).toLocaleString("en-GB", {
                                    hour12: false,
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    day: "2-digit",
                                    month: "2-digit",
                                    year: "numeric",
                                })}
                            </small>

                            <div className="flex items-center justify-end mt-1">{renderStatusIcon()}</div>
                        </div>
                    ) : isAudio ? (
                        <div className="relative max-w-xs text-black shadow-lg border-2 border-green-300 p-2 rounded-lg break-words hover:scale-105 hover:shadow-xl">
                            {repliedToContent && (
                                <div className="p-1 mb-2 border-l-4 rounded-md text-sm w-full bg-blue-600/50 text-white">
                                    <span className="block font-semibold opacity-80">{repliedToUsername}</span>
                                    {repliedToContent.startsWith(CHAT_UPLOAD_PREFIX) ? (
                                        <img
                                            src={`http://localhost:5002${repliedToContent}`}
                                            alt="reply"
                                            className="w-20 h-20 object-cover object-top rounded-md shadow"
                                        />
                                    ) : repliedToContent.startsWith(CHAT_UPLOAD_FILE_PREFIX) ? (
                                        <span
                                            onClick={() => window.open(`http://localhost:5002${repliedToContent}`, "_blank")}
                                            className="text-sm text-gray-700 truncate max-w-xs focus:outline-none bg-transparent border-none p-0 text-left"
                                        >
                                            {currentSelectedMessage.repliedTo?.fileOriginalName || "View File"}
                                        </span>
                                    ) : repliedToContent.startsWith(CHAT_UPLOAD_AUDIO_PREFIX) ? (
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <span className="text-sm text-gray-600">Audio - {currentSelectedMessage.repliedTo?.fileOriginalName}</span>
                                        </div>
                                    ) : repliedToContent.length > 30 ? (
                                        repliedToContent.slice(0, 30) + "..."
                                    ) : (
                                        repliedToContent
                                    )}
                                </div>
                            )}

                            <div className="flex items-center gap-3 w-full">
                                <FontAwesomeIcon icon={faHeadphones} className="text-blue-600 text-xl" />
                                <AudioPlayerCustom src={`http://localhost:5002${currentSelectedMessage.content}`} />
                            </div>

                            <small className="block text-xs mt-1 text-right text-black">
                                {new Date(currentSelectedMessage.timestamp).toLocaleString("en-GB", {
                                    hour12: false,
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    day: "2-digit",
                                    month: "2-digit",
                                    year: "numeric",
                                })}
                            </small>

                            <div className="flex items-center justify-end mt-1">{renderStatusIcon()}</div>
                        </div>
                    ) : isFile ? (
                        <div className="relative max-w-xs text-black shadow-lg border-2 border-green-300 p-2 rounded-lg break-words hover:scale-105 hover:shadow-xl">
                            {repliedToContent && (
                                <div className="p-1 mb-2 border-l-4 rounded-md text-sm w-full bg-blue-600/50 text-white">
                                    <span className="block font-semibold opacity-80">{repliedToUsername}</span>
                                    {repliedToContent.startsWith(CHAT_UPLOAD_PREFIX) ? (
                                        <img
                                            src={`http://localhost:5002${repliedToContent}`}
                                            alt="reply"
                                            className="w-20 h-20 object-cover object-top rounded-md shadow"
                                        />
                                    ) : repliedToContent.startsWith(CHAT_UPLOAD_FILE_PREFIX) ? (
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <FontAwesomeIcon icon={faFileAlt} className="text-blue-600 text-xl" />
                                            <span
                                                onClick={() => window.open(`http://localhost:5002${repliedToContent}`, "_blank")}
                                                className="text-sm text-gray-700 truncate max-w-xs focus:outline-none bg-transparent border-none p-0 text-left"
                                            >
                                                {currentSelectedMessage.repliedTo?.fileOriginalName || "View File"}
                                            </span>
                                        </div>

                                    ) : repliedToContent.startsWith(CHAT_UPLOAD_AUDIO_PREFIX) ? (
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <FontAwesomeIcon icon={faHeadphones} className="text-blue-600 text-xl" />
                                            <span className="text-sm text-gray-600">Audio - {currentSelectedMessage.repliedTo?.fileOriginalName}</span>
                                        </div>
                                    ) : repliedToContent.length > 30 ? (
                                        repliedToContent.slice(0, 30) + "..."
                                    ) : (
                                        repliedToContent
                                    )}
                                </div>
                            )}

                            <div className="flex items-center gap-3 overflow-hidden">
                                <FontAwesomeIcon icon={faFileAlt} className="ml-1 text-blue-600 text-xl" />
                                <button
                                    onClick={() => window.open(`http://localhost:5002${currentSelectedMessage.content}`, "_blank")}
                                    className="text-black font-medium mt-1 block truncate max-w-xs bg-transparent border-none p-0 text-left hover:underline focus:outline-none"
                                >
                                    {currentSelectedMessage.fileOriginalName || "View File"}
                                </button>
                            </div>

                            <small className="block text-xs mt-1 text-right text-black">
                                {new Date(currentSelectedMessage.timestamp).toLocaleString("en-GB", {
                                    hour12: false,
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    day: "2-digit",
                                    month: "2-digit",
                                    year: "numeric",
                                })}
                            </small>

                            <div className="flex items-center justify-end mt-1">{renderStatusIcon()}</div>
                        </div>
                    ) : (
                        <div className="relative max-w-xs p-4 rounded-lg shadow-lg transition-all ease-in-out transform bg-gradient-to-r from-blue-500 to-blue-700 text-white break-words hover:scale-105 hover:shadow-xl"
                            style={{
                                wordBreak: "break-word",
                                borderRadius: "16px 0 16px 16px",
                                boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
                                padding: "12px 6px",
                                transition: "all 0.3s ease",
                            }}>
                            {repliedToContent && (
                                <div className="p-1 mb-2 border-l-4 rounded-md text-sm w-full bg-blue-600/50 text-white">
                                    <span className="block font-semibold opacity-80">{repliedToUsername}</span>
                                    {repliedToContent.startsWith(CHAT_UPLOAD_PREFIX) ? (
                                        <img
                                            src={`http://localhost:5002${repliedToContent}`}
                                            alt="reply"
                                            className="w-20 h-20 object-cover object-top rounded-md shadow"
                                        />
                                    ) : repliedToContent.startsWith(CHAT_UPLOAD_FILE_PREFIX) ? (
                                        <span
                                            onClick={() => window.open(`http://localhost:5002${repliedToContent}`, "_blank")}
                                            className="text-blue-700 underline cursor-pointer hover:text-blue-800"
                                        >
                                            {currentSelectedMessage.repliedTo?.fileOriginalName || "View File"}
                                        </span>
                                    ) : repliedToContent.startsWith(CHAT_UPLOAD_AUDIO_PREFIX) ? (
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <FontAwesomeIcon icon={faHeadphones} className="text-white text-xl" />
                                            <span className="text-sm text-white">Audio - {currentSelectedMessage.repliedTo?.fileOriginalName}</span>
                                        </div>
                                    ) : repliedToContent.length > 30 ? (
                                        repliedToContent.slice(0, 30) + "..."
                                    ) : (
                                        repliedToContent
                                    )}
                                </div>
                            )}

                            {currentSelectedMessage.wasForwarded && (
                                <div className="flex items-center text-xs italic text-gray-300 mb-2">
                                    <FontAwesomeIcon icon={faShare} className="mr-1" />
                                    Forwarded
                                </div>
                            )}

                            <p className="font-semibold text-left mt-2">
                                {currentSelectedMessage.content.length > 150
                                    ? currentSelectedMessage.content.slice(0, 150) + "..."
                                    : currentSelectedMessage.content}
                            </p>

                            <small className="block text-xs mt-1 text-right text-white">
                                {new Date(currentSelectedMessage.timestamp).toLocaleString("en-GB", {
                                    hour12: false,
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    day: "2-digit",
                                    month: "2-digit",
                                    year: "numeric",
                                })}
                            </small>

                            <div className="flex items-center justify-end mt-1">{renderStatusIcon()}</div>
                        </div>
                    )}
                </div>

                <div className="flex flex-col text-lg font-semibold mt-2 mr-10">
                    <span className="flex items-center mb-7 justify-between gap-4">
                        <span className="flex items-center gap-2">
                            ✅ Read
                        </span>
                        <span className="ml-auto text-md">
                            {currentSelectedMessage.status.toLowerCase() === "read" ? "Yes" : "-"}
                        </span>
                    </span>

                    <span className="flex items-center mb-7 justify-between gap-4">
                        <span className="flex items-center gap-2">
                            📬 Delivered
                        </span>
                        <span className="text-md ml-auto">
                            {currentSelectedMessage.status.toLowerCase() !== "sent" && currentSelectedMessage.deliveredAt
                                ? formatTimestampV2(currentSelectedMessage.deliveredAt)
                                : "-"}
                        </span>
                    </span>
                </div>
            </div>
        </div>
    );
};

export default InfoCard;
