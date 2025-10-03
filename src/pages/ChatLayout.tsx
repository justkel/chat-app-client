import React, { useState, useEffect } from 'react';
import AllChats from './AllChats';
import InteractPage from './Interact';
import Dashboard from '../components/LayoutX';

const ChatLayout: React.FC = () => {
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

    useEffect(() => {
        const savedUserId = localStorage.getItem('lastSelectedUserId');
        if (savedUserId) {
            setSelectedUserId(savedUserId);
        }
    }, []);

    const handleSelectUser = (id: string) => {
        setSelectedUserId(id);
        localStorage.setItem('lastSelectedUserId', id);
    };

    return (
        <div className="flex h-screen">
            <Dashboard></Dashboard>
            <div className="hidden md:block w-2/5 border-r overflow-y-auto">
                <AllChats
                    onSelectUser={handleSelectUser}
                    selectedUserId={selectedUserId}
                />
            </div>

            <div className="w-full md:w-3/5 flex-1 bg-gray-50 relative">
                {selectedUserId ? (
                    <InteractPage otherUserId={selectedUserId} />
                ) : (
                    <div className="flex justify-center items-center h-full text-gray-400">
                        Select a chat to start messaging
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChatLayout;
