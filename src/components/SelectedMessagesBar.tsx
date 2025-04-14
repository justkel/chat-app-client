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
    <div className="bg-white p-4 shadow-md flex items-center justify-between fixed top-0 left-0 z-50 w-full overflow-hidden">
      <ArrowLeftOutlined className="text-xl cursor-pointer" onClick={onBack} />

      <p className="text-bold text-xl mr-36">
        {count}
      </p>

      <div>
        <StarOutlined className="text-2xl text-gray-600 hover:text-yellow-500 cursor-pointer mx-12" />
        <DeleteOutlined className="text-2xl text-gray-600 hover:text-red-500 cursor-pointer mx-12" onClick={onDelete} />
        <FontAwesomeIcon
          icon={faShare}
          size="lg"
          className="text-2xl text-gray-600 hover:text-blue-500 cursor-pointer mx-12"
          onClick={onForward}
        />
        <MoreOutlined className="text-3xl cursor-pointer" onClick={onMore} />
      </div>
    </div>
  );
};

export default SelectedMessagesBar;
