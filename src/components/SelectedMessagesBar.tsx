import React from "react";
import { ArrowLeftOutlined, StarOutlined, DeleteOutlined, MoreOutlined } from "@ant-design/icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faShare } from "@fortawesome/free-solid-svg-icons";
import { ChatMessage } from "../utilss/types";

interface SelectedMessagesBarProps {
  count: number;
  onBack: () => void;
  onDelete: () => void;
  onForward: () => void;
  onMore: () => void;
  starMessages: (action: 'star' | 'unstar') => void;
  currentSelectedMessages: ChatMessage[];
  userId: string | null;
}

const SelectedMessagesBar: React.FC<SelectedMessagesBarProps> = ({
  count,
  onBack,
  onDelete,
  onForward,
  onMore,
  starMessages,
  currentSelectedMessages,
  userId,
}) => {
  if (count <= 0) return null;

  const allStarred = currentSelectedMessages.every(
    msg =>
      (msg.sender.id === userId && msg.isStarredByCurrentUser) ||
      (msg.sender.id !== userId && msg.isStarredByOtherUser)
  );

  const shouldUnstar = allStarred;

  return (
    <div className="bg-white p-4 shadow-md absolute top-0 left-0 w-full z-50">
      <div className="flex flex-wrap items-center justify-between gap-y-4 gap-x-4">
        <div className="flex items-center">
          <ArrowLeftOutlined className="text-2xl cursor-pointer" onClick={onBack} />
        </div>

        <div className="flex-grow text-center sm:text-left">
          <p className="font-bold text-lg sm:text-xl">{count}</p>
        </div>

        <div className="flex items-center gap-8 sm:gap-16">
          {shouldUnstar ? (
            <svg
              onClick={() => starMessages('unstar')}
              className="w-6 h-6 text-yellow-500 cursor-pointer"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.518 4.674a1 1 0 00.95.69h4.905c.969 0 1.371 1.24.588 1.81l-3.97 2.882a1 1 0 00-.364 1.118l1.518 4.674c.3.921-.755 1.688-1.538 1.118l-3.97-2.882a1 1 0 00-1.176 0l-3.97 2.882c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.364-1.118L2.49 10.101c-.783-.57-.38-1.81.588-1.81h4.905a1 1 0 00.95-.69l1.518-4.674z"
              />
              <line x1="3" y1="3" x2="21" y2="21" stroke="red" strokeWidth="2" />
            </svg>
          ) : (
            <StarOutlined
              className="text-2xl text-gray-600 hover:text-yellow-500 cursor-pointer"
              onClick={() => starMessages('star')}
            />
          )}
          <DeleteOutlined className="text-2xl text-gray-600 hover:text-red-500 cursor-pointer" onClick={onDelete} />
          <FontAwesomeIcon
            icon={faShare}
            className="text-2xl text-gray-600 hover:text-blue-500 cursor-pointer"
            onClick={onForward}
          />
          <MoreOutlined className="text-3xl cursor-pointer" onClick={onMore} />
        </div>
      </div>
    </div>
  );
};

export default SelectedMessagesBar;
