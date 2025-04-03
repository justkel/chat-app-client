import React, { useState } from 'react';
import { ArrowLeftOutlined, SearchOutlined, CheckCircleFilled } from '@ant-design/icons';

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
}

const ForwardModal: React.FC<ForwardModalProps> = ({ showModal, setShowModal, data }) => {
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

    const filteredUsers = data?.filter(user =>
        user.fullName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-8 rounded-lg shadow-xl w-[600px] relative">
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

                {/* Search Input (Shown only when search is activated) */}
                {showSearch && (
                    <input
                        type="text"
                        placeholder="Search chats..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md mb-4"
                    />
                )}

                <div className="mt-6">
                    <p className="font-semibold text-xl">Chats List</p>
                    <div className="space-y-6 mt-4">
                        {filteredUsers.length > 0 ? (
                            filteredUsers.map((user) => {
                                const isSelected = selectedUsers.includes(user.id);

                                return (
                                    <div
                                        key={user.id}
                                        className={`relative flex items-center space-x-4 p-3 rounded-lg cursor-pointer transition duration-200 ${
                                            isSelected ? 'bg-gray-200' : 'hover:bg-gray-100'
                                        }`}
                                        onClick={() => toggleUserSelection(user.id)}
                                    >
                                        {isSelected && (
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
                            })
                        ) : (
                            <p className="text-gray-500">No users found</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ForwardModal;
