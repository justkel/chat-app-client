import React, { useEffect, useState } from 'react';
import { jwtDecode } from 'jwt-decode';
import { useGetAllUsersExcept } from '../hooks/useGetAllUsersExcept';
import { useAuth } from '../contexts/AuthContext';
import Dashboard from '../components/Layout';
import {
    Avatar,
    Box,
    Button,
    CircularProgress,
    Grid,
    Snackbar,
    Typography,
    Alert,
} from '@mui/material';
import { motion } from 'framer-motion';
import { useSendChatRequest } from '../hooks/sendChatRequest';
import { useGetAllChatRequestsMadeByUser } from '../hooks/useGetAllChatRequests';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import HourglassTopIcon from '@mui/icons-material/HourglassTop';
import CloseIcon from '@mui/icons-material/Close';
import FlashOnIcon from '@mui/icons-material/FlashOn';

interface UserItem {
    id: string;
    fullName: string;
    email: string;
    profilePicture?: string | null;
}

const cardVariants = {
    hidden: { opacity: 0, y: 16, scale: 0.98 },
    visible: { opacity: 1, y: 0, scale: 1 },
    hover: { scale: 1.02, y: -4 },
};

const Members: React.FC = () => {
    const { user } = useAuth();
    const [userId, setUserId] = useState<string | null>(null);
    const [loadingStates, setLoadingStates] = useState<{ [key: string]: boolean }>({});
    const { sendChatRequest } = useSendChatRequest();
    const [snackbar, setSnackbar] = useState<{ message: string; severity: 'success' | 'error'; open: boolean }>({
        message: '',
        severity: 'success',
        open: false,
    });

    useEffect(() => {
        if (user) {
            try {
                const decodedToken: any = jwtDecode(user.token);
                setUserId(decodedToken.sub);
            } catch (err) {
                setUserId(null);
            }
        }
    }, [user]);

    const { data: usersData, loading: usersLoading, error: usersError, refetch } = useGetAllUsersExcept(userId);
    const {
        data: requestsData,
        loading: requestsLoading,
        error: requestsError,
        refetch: statusRefetch,
    } = useGetAllChatRequestsMadeByUser(userId);

    const handleSendRequest = async (receiverId: string) => {
        if (!userId) return;

        setLoadingStates((prev) => ({ ...prev, [receiverId]: true }));

        try {
            // Intentional delay (keeps existing logic)
            await new Promise((resolve) => setTimeout(resolve, 3000));
            await sendChatRequest(userId, receiverId);

            setSnackbar({
                message: 'Chat request sent successfully!',
                severity: 'success',
                open: true,
            });

            refetch?.();
            statusRefetch?.();
        } catch (err: any) {
            const errorMessage = err?.response?.data?.message || err?.message || 'An unexpected error occurred';
            setSnackbar({
                message: `Failed to send chat request: ${errorMessage}`,
                severity: 'error',
                open: true,
            });
        } finally {
            setLoadingStates((prev) => ({ ...prev, [receiverId]: false }));
        }
    };

    const handleCloseSnackbar = () => {
        setSnackbar((prev) => ({ ...prev, open: false }));
    };

    if (usersLoading || requestsLoading) {
        return (
            <Dashboard>
                <Box
                    sx={{
                        minHeight: '60vh',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <CircularProgress />
                </Box>
            </Dashboard>
        );
    }

    if (usersError) {
        return (
            <Dashboard>
                <Box sx={{ p: 4 }}>
                    <Typography color="error">Error loading users: {usersError.message}</Typography>
                </Box>
            </Dashboard>
        );
    }

    if (requestsError) {
        return (
            <Dashboard>
                <Box sx={{ p: 4 }}>
                    <Typography color="error">Error loading requests: {requestsError.message}</Typography>
                </Box>
            </Dashboard>
        );
    }

    const users: UserItem[] = usersData?.getAllUsersExcept ?? [];
    const requests: any[] = requestsData?.getAllChatRequestsMadeByUser ?? [];

    const getRequestStatus = (receiverId: string) => {
        const request = requests.find((r: any) => r.receiver?.id === receiverId);
        return request ? request.status : undefined;
    };

    const StatusPill: React.FC<{ status?: string }> = ({ status }) => {
        if (!status) return null;

        const baseStyles = {
            display: 'inline-flex',
            alignItems: 'center',
            gap: 1,
            px: 2,
            py: '4px',
            borderRadius: '999px',
            fontSize: '0.85rem',
            fontWeight: 600,
        } as const;

        switch (status) {
            case 'accepted':
                return (
                    <Box sx={{ ...baseStyles, bgcolor: 'rgba(72, 187, 120, 0.12)', color: '#2f855a' }}>
                        <DoneAllIcon sx={{ fontSize: 16 }} />
                        <span>Accepted</span>
                    </Box>
                );
            case 'rejected':
                return (
                    <Box sx={{ ...baseStyles, bgcolor: 'rgba(239, 68, 68, 0.08)', color: '#c53030' }}>
                        <CloseIcon sx={{ fontSize: 16 }} />
                        <span>Rejected</span>
                    </Box>
                );
            case 'pending':
                return (
                    <Box sx={{ ...baseStyles, bgcolor: 'rgba(59, 130, 246, 0.08)', color: '#2563eb' }}>
                        <HourglassTopIcon sx={{ fontSize: 16 }} />
                        <span>Sent</span>
                    </Box>
                );
            default:
                return null;
        }
    };

    return (
        <Dashboard>
            <Snackbar
                open={snackbar.open}
                autoHideDuration={4800}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert
                    onClose={handleCloseSnackbar}
                    severity={snackbar.severity}
                    sx={{
                        width: '100%',
                        borderRadius: 2,
                        boxShadow: '0 6px 18px rgba(14, 30, 37, 0.08)',
                        fontWeight: 700,
                        fontFamily: 'Montserrat, sans-serif',
                        fontSize: '1rem',
                    }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>

            <Box
                sx={{
                    px: { xs: 2, md: 4 },
                    pt: { xs: 3, md: 6 },
                    pb: 2,
                    display: 'flex',
                    justifyContent: 'center',
                }}
            >
                <Box
                    sx={{
                        width: '100%',
                        maxWidth: 1100,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 3,
                        flexWrap: 'wrap',
                    }}
                >
                    <Box>
                        <Typography
                            variant="h5"
                            sx={{ fontWeight: 700, fontFamily: 'Montserrat, sans-serif', color: '#0f172a' }}
                        >
                            Chat Access Requests
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#475569', mt: 0.5 }}>
                            Request access to chat privately with other members.
                        </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                        <Button
                            startIcon={<AutoAwesomeIcon />}
                            onClick={() => {
                                refetch?.();
                                statusRefetch?.();
                                setSnackbar({ message: 'Refreshed list', severity: 'success', open: true });
                            }}
                            sx={{
                                textTransform: 'none',
                                borderRadius: 2,
                                px: 2,
                                py: 1,
                                fontWeight: 700,
                                fontFamily: 'Montserrat, sans-serif',
                                bgcolor: 'transparent',
                                border: '1px solid rgba(15, 23, 42, 0.06)',
                                '&:hover': { boxShadow: '0 6px 20px rgba(2,6,23,0.06)' },
                            }}
                        >
                            Refresh
                        </Button>
                    </Box>
                </Box>
            </Box>

            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    px: { xs: 2, md: 4 },
                    pb: { xs: 6, md: 8 },
                }}
            >
                <Box
                    sx={{
                        width: '100%',
                        maxWidth: 1100,
                        borderRadius: 4,
                        p: { xs: 2, md: 3 },
                        background: 'linear-gradient(180deg, rgba(255,255,255,0.65), rgba(255,255,255,0.6))',
                        backdropFilter: 'blur(10px)',
                        boxShadow: '0 12px 40px rgba(2,6,23,0.06)',
                        border: '1px solid rgba(2,6,23,0.04)',
                    }}
                >
                    {users.length === 0 ? (
                        <Box
                            sx={{
                                minHeight: 220,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexDirection: 'column',
                                gap: 2,
                                textAlign: 'center',
                                py: 6,
                            }}
                        >
                            <Avatar sx={{ bgcolor: '#e2e8f0', width: 56, height: 56, color: '#0f172a' }}>
                                <AutoAwesomeIcon />
                            </Avatar>
                            <Typography variant="h6" sx={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700 }}>
                                No members found
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#64748b' }}>
                                There are no other users available right now. Try refreshing later.
                            </Typography>
                        </Box>
                    ) : (
                        <Grid
                            container
                            spacing={3}
                            sx={{
                                mt: 1,
                            }}
                        >
                            {users.map((u) => {
                                const status = getRequestStatus(u.id);
                                const isLoading = !!loadingStates[u.id];

                                return (
                                    <Grid key={u.id} item xs={12} sm={6} md={4}>
                                        <motion.div
                                            initial="hidden"
                                            animate="visible"
                                            whileHover="hover"
                                            variants={cardVariants}
                                            transition={{ duration: 0.28, ease: 'easeOut' }}
                                        >
                                            <Box
                                                sx={{
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    gap: 2,
                                                    p: 2.25,
                                                    borderRadius: 3,
                                                    height: '100%',
                                                    alignItems: 'stretch',
                                                    background: 'linear-gradient(180deg, rgba(255,255,255,0.82), rgba(255,255,255,0.8))',
                                                    border: '1px solid rgba(2,6,23,0.04)',
                                                    boxShadow: '0 6px 18px rgba(2,6,23,0.04)',
                                                }}
                                            >
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                    <Avatar
                                                        sx={{
                                                            width: 56,
                                                            height: 56,
                                                            bgcolor: '#c7d2fe',
                                                            color: '#3730a3',
                                                            fontWeight: 800,
                                                            fontFamily: 'Montserrat, sans-serif',
                                                            fontSize: 18,
                                                        }}
                                                        src={u.profilePicture ? `http://localhost:5002${u.profilePicture}` : undefined}
                                                    >
                                                        {!u.profilePicture && (u.fullName ? u.fullName.charAt(0).toUpperCase() : '?')}
                                                    </Avatar>

                                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                                        <Typography
                                                            noWrap
                                                            sx={{
                                                                fontWeight: 800,
                                                                fontFamily: 'Montserrat, sans-serif',
                                                                color: '#0f172a',
                                                                fontSize: '1rem',
                                                            }}
                                                        >
                                                            {u.fullName}
                                                        </Typography>
                                                        <Typography noWrap sx={{ color: '#64748b', fontSize: '0.875rem' }}>
                                                            {u.email}
                                                        </Typography>
                                                    </Box>
                                                </Box>

                                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
                                                    <Box>{status ? <StatusPill status={status} /> : <Typography sx={{ color: '#64748b', fontWeight: 600 }}>No request</Typography>}</Box>

                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        {status ? (
                                                            <Button
                                                                variant="outlined"
                                                                disabled
                                                                sx={{
                                                                    textTransform: 'none',
                                                                    borderRadius: 2,
                                                                    px: 2,
                                                                    py: 0.8,
                                                                    fontWeight: 700,
                                                                    fontSize: '0.9rem',
                                                                    color: '#475569',
                                                                    borderColor: 'rgba(15,23,42,0.04)',
                                                                }}
                                                            >
                                                                {status === 'accepted' ? 'Connected' : status === 'rejected' ? 'Unavailable' : 'Pending'}
                                                            </Button>
                                                        ) : (
                                                            <Button
                                                                onClick={() => handleSendRequest(u.id)}
                                                                disabled={isLoading}
                                                                sx={{
                                                                    textTransform: 'none',
                                                                    borderRadius: 3,
                                                                    px: 2.5,
                                                                    py: 1,
                                                                    fontWeight: 800,
                                                                    background: 'linear-gradient(90deg,#6366f1,#7c3aed)',
                                                                    color: '#fff',
                                                                    boxShadow: '0 8px 24px rgba(99,102,241,0.14)',
                                                                    '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 12px 34px rgba(124,58,237,0.14)' },
                                                                }}
                                                                startIcon={isLoading ? <CircularProgress size={18} color="inherit" /> : undefined}
                                                            >
                                                                <FlashOnIcon sx={{ fontSize: 16 }} /> {isLoading ? 'Sending...' : 'Connect'}
                                                            </Button>
                                                        )}
                                                    </Box>
                                                </Box>
                                            </Box>
                                        </motion.div>
                                    </Grid>
                                );
                            })}
                        </Grid>
                    )}
                </Box>
            </Box>
        </Dashboard>
    );
};

export default Members;
