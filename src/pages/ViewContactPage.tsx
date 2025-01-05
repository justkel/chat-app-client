import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { useAuth } from '../contexts/AuthContext';
import { useOtherUserDetails } from '../hooks/useGetOtherUserContactDetails';
import { useChatSettings } from '../hooks/useGetOtherUserContactDetails';
import { Avatar, Spin } from 'antd';
import { ArrowLeftOutlined, MoreOutlined } from '@ant-design/icons';

const ViewContactPage: React.FC = () => {
    const { userId, otherUserId } = useParams();
    const { user } = useAuth();
    const [showCard, setShowCard] = useState(false);
    const navigate = useNavigate();

    const toggleCard = () => setShowCard(!showCard);

    const { data: userDetails, loading: userLoading, error: userError } = useOtherUserDetails(userId!, otherUserId!);
    const { data: chatSettings, loading: chatLoading, error: chatError } = useChatSettings(userId!, otherUserId!);

    useEffect(() => {
        if (user) {
            try {
                const decodedToken: any = jwtDecode(user.token);

                if (decodedToken.sub !== Number(userId)) {
                    console.warn('User ID does not match the decoded token. Redirecting...');
                    navigate('/chats');
                }
            } catch (error) {
                console.error('Error decoding token:', error);
                navigate('/login');
            }
        }
    }, [user, userId, navigate]);

    if (userLoading || chatLoading) return <Spin className="mt-8" />;
    if (userError || chatError) {
        console.error(userError || chatError);
        return <div>Error loading data.</div>;
    }

    const handleEditContact = () => {
        if (userId && otherUserId) {
            navigate(`/edit-contact/${userId}/${otherUserId}`);
        }
    };

    return (
        <div className="p-8 min-h-screen font-montserrat relative bg-gradient-to-br from-gray-50 via-gray-100 to-white shadow-lg rounded-2xl">
            <ArrowLeftOutlined
                className="absolute top-6 left-6 text-2xl cursor-pointer"
                onClick={() => window.location.href = `/chat/${otherUserId}`}
            />
            <MoreOutlined className="absolute top-6 right-6 text-2xl cursor-pointer" onClick={toggleCard} />

            <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-16 rounded-3xl shadow-2xl w-[90%] max-w-lg mx-auto text-center mt-16 relative transform transition-all hover:scale-105 hover:shadow-3xl">
                <div className="absolute -top-10 left-1/2 transform -translate-x-1/2">
                    <div className="bg-white p-2 rounded-full shadow-lg">
                        <Avatar
                            size={200}
                            src={`http://localhost:5002${userDetails?.profilePicture}`}
                            className="mx-auto"
                        />
                    </div>
                </div>
                <div className="mt-40">
                    <h1 className="text-4xl font-bold text-blue-700 hover:text-blue-900 transition-colors">
                        {chatSettings?.customUsername || userDetails?.username}
                    </h1>
                    {userDetails?.phoneNumber && (
                        <p className="text-lg mt-4 text-gray-600 hover:text-gray-800 transition-colors">
                            📞 {userDetails?.phoneNumber}
                        </p>
                    )}
                </div>
                <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-blue-300 to-blue-500 rounded-bl-full blur-2xl opacity-50 pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tr from-blue-300 to-blue-500 rounded-tr-full blur-2xl opacity-50 pointer-events-none"></div>
            </div>

            {showCard && (
                <div className="absolute top-4 right-4 bg-white shadow-md rounded-lg p-4 z-20 w-48">
                    <ul className="space-y-8">
                        <li
                            className="cursor-pointer hover:text-blue-500"
                            onClick={handleEditContact}
                        >
                            Edit Contact
                        </li>
                    </ul>
                </div>
            )}
        </div>
    );
};

export default ViewContactPage;
