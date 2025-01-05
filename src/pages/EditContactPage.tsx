import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useChatSettings } from '../hooks/useGetOtherUserContactDetails';
import { Spin } from 'antd';

const EditContactPage: React.FC = () => {
    const { userId, otherUserId } = useParams();
    const navigate = useNavigate();
    const [customUsername, setCustomUsername] = useState('');

    const { data: chatSettings, loading: chatLoading, error: chatError } = useChatSettings(userId!, otherUserId!);

    useEffect(() => {
        if (chatSettings) {
            setCustomUsername(chatSettings.customUsername || '');
        }
    }, [chatSettings]);

    if (chatLoading) return <Spin className="mt-8" />;
    if (chatError) {
        console.error(chatError);
        return <div>Error loading chat settings.</div>;
    }

    return (
        <div className="flex items-center justify-center h-screen bg-gradient-to-b from-blue-50 to-white font-montserrat">
            <div className="bg-white shadow-xl rounded-lg p-8 w-[90%] max-w-md text-center border border-gray-200">
                <h1 className="text-3xl font-bold text-blue-600 mb-6">Edit Contact</h1>
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                    }}
                >
                    <label
                        htmlFor="customUsername"
                        className="block text-lg font-medium text-gray-700 mb-2"
                    >
                        Custom Username
                    </label>
                    <input
                        id="customUsername"
                        value={customUsername}
                        onChange={(e) => setCustomUsername(e.target.value)}
                        className="w-3/4 px-4 py-2 mb-6 text-lg text-gray-800 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm"
                        placeholder="Enter custom username"
                    />
                    <div className="flex items-center justify-center space-x-4">
                        <button
                            type="submit"
                            className="px-6 py-2 text-lg font-semibold text-white bg-blue-600 rounded-full hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 shadow-lg transition-all"
                        >
                            Save
                        </button>
                        <button
                            type="button"
                            onClick={() => navigate(-1)}
                            className="px-6 py-2 text-lg font-semibold text-blue-600 bg-white border border-blue-600 rounded-full hover:bg-blue-100 focus:outline-none focus:ring-4 focus:ring-blue-200 shadow-lg transition-all"
                        >
                            Go Back
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditContactPage;
