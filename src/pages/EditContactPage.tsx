import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useChatSettings } from '../hooks/useGetOtherUserContactDetails';
import { useEditChatSettings } from '../hooks/useEditChatSettings';
import { Spin, message } from 'antd';
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react';
import { SmileOutlined } from '@ant-design/icons';

const EditContactPage: React.FC = () => {
    const { userId, otherUserId } = useParams();
    const navigate = useNavigate();
    const [customUsername, setCustomUsername] = useState('');
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);

    const inputRef = useRef<HTMLInputElement>(null);

    const { data: chatSettings, loading: chatLoading, error: chatError } = useChatSettings(userId!, otherUserId!);
    const { editChatSettings, loading: editLoading } = useEditChatSettings();

    useEffect(() => {
        if (chatSettings) {
            setCustomUsername(chatSettings.customUsername || '');
        }
    }, [chatSettings]);

    const handleEmojiClick = (emojiData: EmojiClickData) => {
        const emoji = emojiData.emoji;
        const input = inputRef.current;
        if (!input) return;

        const start = input.selectionStart || 0;
        const end = input.selectionEnd || 0;
        const textBefore = customUsername.slice(0, start);
        const textAfter = customUsername.slice(end);
        const newValue = textBefore + emoji + textAfter;

        setCustomUsername(newValue);

        // Refocus input and move cursor after emoji
        requestAnimationFrame(() => {
            input.focus();
            input.setSelectionRange(start + emoji.length, start + emoji.length);
        });
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await editChatSettings({
                variables: {
                    ownerId: userId,
                    otherUserId: otherUserId,
                    editInput: {
                        customUsername,
                    },
                },
            });
            message.success('Chat settings updated successfully!');
            window.location.href = `/view-contact/${userId}/${otherUserId}`;
        } catch (err) {
            console.error(err);
            message.error('Failed to update chat settings. Please try again.');
        }
    };

    if (chatLoading) return <Spin className="mt-8" />;
    if (chatError) {
        console.error(chatError);
        return <div>Error loading chat settings.</div>;
    }

    return (
        <div className="flex items-center justify-center h-screen bg-gradient-to-b from-blue-50 to-white font-montserrat">
            <div className="bg-white shadow-xl rounded-lg p-8 w-[90%] max-w-md text-center border border-gray-200 relative">
                <h1 className="text-3xl font-bold text-blue-600 mb-6">Edit Contact</h1>
                <form onSubmit={handleSave}>
                    <label
                        htmlFor="customUsername"
                        className="block text-lg font-medium text-gray-700 mb-2"
                    >
                        Custom Username
                    </label>

                    {/* Input with emoji button */}
                    <div className="flex items-center justify-center relative mb-6">
                        <input
                            ref={inputRef}
                            id="customUsername"
                            value={customUsername}
                            onChange={(e) => setCustomUsername(e.target.value)}
                            className="w-3/4 px-4 py-2 mr-5 text-lg text-gray-800 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm"
                            placeholder="Enter custom username"
                            autoComplete="off"
                            spellCheck="false"
                        />
                        <button
                            type="button"
                            className="absolute right-8 text-gray-500 hover:text-blue-600 transition-colors"
                            onClick={() => setShowEmojiPicker((prev) => !prev)}
                            title="Add Emoji"
                        >
                            <SmileOutlined className="text-xl ml-2" />
                        </button>

                        {/* Emoji Picker Dropdown */}
                        {showEmojiPicker && (
                            <div className="absolute top-12 right-0 z-50">
                                <EmojiPicker
                                    onEmojiClick={handleEmojiClick}
                                    width={300}
                                    height={400}
                                />
                            </div>
                        )}
                    </div>

                    <div className="flex items-center justify-center space-x-4">
                        <button
                            type="submit"
                            disabled={editLoading}
                            className="px-6 py-2 text-lg font-semibold text-white bg-blue-600 rounded-full hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 shadow-lg transition-all"
                        >
                            {editLoading ? 'Saving...' : 'Save'}
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
