import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input, Spin } from 'antd';
import { jwtDecode } from 'jwt-decode';
import { useAuth } from '../contexts/AuthContext';
import { useGetAcceptedChatUsers } from '../hooks/useGetAcceptedUsers';
import Dashboard from '../components/Layout';
import { List, ListItem, ListItemAvatar, ListItemText, Avatar, Typography, Paper } from '@mui/material';

const { Search } = Input;

const ChatPage = () => {
    const { user } = useAuth();
    const [userId, setUserId] = useState<string | null>(null);
    const { data, loading, error } = useGetAcceptedChatUsers(userId);
    const navigate = useNavigate();

    useEffect(() => {
        if (user) {
            const decodedToken: any = jwtDecode(user.token);
            setUserId(decodedToken.sub);
        }
    }, [user]);

    const handleUserClick = (id: string) => {
        navigate(`/chat/${id}`);
    };

    const renderAvatar = (user: any) => {
        if (user.profilePicture) {
            // Use the profile picture from the server
            return (
                <Avatar
                    src={`http://localhost:5002${user.profilePicture}`}
                    alt={user.fullName}
                    sx={{ backgroundColor: '#1890ff', fontFamily: 'Poppins, sans-serif' }}
                />
            );
        }

        // Fallback to initials if profilePicture is not available
        const initials = user.fullName
            .split(' ')
            .map((name: string) => name.charAt(0))
            .join('')
            .toUpperCase();

        return (
            <Avatar sx={{ backgroundColor: '#1890ff', fontFamily: 'Poppins, sans-serif' }}>
                {initials}
            </Avatar>
        );
    };

    if (loading) return <Spin size="large" style={{ display: 'block', margin: '0 auto' }} />;
    if (error) return <p>Error: {error.message}</p>;

    return (
        <Dashboard>
            <div className="chat-page-container">
                <div className="search-section">
                    <Typography variant="h4" sx={{ fontFamily: 'Poppins, sans-serif', marginBottom: '20px' }}>
                        Chat Users
                    </Typography>
                    <Search
                        placeholder="Search users..."
                        enterButton
                        disabled
                        style={{
                            width: '100%',
                            borderRadius: '5px',
                            marginBottom: '20px',
                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                        }}
                    />
                </div>

                <Paper elevation={3} sx={{ padding: '20px' }}>
                    {data?.getAcceptedChatUsers.length === 0 ? (
                        <p>No users to chat with</p>
                    ) : (
                        <List>
                            {data?.getAcceptedChatUsers.map((user: any) => (
                                <ListItem
                                    key={user.id}
                                    onClick={() => handleUserClick(user.id)}
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
                                >
                                    <ListItemAvatar>{renderAvatar(user)}</ListItemAvatar>
                                    <ListItemText
                                        primary={user.fullName}
                                        secondary={user.email}
                                        primaryTypographyProps={{
                                            sx: {
                                                fontFamily: 'Poppins, sans-serif',
                                                fontWeight: 'bold',
                                                color: '#1d1d1f',
                                            },
                                        }}
                                        secondaryTypographyProps={{
                                            sx: {
                                                fontFamily: 'Poppins, sans-serif',
                                                color: '#888',
                                                fontSize: '14px',
                                            },
                                        }}
                                    />
                                </ListItem>
                            ))}
                        </List>
                    )}
                </Paper>
            </div>
        </Dashboard>
    );
};

export default ChatPage;
