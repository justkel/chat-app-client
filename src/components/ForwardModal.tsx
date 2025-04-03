import React from 'react';
import { ArrowLeftOutlined, SearchOutlined } from '@ant-design/icons';

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
    if (!showModal) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-8 rounded-lg shadow-xl w-[600px]">
                <div className="flex items-center justify-between mb-6">
                    <ArrowLeftOutlined
                        className="text-xl cursor-pointer"
                        onClick={() => setShowModal(false)}
                    />
                    <p className="font-semibold text-2xl">Forward to ...</p>
                    <SearchOutlined className="text-xl cursor-pointer" />
                </div>

                <div className="mt-6">
                    <p className="font-semibold text-xl">Chats List</p>
                    <div className="space-y-6 mt-4">
                        {data && data.length > 0 && data.map((user) => (
                            <div key={user.id} className="flex items-center space-x-4">
                                <div className="w-14 h-14 rounded-full bg-gray-300">
                                    <img
                                        src={`http://localhost:5002${user.profilePicture}`}
                                        alt={user.fullName[0]}
                                        className="w-full h-full rounded-full object-cover"
                                    />
                                </div>
                                <p className="text-lg">{user.fullName}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ForwardModal;
