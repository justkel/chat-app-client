import React from "react";
import { ArrowLeftOutlined, StarOutlined, DeleteOutlined, MoreOutlined } from "@ant-design/icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faShare } from "@fortawesome/free-solid-svg-icons";

interface SelectedMessagesBarProps {
  count: number;
  onBack: () => void;
  onDelete: () => void;
  onForward: () => void;
  onMore: () => void;
}

const SelectedMessagesBar: React.FC<SelectedMessagesBarProps> = ({
  count,
  onBack,
  onDelete,
  onForward,
  onMore,
}) => {
  if (count <= 0) return null;

  return (
    <div className="bg-white p-4 shadow-md fixed top-0 left-0 z-50 w-full">
      <div className="flex flex-wrap items-center justify-between gap-y-4 gap-x-4">

        <div className="flex items-center">
          <ArrowLeftOutlined className="text-2xl cursor-pointer" onClick={onBack} />
        </div>

        <div className="flex-grow text-center sm:text-left">
          <p className="font-bold text-lg sm:text-xl">{count}</p>
        </div>

        <div className="flex items-center gap-8 sm:gap-16">
          <StarOutlined className="text-2xl text-gray-600 hover:text-yellow-500 cursor-pointer" />
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
