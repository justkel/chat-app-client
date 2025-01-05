import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { useAuth } from '../contexts/AuthContext';
import { useOtherUserDetails } from '../hooks/useGetOtherUserContactDetails';
import { useChatSettings } from '../hooks/useGetOtherUserContactDetails';
import { Avatar, Spin } from 'antd';

const ViewContactPage: React.FC = () => {
  const { userId, otherUserId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

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

  return (
    <div className="p-8">
      <div className="bg-white shadow-md rounded-lg p-6 text-center">
        <Avatar
          size={128}
          src={`http://localhost:5002${userDetails?.profilePicture}`}
          className="mx-auto mb-4"
        />
        <h1 className="text-xl font-semibold">
          {chatSettings?.customUsername || userDetails?.username}
        </h1>
        {userDetails?.phoneNumber && <p className="text-gray-700 mt-2">{userDetails?.phoneNumber}</p>}
      </div>
    </div>
  );
};

export default ViewContactPage;
