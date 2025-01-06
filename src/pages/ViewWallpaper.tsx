import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { useAuth } from '../contexts/AuthContext';
import { useChatSettings } from '../hooks/useGetOtherUserContactDetails';
import { useGetAllWallpapers } from '../hooks/useGetAllWallpapers';
import { Spin, Avatar } from 'antd';
import { ArrowLeftOutlined, MoreOutlined } from '@ant-design/icons';

const ViewWallPaper: React.FC = () => {
  const { userId, otherUserId } = useParams();
  const { user } = useAuth();
  const [showCard, setShowCard] = useState(false);
  const navigate = useNavigate();

  const toggleCard = () => setShowCard(!showCard);

  const { data: chatSettings, loading: chatLoading, error: chatError } = useChatSettings(userId!, otherUserId!);
  const { data: wallpapersData, loading: wallpapersLoading, error: wallpapersError } = useGetAllWallpapers();

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

  // Preload wallpaper images
  useEffect(() => {
    if (wallpapersData?.getAllWallpapers) {
      wallpapersData.getAllWallpapers.forEach((wallpaper: { wallpaper: string }) => {
        const img = new Image();
        img.src = `http://localhost:5002/wallpapers/${wallpaper.wallpaper}`;
      });
    }
  }, [wallpapersData]);

  if (chatLoading || wallpapersLoading) return <Spin className="mt-8" />;
  if (chatError || wallpapersError) {
    console.error(chatError || wallpapersError);
    return <div>Error loading data.</div>;
  }

  return (
    <div className="p-8 min-h-screen font-montserrat relative bg-gradient-to-br from-gray-50 via-gray-100 to-white shadow-lg rounded-2xl">
      <ArrowLeftOutlined
        className="absolute top-6 left-6 text-2xl cursor-pointer"
        onClick={() => window.location.href = `/chat/${otherUserId}`}
      />
      <MoreOutlined className="absolute top-6 right-6 text-2xl cursor-pointer" onClick={toggleCard} />

      <h2 className="text-xl font-semibold mb-6 mt-10">Available Wallpapers</h2>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {wallpapersData.getAllWallpapers.map((wallpaper: { id: number; wallpaper: string }) => {
          const isActive = chatSettings?.customWallpaper === wallpaper.wallpaper;

          return (
            <div
              key={wallpaper.id}
              className={`p-2 border-2 rounded-lg ${isActive ? 'border-green-500' : 'border-gray-300'} hover:shadow-lg`}
            >
              <Avatar
                shape="square"
                size={220}
                src={`http://localhost:5002/wallpapers/${wallpaper.wallpaper}`}
                className="rounded-lg"
              />
              {isActive && <div className="text-center mt-2 text-green-500 text-sm">In Use</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ViewWallPaper;
