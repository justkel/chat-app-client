import React, { useEffect, useState, useMemo } from 'react';
import { Spin } from 'antd';
import { jwtDecode } from 'jwt-decode';
import { useAuth } from '../contexts/AuthContext';
import { useGetAcceptedChatUsers } from '../hooks/useGetAcceptedUsers';
import { useGetLastMessages } from '../hooks/useGetLastMessage';
import { useGetUnreadMessagesCount } from '../hooks/useGetUnreadMessagesCount';
import Dashboard from '../components/Layout';
import { List, ListItem, ListItemAvatar, ListItemText, Avatar, Paper, Typography, Badge } from '@mui/material';
import socket from '../socket';

const ChatPage = () => {
    const { user } = useAuth();
    const [userId, setUserId] = useState<string | null>(null);
    const [typingUsers, setTypingUsers] = useState<Record<string, boolean>>({});
    const [lastMessagesMap, setLastMessagesMap] = useState<Record<number, any>>({});
    const [unreadCounts, setUnreadCounts] = useState<Record<number, number>>({}); // Unread message counts
    const { data, loading, error } = useGetAcceptedChatUsers(userId);

    const otherUserIds = data?.getAcceptedChatUsers.map((user: any) => user.id) || [];
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
            if (!message || !message.sender || !message.receiver) {
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
            data?.getAcceptedChatUsers.forEach((user: any) => {
                const room = [userId, user.id].sort().join('-');
                socket.emit('leaveRoom', { userId, otherUserId: user.id });
                console.log(`Left room: ${room}`);
            });
        };
    }, [userId, data]);

    useEffect(() => {
        const newLastMessagesMap = lastMessages.reduce((acc: Record<number, any>, msg: any) => {
            const key = msg.sender.id === userId ? msg.receiver.id : msg.sender.id;
            acc[key] = msg;
            return acc;
        }, {});
        setLastMessagesMap(newLastMessagesMap);
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

    if (loading || lastMessagesLoading || unreadCountsLoading) return <Spin size="large" style={{ display: 'block', margin: '0 auto' }} />;
    if (error) return <p>Error: {error.message}</p>;

    return (
        <Dashboard>
            <div className="chat-page-container">
                <div className="search-section">
                    <Typography variant="h4" sx={{ fontFamily: 'Poppins, sans-serif', marginBottom: '20px' }}>
                        Chat Users
                    </Typography>
                </div>

                <Paper elevation={3} sx={{ padding: '20px' }}>
                    {data?.getAcceptedChatUsers.length === 0 ? (
                        <p>No users to chat with</p>
                    ) : (
                        <List>
                            {data?.getAcceptedChatUsers.map((user: any) => {
                                const lastMessage = lastMessagesMap[user.id];
                                const unreadCount = unreadCounts[user.id] || 0;

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
                                                            alt={user.fullName}
                                                            style={{ width: '100%', height: '100%' }}
                                                        />
                                                    ) : (
                                                        user.fullName[0]
                                                    )}
                                                </Avatar>
                                            </Badge>
                                        </ListItemAvatar>
                                        <ListItemText
                                            primary={user.fullName}
                                            secondary={
                                                typingUsers[user.id] ? (
                                                    <Typography
                                                        sx={{
                                                            fontSize: '16px',
                                                            color: 'green',
                                                            fontStyle: 'italic',
                                                            fontWeight: 'bold',
                                                            fontFamily: 'Poppins, sans-serif',
                                                        }}
                                                    >
                                                        Typing...
                                                    </Typography>
                                                ) : lastMessage ? (
                                                    lastMessage.sender.id === userId
                                                        ? `You: ${lastMessage.content}`
                                                        : lastMessage.content
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
