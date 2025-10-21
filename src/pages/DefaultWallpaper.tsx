import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { useAuth } from '../contexts/AuthContext';
import { useGetAllWallpapers } from '../hooks/useGetAllWallpapers';
import { Spin, Avatar, Button } from 'antd';
import { ArrowLeftOutlined, MoreOutlined } from '@ant-design/icons';
import { useUpdateDefaultWallpaper } from '../hooks/useUpdateDefaultWallpaper';
import { useGetUserById } from '../hooks/useGetOtherUser';

const DefaultWallPaper: React.FC = () => {
    const [userId, setUserId] = useState<string | null>(null);
    const { user } = useAuth();

    useEffect(() => {
        if (user) {
            const decodedToken: any = jwtDecode(user.token);
            setUserId(decodedToken.sub);
        }
    }, [user]);
    const [showCard, setShowCard] = useState(false);
    const [expandedWallpaper, setExpandedWallpaper] = useState<null | {
        id: number;
        wallpaper: string;
        isActive: boolean;
    }>(null);
    const [customWallpaper, setCustomWallpaper] = useState<string>('');
    const navigate = useNavigate();

    const toggleCard = () => setShowCard(!showCard);

    const { data: userData, loading: userLoading, error: userError, refetch } = useGetUserById(userId!);
    const { data: wallpapersData, loading: wallpapersLoading, error: wallpapersError } = useGetAllWallpapers();

    const { updateWallpaper, loading: wallpaperLoading, error: wallpaperError } = useUpdateDefaultWallpaper();

    useEffect(() => {
        if (userData?.getUserById?.defaultChatWallpaper) {
            setCustomWallpaper(userData?.getUserById?.defaultChatWallpaper);
        }
    }, [userData]);

    // Preload wallpaper images
    useEffect(() => {
        if (wallpapersData?.getAllWallpapers) {
            wallpapersData.getAllWallpapers.forEach((wallpaper: { wallpaper: string }) => {
                const img = new Image();
                img.src = `http://localhost:5002/wallpapers/${wallpaper.wallpaper}`;
            });
        }
    }, [wallpapersData]);

    if (userLoading || wallpapersLoading || wallpaperLoading) return <Spin className="mt-8" />;
    if (userError || wallpapersError || wallpaperError) {
        console.error(userError || wallpapersError || wallpaperError);
        return <div>Error loading data.</div>;
    }

    const handleWallpaperClick = (wallpaper: { id: number; wallpaper: string }, isActive: boolean) => {
        setExpandedWallpaper({ ...wallpaper, isActive });
    };

    const closeExpandedView = () => {
        setExpandedWallpaper(null);
    };

    const selectWallpaper = (wallpaper: string) => {
        setCustomWallpaper(wallpaper);
        updateWallpaper(userId!, wallpaper);
        closeExpandedView();
        refetch();
    };

    return (
        <div className="p-8 min-h-screen font-montserrat relative bg-gradient-to-br from-gray-50 via-gray-100 to-white shadow-lg rounded-2xl">
            <ArrowLeftOutlined
                className="absolute top-6 left-6 text-2xl cursor-pointer"
                onClick={() => navigate(-1)}
            />
            <MoreOutlined className="absolute top-6 right-6 text-2xl cursor-pointer" onClick={toggleCard} />

            <h2 className="text-xl font-semibold mb-6 mt-12 bg-gradient-to-r from-gray-800 via-gray-700 to-gray-900 bg-clip-text text-transparent">
                Available Wallpapers
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {wallpapersData.getAllWallpapers.map((wallpaper: { id: number; wallpaper: string }) => {
                    const isActive = customWallpaper === wallpaper.wallpaper;

                    return (
                        <div
                            key={wallpaper.id}
                            className={`p-2 border-2 rounded-lg ${isActive ? 'border-green-500' : 'border-gray-300'} hover:shadow-lg cursor-pointer`}
                            onClick={() => handleWallpaperClick(wallpaper, isActive)}
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

            {expandedWallpaper && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                    <div className="bg-white rounded-lg p-6 w-11/12 md:w-3/4 lg:w-1/2 relative">
                        <img
                            src={`http://localhost:5002/wallpapers/${expandedWallpaper.wallpaper}`}
                            alt="Expanded Wallpaper"
                            className="w-full h-auto rounded-lg"
                        />
                        {!expandedWallpaper.isActive && (
                            <div className="flex justify-center">
                                <Button
                                    type="primary"
                                    className="mt-4 w-1/2 font-montserrat"
                                    onClick={() => selectWallpaper(expandedWallpaper.wallpaper)}
                                >
                                    Select as default wallpaper
                                </Button>
                            </div>
                        )}
                        <Button
                            type="default"
                            className="absolute top-4 right-4 font-montserrat"
                            onClick={closeExpandedView}
                        >
                            Close
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DefaultWallPaper;
