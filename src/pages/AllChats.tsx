import React, { useEffect, useState } from 'react';
import { Spin } from 'antd';
import { jwtDecode } from 'jwt-decode';
import { useAuth } from '../contexts/AuthContext';
import { useGetAcceptedChatUsers } from '../hooks/useGetAcceptedUsers';
import { useGetLastMessages } from '../hooks/useGetLastMessage';
import Dashboard from '../components/Layout';
import { List, ListItem, ListItemAvatar, ListItemText, Avatar, Paper, Typography } from '@mui/material';

const ChatPage = () => {
    const { user } = useAuth();
    const [userId, setUserId] = useState<string | null>(null);
    const { data, loading, error } = useGetAcceptedChatUsers(userId);

    useEffect(() => {
        if (user) {
            const decodedToken: any = jwtDecode(user.token);
            setUserId(decodedToken.sub);
        }
    }, [user]);

    const otherUserIds = data?.getAcceptedChatUsers.map((user: any) => user.id) || [];
    const { data: lastMessagesData, loading: lastMessagesLoading } = useGetLastMessages(Number(userId), otherUserIds);

    if (loading || lastMessagesLoading) return <Spin size="large" style={{ display: 'block', margin: '0 auto' }} />;
    if (error) return <p>Error: {error.message}</p>;

    const lastMessages = lastMessagesData?.getLastMessages || [];

    const lastMessagesMap = lastMessages.reduce((acc: Record<number, any>, msg: any) => {
        const key = msg.sender.id === userId ? msg.receiver.id : msg.sender.id;
        acc[key] = msg;
        return acc;
    }, {});


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
                                        onClick={() => (window.location.href = `/chat/${user.id}`)} // Consider useNavigate
                                    >
                                        <ListItemAvatar>
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
                                        </ListItemAvatar>
                                        <ListItemText
                                            primary={user.fullName}
                                            secondary={
                                                lastMessage
                                                    ? lastMessage.sender.id === userId
                                                        ? `You: ${lastMessage.content}`
                                                        : lastMessage.content
                                                    : 'No messages yet'
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
