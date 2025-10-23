import React, { useEffect, useState } from 'react';
import { jwtDecode } from 'jwt-decode';
import {
    Box,
    Grid,
    Card,
    CardContent,
    Typography,
    Avatar,
    Button,
    Chip,
    CircularProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Snackbar,
    Alert,
    Stack,
    Divider,
} from '@mui/material';
import BoltIcon from '@mui/icons-material/FlashOn';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import { useAuth } from '../contexts/AuthContext';
import { useFetchChatRequests } from '../hooks/useFetchChatRequests';
import { useApproveChatRequest } from '../hooks/useApproveChatRequest';
import { useRejectChatRequest } from '../hooks/useRejectChatRequest';
import Dashboard from '../components/Layout';
import Title from 'antd/es/typography/Title';
type ChatRequest = {
    id: string;
    requester?: {
        id?: string;
        fullName?: string;
        email?: string;
        profilePicture?: string | null;
    };
    createdAt?: string;
};

const containerStyle = {
    minHeight: '100vh',
    py: { xs: 6, md: 10 },
    px: { xs: 3, md: 6 },
    background: `linear-gradient(180deg, #f7fbff 0%, #f1f6ff 40%, #eef6ff 100%)`,
    fontFamily: `'Montserrat', system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial`,
};

const headerCardSx = {
    maxWidth: 1200,
    mx: 'auto',
    mb: 4,
    px: { xs: 3, md: 4 },
    py: { xs: 3, md: 4 },
    borderRadius: 3,
    background: 'linear-gradient(180deg, rgba(255,255,255,0.9), rgba(250,250,255,0.85))',
    boxShadow: '0 10px 30px rgba(15,23,42,0.06)',
    border: '1px solid rgba(15,23,42,0.04)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 2,
};

const cardSx = {
    borderRadius: 3,
    minHeight: 150,
    minWidth: 350,
    display: 'flex',
    flexDirection: 'column' as const,
    justifyContent: 'space-between',
    background: 'linear-gradient(180deg, rgba(255,255,255,0.96), rgba(250,250,255,0.96))',
    boxShadow: '0 8px 30px rgba(15,23,42,0.04)',
    border: '1px solid rgba(15,23,42,0.04)',
};

const neonApproveSx = {
    textTransform: 'none',
    borderRadius: 999,
    px: 2.5,
    py: 1,
    fontWeight: 800,
    color: '#021026',
    background: 'linear-gradient(90deg,#60a5fa,#7c3aed)',
    boxShadow: '0 10px 30px rgba(124,58,237,0.10)',
    '&:hover': { transform: 'translateY(-1px)', boxShadow: '0 14px 36px rgba(124,58,237,0.14)' },
};

const outlineRejectSx = {
    textTransform: 'none',
    borderRadius: 999,
    px: 2.5,
    py: 1,
    fontWeight: 800,
    color: '#b91c1c',
    background: 'transparent',
    border: '1px solid rgba(185,28,28,0.12)',
    '&:hover': { background: 'rgba(185,28,28,0.03)' },
};

const infoChipSx = {
    background: 'linear-gradient(90deg, rgba(96,165,250,0.12), rgba(124,58,237,0.06))',
    color: '#0f172a',
    fontWeight: 700,
    px: 1.5,
    py: 0.4,
    borderRadius: 999,
};

const emptyStateSx = {
    textAlign: 'center' as const,
    py: 10,
    color: '#64748b',
};

const ChatRequests: React.FC = () => {
    const { user } = useAuth();
    const [userId, setUserId] = useState<string | null>(null);
    const [requests, setRequests] = useState<ChatRequest[]>([]);
    const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [confirmPayload, setConfirmPayload] = useState<{ id: string; type: 'approve' | 'reject' } | null>(null);
    const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' }>({
        open: false,
        message: '',
        severity: 'info',
    });

    const { data, loading, error, refetch } = useFetchChatRequests(userId);
    const { approveChatRequest } = useApproveChatRequest();
    const { rejectChatRequest } = useRejectChatRequest();

    useEffect(() => {
        if (user?.token) {
            try {
                const decoded: any = jwtDecode(user.token);
                setUserId(decoded.sub);
            } catch {
                setUserId(null);
            }
        }
    }, [user]);

    useEffect(() => {
        if (data?.getChatRequests) {
            setRequests(data.getChatRequests);
        }
    }, [data]);

    const openConfirm = (id: string, type: 'approve' | 'reject') => {
        setConfirmPayload({ id, type });
        setConfirmOpen(true);
    };

    const closeConfirm = () => {
        setConfirmOpen(false);
        setConfirmPayload(null);
    };

    const handleConfirm = async () => {
        if (!confirmPayload) return;
        const { id, type } = confirmPayload;

        setLoadingStates((s) => ({ ...s, [id]: true }));

        try {
            if (type === 'approve') {
                await approveChatRequest(id);
                setSnackbar({ open: true, message: 'Request approved', severity: 'success' });
            } else {
                await rejectChatRequest(id);
                setSnackbar({ open: true, message: 'Request rejected', severity: 'success' });
            }

            await refetch?.();
        } catch (err: any) {
            setSnackbar({ open: true, message: err?.message || 'Action failed', severity: 'error' });
        } finally {
            setLoadingStates((s) => ({ ...s, [id]: false }));
            closeConfirm();
        }
    };

    const handleCloseSnackbar = () => {
        setSnackbar((s) => ({ ...s, open: false }));
    };

    const formatDate = (iso?: string) => {
        if (!iso) return 'N/A';

        const d = new Date(iso);
        const options: Intl.DateTimeFormatOptions = {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
        };
        const formatted = d.toLocaleString('en-US', options);

        return formatted.replace(' AM', 'AM').replace(' PM', 'PM');
    };

    if (loading) {
        return (
            <Dashboard>
                <Box sx={{ ...containerStyle, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <CircularProgress />
                </Box>
            </Dashboard>
        );
    }

    if (error) {
        return (
            <Dashboard>
                <Box sx={{ ...containerStyle }}>
                    <Box sx={{ maxWidth: 1100, mx: 'auto' }}>
                        <Title level={2} style={{ marginBottom: 8 }}>
                            Error
                        </Title>
                        <Typography color="error">{error.message}</Typography>
                    </Box>
                </Box>
            </Dashboard>
        );
    }

    return (
        <Dashboard>
            <Box sx={containerStyle}>
                <Box sx={headerCardSx}>
                    <Stack direction="row" spacing={2} alignItems="center">
                        <Box
                            sx={{
                                width: 64,
                                height: 64,
                                borderRadius: 2,
                                display: 'grid',
                                placeItems: 'center',
                                background: 'linear-gradient(135deg,#60a5fa,#7c3aed)',
                                boxShadow: '0 10px 30px rgba(124,58,237,0.14)',
                            }}
                        >
                            <BoltIcon sx={{ color: '#fff', fontSize: 30 }} />
                        </Box>
                        <Box>
                            <Typography sx={{ fontWeight: 800, fontSize: 20, color: '#021026' }}>Pending Chat Requests</Typography>
                            <Typography sx={{ color: '#475569', fontSize: 14 }}>
                                Review and manage requests from other members — approve to allow private chats, or reject to decline.
                            </Typography>
                        </Box>
                    </Stack>

                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <Button
                            onClick={async () => {
                                await refetch?.();
                                setSnackbar({ open: true, message: 'Request list refreshed', severity: 'info' });
                            }}
                            sx={{
                                borderRadius: 999,
                                px: 2.5,
                                py: 1,
                                background: 'linear-gradient(90deg,#7c3aed,#60a5fa)',
                                color: '#fff',
                                fontWeight: 800,
                                boxShadow: '0 10px 30px rgba(99,102,241,0.12)',
                                textTransform: 'none',
                            }}
                        >
                            Refresh
                        </Button>
                    </Box>
                </Box>

                <Box sx={{ maxWidth: 1200, mx: 'auto', mt: 4 }}>
                    {(!requests || requests.length === 0) ? (
                        <Box sx={emptyStateSx}>
                            <Avatar
                                sx={{
                                    bgcolor: 'transparent',
                                    width: 88,
                                    height: 88,
                                    mx: 'auto',
                                    color: '#7c3aed',
                                    border: '2px dashed rgba(124,58,237,0.18)',
                                }}
                            >
                                <BoltIcon sx={{ fontSize: 40 }} />
                            </Avatar>
                            <Typography sx={{ mt: 2, fontWeight: 800, color: '#0f172a' }}>No pending requests</Typography>
                            <Typography sx={{ mt: 1, color: '#64748b' }}>
                                There are currently no chat requests. Use the Refresh button to check again.
                            </Typography>
                        </Box>
                    ) : (
                        <Grid container spacing={3}>
                            {requests.map((req) => {
                                const id = req.id;
                                const loadingForThis = !!loadingStates[id];
                                const requester = req.requester ?? {};
                                return (
                                    <Grid item xs={12} sm={6} md={4} key={id}>
                                        <Card sx={cardSx}>
                                            <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                                                    <Avatar
                                                        src={requester.profilePicture ? `http://localhost:5002${requester.profilePicture}` : undefined}
                                                        sx={{ width: 56, height: 56, bgcolor: '#eef2ff', color: '#3730a3', fontWeight: 800 }}
                                                    >
                                                        {!requester.profilePicture && (requester.fullName ? requester.fullName.charAt(0).toUpperCase() : '?')}
                                                    </Avatar>

                                                    <Box sx={{ minWidth: 0 }}>
                                                        <Typography sx={{ fontWeight: 800, fontSize: 16, color: '#021026' }} noWrap>
                                                            {requester.fullName ?? 'Unknown User'}
                                                        </Typography>
                                                        <Typography sx={{ color: '#64748b', fontSize: 13 }} noWrap>
                                                            {requester.email ?? 'No email'}
                                                        </Typography>
                                                    </Box>

                                                    <Box sx={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <Chip label="Pending" sx={infoChipSx} />
                                                    </Box>
                                                </Box>

                                                <Divider sx={{ borderColor: 'rgba(15,23,42,0.04)' }} />

                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
                                                    <Box>
                                                        <Typography sx={{ color: '#64748b', fontSize: 13 }}>
                                                            Requested: <strong style={{ color: '#0f172a' }}>{formatDate(req.createdAt)}</strong>
                                                        </Typography>
                                                    </Box>

                                                    <Stack direction="row" spacing={1}>
                                                        {/* Approve = Neon Blue Gradient */}
                                                        <Button
                                                            startIcon={loadingForThis ? <CircularProgress size={16} color="inherit" /> : <CheckIcon />}
                                                            onClick={() => openConfirm(id, 'approve')}
                                                            disabled={loadingForThis}
                                                            sx={neonApproveSx}
                                                        >
                                                            {loadingForThis ? 'Processing' : 'Accept'}
                                                        </Button>

                                                        <Button
                                                            startIcon={<CloseIcon />}
                                                            onClick={() => openConfirm(id, 'reject')}
                                                            disabled={loadingForThis}
                                                            sx={outlineRejectSx}
                                                        >
                                                            Reject
                                                        </Button>
                                                    </Stack>
                                                </Box>
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                );
                            })}
                        </Grid>
                    )}
                </Box>
            </Box>

            <Dialog open={confirmOpen} onClose={closeConfirm} fullWidth maxWidth="xs">
                <DialogTitle sx={{ fontWeight: 800 }}>Confirm action</DialogTitle>
                <DialogContent>
                    <Typography>
                        Are you sure you want to {confirmPayload?.type === 'approve' ? 'approve' : 'reject'} this chat request?
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={closeConfirm} sx={{ textTransform: 'none' }}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleConfirm}
                        variant="contained"
                        sx={
                            confirmPayload?.type === 'approve'
                                ? neonApproveSx
                                : { ...outlineRejectSx, background: 'rgba(185,28,28,0.06)', color: '#7f1d1d' }
                        }
                    >
                        {confirmPayload?.type === 'approve' ? 'Yes, approve' : 'Yes, reject'}
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar open={snackbar.open} autoHideDuration={4200} onClose={handleCloseSnackbar} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
                <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%', fontWeight: 700 }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Dashboard>
    );
};

export default ChatRequests;
