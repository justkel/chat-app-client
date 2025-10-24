import React, { useEffect, useState, useMemo } from 'react';
import { Spin } from 'antd';
import {
    AppBar,
    Toolbar,
    InputBase,
    IconButton,
    Box,
    Tooltip,
} from '@mui/material';
import { jwtDecode } from 'jwt-decode';
import { useAuth } from '../contexts/AuthContext';
import { useGetAcceptedChatUsers, useGetAcceptedChatUsersAll } from '../hooks/useGetAcceptedUsers';
import { useGetLastMessages } from '../hooks/useGetLastMessage';
import { useGetUnreadMessagesCount } from '../hooks/useGetUnreadMessagesCount';
import { useGetChatUserDetails } from '../hooks/useGetOtherUserdetails';
import { List, ListItem, ListItemAvatar, Avatar, Paper, Typography, Badge } from '@mui/material';
import { CameraOutlined, PaperClipOutlined, AudioOutlined, ReloadOutlined } from '@ant-design/icons';
import { io } from 'socket.io-client';
import { CHAT_UPLOAD_PREFIX, CHAT_UPLOAD_FILE_PREFIX, CHAT_UPLOAD_AUDIO_PREFIX } from '../utilss/types';
import { useSearchAcceptedUsers } from '../hooks/useSearchAcceptedUsers';
import { useGetUnreadConversationCount } from '../hooks/useGetUnreadMessagesCount';
const socket = io('http://localhost:5002', {
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 20000,
});


interface ChatPageProps {
    onSelectUser: (id: string) => void;
    selectedUserId: string | null;
}

const ChatPage: React.FC<ChatPageProps> = ({ onSelectUser, selectedUserId }) => {
    const { user } = useAuth();
    const [userId, setUserId] = useState<string | null>(null);
    const [typingUsers, setTypingUsers] = useState<Record<string, boolean>>({});
    const [lastMessagesMap, setLastMessagesMap] = useState<Record<number, any>>({});
    const [unreadCounts, setUnreadCounts] = useState<Record<number, number>>({});
    const [draftMessages, setDraftMessages] = useState<Record<string, string>>({});
    const [sortedUserIds, setSortedUserIds] = useState<number[]>([]);
    const [chatFilter, setChatFilter] = useState<'all' | 'unread' | 'search'>('all');
    const [searchTerm, setSearchTerm] = useState('');

    const { data, loading, refetch, error } = useGetAcceptedChatUsers(userId);
    const { data: dataAll, refetch: refetchAll, loading: loadingAll, error: err } = useGetAcceptedChatUsersAll(userId);
    const { data: searchData } = useSearchAcceptedUsers(userId, searchTerm);

    const otherUserIds = useMemo(() => {
        return data?.getAcceptedChatUsers.map((user: any) => user.id) || [];
    }, [data?.getAcceptedChatUsers]);

    const { data: chatUserData, loading: chatLoading } = useGetChatUserDetails(Number(userId), otherUserIds);

    const { data: lastMessagesData, loading: lastMessagesLoading } = useGetLastMessages(Number(userId), otherUserIds);

    const { data: unreadMessageCountsData, loading: unreadCountsLoading } = useGetUnreadMessagesCount(userId);
    const { unreadConversationCount, refetch: refetchUnreadTotal } = useGetUnreadConversationCount(userId);

    const [unreadTotal, setUnreadTotal] = useState(0);

    useEffect(() => {
        if (typeof unreadConversationCount === "number") {
            setUnreadTotal(unreadConversationCount);
        }
    }, [unreadConversationCount]);

    const lastMessages = useMemo(() => {
        return lastMessagesData?.getLastMessages || [];
    }, [lastMessagesData?.getLastMessages]);

    const refreshChats = async () => {
        try {
            await Promise.all([
                refetchAll(),
                refetch(),
                refetchUnreadTotal(),
            ]);
        } catch (error) {
            console.error("Failed to refresh chats:", error);
        }
    };

    useEffect(() => {
        if (unreadMessageCountsData) {
            const unreadCountMap = unreadMessageCountsData.getUnreadMessagesCount.reduce(
                (acc: Record<number, number>, { userId, unreadCount }: { userId: string, unreadCount: number }) => {
                    acc[parseInt(userId)] = unreadCount;
                    return acc;
                },
                {}
            );
            setUnreadCounts(unreadCountMap);

            // Count how many users have unread > 0
            const totalUnreadChats = (Object.values(unreadCountMap) as number[])
                .filter((count) => count > 0).length;

            setUnreadTotal(totalUnreadChats);
        }
    }, [unreadMessageCountsData]);

    useEffect(() => {
        const interval = setInterval(() => {
            const drafts: Record<string, string> = {};
            otherUserIds.forEach((otherUserId: any) => {
                const draftKey = `message_${userId}_${otherUserId}`;
                const draftMessage = localStorage.getItem(draftKey);
                if (draftMessage) {
                    drafts[draftKey] = draftMessage;
                }
            });
            setDraftMessages(drafts);
        }, 2000);

        return () => clearInterval(interval);
    }, [userId, otherUserIds]);

    useEffect(() => {
        if (!data?.getAcceptedChatUsers) return;

        const defaultOrder = data.getAcceptedChatUsers.map((user: any) => user.id);
        setSortedUserIds(defaultOrder);
    }, [data?.getAcceptedChatUsers]);

    const filteredUserIds = useMemo(() => {
        if (chatFilter === 'search') {
            return searchData?.searchAcceptedUsers?.map((u: any) => u.id) || [];
        }

        if (chatFilter === 'unread') {
            return sortedUserIds.filter((id) => unreadCounts[id] > 0);
        }

        return sortedUserIds;
    }, [chatFilter, sortedUserIds, unreadCounts, searchData]);

    useEffect(() => {
        if (!userId) return;

        dataAll?.getAcceptedChatUsersAll.forEach((user: any) => {
            const room = [userId, user.id].sort().join('-');
            if (socket.connected) {
                socket.emit('joinRoom', { userId, otherUserId: user.id });
                console.log(`Joined room: ${room}`);
            }
        });

        socket.on('userActivityUpdate', ({ userId: uId, isActive }: { userId: string; isActive: boolean }) => {
            if (userId === uId) return;
            setTypingUsers((prev) => ({
                ...prev,
                [uId]: isActive,
            }));
        });

        socket.on('receiveMessage', (message: any) => {
            if (!message || !message.sender || !message.receiver) {
                console.error('Invalid message format:', message);
                return;
            }

            if (message.wasSentWhileCurrentlyBlocked && message.sender.id !== userId) {
                return;
            }

            setLastMessagesMap((prev) => {
                const key = message.sender.id === userId ? message.receiver.id : message.sender.id;
                return { ...prev, [key]: message };
            });

            const senderId = message.sender.id;
            const activeUserId = senderId === userId ? message.receiver.id : senderId;
            setSortedUserIds((prev) => {
                const without = prev.filter((id) => id !== activeUserId);
                return [activeUserId, ...without];
            });

            // Increment unread count if the message is from another user
            if (message.sender.id !== userId) {
                setUnreadCounts((prev) => ({
                    ...prev,
                    [message.sender.id]: (prev[message.sender.id] || 0) + 1,
                }));

                setUnreadTotal(prev => prev + 1);
            }
        });

        socket.on('updatedLastMessageForDelMe', (message: { message: any, uId: any, oth: any, }) => {
            const msg = message.message;
            const uId = message.uId;
            const oth = message.oth;

            if (uId !== userId) return;

            setLastMessagesMap((prev) => {
                const key = msg !== undefined ? (msg.sender.id === userId ? msg.receiver.id : msg.sender.id) : oth;
                return { ...prev, [key]: msg || null };
            });

        });

        socket.on('updatedLastMessage', ({ senderMessage, receiverMessage, unreadCount, uId, oth }: { senderMessage: any; receiverMessage: any; unreadCount: number, uId: any, oth: any }) => {
            if (userId === uId) {
                setLastMessagesMap((prev) => {
                    const key = senderMessage !== null
                        ? (senderMessage.sender.id === userId
                            ? senderMessage.receiver.id
                            : senderMessage.sender.id)
                        : oth;

                    return {
                        ...prev,
                        [key]: senderMessage || null,
                    };
                });
            }

            if (userId !== uId) {
                setLastMessagesMap((prev) => {
                    const key = receiverMessage !== null ? (receiverMessage.sender.id === userId ? receiverMessage.receiver.id : receiverMessage.sender.id) : uId;
                    return { ...prev, [key]: receiverMessage || null };
                });

                setUnreadCounts((prev) => ({
                    ...prev,
                    [uId]: unreadCount !== undefined
                        ? Math.max((prev[uId] || 0) - unreadCount, 0)
                        : (prev[uId] || 0),
                }));
            }
        });

        socket.on('updatedLastMessageAfterEdit', ({ senderMessage, receiverMessage, uId, oth }: { senderMessage: any; receiverMessage: any; uId: any, oth: any }) => {
            if (userId === uId) {
                setLastMessagesMap((prev) => {
                    const key = senderMessage !== null
                        ? (senderMessage.sender.id === userId
                            ? senderMessage.receiver.id
                            : senderMessage.sender.id)
                        : oth;

                    return {
                        ...prev,
                        [key]: senderMessage || null,
                    };
                });
            }

            if (userId !== uId) {
                setLastMessagesMap((prev) => {
                    const key = receiverMessage !== null ? (receiverMessage.sender.id === userId ? receiverMessage.receiver.id : receiverMessage.sender.id) : uId;
                    return { ...prev, [key]: receiverMessage || null };
                });
            }
        });

        socket.on('unreadCountReset', (otherUserId: { otherUserId: string; count: number }) => {
            const id = otherUserId.otherUserId;
            if (id !== userId) {
                setUnreadCounts((prev) => ({
                    ...prev,
                    [id]: 0,
                }));

                setUnreadTotal(prev => Math.max(prev - 1, 0));
            }
        });

        // Cleanup listeners
        return () => {
            socket.off('userActivityUpdate');
            socket.off('receiveMessage');
            socket.off('unreadCountReset');
            socket.off('updatedLastMessageForDelMe');
            socket.off('updatedLastMessage');
            socket.off('updatedLastMessageAfterEdit');
            data?.getAcceptedChatUsers.forEach((user: any) => {
                const room = [userId, user.id].sort().join('-');
                socket.emit('leaveRoom', { userId, otherUserId: user.id });
                console.log(`Left room: ${room}`);
            });
        };
    }, [userId, data, refetch, dataAll]);

    useEffect(() => {
        if (!userId) return;

        socket.on('messageDelivered', ({ transformedMessage }) => {
            const { sender, receiver, id } = transformedMessage;

            setLastMessagesMap((prev) => {
                const key = sender.id === userId ? receiver.id : sender.id;

                const currentMessage = prev[key];

                if (currentMessage && currentMessage.id === id) {
                    return {
                        ...prev,
                        [key]: { ...currentMessage, status: 'delivered' },
                    };
                }

                return prev;
            });
        });

        return () => {
            socket.off('messageDelivered');
        };
    }, [userId]);

    useEffect(() => {
        if (!userId) return;

        socket.on('messageStatusUpdatedToRead', (transformedMessage) => {
            const { sender, receiver, id } = transformedMessage;

            setLastMessagesMap((prev) => {
                const key = sender.id === userId ? receiver.id : sender.id;

                const currentMessage = prev[key];

                if (currentMessage && currentMessage.id === id) {
                    return {
                        ...prev,
                        [key]: { ...currentMessage, status: 'read' },
                    };
                }

                return prev;
            });
        });

        return () => {
            socket.off('messageStatusUpdatedToRead');
        };
    }, [userId]);

    useEffect(() => {
        setLastMessagesMap((prev) => {
            const newLastMessagesMap = lastMessages.reduce((acc: Record<number, any>, msg: any) => {
                const key = msg.sender.id === userId ? msg.receiver.id : msg.sender.id;

                // Merge with previous state
                acc[key] = acc[key]?.timestamp > msg.timestamp ? acc[key] : msg; // Keep the most recent
                return acc;
            }, { ...prev });

            return newLastMessagesMap;
        });
    }, [lastMessages, userId]);

    useEffect(() => {
        if (user) {
            const decodedToken: any = jwtDecode(user.token);
            setUserId(decodedToken.sub);
        }
    }, [user]);

    const handleUserClick = (otherUserId: number) => {
        // Reset unread count when opening a chat
        // setUnreadCounts((prev) => ({ ...prev, [otherUserId]: 0 }));
        // window.location.href = `/chat/${otherUserId}`;
        if (onSelectUser) {
            onSelectUser(String(otherUserId));
        }
    };

    const formatTimestamp = (iso?: string | number | null) => {
        if (!iso) return '';
        const d = new Date(iso);
        const now = new Date();

        const isToday =
            d.getFullYear() === now.getFullYear() &&
            d.getMonth() === now.getMonth() &&
            d.getDate() === now.getDate();

        const yesterday = new Date(now);
        yesterday.setDate(now.getDate() - 1);
        const isYesterday =
            d.getFullYear() === yesterday.getFullYear() &&
            d.getMonth() === yesterday.getMonth() &&
            d.getDate() === yesterday.getDate();

        const startOfWeek = new Date(now);
        const day = startOfWeek.getDay();
        startOfWeek.setDate(now.getDate() - day);
        const isThisWeek = d > startOfWeek && !isToday && !isYesterday;

        if (isToday) {
            return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
        }
        if (isYesterday) return 'Yesterday';
        if (isThisWeek) return d.toLocaleDateString([], { weekday: 'short' });
        return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    };

    if (loading || lastMessagesLoading || unreadCountsLoading || chatLoading || loadingAll) return <Spin size="default" style={{ display: 'block', margin: '0 auto' }} />;
    if (error) return <p>Error: {error.message}</p>;
    if (err) return <p>Error: {err.message}</p>;

    return (
        <div className="chat-page-container" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            <Box component="main" sx={{ flexGrow: 1, bgcolor: 'background.default', p: 2 }}>
                <AppBar
                    position="static"
                    sx={{
                        boxShadow: 'none',
                        backgroundColor: '#fff',
                        color: 'black',
                    }}
                >
                    <Toolbar sx={{ gap: 2, px: { xs: 1, sm: 2, md: 3 } }}>
                        <Box
                            sx={{
                                flex: 1,
                                display: 'flex',
                                justifyContent: 'center',
                            }}
                        >
                            <Box
                                sx={{
                                    width: { xs: '100%', sm: '420px' },
                                    maxWidth: '100%',
                                    position: 'relative',
                                }}
                            >
                                <InputBase
                                    placeholder="Search using username or custom name"
                                    value={searchTerm}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        setSearchTerm(value);
                                        setChatFilter(value.length > 0 ? 'search' : 'all');
                                    }}
                                    sx={{
                                        width: '100%',
                                        height: 44,
                                        px: 3,
                                        borderRadius: '999px',
                                        background: '#fff',
                                        boxShadow: '0 6px 18px rgba(15,23,42,0.06)',
                                        transition: 'box-shadow .25s ease, transform .15s ease',
                                        fontFamily: 'Montserrat, sans-serif',
                                    }}
                                />

                                {searchTerm && (
                                    <IconButton
                                        onClick={() => {
                                            setSearchTerm('');
                                            setChatFilter('all');
                                        }}
                                        sx={{
                                            position: 'absolute',
                                            right: 6,
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                            color: 'gray',
                                            '&:hover': { color: '#2980b9' },
                                        }}
                                    >
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            width="18"
                                            height="18"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="3"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        >
                                            <line x1="18" y1="6" x2="6" y2="18" />
                                            <line x1="6" y1="6" x2="18" y2="18" />
                                        </svg>
                                    </IconButton>
                                )}
                            </Box>
                        </Box>
                    </Toolbar>
                </AppBar>
            </Box>

            <Box
                display="flex"
                justifyContent="center"
                alignItems="center"
                gap={1.5}
                mb={2}
                sx={{ px: 2 }}
            >
                <Box display="flex" justifyContent="center" alignItems="center" gap={1.5}>
                    {[
                        { key: 'all', label: 'All Chats' },
                        { key: 'unread', label: 'Unread' },
                    ].map(({ key, label }) => {
                        const isActive = chatFilter === key;
                        const showBadge = key === 'unread' && unreadTotal > 0;
                        return (
                            <Paper
                                key={key}
                                elevation={0}
                                onClick={() => {
                                    setChatFilter(key as any);
                                    if (key !== 'search') setSearchTerm('');
                                }}
                                sx={{
                                    cursor: 'pointer',
                                    px: 2.2,
                                    py: 0.7,
                                    borderRadius: '20px',
                                    border: isActive ? '1.8px solid #2980b9' : '1px solid rgba(0,0,0,0.08)',
                                    background: isActive ? 'rgba(41,128,185,0.06)' : 'transparent',
                                    color: isActive ? '#2980b9' : '#333',
                                    fontWeight: 600,
                                    fontSize: '0.95rem',
                                    transition: 'all 0.24s ease',
                                }}
                            >
                                {showBadge ? (
                                    <Badge
                                        badgeContent={unreadTotal}
                                        color="error"
                                        sx={{
                                            '& .MuiBadge-badge': {
                                                fontFamily: 'Montserrat, sans-serif',
                                                fontSize: '0.65rem',
                                                minWidth: '18px',
                                                height: '18px',
                                            }
                                        }}
                                    >
                                        <Typography variant="subtitle2" sx={{ fontFamily: 'Montserrat, sans-serif' }}>
                                            {label}
                                        </Typography>
                                    </Badge>
                                ) : (
                                    <Typography variant="subtitle2" sx={{ fontFamily: 'Montserrat, sans-serif' }}>
                                        {label}
                                    </Typography>
                                )}
                            </Paper>
                        );
                    })}
                </Box>

                <Tooltip
                    title={<span className="font-montserrat">Refresh Chats</span>}
                    placement="right"
                >
                    <IconButton onClick={refreshChats}>
                        <ReloadOutlined
                            spin={loading}
                            style={{ fontSize: 20, color: '#2980b9' }}
                        />
                    </IconButton>
                </Tooltip>
            </Box>

            <Paper elevation={3} sx={{ padding: { xs: 1, sm: 2 }, mx: { xs: 1, sm: 2 }, borderRadius: 2 }}>
                {data?.getAcceptedChatUsers.length === 0 ? (
                    <Box sx={{ py: 6, textAlign: 'center' }}>
                        <Typography variant="body1" color="text.secondary">
                            No users to chat with
                        </Typography>
                    </Box>
                ) : (
                    <List>
                        {filteredUserIds.length > 0 ? (
                            filteredUserIds.map((id: number) => {
                                const user = dataAll.getAcceptedChatUsersAll.find((u: any) => u.id === id);
                                const lastMessage = lastMessagesMap[user.id] || null;
                                const unreadCount = unreadCounts[user.id] || 0;
                                const draftMessage = draftMessages[`message_${userId}_${user.id}`];
                                const truncatedDraftMessage = draftMessage ? draftMessage.split(' ').slice(0, 40).join(' ') : '';
                                const displayDraftMessage = draftMessage && draftMessage.split(' ').length > 40
                                    ? `${truncatedDraftMessage}...`
                                    : truncatedDraftMessage;

                                const chatDetail = chatUserData?.getOtherUserChatDetails?.find(
                                    (chat: any) => chat && chat.otherUser && chat.otherUser.id === user.id
                                );

                                const isSelected = String(selectedUserId) === String(user.id);

                                return (
                                    <ListItem
                                        key={user.id}
                                        onClick={() => handleUserClick(user.id)}
                                        sx={{
                                            mb: 1.5,
                                            px: { xs: 1.2, sm: 2 },
                                            py: { xs: 1, sm: 1.3 },
                                            borderRadius: 2,
                                            cursor: 'pointer',
                                            alignItems: 'flex-start',
                                            background: isSelected ? 'rgba(37, 211, 102, 0.08)' : '#fff',
                                            boxShadow: '0 6px 14px rgba(15,23,42,0.03)',
                                            transition: 'transform .12s ease, box-shadow .12s ease',
                                            '&:hover': { transform: 'translateY(-2px)' },
                                            minHeight: 70,
                                            display: 'flex',
                                        }}
                                    >
                                        <ListItemAvatar sx={{ minWidth: 56, mr: 1.5 }}>
                                            <Badge
                                                badgeContent={unreadCount > 0 ? unreadCount : null}
                                                color="primary"
                                                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                                                sx={{
                                                    '& .MuiBadge-badge': {
                                                        backgroundColor: '#25D566',
                                                        color: '#fff',
                                                        fontSize: '0.7rem',
                                                        minWidth: 22,
                                                        height: 22,
                                                        borderRadius: '12px',
                                                    },
                                                }}
                                            >
                                                <Avatar
                                                    sx={{
                                                        width: 46,
                                                        height: 46,
                                                        fontWeight: 600,
                                                        bgcolor: user.profilePicture ? 'transparent' : '#e8eef6',
                                                    }}
                                                >
                                                    {user.profilePicture ? (
                                                        <img
                                                            src={`http://localhost:5002${user.profilePicture}`}
                                                            alt={user.fullName[0]}
                                                            style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 999 }}
                                                        />
                                                    ) : (
                                                        <span style={{ fontFamily: 'Montserrat, sans-serif' }}>{user.fullName?.[0]}</span>
                                                    )}
                                                </Avatar>
                                            </Badge>
                                        </ListItemAvatar>

                                        <Box sx={{ flex: 1, minWidth: 0 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                                                <Typography
                                                    noWrap
                                                    sx={{
                                                        fontWeight: 700,
                                                        fontSize: '0.98rem',
                                                        lineHeight: 1.05,
                                                        mr: 1,
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        whiteSpace: 'nowrap',
                                                        flex: 1,
                                                    }}
                                                >
                                                    {chatDetail?.customUsername || user.fullName}
                                                </Typography>

                                                <Typography
                                                    sx={{
                                                        fontSize: '0.82rem',
                                                        color: 'text.secondary',
                                                        whiteSpace: 'nowrap',
                                                        flexShrink: 0,
                                                    }}
                                                >
                                                    {lastMessage ? formatTimestamp(lastMessage.timestamp) : ''}
                                                </Typography>
                                            </Box>

                                            <Box sx={{ mt: 0.35, display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Box sx={{ minWidth: 0, flex: 1 }}>
                                                    {typingUsers[user.id] ? (
                                                        <Typography
                                                            sx={{
                                                                fontSize: '13px',
                                                                color: '#25D566',
                                                                fontStyle: 'italic',
                                                                fontWeight: 700,
                                                            }}
                                                            noWrap
                                                        >
                                                            Typing...
                                                        </Typography>
                                                    ) : draftMessage ? (
                                                        <Typography
                                                            sx={{
                                                                fontSize: '13px',
                                                                color: '#16a34a',
                                                                fontStyle: 'italic',
                                                                fontWeight: 600,
                                                            }}
                                                            noWrap
                                                        >
                                                            {`Draft: ${displayDraftMessage}`}
                                                        </Typography>
                                                    ) : lastMessage !== null ? (
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                            {lastMessage.sender?.id === userId && (
                                                                <>
                                                                    <Typography
                                                                        sx={{
                                                                            fontSize: '13px',
                                                                            color: 'text.secondary',
                                                                            fontWeight: 700,
                                                                            mr: 0.3,
                                                                        }}
                                                                        noWrap
                                                                    >
                                                                        You:
                                                                    </Typography>
                                                                    <span className="text-sm text-gray-600 mr-1" style={{ fontSize: '12px' }}>
                                                                        {lastMessage.status.toLowerCase() === 'sent' && (
                                                                            <svg
                                                                                xmlns="http://www.w3.org/2000/svg"
                                                                                width="24"
                                                                                height="16"
                                                                                viewBox="0 0 24 24"
                                                                                fill="none"
                                                                                stroke="currentColor"
                                                                                strokeWidth="2"
                                                                                strokeLinecap="round"
                                                                                strokeLinejoin="round"
                                                                                className="tick-icon"
                                                                            >
                                                                                <polyline points="20 6 9 17 4 12" />
                                                                            </svg>
                                                                        )}
                                                                        {lastMessage.status.toLowerCase() === 'delivered' && (
                                                                            <svg
                                                                                xmlns="http://www.w3.org/2000/svg"
                                                                                width="24"
                                                                                height="16"
                                                                                viewBox="0 0 32 16"
                                                                                fill="none"
                                                                                stroke="currentColor"
                                                                                strokeWidth="2"
                                                                                strokeLinecap="round"
                                                                                strokeLinejoin="round"
                                                                                className="tick-icon mb-1"
                                                                            >
                                                                                <polyline points="20 6 9 17 4 12" />
                                                                                <polyline points="26 6 15 17 20 12" />
                                                                            </svg>
                                                                        )}
                                                                        {lastMessage.status.toLowerCase() === 'read' && (
                                                                            <svg
                                                                                xmlns="http://www.w3.org/2000/svg"
                                                                                width="24"
                                                                                height="16"
                                                                                viewBox="0 0 32 16"
                                                                                fill="none"
                                                                                stroke="currentColor"
                                                                                strokeWidth="2"
                                                                                strokeLinecap="round"
                                                                                strokeLinejoin="round"
                                                                                className="tick-icon text-green-500 mb-1 font-bold"
                                                                            >
                                                                                <polyline points="20 6 9 17 4 12" />
                                                                                <polyline points="26 6 15 17 20 12" />
                                                                            </svg>
                                                                        )}
                                                                    </span>
                                                                </>


                                                            )}

                                                            <Typography
                                                                sx={{
                                                                    fontSize: '13px',
                                                                    color: 'text.secondary',
                                                                    overflow: 'hidden',
                                                                    textOverflow: 'ellipsis',
                                                                    whiteSpace: 'nowrap',
                                                                    maxWidth: '100%',
                                                                }}
                                                                component="span"
                                                            >
                                                                {lastMessage.content?.startsWith(CHAT_UPLOAD_PREFIX) ? (
                                                                    <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.6 }}>
                                                                        <CameraOutlined />
                                                                        {!lastMessage.caption ? 'Photo' : (
                                                                            <Box component="span" sx={{ color: 'text.secondary', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                                                {lastMessage.caption}
                                                                            </Box>
                                                                        )}
                                                                    </Box>
                                                                ) : lastMessage.content?.startsWith(CHAT_UPLOAD_FILE_PREFIX) ? (
                                                                    <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.6 }}>
                                                                        <PaperClipOutlined />
                                                                        {!lastMessage.caption ? 'File' : (
                                                                            <Box component="span" sx={{ color: 'text.secondary', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                                                {lastMessage.caption}
                                                                            </Box>
                                                                        )}
                                                                    </Box>
                                                                ) : lastMessage.content?.startsWith(CHAT_UPLOAD_AUDIO_PREFIX) ? (
                                                                    <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.6 }}>
                                                                        <AudioOutlined />
                                                                        Audio
                                                                    </Box>
                                                                ) : lastMessage.content?.length > 100 ? (
                                                                    `${lastMessage.content.slice(0, 100)}...`
                                                                ) : (
                                                                    lastMessage.content
                                                                )}
                                                            </Typography>
                                                        </Box>
                                                    ) : (
                                                        <Typography sx={{ fontSize: '13px', color: 'text.secondary' }} noWrap>
                                                            No messages yet
                                                        </Typography>
                                                    )}
                                                </Box>

                                            </Box>
                                        </Box>
                                    </ListItem>
                                );
                            })
                        ) : (
                            <Box sx={{ py: 6, textAlign: 'center' }}>
                                <Typography
                                    textAlign="center"
                                    sx={{
                                        color: 'gray',
                                        fontSize: '1rem',
                                        letterSpacing: '0.3px',
                                        px: 2,
                                    }}
                                >
                                    {chatFilter === 'search' ? 'No results found' : 'No unread messages'}
                                </Typography>
                            </Box>
                        )}
                    </List>
                )}
            </Paper>
        </div>
    );
};

export default ChatPage;
