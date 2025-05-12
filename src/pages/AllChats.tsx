import React, { useEffect, useState, useMemo } from 'react';
import { Spin } from 'antd';
import { jwtDecode } from 'jwt-decode';
import { useAuth } from '../contexts/AuthContext';
import { useGetAcceptedChatUsers } from '../hooks/useGetAcceptedUsers';
import { useGetLastMessages } from '../hooks/useGetLastMessage';
import { useGetUnreadMessagesCount } from '../hooks/useGetUnreadMessagesCount';
import { useGetChatUserDetails } from '../hooks/useGetOtherUserdetails';
import Dashboard from '../components/Layout';
import { List, ListItem, ListItemAvatar, ListItemText, Avatar, Paper, Typography, Badge } from '@mui/material';
import { CameraOutlined, PaperClipOutlined, AudioOutlined } from '@ant-design/icons';
import socket from '../socket';
import { CHAT_UPLOAD_PREFIX, CHAT_UPLOAD_FILE_PREFIX, CHAT_UPLOAD_AUDIO_PREFIX } from '../utilss/types';

const ChatPage = () => {
    const { user } = useAuth();
    const [userId, setUserId] = useState<string | null>(null);
    const [typingUsers, setTypingUsers] = useState<Record<string, boolean>>({});
    const [lastMessagesMap, setLastMessagesMap] = useState<Record<number, any>>({});
    const [unreadCounts, setUnreadCounts] = useState<Record<number, number>>({});
    const [draftMessages, setDraftMessages] = useState<Record<string, string>>({});
    const { data, loading, error } = useGetAcceptedChatUsers(userId);

    const otherUserIds = useMemo(() => {
        return data?.getAcceptedChatUsers.map((user: any) => user.id) || [];
    }, [data?.getAcceptedChatUsers]);

    const { data: chatUserData, loading: chatLoading } = useGetChatUserDetails(Number(userId), otherUserIds);

    const { data: lastMessagesData, loading: lastMessagesLoading } = useGetLastMessages(Number(userId), otherUserIds);

    const { data: unreadMessageCountsData, loading: unreadCountsLoading } = useGetUnreadMessagesCount(userId);

    const lastMessages = useMemo(() => {
        return lastMessagesData?.getLastMessages || [];
    }, [lastMessagesData?.getLastMessages]);

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
        if (!userId) return;

        data?.getAcceptedChatUsers.forEach((user: any) => {
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
            if (!message || !message.sender || !message.receiver || message.wasSentWhileCurrentlyBlocked) {
                console.error('Invalid message format:', message);
                return;
            }

            setLastMessagesMap((prev) => {
                const key = message.sender.id === userId ? message.receiver.id : message.sender.id;
                return { ...prev, [key]: message };
            });

            // Increment unread count if the message is from another user
            if (message.sender.id !== userId) {
                setUnreadCounts((prev) => ({
                    ...prev,
                    [message.sender.id]: (prev[message.sender.id] || 0) + 1,
                }));
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
            }
        });

        // Cleanup listeners
        return () => {
            socket.off('userActivityUpdate');
            socket.off('receiveMessage');
            socket.off('unreadCountReset');
            socket.off('updatedLastMessageForDelMe');
            socket.off('updatedLastMessage');
            data?.getAcceptedChatUsers.forEach((user: any) => {
                const room = [userId, user.id].sort().join('-');
                socket.emit('leaveRoom', { userId, otherUserId: user.id });
                console.log(`Left room: ${room}`);
            });
        };
    }, [userId, data]);

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
        setUnreadCounts((prev) => ({ ...prev, [otherUserId]: 0 }));
        window.location.href = `/chat/${otherUserId}`;
    };

    const formatTimestamp = (timestamp: string) => {
        const messageDate = new Date(timestamp);
        const currentDate = new Date();

        const isToday = messageDate.toDateString() === currentDate.toDateString();
        const isYesterday =
            messageDate.getDate() === currentDate.getDate() - 1 &&
            messageDate.getMonth() === currentDate.getMonth() &&
            messageDate.getFullYear() === currentDate.getFullYear();

        const hours = messageDate.getHours();
        let minutes = messageDate.getMinutes();
        const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes.toString();

        if (isToday) {
            return `${hours}:${formattedMinutes} ${hours < 12 ? "AM" : "PM"}`;
        } else if (isYesterday) {
            return "Yesterday";
        } else {
            return `${messageDate.getMonth() + 1}/${messageDate.getDate()}/${messageDate.getFullYear().toString().slice(-2)}`;
        }
    };

    if (loading || lastMessagesLoading || unreadCountsLoading || chatLoading) return <Spin size="default" style={{ display: 'block', margin: '0 auto' }} />;
    if (error) return <p>Error: {error.message}</p>;

    return (
        <Dashboard>
            <div className="chat-page-container">
                <div className="search-section">
                    <Typography variant="h5" sx={{ fontFamily: 'Poppins, sans-serif', marginBottom: '10px' }}>
                        Chat Users
                    </Typography>
                </div>

                <Paper elevation={3} sx={{ padding: '20px' }}>
                    {data?.getAcceptedChatUsers.length === 0 ? (
                        <p>No users to chat with</p>
                    ) : (
                        <List>
                            {data?.getAcceptedChatUsers.map((user: any) => {
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

                                return (
                                    <ListItem
                                        key={user.id}
                                        sx={{
                                            marginBottom: '20px',
                                            borderRadius: '12px',
                                            padding: '10px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                                            cursor: 'pointer',
                                            '&:hover': {
                                                transform: 'scale(1.01)',
                                                transition: 'transform 0.2s',
                                            },
                                        }}
                                        onClick={() => handleUserClick(user.id)}
                                    >
                                        <ListItemAvatar>
                                            <Badge
                                                badgeContent={unreadCount}
                                                color="primary"
                                                anchorOrigin={{
                                                    vertical: 'top',
                                                    horizontal: 'right',
                                                }}
                                            >
                                                <Avatar>
                                                    {user.profilePicture ? (
                                                        <img
                                                            src={`http://localhost:5002${user.profilePicture}`}
                                                            alt={user.fullName[0]}
                                                            style={{ width: '100%', height: '100%' }}
                                                        />
                                                    ) : (
                                                        user.fullName[0]
                                                    )}
                                                </Avatar>
                                            </Badge>
                                        </ListItemAvatar>
                                        <ListItemText
                                            primary={chatDetail?.customUsername || user.fullName}
                                            secondary={
                                                typingUsers[user.id] ? (
                                                    <Typography
                                                        sx={{
                                                            fontSize: '13px',
                                                            color: 'green',
                                                            fontStyle: 'italic',
                                                            fontWeight: 'bold',
                                                            fontFamily: 'Poppins, sans-serif',
                                                        }}
                                                    >
                                                        Typing...
                                                    </Typography>
                                                ) : draftMessage ? (
                                                    <Typography
                                                        sx={{
                                                            fontSize: '14px',
                                                            color: 'green',
                                                            fontWeight: 'bold',
                                                            fontFamily: 'Poppins, sans-serif',
                                                        }}
                                                    >
                                                        Draft: {displayDraftMessage}
                                                    </Typography>
                                                ) : lastMessage !== null ? (
                                                    <div className="flex justify-between">
                                                        <span className="flex items-center">
                                                            {lastMessage.sender.id === userId ? (
                                                                <>
                                                                    <span className="mr-1 font-semibold">You:</span>
                                                                    <span className="flex items-center">
                                                                        {lastMessage.status && (
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
                                                                        )}
                                                                        <span className="truncate block max-w-full">
                                                                            {lastMessage.content.startsWith(CHAT_UPLOAD_PREFIX) ? (
                                                                                <span className="flex items-center gap-1 text-gray-600">
                                                                                    <CameraOutlined />
                                                                                    <span>Photo</span>
                                                                                </span>
                                                                            ) : lastMessage.content.startsWith(CHAT_UPLOAD_FILE_PREFIX) ? (
                                                                                <span className="flex items-center gap-1 text-gray-600">
                                                                                    <PaperClipOutlined />
                                                                                    <span>File</span>
                                                                                </span>
                                                                            ) : lastMessage.content.startsWith(CHAT_UPLOAD_AUDIO_PREFIX) ? (
                                                                                <span className="flex items-center gap-1 text-gray-600">
                                                                                    <AudioOutlined />
                                                                                    <span>Audio</span>
                                                                                </span>
                                                                            ) : lastMessage.content.length > 100 ? (
                                                                                lastMessage.content.slice(0, 100) + "..."
                                                                            ) : (
                                                                                lastMessage.content
                                                                            )}
                                                                        </span>

                                                                    </span>
                                                                </>
                                                            ) : (
                                                                <span className="truncate block max-w-full">
                                                                    {lastMessage.content.startsWith(CHAT_UPLOAD_PREFIX) ? (
                                                                        <span className="flex items-center gap-1 text-gray-600">
                                                                            <CameraOutlined />
                                                                            <span>Photo</span>
                                                                        </span>
                                                                    ) : lastMessage.content.startsWith(CHAT_UPLOAD_FILE_PREFIX) ? (
                                                                        <span className="flex items-center gap-1 text-gray-600">
                                                                            <PaperClipOutlined />
                                                                            <span>File</span>
                                                                        </span>
                                                                    ) : lastMessage.content.startsWith(CHAT_UPLOAD_AUDIO_PREFIX) ? (
                                                                        <span className="flex items-center gap-1 text-gray-600">
                                                                            <AudioOutlined />
                                                                            <span>Audio</span>
                                                                        </span>
                                                                    ) : lastMessage.content.length > 100 ? (
                                                                        lastMessage.content.slice(0, 100) + "..."
                                                                    ) : (
                                                                        lastMessage.content
                                                                    )}
                                                                </span>

                                                            )}
                                                        </span>
                                                        <span className="text-md text-gray-500 mr-4">{formatTimestamp(lastMessage.timestamp)}</span>
                                                    </div>
                                                ) : (
                                                    'No messages yet'
                                                )
                                            }
                                            primaryTypographyProps={{
                                                sx: { fontFamily: 'Poppins, sans-serif', fontWeight: 'bold' },
                                            }}
                                            secondaryTypographyProps={{
                                                sx: { fontFamily: 'Poppins, sans-serif', color: '#888' },
                                            }}
                                        />
                                    </ListItem>
                                );
                            })}
                        </List>
                    )}
                </Paper>
            </div>
        </Dashboard>
    );
};

export default ChatPage;
