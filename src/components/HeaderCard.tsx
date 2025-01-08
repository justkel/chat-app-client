import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeftOutlined, MoreOutlined } from '@ant-design/icons';
import { Avatar } from 'antd';
import { useChatSettings } from '../hooks/useGetOtherUserContactDetails';

interface HeaderWithInlineCardProps {
  otherUserData: any;
  userId: string | null;
  otherUserId: string | null | undefined;
}

const HeaderWithInlineCard: React.FC<HeaderWithInlineCardProps> = ({ otherUserData, userId, otherUserId }) => {
  const [showCard, setShowCard] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const { data: chatSettings } = useChatSettings(userId!, otherUserId!);
  const navigate = useNavigate();

  const toggleCard = () => setShowCard((prev) => !prev);

  const handleBackNavigation = () => {
    navigate(-1);
  };

  const handleViewContact = () => {
    if (userId && otherUserId) {
      navigate(`/view-contact/${userId}/${otherUserId}`);
    }
  };

  const handleViewWallPaper = () => {
    if (userId && otherUserId) {
      navigate(`/view-wallpaper/${userId}/${otherUserId}`);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (cardRef.current && !cardRef.current.contains(event.target as Node)) {
        setShowCard(false);
      }
    };

    if (showCard) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showCard]);

  return (
    <div>
      <div className="bg-white p-4 shadow-md flex items-center justify-between fixed top-0 left-0 z-10 w-full overflow-hidden">
        <div className="flex items-center space-x-4">
          <ArrowLeftOutlined onClick={handleBackNavigation} className="text-xl cursor-pointer" />
          <Avatar src={`http://localhost:5002${otherUserData?.getOtherUserById?.profilePicture}`} />
          <div className="flex flex-col">
            <span className="font-semibold">{chatSettings?.customUsername || otherUserData?.getOtherUserById?.username}</span>
            <span className={`text-sm ${otherUserData?.getOtherUserById?.isOnline ? 'text-green-500' : 'text-gray-500'}`}>
              {otherUserData?.getOtherUserById?.isOnline ? 'Online' : 'Offline'}
            </span>
          </div>
        </div>
        <div>
          <MoreOutlined className="text-3xl cursor-pointer" onClick={toggleCard} />
        </div>
      </div>

      {showCard && (
        <div
          ref={cardRef}
          className="absolute top-44 right-4 bg-white shadow-md rounded-lg p-4 z-20 w-48"
        >
          <ul className="space-y-8">
            <li className="cursor-pointer hover:text-blue-500" onClick={handleViewContact}>
              View Contact
            </li>
            <li className="cursor-pointer hover:text-blue-500">Search</li>
            <li className="cursor-pointer hover:text-blue-500">Media</li>
            <li className="cursor-pointer hover:text-blue-500" onClick={handleViewWallPaper}>
              Wallpaper
            </li>
            <li className="cursor-pointer hover:text-blue-500">Block</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default HeaderWithInlineCard;
