import React, { useState } from 'react';
import { ArrowLeftOutlined, SearchOutlined, CheckCircleFilled, SendOutlined } from '@ant-design/icons';

interface User {
    id: string;
    fullName: string;
    email: string;
    profilePicture: string;
}

interface ForwardModalProps {
    showModal: boolean;
    setShowModal: React.Dispatch<React.SetStateAction<boolean>>;
    data: User[];
    onSendForwardedMessage: (selectedUsers: string[]) => void;
    isOtherUserBlocked: boolean;
    otherUserId: string | null;
}

const ForwardModal: React.FC<ForwardModalProps> = ({ showModal, setShowModal, data, onSendForwardedMessage, isOtherUserBlocked, otherUserId }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [showSearch, setShowSearch] = useState(false);
    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

    if (!showModal) return null;

    const toggleUserSelection = (userId: string) => {
        setSelectedUsers((prevSelected) =>
            prevSelected.includes(userId)
                ? prevSelected.filter(id => id !== userId)
                : [...prevSelected, userId]
        );
    };

    const handleSendClick = () => {
        // Call the parent's callback and send the selected users
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-8 rounded-lg shadow-xl w-[600px] relative flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <ArrowLeftOutlined
                        className="text-xl cursor-pointer"
                        onClick={() => setShowModal(false)}
                    />
                    <p className="font-semibold text-2xl">Forward to ...</p>
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
                        className="w-full p-2 border border-gray-300 rounded-md mb-4"
                    />
                )}

                <div className="flex-grow overflow-y-auto">
                    <p className="font-semibold text-xl">Chats List</p>
                    <div className="space-y-6 mt-4">
                        {filteredUsers.map((user) => {
                            const isSelected = selectedUsers.includes(user.id);
                            const isBlockedUser = isOtherUserBlocked && Number(user.id) === Number(otherUserId);

                            return (
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

                                    <div className="w-14 h-14 rounded-full bg-gray-300 overflow-hidden">
                                        <img
                                            src={`http://localhost:5002${user.profilePicture}`}
                                            alt={user.fullName[0]}
                                            className="w-full h-full rounded-full object-cover"
                                        />
                                    </div>

                                    <p className="text-lg">{user.fullName}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="mt-6 border-t pt-4 flex justify-between items-center">
                    <p className="text-gray-700 truncate max-w-[80%]">
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
