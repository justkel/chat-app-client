import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { useAuth } from '../contexts/AuthContext';
import { useOtherUserDetails, useChatSettings } from '../hooks/useGetOtherUserContactDetails';
import { Avatar, Spin } from 'antd';
import { ArrowLeftOutlined, MoreOutlined, EditOutlined } from '@ant-design/icons';

const ViewContactPage: React.FC = () => {
    const { userId, otherUserId } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [showCard, setShowCard] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const toggleCard = () => setShowCard(prev => !prev);

    const { data: userDetails, loading: userLoading, error: userError } = useOtherUserDetails(userId!, otherUserId!);
    const { data: chatSettings, loading: chatLoading, error: chatError } = useChatSettings(userId!, otherUserId!);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowCard(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (user) {
            try {
                const decodedToken: any = jwtDecode(user.token);
                if (decodedToken.sub !== Number(userId)) {
                    navigate('/chats');
                }
            } catch {
                navigate('/login');
            }
        }
    }, [user, userId, navigate]);

    if (userLoading || chatLoading) return <Spin className="mt-8" size="large" />;
    if (userError || chatError) return <div>Error loading data.</div>;

    const handleEditContact = () => {
        if (userId && otherUserId) {
            navigate(`/edit-contact/${userId}/${otherUserId}`);
        }
    };

    const handleBackNavigation = () => navigate('/chats');

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-white font-montserrat relative flex flex-col items-center p-4 md:p-8">

            <div className="w-full flex justify-between items-center mb-6">
                <ArrowLeftOutlined
                    className="text-2xl text-gray-700 hover:text-gray-900 cursor-pointer transition-colors"
                    onClick={handleBackNavigation}
                />
                <MoreOutlined
                    className="text-2xl text-gray-700 hover:text-gray-900 cursor-pointer transition-colors"
                    onClick={toggleCard}
                />
            </div>

            <div className="relative w-full max-w-md p-8 rounded-3xl bg-white/40 backdrop-blur-md shadow-xl flex flex-col items-center transform transition-all hover:scale-105">

                <div className="relative -mt-24">
                    <Avatar
                        size={160}
                        src={`http://localhost:5002${userDetails?.profilePicture}`}
                        className="border-4 border-white shadow-lg"
                    />
                </div>

                <h1 className="mt-6 text-3xl font-bold text-gray-900">
                    {chatSettings?.customUsername || userDetails?.username}
                </h1>

                {userDetails?.phoneNumber && (
                    <p className="mt-2 text-gray-700 text-lg">
                        📞 {userDetails?.phoneNumber}
                    </p>
                )}

                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-200/30 rounded-full blur-3xl pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-purple-200/30 rounded-full blur-3xl pointer-events-none"></div>
            </div>

            {showCard && (
                <div
                    ref={dropdownRef}
                    className="absolute top-20 right-6 bg-white/80 backdrop-blur-md shadow-lg rounded-xl p-4 z-20 w-48 transition-all"
                >
                    <ul className="space-y-4">
                        <li
                            onClick={handleEditContact}
                            className="flex items-center gap-2 text-gray-700 hover:text-blue-600 cursor-pointer transition-colors"
                        >
                            <EditOutlined /> Edit Contact
                        </li>
                    </ul>
                </div>
            )}
        </div>
    );
};

export default ViewContactPage;
