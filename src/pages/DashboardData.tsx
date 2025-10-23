import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Typography,
    Avatar,
    Card,
    Grid,
    Stack,
    Tooltip,
    CircularProgress,
    Chip,
    Alert,
    Snackbar,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import InboxIcon from '@mui/icons-material/Inbox';
import PersonAddAlt1Icon from '@mui/icons-material/PersonAddAlt1';
import BlockIcon from '@mui/icons-material/Block';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import ChatBubbleIcon from '@mui/icons-material/ChatBubble';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import AccountCircle from '@mui/icons-material/AccountCircle';
import { motion } from 'framer-motion';
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
import { CHAT_UPLOAD_PREFIX, CHAT_UPLOAD_FILE_PREFIX, CHAT_UPLOAD_AUDIO_PREFIX } from '../utilss/types';
import Dashboard from '../components/Layout';

const DashboardPage: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [userId, setUserId] = useState<string | null>(null);
    const [loadingNavigate, setLoadingNavigate] = useState(false);

    useEffect(() => {
        if (user) {
            try {
                const decodedToken: any = jwtDecode(user.token);
                setUserId(String(decodedToken.sub));
            } catch {
                setUserId(null);
            }
        }
    }, [user]);

    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'info',
    });

    const { data: userData, loading: userLoading, refetch: refetchUser } = useGetUserById(userId!);
    const { data: allContactsData, loading: allContactsLoading, refetch: refetchAllContacts } = useGetAcceptedChatUsersAll(userId);
    const { data: activeChatsData, loading: activeChatsLoading, refetch: refetchActiveContacts } = useGetAcceptedChatUsers(userId);
    const { data: recentMessagesData, loading: recentMessagesLoading, refetch: refetchRecentMessages } = useGetRecentConversationsLastMessages(userId);
    const { data: unreadSummaryData, refetch: refetchUnread } = useGetUnreadSummary(userId ? Number(userId) : null);
    const { data: pendingRequestsData, refetch: refetchPending } = useGetPendingRequestSummary(userId ? Number(userId) : null);
    const { data: blockedUsersData, refetch: refetchBlocked } = useGetBlockedUsersCount(userId ? Number(userId) : null);
    const { data: messageStatsData, refetch: refetchMessageStats } = useGetMessageStats(userId ? Number(userId) : null);

    const [refreshing, setRefreshing] = useState(false);

    const refreshAll = async () => {
        setRefreshing(true);
        await Promise.all([
            refetchUser?.(),
            refetchAllContacts?.(),
            refetchActiveContacts?.(),
            refetchRecentMessages?.(),
            refetchUnread?.(),
            refetchPending?.(),
            refetchBlocked?.(),
            refetchMessageStats?.(),
        ]);
        setRefreshing(false);
        setSnackbar({ open: true, message: 'Dashboard refreshed', severity: 'info' });
    };

    const loading = allContactsLoading || activeChatsLoading || recentMessagesLoading || userLoading;

    if (loading) {
        return (
            <Box className="flex items-center justify-center min-h-screen">
                <CircularProgress size={72} />
            </Box>
        );
    }

    const allContacts = allContactsData?.getAcceptedChatUsersAll || [];
    const onlineFriends = allContacts.filter((f: any) => f.isOnline) || [];
    const activeChats = activeChatsData?.getAcceptedChatUsers || [];
    const recentMsgs = recentMessagesData?.getRecentConversationsLastMessages || [];

    const fancySentenceForPending = (sent: number, received: number) => {
        const sentPart = sent > 0 ? `${sent} request${sent > 1 ? 's' : ''} waiting on others` : 'No outgoing requests';
        const receivedPart = received > 0 ? `${received} invites pending your action` : 'No incoming requests';
        return `${sentPart} · ${receivedPart}`;
    };

    const formatUnreadSummary = (total: number, convos: number) => {
        return `You have ${total.toLocaleString()} unread message${total !== 1 ? 's' : ''} across ${convos} conversation${convos !== 1 ? 's' : ''}.`;
    };

    const formatTimestamp = (ts: string | number) => {
        const d = new Date(ts);
        return d.toLocaleString(undefined, {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const MEDIA_BASE = 'http://localhost:5002';

    const renderContentDashboard = (msg: any) => {
        const content: string | null = msg.content ?? null;

        if (content && content.startsWith(CHAT_UPLOAD_PREFIX)) {
            const url = `${MEDIA_BASE}${content}`;
            return (
                <img
                    src={url}
                    alt="img"
                    style={{
                        width: 55,
                        height: 55,
                        borderRadius: 6,
                        objectFit: 'cover',
                        marginTop: 6,
                    }}
                />
            );
        }

        if (content && content.startsWith(CHAT_UPLOAD_FILE_PREFIX)) {
            return (
                <Typography sx={{ color: '#6b7280', fontSize: 13 }} noWrap>
                    📄 File
                </Typography>
            );
        }

        if (content && content.startsWith(CHAT_UPLOAD_AUDIO_PREFIX)) {
            return (
                <Typography sx={{ color: '#6b7280', fontSize: 13 }} noWrap>
                    🎤 Voice Audio
                </Typography>
            );
        }

        if (msg.content) {
            return (
                <Typography sx={{ color: '#6b7280', fontSize: 13 }} noWrap>
                    {msg.content}
                </Typography>
            );
        }
    };

    const getDynamicLine = (type: string, value?: number, sent?: number, received?: number) => {
        switch (type) {
            case 'contacts':
                if (!value || value === 0) return 'No contacts yet — your space is still new.';
                if (value <= 5) return 'A small circle — stay close to your people.';
                if (value <= 30) return 'Growing connections — one chat at a time.';
                if (value <= 100) return 'A warm community — conversations live here.';
                return 'A full network — your world is expanding.';

            case 'unread':
                if (!value || value === 0) return 'No unread messages — enjoy the calm.';
                if (value <= 10) return 'Some chats are waiting — respond when you can.';
                if (value <= 30) return 'Your inbox is active — take a moment to catch up.';
                return 'A busy space — one reply at a time is enough.';

            case 'online':
                if (!value || value === 0) return 'No friends online at the moment.';
                if (value <= 5) return 'A few friends are online — feel free to say hello.';
                return 'Many friends are online — your space is alive.';

            case 'messageBalance':
                if (sent === undefined || received === undefined) return '';
                const total = sent + received;

                if (sent === 0 && received === 0) {
                    return 'No messages yet — start chatting to begin your story.';
                }
                if (total > 300) {
                    return 'Wow — you’re a messaging superstar! Keep the conversations flowing.';
                }
                if (sent === received) {
                    return 'Your conversations are balanced — that’s healthy.';
                }
                if (sent > received) {
                    return 'You’ve spoken more — gentle conversations matter.';
                }
                return 'You’ve been listening more — a beautiful habit.';

            case 'pendingRequests':
                if (!value || value === 0) return 'No pending requests at the moment.';
                if (value <= 5) return 'Some requests are awaiting attention.';
                return 'You have many pending requests — handle them with ease.';

            default:
                return '';
        }
    };

    const getInitials = (fullName: string = '') => {
        const parts = fullName.trim().split(' ');
        const first = parts[0]?.charAt(0).toUpperCase() || '';
        const last = parts[1]?.charAt(0).toUpperCase() || '';
        return last ? `${first}.${last}.` : `${first}.`;
    };

    const handleOpenMessageFromDashboard = (message: any) => {
        const sendTo = message.sender.id === Number(userId) ? message.receiver.id : message.sender.id;
        localStorage.setItem('lastSelectedUserId', sendTo);

        setLoadingNavigate(true);

        setTimeout(() => {
            setLoadingNavigate(false);
            navigate('/chats', {
                state: { scrollToMessageId: message.id },
            });
        }, 3500);
    };

    const popVariant = {
        hidden: { scale: 0.95, opacity: 0 },
        show: { scale: 1, opacity: 1, transition: { type: 'spring', stiffness: 260, damping: 20 } },
    };

    return (
        <Dashboard>
            <Box
                sx={{
                    p: { xs: 3, md: 6 },
                    minHeight: '100vh',
                    fontFamily: '"Montserrat", "Inter", sans-serif',
                    background: 'linear-gradient(180deg, rgba(243,246,255,1) 0%, rgba(226,232,240,1) 100%)',
                }}
            >
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 3,
                        mb: 6,
                        p: { xs: 2.5, md: 3.5 },
                        borderRadius: 3,
                        backdropFilter: 'blur(14px)',
                        background: 'rgba(255,255,255,0.4)',
                        boxShadow: '0 8px 30px rgba(16,24,40,0.06)',
                        fontFamily: 'Montserrat, Inter, sans-serif',
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar
                            src={userData?.getUserById?.profilePicture ? `http://localhost:5002${userData.getUserById.profilePicture}` : undefined}
                            sx={{ width: 82, height: 82, bgcolor: '#eef2ff', color: '#3730a3', fontWeight: 800 }}
                        >
                            {!userData?.getUserById?.profilePicture &&
                                (userData?.getUserById?.fullName?.charAt(0).toUpperCase() || <AccountCircle />)}
                        </Avatar>

                        <Box>
                            <Typography
                                sx={{
                                    fontSize: 27,
                                    fontWeight: 900,
                                    color: '#0f172a',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1,
                                    fontFamily: 'Montserrat, sans-serif',
                                }}
                            >
                                Welcome back, {userData?.getUserById?.username ?? 'friend'}{' '}
                                <motion.span
                                    animate={{ rotate: [0, 15, -10, 15, -10, 0] }}
                                    transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
                                    style={{ display: 'inline-block' }}
                                >
                                    👋
                                </motion.span>
                            </Typography>

                            <Typography
                                sx={{
                                    color: '#475569',
                                    mt: 0.3,
                                    fontSize: 14.5,
                                    fontFamily: 'Montserrat, sans-serif',
                                }}
                            >
                                Snapshot of your world — everything at a glance.
                            </Typography>
                        </Box>
                    </Box>

                    <Tooltip title="Refresh Dashboard">
                        <motion.button
                            onClick={refreshAll}
                            disabled={refreshing}
                            style={{
                                borderRadius: 40,
                                padding: '10px 20px',
                                fontWeight: 700,
                                border: 'none',
                                cursor: 'pointer',
                                color: '#fff',
                                fontFamily: 'Montserrat, sans-serif',
                                background: 'linear-gradient(90deg,#7c3aed,#60a5fa)',
                                boxShadow: '0 10px 30px rgba(99,102,241,0.25)',
                            }}
                            whileTap={{ scale: 0.9 }}
                            whileHover={{ scale: refreshing ? 1 : 1.06 }}
                        >
                            {refreshing ? 'Refreshing...' : 'Refresh'}
                        </motion.button>
                    </Tooltip>
                </Box>

                <Grid container spacing={4}>
                    <Grid item xs={12} md={4}>
                        <Stack spacing={4}>
                            <motion.div variants={popVariant} initial="hidden" animate="show">
                                <Card sx={{ ...cardStyle, cursor: 'pointer' }} onClick={() => navigate('/contacts')}>
                                    <Typography sx={cardTitleStyle('#0ea5a2')}>Total Contacts</Typography>
                                    <Typography sx={{ fontSize: 18, color: '#065f46', mb: 1 }}>You have a total of</Typography>
                                    <Typography sx={{ fontSize: 42, fontWeight: 900, color: '#064e3b' }}>
                                        {allContacts.length.toLocaleString()}
                                    </Typography>
                                    <Typography sx={{ mt: 1, color: '#475569', fontWeight: 600 }}>
                                        {getDynamicLine('contacts', allContacts.length)}
                                    </Typography>
                                </Card>
                            </motion.div>

                            <motion.div variants={popVariant} initial="hidden" animate="show">
                                <Card sx={{ ...cardStyle, cursor: 'pointer' }} onClick={() => navigate('/contacts')}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Box>
                                            <Typography sx={cardTitleStyle('#7c3aed')}>Friends Online</Typography>
                                            <Typography sx={{ color: '#4b5563', fontWeight: 600 }}>
                                                {onlineFriends.length} currently available
                                            </Typography>
                                        </Box>
                                    </Box>

                                    <Stack direction="row" spacing={2} alignItems="center" sx={{ mt: 3, overflowX: 'auto', pb: 1 }}>
                                        {onlineFriends.length === 0 && <Box sx={{ color: '#6b7280' }}>No one online right now — time to start a conversation?</Box>}

                                        {onlineFriends.slice(0, 12).map((f: any) => (
                                            <Tooltip key={f.id} title={f.fullName || 'Unknown'}>
                                                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>

                                                    <Avatar
                                                        src={f.profilePicture ? `http://localhost:5002${f.profilePicture}` : undefined}
                                                        sx={{
                                                            width: 52,
                                                            height: 52,
                                                            border: '3px solid rgba(124,58,237,0.12)',
                                                            boxShadow: '0 4px 18px rgba(99,102,241,0.12)',
                                                            '&:hover': { transform: 'translateY(-6px)' },
                                                            transition: 'all 0.25s ease',
                                                            background: '#f1f5f9'
                                                        }}
                                                    />

                                                    <Typography
                                                        sx={{
                                                            fontWeight: 700,
                                                            fontSize: 13,
                                                            color: '#1e293b',
                                                            fontFamily: 'Montserrat',
                                                            mt: 0.3
                                                        }}
                                                    >
                                                        {getInitials(f.fullName)}
                                                    </Typography>

                                                </Box>
                                            </Tooltip>
                                        ))}
                                    </Stack>
                                </Card>
                            </motion.div>

                            <motion.div variants={popVariant} initial="hidden" animate="show">
                                <Card sx={{ ...cardStyle, py: 2, cursor: 'pointer' }} onClick={() => navigate('/chats')}>
                                    <Typography sx={cardTitleStyle('#2563eb')}>Active Chats</Typography>
                                    <Typography sx={{ color: '#475569', mb: 2 }}>One-line view — quick jump</Typography>
                                    <Stack direction="row" spacing={1} sx={{
                                        overflowX: 'auto', pb: 1, '&::-webkit-scrollbar': {
                                            display: 'none',
                                        },
                                        '-ms-overflow-style': 'none',
                                        'scrollbar-width': 'none',
                                    }}>
                                        {activeChats.length === 0 && (
                                            <Chip icon={<ChatBubbleIcon />} label="No active chats" variant="outlined" />
                                        )}
                                        {activeChats.slice(0, 12).map((c: any) => (
                                            <Chip
                                                key={c.id}
                                                avatar={<Avatar src={c.profilePicture ? `http://localhost:5002${c.profilePicture}` : undefined} />}
                                                label={`${c.firstName}`}
                                                clickable
                                                variant="filled"
                                                sx={{
                                                    fontWeight: 700,
                                                    textTransform: 'none',
                                                    boxShadow: '0 6px 18px rgba(2,6,23,0.06)',
                                                }}
                                            />
                                        ))}
                                    </Stack>
                                </Card>
                            </motion.div>
                        </Stack>
                    </Grid>

                    <Grid item xs={12} md={5}>
                        <Stack spacing={4}>
                            <motion.div variants={popVariant} initial="hidden" animate="show">
                                <Card sx={{ ...cardStyle, position: 'relative', overflow: 'visible', cursor: 'pointer' }} onClick={() => navigate('/chats')}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Typography sx={cardTitleStyle('#ef4444')}>Messages — battlefield</Typography>
                                        <Typography sx={{ color: '#64748b', fontWeight: 700 }}>Stats</Typography>
                                    </Box>

                                    <Box sx={{ mt: 2, display: 'flex', gap: 2, alignItems: 'stretch', flexWrap: 'wrap' }}>
                                        <Box sx={{
                                            flex: 1,
                                            minWidth: 180,
                                            p: 3,
                                            borderRadius: 2,
                                            background: 'linear-gradient(135deg, rgba(255,245,235,0.9), rgba(255,250,240,0.6))',
                                            boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.02)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 2,
                                        }}>
                                            <Box sx={{ p: 1, borderRadius: '12px', background: 'rgba(14,165,132,0.08)' }}>
                                                <SendIcon sx={{ fontSize: 28, color: '#047857' }} />
                                            </Box>
                                            <Box>
                                                <Typography sx={{ fontSize: 13, fontWeight: 800, color: '#065f46' }}>Outgoing</Typography>
                                                <Typography sx={{ fontSize: 34, fontWeight: 900 }}>
                                                    {messageStatsData?.getMessageStats?.totalMessagesSent ?? 0}
                                                </Typography>
                                                <Typography sx={{ fontSize: 12, color: '#6b7280' }}>Messages you initiated</Typography>
                                            </Box>
                                        </Box>

                                        <Box sx={{
                                            width: 4,
                                            borderRadius: 2,
                                            alignSelf: 'center',
                                            background: 'linear-gradient(180deg, rgba(99,102,241,0.9), rgba(124,58,237,0.9))',
                                            minHeight: 120,
                                            display: { xs: 'none', sm: 'block' },
                                        }} />

                                        <Box sx={{
                                            flex: 1,
                                            minWidth: 180,
                                            p: 3,
                                            borderRadius: 2,
                                            background: 'linear-gradient(135deg, rgba(240,249,255,0.9), rgba(243,246,255,0.6))',
                                            boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.02)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 2,
                                        }}>
                                            <Box sx={{ p: 1, borderRadius: '12px', background: 'rgba(37,99,235,0.06)' }}>
                                                <InboxIcon sx={{ fontSize: 28, color: '#1e3a8a' }} />
                                            </Box>
                                            <Box>
                                                <Typography sx={{ fontSize: 13, fontWeight: 800, color: '#1e3a8a' }}>Incoming</Typography>
                                                <Typography sx={{ fontSize: 34, fontWeight: 900 }}>
                                                    {messageStatsData?.getMessageStats?.totalMessagesReceived ?? 0}
                                                </Typography>
                                                <Typography sx={{ fontSize: 12, color: '#6b7280' }}>Messages you've been sent</Typography>
                                            </Box>
                                        </Box>
                                    </Box>

                                    <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                                        <RocketLaunchIcon />
                                        <Typography sx={{ color: '#475569', fontWeight: 600 }}>
                                            {getDynamicLine(
                                                'messageBalance',
                                                undefined,
                                                messageStatsData?.getMessageStats?.totalMessagesSent ?? 0,
                                                messageStatsData?.getMessageStats?.totalMessagesReceived ?? 0
                                            )}
                                        </Typography>
                                    </Box>
                                </Card>
                            </motion.div>

                            <motion.div variants={popVariant} initial="hidden" animate="show">
                                <Card sx={{ ...cardStyle, cursor: 'pointer' }} onClick={() => navigate('/chats')}>
                                    <Typography sx={cardTitleStyle('#db2777')}>Unread</Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mt: 1 }}>
                                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 160 }}>
                                            <Typography sx={{ fontSize: 40, fontWeight: 900, color: '#be185d' }}>
                                                {unreadSummaryData?.getUnreadSummary?.totalUnreadMessages ?? 0}
                                            </Typography>
                                        </motion.div>

                                        <Box>
                                            <Typography sx={{ fontWeight: 800, color: '#6b21a8' }}>
                                                {formatUnreadSummary(
                                                    unreadSummaryData?.getUnreadSummary?.totalUnreadMessages ?? 0,
                                                    unreadSummaryData?.getUnreadSummary?.unreadConversationCount ?? 0
                                                )}
                                            </Typography>
                                            <Typography sx={{ fontSize: 13, color: '#6b7280', mt: 0.5 }}>
                                                {getDynamicLine('unread', unreadSummaryData?.getUnreadSummary?.totalUnreadMessages ?? 0)}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Card>
                            </motion.div>
                        </Stack>
                    </Grid>

                    <Grid item xs={12} md={3}>
                        <Stack spacing={4}>
                            <motion.div variants={popVariant} initial="hidden" animate="show">
                                <Card sx={{ ...cardStyle, py: 3, cursor: 'pointer' }} onClick={() => navigate('/settings')}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                        <BlockIcon sx={{ fontSize: 30, color: '#616161' }} />
                                        <Box>
                                            <Typography sx={cardTitleStyle('#6b7280')}>Blocked Users</Typography>
                                            <Typography sx={{ fontSize: 26, fontWeight: 900 }}>
                                                {blockedUsersData?.getBlockedUsersCount?.blockedCount ?? 0}
                                            </Typography>
                                            <Typography sx={{ fontSize: 12, color: '#9aa3b2' }}>Soft and safe — review when needed.</Typography>
                                        </Box>
                                    </Box>
                                </Card>
                            </motion.div>
                        </Stack>
                    </Grid>
                </Grid>

                <Grid container spacing={4} sx={{ mt: 3 }}>
                    <Grid item xs={12} md={6}>
                        <motion.div variants={popVariant} initial="hidden" animate="show">
                            <Card sx={{ ...cardStyle, background: 'rgba(255,255,255,0.12)' }}>
                                <Typography sx={cardTitleStyle('#2563eb')}>Recent Messages</Typography>
                                <Stack spacing={2} mt={2}>
                                    {(recentMsgs.length ? recentMsgs.slice(0, 3) : []).map((m: any) => (
                                        <Box
                                            key={m.id}
                                            onClick={() => handleOpenMessageFromDashboard(m)}
                                            sx={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                p: 2,
                                                borderRadius: 2,
                                                background: 'linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01))',
                                                border: '1px solid rgba(255,255,255,0.03)',
                                                transition: 'all 0.18s ease',
                                                cursor: 'pointer',
                                                '&:hover': { transform: 'translateY(-6px)', boxShadow: '0 8px 30px rgba(2,6,23,0.08)' },
                                            }}
                                        >
                                            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flex: 1 }}>
                                                <Avatar
                                                    src={m.sender?.profilePicture ? `http://localhost:5002${m.sender.profilePicture}` : undefined}
                                                    sx={{ width: 44, height: 44 }}
                                                >
                                                    {!m.sender?.profilePicture && (m.sender?.firstName?.charAt(0).toUpperCase() || '?')}
                                                </Avatar>
                                                <Box sx={{ minWidth: 0 }}>
                                                    <Typography sx={{ fontWeight: 800, fontSize: 15 }}>
                                                        {m.sender?.firstName ?? ''} {m.sender?.lastName ?? ''}
                                                    </Typography>
                                                    <Typography sx={{ color: '#6b7280', fontSize: 13 }} noWrap>
                                                        {renderContentDashboard(m)}
                                                    </Typography>
                                                </Box>
                                            </Box>

                                            <Box sx={{ ml: 2, textAlign: 'right', minWidth: 150 }}>
                                                <Typography sx={{ fontSize: 12, color: '#94a3b8', fontWeight: 700 }}>
                                                    {formatTimestamp(m.timestamp)}
                                                </Typography>
                                                <Typography sx={{ fontSize: 11, color: '#9aa3b2' }}>
                                                    {m.sender?.id === Number(userId) ? 'You' : 'Other User'}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    ))}
                                </Stack>
                            </Card>
                        </motion.div>
                    </Grid>

                    <Grid item xs={12} md={6}>
                        <motion.div variants={popVariant} initial="hidden" animate="show">
                            <Card sx={cardStyle}>
                                <Typography sx={cardTitleStyle('#f59e0b')}>Pending Requests</Typography>
                                <Typography sx={{ color: '#7c2d12', fontWeight: 700, fontSize: 22, mt: 1 }}>
                                    {pendingRequestsData?.getPendingRequestSummary?.receivedPendingCount ?? 0} received · {pendingRequestsData?.getPendingRequestSummary?.sentPendingCount ?? 0} sent
                                </Typography>
                                <Typography sx={{ mt: 1, color: '#475569' }}>
                                    {fancySentenceForPending(
                                        pendingRequestsData?.getPendingRequestSummary?.sentPendingCount ?? 0,
                                        pendingRequestsData?.getPendingRequestSummary?.receivedPendingCount ?? 0
                                    )}
                                </Typography>
                                <Box sx={{ mt: 2, display: 'flex', gap: 1, cursor: 'pointer' }}>
                                    <Chip
                                        icon={<PersonAddAlt1Icon />}
                                        label="Review"
                                        clickable
                                        onClick={() => navigate('/pending-requests')}
                                    />
                                    <Chip
                                        icon={<PendingActionsIcon />}
                                        label="Pending"
                                        clickable
                                        onClick={() => navigate('/all-users')}
                                    />
                                </Box>
                            </Card>
                        </motion.div>
                    </Grid>
                </Grid>
            </Box>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={2500}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
                <Alert
                    onClose={() => setSnackbar({ ...snackbar, open: false })}
                    severity={snackbar.severity as any}
                    variant="filled"
                    sx={{ fontWeight: 700, letterSpacing: 0.3 }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>

            {loadingNavigate && (
                <Box
                    sx={{
                        position: 'fixed',
                        inset: 0,
                        backgroundColor: 'rgba(0,0,0,0.3)',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        zIndex: 9999,
                    }}
                >
                    <CircularProgress />
                </Box>
            )}
        </Dashboard>
    );
};

const cardStyle = {
    borderRadius: 3,
    p: 3,
    background: 'rgba(255,255,255,0.85)',
    backdropFilter: 'blur(8px)',
    border: '1px solid rgba(2,6,23,0.04)',
    transition: 'all 0.28s ease-in-out',
    '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 10px 40px rgba(2,6,23,0.06)' },
};

const cardTitleStyle = (color: string) => ({
    fontWeight: 800,
    color,
    mb: 1,
});

export default DashboardPage;
