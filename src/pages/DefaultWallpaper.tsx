import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { useAuth } from '../contexts/AuthContext';
import { useGetAllWallpapers } from '../hooks/useGetAllWallpapers';
import { Spin, Button, Tag } from 'antd';
import { ArrowLeftOutlined, MoreOutlined } from '@ant-design/icons';
import { useUpdateDefaultWallpaper } from '../hooks/useUpdateDefaultWallpaper';
import { useGetUserById } from '../hooks/useGetOtherUser';

/**
 * Dark Sleek — 3-column premium wallpaper selector
 * - Design: cinematic dark theme, glass-black cards, neon accent
 * - Layout: responsive 1 / 2 / 3 columns, centered header
 * - Modal: compact cinematic preview with action bar
 *
 */
const DefaultWallPaper: React.FC = () => {
    const [userId, setUserId] = useState<string | null>(null);
    const { user } = useAuth();

    useEffect(() => {
        if (user) {
            const decodedToken: any = jwtDecode(user.token);
            setUserId(decodedToken.sub);
        }
    }, [user]);

    const [showCard, setShowCard] = useState(false); // kept from original, toggle currently unused visually but preserved
    const [expandedWallpaper, setExpandedWallpaper] = useState<null | { id: number; wallpaper: string; isActive: boolean; }>(null);
    const [customWallpaper, setCustomWallpaper] = useState<string>('');

    const navigate = useNavigate();
    const toggleCard = () => setShowCard(!showCard);

    const { data: userData, loading: userLoading, error: userError, refetch } = useGetUserById(userId!);
    const { data: wallpapersData, loading: wallpapersLoading, error: wallpapersError } = useGetAllWallpapers();
    const { updateWallpaper, loading: wallpaperLoading, error: wallpaperError } = useUpdateDefaultWallpaper();

    useEffect(() => {
        if (userData?.getUserById?.defaultChatWallpaper) {
            setCustomWallpaper(userData.getUserById.defaultChatWallpaper);
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

    if (userLoading || wallpapersLoading || wallpaperLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-neutral-900 via-black to-neutral-900">
                <Spin size="large" tip="Loading wallpapers..." />
            </div>
        );
    }

    if (userError || wallpapersError || wallpaperError) {
        console.error(userError || wallpapersError || wallpaperError);
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-neutral-900 via-black to-neutral-900">
                <div className="text-red-400">Error loading data.</div>
            </div>
        );
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
        <div className="min-h-screen p-8 font-montserrat bg-gradient-to-b from-neutral-900 via-neutral-950 to-black text-gray-200">
            <div className="max-w-6xl mx-auto">
                <header className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <button
                            aria-label="Back"
                            onClick={() => navigate(-1)}
                            className="w-11 h-11 rounded-xl bg-[rgba(255,255,255,0.03)] border border-transparent hover:border-neutral-700 flex items-center justify-center transition"
                            title="Back"
                        >
                            <ArrowLeftOutlined className="text-lg text-gray-300" />
                        </button>

                        <div className="ml-2">
                            <h1 className="text-2xl font-semibold tracking-tight text-white">Default Chat Wallpaper</h1>
                            <p className="text-sm text-neutral-400 mt-1">Choose a wallpaper to personalize your chats</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            aria-label="More"
                            onClick={toggleCard}
                            className="w-11 h-11 rounded-xl bg-[rgba(255,255,255,0.02)] border border-transparent hover:border-neutral-700 flex items-center justify-center transition"
                            title="More"
                        >
                            <MoreOutlined className="text-lg text-gray-300" />
                        </button>
                    </div>
                </header>

                <section className="mb-8">
                    <div className="relative rounded-2xl overflow-hidden border border-neutral-800 bg-[linear-gradient(90deg,rgba(255,255,255,0.02),rgba(255,255,255,0.01))] p-4 shadow-[0_8px_30px_rgba(0,0,0,0.6)]">
                        <div className="flex items-center gap-4">
                            <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 border border-neutral-800">
                                {(customWallpaper !== '' && customWallpaper !== null) && (
                                    <img
                                        src={`http://localhost:5002/wallpapers/${customWallpaper}`}
                                        alt="Current wallpaper"
                                        className="w-full h-full object-cover"
                                    />
                                )}
                            </div>

                            <div className="flex-1">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="text-sm text-neutral-300">Current Wallpaper</div>
                                        <div className="text-lg font-medium text-white truncate">{customWallpaper || 'Default'}</div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <Button
                                            type="primary"
                                            size="large"
                                            onClick={() => setExpandedWallpaper({ id: -1, wallpaper: customWallpaper || '', isActive: true })}
                                            className="rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 border-0 shadow-md font-montserrat"
                                        >
                                            Preview
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="absolute left-0 right-0 bottom-0 h-[1px] bg-gradient-to-r from-transparent via-indigo-700 to-transparent opacity-30" />
                    </div>
                </section>

                <main>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {wallpapersData.getAllWallpapers.map((wallpaper: { id: number; wallpaper: string }) => {
                            const isActive = customWallpaper === wallpaper.wallpaper;
                            return (
                                <article
                                    key={wallpaper.id}
                                    onClick={() => handleWallpaperClick(wallpaper, isActive)}
                                    className={
                                        `group relative rounded-2xl overflow-hidden cursor-pointer transform transition 
                     duration-300 will-change-transform
                     bg-[rgba(255,255,255,0.02)] border border-neutral-800 shadow-[0_6px_20px_rgba(0,0,0,0.7)]
                     hover:scale-[1.02]`
                                    }
                                >
                                    <div className="w-full h-56 md:h-64 lg:h-56 relative">
                                        <img
                                            src={`http://localhost:5002/wallpapers/${wallpaper.wallpaper}`}
                                            alt={`Wallpaper ${wallpaper.id}`}
                                            className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105`}
                                        />

                                        <div
                                            className={`absolute inset-0 pointer-events-none transition-opacity ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-30'
                                                }`}
                                            style={{
                                                background:
                                                    isActive
                                                        ? 'linear-gradient(180deg, rgba(99,102,241,0.06), rgba(139,92,246,0.12))'
                                                        : 'radial-gradient(circle at 10% 10%, rgba(99,102,241,0.06), transparent 20%)',
                                            }}
                                        />
                                    </div>

                                    <div className="p-4 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-11 h-11 rounded-md overflow-hidden flex-shrink-0 border border-neutral-800">
                                                <img
                                                    alt="thumb"
                                                    src={`http://localhost:5002/wallpapers/${wallpaper.wallpaper}`}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>

                                            <div>
                                                <div className="text-sm text-neutral-300 truncate">Wallpaper {wallpaper.id}</div>
                                                <div
                                                    className="text-xs text-neutral-400"
                                                    title={wallpaper.wallpaper || ''}
                                                >
                                                    {String(wallpaper.wallpaper || '').length > 10
                                                        ? `${String(wallpaper.wallpaper).slice(0, 10)}…`
                                                        : wallpaper.wallpaper}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {isActive ? (
                                                <Tag color="processing" className="rounded-full px-3 py-0.5 text-sm">
                                                    In Use
                                                </Tag>
                                            ) : (
                                                <div className="text-sm text-neutral-400"> </div>
                                            )}
                                            <Button
                                                type="default"
                                                size="small"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleWallpaperClick(wallpaper, isActive);
                                                }}
                                                className="rounded-md font-montserrat text-white border-neutral-700 bg-[rgba(255,255,255,0.02)] hover:bg-[rgba(255,255,255,0.03)]"
                                            >
                                                View
                                            </Button>
                                        </div>
                                    </div>

                                    {/* neon focus outline when active */}
                                    {isActive && (
                                        <div className="pointer-events-none absolute -inset-px rounded-2xl border-2 border-indigo-500/40 shadow-[0_6px_30px_rgba(99,102,241,0.12)]" />
                                    )}
                                </article>
                            );
                        })}
                    </div>
                </main>
            </div>

            {expandedWallpaper && (
                <div
                    className="fixed inset-0 z-60 flex items-center justify-center"
                    aria-modal="true"
                    role="dialog"
                >
                    <div
                        className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
                        onClick={closeExpandedView}
                    />

                    <div className="relative z-10 w-[92%] md:w-3/5 lg:w-2/5 rounded-2xl overflow-hidden shadow-2xl border border-neutral-800 bg-gradient-to-b from-[rgba(10,11,13,0.88)] to-[rgba(6,6,6,0.96)] transform transition-all duration-400">
                        <div className="relative">
                            <div className="w-full h-72 md:h-96 lg:h-80 bg-black">
                                {expandedWallpaper.wallpaper ? (
                                    <img
                                        src={`http://localhost:5002/wallpapers/${expandedWallpaper.wallpaper}`}
                                        alt="expanded"
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-neutral-500">No preview</div>
                                )}
                            </div>

                            <button
                                onClick={closeExpandedView}
                                className="absolute top-4 right-4 rounded-full w-10 h-10 flex items-center justify-center bg-[rgba(0,0,0,0.45)] border border-neutral-700 hover:bg-[rgba(0,0,0,0.6)] transition"
                                aria-label="Close preview"
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#E6E6E6" strokeWidth="2">
                                    <path d="M18 6L6 18" strokeLinecap="round" strokeLinejoin="round" />
                                    <path d="M6 6L18 18" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </button>
                        </div>

                        <div className="p-4 flex items-center justify-between border-t border-neutral-800 bg-[rgba(0,0,0,0.45)]">
                            <div className="text-sm text-neutral-300 font-montserrat">{expandedWallpaper.isActive ? 'Currently in use' : 'Preview'}</div>

                            <div className="flex items-center gap-3">
                                {!expandedWallpaper.isActive && (
                                    <Button
                                        type="primary"
                                        size="middle"
                                        onClick={() => selectWallpaper(expandedWallpaper.wallpaper)}
                                        className="rounded-lg px-5 bg-gradient-to-r from-indigo-500 to-purple-600 border-0 shadow font-montserrat"
                                    >
                                        Use as default
                                    </Button>
                                )}

                                <Button
                                    type="default"
                                    size="middle"
                                    onClick={closeExpandedView}
                                    className="rounded-lg text-white border-neutral-700 bg-[rgba(255,255,255,0.02)] font-montserrat"
                                >
                                    Close
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DefaultWallPaper;
