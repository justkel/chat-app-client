import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeftOutlined,
  MoreOutlined,
  SearchOutlined,
  CloseOutlined,
  UpOutlined,
  DownOutlined,
} from '@ant-design/icons';
import { Avatar, Modal } from 'antd';
import { useChatSettings } from '../hooks/useGetOtherUserContactDetails';
import { ChatMessage } from '../utilss/types';

interface HeaderWithInlineCardProps {
  otherUserData: any;
  userId: string | null;
  otherUserId: string | null | undefined;
  handleBlockOtherUser: (action: 'block' | 'unblock') => void;
  isOtherUserBlocked: boolean;
  isUserBlocked: boolean;
  handleSearch: (searchTerm: string) => ChatMessage[];
  searchResults: ChatMessage[];
  scrollToMessage: (id: string) => void;
}

const HeaderWithInlineCard: React.FC<HeaderWithInlineCardProps> = ({
  otherUserData,
  userId,
  otherUserId,
  handleBlockOtherUser,
  isOtherUserBlocked,
  isUserBlocked,
  handleSearch,
  searchResults,
  scrollToMessage,
}) => {
  const [showCard, setShowCard] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentMatchIndex, setCurrentMatchIndex] = useState<number | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const { data: chatSettings } = useChatSettings(userId!, otherUserId!);
  const navigate = useNavigate();

  const toggleCard = () => setShowCard((prev) => !prev);
  const toggleSearchModal = () => setIsSearchModalOpen((prev) => !prev);

  const handleBackNavigation = () => navigate(-1);

  const handleViewContact = () => {
    if (userId && otherUserId) navigate(`/view-contact/${userId}/${otherUserId}`);
  };

  const handleViewMedia = () => {
    if (userId && otherUserId) navigate(`/media/${userId}/${otherUserId}`);
  };


  const handleViewWallPaper = () => {
    if (userId && otherUserId) navigate(`/view-wallpaper/${userId}/${otherUserId}`);
  };

  const showBlockConfirmModal = () => {
    const action = isOtherUserBlocked ? 'unblock' : 'block';
    Modal.confirm({
      title: <span style={{ fontFamily: 'Montserrat, sans-serif' }}>{action === 'block' ? 'Block User' : 'Unblock User'}</span>,
      content: <span style={{ fontFamily: 'Montserrat, sans-serif' }}>{`Are you sure you want to ${action} this user?`}</span>,
      okText: <span style={{ fontFamily: 'Montserrat, sans-serif' }}>{action === 'block' ? 'Block' : 'Unblock'}</span>,
      cancelText: <span style={{ fontFamily: 'Montserrat, sans-serif' }}>Cancel</span>,
      okType: 'danger',
      centered: true,
      onOk: () => {
        handleBlockOtherUser(action);
        setShowCard(false);
      },
    });
  };

  const handleInputSearch = () => {
    const results = handleSearch(searchTerm);
    results.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    if (results.length > 0) {
      setCurrentMatchIndex(0);
      scrollToMessage(results[0].id);
    } else {
      setCurrentMatchIndex(null);
    }
  };

  const goToPrev = () => {
    if (currentMatchIndex !== null && currentMatchIndex > 0) {
      const newIndex = currentMatchIndex - 1;
      setCurrentMatchIndex(newIndex);
      scrollToMessage(searchResults[newIndex].id);
    }
  };

  const goToNext = () => {
    if (
      currentMatchIndex !== null &&
      currentMatchIndex < searchResults.length - 1
    ) {
      const newIndex = currentMatchIndex + 1;
      setCurrentMatchIndex(newIndex);
      scrollToMessage(searchResults[newIndex].id);
    }
  };

  const clearSearch = () => {
    setSearchTerm('');
    setCurrentMatchIndex(null);
    handleSearch('');
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

  useEffect(() => {
    if (
      currentMatchIndex !== null &&
      searchResults.length > 0 &&
      searchResults[currentMatchIndex]
    ) {
      scrollToMessage(searchResults[currentMatchIndex].id);
    }
  }, [currentMatchIndex, searchResults, scrollToMessage]);

  return (
    <div className='z-10'>
      <div className="relative h-full flex flex-col">
        <div className="fixed top-0 left-14 right-0 lg:left-[42.9%] bg-white p-4 shadow-md flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <ArrowLeftOutlined onClick={handleBackNavigation} className="text-xl cursor-pointer" />
            <Avatar src={`http://localhost:5002${otherUserData?.getOtherUserById?.profilePicture}`} />
            <div className="flex flex-col">
              <span className="font-semibold">
                {chatSettings?.customUsername || otherUserData?.getOtherUserById?.username}
              </span>
              {(isUserBlocked === false && isOtherUserBlocked === false) && (
                <span
                  className={`text-sm ${otherUserData?.getOtherUserById?.isOnline ? 'text-green-500' : 'text-gray-500'}`}
                >
                  {otherUserData?.getOtherUserById?.isOnline ? 'Online' : 'Offline'}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <SearchOutlined className="text-2xl cursor-pointer" onClick={toggleSearchModal} />
            <MoreOutlined className="text-3xl cursor-pointer" onClick={toggleCard} />
          </div>
        </div>
      </div>

      {isSearchModalOpen && (
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 bg-white p-3 rounded shadow-lg z-30 w-full max-w-md flex items-center space-x-2">
          <div className="relative flex-grow">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search messages..."
              className="w-full border border-gray-300 rounded px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 pr-8"
            />
            {searchTerm && (
              <CloseOutlined
                onClick={clearSearch}
                className="absolute right-2 top-2 text-gray-400 hover:text-red-500 cursor-pointer"
              />
            )}
          </div>
          <SearchOutlined
            className="text-blue-500 text-xl cursor-pointer hover:text-blue-700"
            onClick={handleInputSearch}
          />
        </div>
      )}

      {currentMatchIndex !== null && searchResults.length > 0 && (
        <div className="absolute top-36 left-1/2 transform -translate-x-1/2 bg-white shadow-md rounded-lg px-4 py-2 w-full max-w-sm flex items-center space-x-4 z-30">
          <UpOutlined
            onClick={goToPrev}
            className={`text-lg cursor-pointer ${currentMatchIndex === 0 ? 'text-gray-300 cursor-not-allowed' : 'text-blue-500'}`}
          />
          <span className="text-sm font-medium">{`${currentMatchIndex + 1} of ${searchResults.length} matches`}</span>
          <DownOutlined
            onClick={goToNext}
            className={`text-lg cursor-pointer ${currentMatchIndex === searchResults.length - 1 ? 'text-gray-300 cursor-not-allowed' : 'text-blue-500'}`}
          />
        </div>
      )}

      {showCard && (
        <div ref={cardRef} className="absolute top-44 right-0 bg-white shadow-md rounded-lg p-4 z-20 w-full max-w-xs">
          <ul className="space-y-4">
            <li className="cursor-pointer hover:text-blue-500" onClick={handleViewContact}>View Contact</li>
            <li className="cursor-pointer hover:text-blue-500">Search</li>
            <li className="cursor-pointer hover:text-blue-500" onClick={handleViewMedia}>Media</li>
            <li className="cursor-pointer hover:text-blue-500" onClick={handleViewWallPaper}>Wallpaper</li>
            <li className="cursor-pointer hover:text-blue-500" onClick={showBlockConfirmModal}>
              {isOtherUserBlocked === true ? 'Unblock' : 'Block'}
            </li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default HeaderWithInlineCard;
