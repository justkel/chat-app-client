import React, { useState, useMemo } from 'react';
import { ArrowLeftOutlined, SearchOutlined, CheckCircleFilled, SendOutlined } from '@ant-design/icons';
import { Tooltip, Spin } from 'antd';
import { useGetBlockedUsers } from '../hooks/UseGetBlockedUsers';

interface User {
    id: string;
    fullName: string;
    email: string;
    profilePicture: string;
}

interface OtherUser {
  id: string | number;
  fullName: string;
  email: string;
  profilePicture: string;
}

interface BlockedUser {
  id: string | number;
  isOtherUserBlocked: boolean;
  otherUser: OtherUser;
}

interface ForwardModalProps {
    showModal: boolean;
    setShowModal: React.Dispatch<React.SetStateAction<boolean>>;
    data: User[];
    userId: string;
    onSendForwardedMessage: (selectedUsers: string[]) => void;
}

const ForwardModal: React.FC<ForwardModalProps> = ({ showModal, setShowModal, data, userId, onSendForwardedMessage }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [showSearch, setShowSearch] = useState(false);
    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

    const { data: blockedData, loading: blockedLoading, error: blockedError } = useGetBlockedUsers(userId);

    const blockedUserIds = useMemo(
        () => blockedData?.getBlockedUsers.map((b: BlockedUser) => b.otherUser.id) || [],
        [blockedData?.getBlockedUsers]
    );

    if (!showModal) return null;

    const toggleUserSelection = (userId: string) => {
        setSelectedUsers((prevSelected) =>
            prevSelected.includes(userId)
                ? prevSelected.filter(id => id !== userId)
                : [...prevSelected, userId]
        );
    };

    const handleSendClick = () => {
        onSendForwardedMessage(selectedUsers);
        setShowModal(false);
        setSelectedUsers([]);
    };

    const filteredUsers = data?.filter(user =>
        user.fullName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const selectedUserNames = data
        .filter(user => selectedUsers.includes(user.id))
        .map(user => user.fullName)
        .join(', ');

    return (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white p-6 md:p-8 rounded-lg shadow-xl w-full max-w-[600px] max-h-[90vh] flex flex-col">
                <div className="flex items-center justify-between mb-4 md:mb-6">
                    <ArrowLeftOutlined
                        className="text-xl cursor-pointer"
                        onClick={() => setShowModal(false)}
                    />
                    <p className="font-semibold text-lg md:text-2xl text-center flex-1">
                        Forward to ...
                    </p>
                    <SearchOutlined
                        className="text-xl cursor-pointer"
                        onClick={() => setShowSearch(!showSearch)}
                    />
                </div>

                {showSearch && (
                    <input
                        type="text"
                        placeholder="Search chats..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                )}

                {blockedLoading ? (
                    <div className="flex justify-center items-center flex-1">
                        <Spin size="large" />
                    </div>
                ) : blockedError ? (
                    <p className="text-red-500">Error loading blocked users</p>
                ) : (
                    <div className="flex-1 overflow-y-auto">
                        <p className="font-semibold text-lg md:text-xl mb-2">Chats List</p>
                        <div className="flex flex-col space-y-3">
                            {filteredUsers.map((user) => {
                                const isSelected = selectedUsers.includes(user.id);
                                const isBlockedUser = blockedUserIds.includes(user.id);

                                const userItem = (
                                    <div
                                        key={user.id}
                                        className={`relative flex items-center space-x-4 p-3 rounded-lg transition duration-200
                                            ${isSelected ? 'bg-gray-200' : 'hover:bg-gray-100'}
                                            ${isBlockedUser ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
                                        `}
                                        onClick={() => {
                                            if (!isBlockedUser) {
                                                toggleUserSelection(user.id);
                                            }
                                        }}
                                    >
                                        {isSelected && !isBlockedUser && (
                                            <CheckCircleFilled
                                                className="absolute top-2 right-2 text-green-500 text-xl"
                                            />
                                        )}

                                        <div className="w-12 h-12 rounded-full bg-gray-300 overflow-hidden flex-shrink-0">
                                            <img
                                                src={`http://localhost:5002${user.profilePicture}`}
                                                alt={user.fullName[0]}
                                                className="w-full h-full rounded-full object-cover"
                                            />
                                        </div>

                                        <p className="text-sm md:text-base truncate">{user.fullName}</p>
                                    </div>
                                );

                                return isBlockedUser ? (
                                    <Tooltip key={user.id} title="This user is blocked and cannot receive forwarded messages">
                                        {userItem}
                                    </Tooltip>
                                ) : (
                                    userItem
                                );
                            })}
                        </div>
                    </div>
                )}

                <div className="mt-4 md:mt-6 border-t pt-3 flex flex-col sm:flex-row justify-between items-center gap-3">
                    <p className="text-gray-700 truncate max-w-full text-center sm:text-left">
                        {selectedUserNames || 'No user selected'}
                    </p>

                    <button
                        onClick={handleSendClick}
                        className="bg-blue-600 text-white px-4 py-2 rounded-full flex items-center gap-2 hover:bg-blue-700 disabled:bg-gray-400"
                        disabled={selectedUsers.length === 0}
                    >
                        <SendOutlined />
                        Send
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ForwardModal;
