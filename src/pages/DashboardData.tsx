import React, { useEffect, useState } from 'react';
import {
    Box,
    Typography,
    Avatar,
    Card,
    Grid,
    Stack,
    Tooltip,
    CircularProgress,
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { jwtDecode } from 'jwt-decode';
import {
    useGetAcceptedChatUsersAll,
    useGetAcceptedChatUsers,
} from '../hooks/useGetAcceptedUsers';
import { useGetUserById } from '../hooks/useGetOtherUser';
import {
    useGetMessageStats,
    useGetBlockedUsersCount,
    useGetPendingRequestSummary,
    useGetUnreadSummary,
    useGetRecentConversationsLastMessages,
} from '../hooks/useDashboardData';

const DashboardPage: React.FC = () => {
    const { user } = useAuth();
    const [userId, setUserId] = useState<string | null>(null);

    const { data: userData, loading: userLoading } = useGetUserById(userId!);

    useEffect(() => {
        if (user) {
            const decodedToken: any = jwtDecode(user.token);
            setUserId(decodedToken.sub);
        }
    }, [user]);

    // Hooks for dashboard stats
    const { data: allContactsData, loading: allContactsLoading } = useGetAcceptedChatUsersAll(userId);
    const { data: activeChatsData, loading: activeChatsLoading } = useGetAcceptedChatUsers(userId);
    const { data: recentMessagesData, loading: recentMessagesLoading } = useGetRecentConversationsLastMessages(userId);
    const { data: unreadSummaryData } = useGetUnreadSummary(Number(userId));
    const { data: pendingRequestsData } = useGetPendingRequestSummary(Number(userId));
    const { data: blockedUsersData } = useGetBlockedUsersCount(Number(userId));
    const { data: messageStatsData } = useGetMessageStats(Number(userId));

    if (allContactsLoading || activeChatsLoading || recentMessagesLoading || userLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <CircularProgress size={60} />
            </Box>
        );
    }

    const onlineFriends = allContactsData?.getAcceptedChatUsersAll.filter((u: any) => u.isOnline) || [];

    return (
        <Box sx={{
            p: { xs: 2, md: 4 },
            minHeight: '100vh',
            fontFamily: 'Montserrat, sans-serif',
            background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        }}>
            <Box sx={{
                display: 'flex',
                alignItems: 'center',
                mb: 6,
                p: 3,
                borderRadius: 3,
                backdropFilter: 'blur(12px)',
                background: 'rgba(255,255,255,0.25)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                transition: 'all 0.3s ease-in-out',
                '&:hover': { transform: 'translateY(-3px)' },
            }}>
                <Avatar
                    src={userData?.getUserById?.profilePicture ? `http://localhost:5002${userData.getUserById.profilePicture}` : undefined}
                    sx={{ width: 72, height: 72, mr: 3, bgcolor: '#dbeafe', color: '#1e3a8a', fontWeight: 700 }}
                >
                    {!userData?.getUserById?.profilePicture && userData?.getUserById?.fullName?.charAt(0).toUpperCase()}
                </Avatar>
                <Box>
                    <Typography sx={{ fontSize: 28, fontWeight: 800, color: '#0f172a' }}>
                        Welcome, {userData?.getUserById?.fullName ?? 'User'} 👋
                    </Typography>
                    <Typography sx={{ color: '#64748b', mt: 0.5 }}>
                        Here’s a quick overview of your activity
                    </Typography>
                </Box>
            </Box>

            <Grid container spacing={4}>
                <Grid item xs={12} md={4}>
                    <Card sx={cardStyle}>
                        <Typography sx={cardTitleStyle('#2563eb')}>Total Contacts</Typography>
                        <Typography sx={cardNumberStyle('#1e40af')}>{allContactsData?.getAcceptedChatUsersAll.length ?? 0}</Typography>
                    </Card>
                </Grid>

                <Grid item xs={12} md={4}>
                    <Card sx={cardStyle}>
                        <Typography sx={cardTitleStyle('#16a34a')}>Friends Online</Typography>
                        <Typography sx={cardNumberStyle('#065f46', 2)}>{onlineFriends.length}</Typography>
                        <Stack direction="row" spacing={1} sx={{ overflowX: 'auto', py: 1 }}>
                            {onlineFriends.slice(0, 5).map((friend: any) => (
                                <Tooltip key={friend.id} title={friend.fullName}>
                                    <Avatar
                                        src={friend.profilePicture ? `http://localhost:5002${friend.profilePicture}` : undefined}
                                        sx={{ width: 40, height: 40, bgcolor: '#d1fae5', color: '#065f46', fontWeight: 700 }}
                                    >
                                        {!friend.profilePicture && friend.fullName.charAt(0).toUpperCase()}
                                    </Avatar>
                                </Tooltip>
                            ))}
                        </Stack>
                    </Card>
                </Grid>

                <Grid item xs={12} md={4}>
                    <Card sx={cardStyle}>
                        <Typography sx={cardTitleStyle('#f59e0b')}>Active Chats</Typography>
                        <Typography sx={cardNumberStyle('#78350f')}>{activeChatsData?.getAcceptedChatUsers.length ?? 0}</Typography>
                    </Card>
                </Grid>

                <Grid item xs={12} md={6}>
                    <Card sx={cardStyle}>
                        <Typography sx={cardTitleStyle('#db2777')}>Messages</Typography>
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={4} mt={1}>
                            <Box>
                                <Typography sx={subCardTitleStyle('#be185d')}>Sent</Typography>
                                <Typography sx={subCardNumberStyle}>{messageStatsData?.getMessageStats?.totalMessagesSent ?? 0}</Typography>
                            </Box>
                            <Box>
                                <Typography sx={subCardTitleStyle('#9333ea')}>Received</Typography>
                                <Typography sx={subCardNumberStyle}>{messageStatsData?.getMessageStats?.totalMessagesReceived ?? 0}</Typography>
                            </Box>
                        </Stack>
                    </Card>
                </Grid>

                <Grid item xs={12} md={3}>
                    <Card sx={cardStyle}>
                        <Typography sx={cardTitleStyle('#e11d48')}>Pending Requests</Typography>
                        <Typography sx={cardNumberStyle('#881337')}>
                            {pendingRequestsData?.getPendingRequestSummary?.receivedPendingCount ?? 0}
                        </Typography>
                    </Card>
                </Grid>

                <Grid item xs={12} md={3}>
                    <Card sx={cardStyle}>
                        <Typography sx={cardTitleStyle('#f43f5e')}>Unread Messages</Typography>
                        <Typography sx={cardNumberStyle('#b91c1c')}>
                            {unreadSummaryData?.getUnreadSummary?.totalUnreadMessages ?? 0}
                        </Typography>
                    </Card>
                </Grid>

                <Grid item xs={12} md={3}>
                    <Card sx={cardStyle}>
                        <Typography sx={cardTitleStyle('#6b7280')}>Blocked Users</Typography>
                        <Typography sx={cardNumberStyle('#374151')}>
                            {blockedUsersData?.getBlockedUsersCount?.blockedCount ?? 0}
                        </Typography>
                    </Card>
                </Grid>

                <Grid item xs={12}>
                    <Card sx={{ ...cardStyle, background: 'rgba(255,255,255,0.15)' }}>
                        <Typography sx={cardTitleStyle('#2563eb')}>Recent Messages</Typography>
                        <Stack spacing={2} mt={2}>
                            {recentMessagesData?.getRecentConversationsLastMessages.slice(0, 5).map((msg: any) => (
                                <Box key={msg.id} sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    p: 2,
                                    borderRadius: 2,
                                    background: 'rgba(255,255,255,0.3)',
                                    backdropFilter: 'blur(6px)',
                                    transition: 'all 0.2s ease-in-out',
                                    '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' },
                                }}>
                                    <Box>
                                        <Typography sx={{ fontWeight: 700 }}>
                                            {msg.sender.firstName} {msg.sender.lastName}
                                        </Typography>
                                        <Typography sx={{ color: '#64748b', fontSize: 13 }} noWrap>
                                            {msg.content}
                                        </Typography>
                                    </Box>
                                    <Typography sx={{ color: '#1e3a8a', fontWeight: 600, fontSize: 12 }}>
                                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </Typography>
                                </Box>
                            ))}
                        </Stack>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
};

const cardStyle = {
    borderRadius: 3,
    p: 3,
    background: 'rgba(255,255,255,0.2)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255,255,255,0.3)',
    transition: 'all 0.3s ease-in-out',
    '&:hover': { transform: 'translateY(-3px)', boxShadow: '0 8px 24px rgba(0,0,0,0.15)' },
};

const cardTitleStyle = (color: string) => ({
    fontWeight: 700,
    color,
    mb: 1,
});

const cardNumberStyle = (color: string, mb: number = 0) => ({
    fontSize: 36,
    fontWeight: 800,
    color,
    mb,
});

const subCardTitleStyle = (color: string) => ({
    fontSize: 20,
    fontWeight: 700,
    color,
});

const subCardNumberStyle = {
    fontSize: 28,
    fontWeight: 800,
};

export default DashboardPage;
