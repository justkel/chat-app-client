import React, { useEffect, useState } from 'react';
import { jwtDecode } from 'jwt-decode';
import { useGetAllUsersExcept } from '../hooks/useGetAllUsersExcept';
import { useAuth } from '../contexts/AuthContext';
import Dashboard from '../components/Layout';
import { List, ListItem, ListItemText, ListItemAvatar, Avatar, Typography, Paper, Button, Box, Snackbar, Alert, CircularProgress } from '@mui/material';
import { useSendChatRequest } from '../hooks/sendChatRequest';
import { useGetAllChatRequestsMadeByUser } from '../hooks/useGetAllChatRequests';

interface User {
    id: string;
    fullName: string;
    email: string;
}

const Members = () => {
    const { user } = useAuth();
    const [userId, setUserId] = useState<string | null>(null);
    const [loadingStates, setLoadingStates] = useState<{ [key: string]: boolean }>({});
    const { sendChatRequest } = useSendChatRequest();
    const [snackbar, setSnackbar] = useState<{ message: string, severity: 'success' | 'error', open: boolean }>({
        message: '',
        severity: 'success',
        open: false,
    });

    useEffect(() => {
        if (user) {
            const decodedToken: any = jwtDecode(user.token);
            setUserId(decodedToken.sub);
        }
    }, [user]);

    const { data: usersData, loading: usersLoading, error: usersError, refetch } = useGetAllUsersExcept(userId);
    const { data: requestsData, loading: requestsLoading, error: requestsError, refetch: statusRefetch } = useGetAllChatRequestsMadeByUser(userId);

    const handleSendRequest = async (receiverId: string) => {
        if (!userId) return;

        setLoadingStates((prevState) => ({ ...prevState, [receiverId]: true }));

        try {
            // Add a delay of 3 seconds (3000 milliseconds)
            await new Promise((resolve) => setTimeout(resolve, 3000));

            await sendChatRequest(userId, receiverId);
            setSnackbar({
                message: 'Chat request sent successfully!',
                severity: 'success',
                open: true,
            });
            refetch();
            statusRefetch();
        } catch (err: any) {
            const errorMessage = err.response?.data?.message || err.message || 'An unexpected error occurred';
            setSnackbar({
                message: `Failed to send chat request: ${errorMessage}`,
                severity: 'error',
                open: true,
            });
        } finally {
            setLoadingStates((prevState) => ({ ...prevState, [receiverId]: false }));
        }
    };

    const handleCloseSnackbar = () => {
        setSnackbar((prevState) => ({ ...prevState, open: false }));
    };

    if (usersLoading || requestsLoading) {
        return (
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '100vh',
                }}
            >
                <CircularProgress />
            </Box>
        );
    }
    if (usersError) return <p>Error: {usersError.message}</p>;
    if (requestsError) return <p>Error: {requestsError.message}</p>;

    const getRequestStatus = (receiverId: string) => {
        const request = requestsData?.getAllChatRequestsMadeByUser.find((req: any) => req.receiver.id === receiverId);
        return request ? request.status : undefined;
    };

    return (
        <Dashboard>
            <Snackbar
                open={snackbar.open}
                autoHideDuration={5000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{
                    width: '100%',
                    fontWeight: 'bold',
                    fontSize: '1.2rem',
                    '& .MuiAlert-message': {
                        fontWeight: 'bold',
                        fontSize: '1.2rem',
                    },
                }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>

            <Paper
                sx={{
                    maxWidth: 600,
                    margin: 'auto',
                    padding: 3,
                    mt: 5,
                    fontFamily: 'Poppins, sans-serif',
                }}
            >
                <Typography
                    variant="h6"
                    gutterBottom
                    align="center"
                    color="primary"
                    sx={{ fontFamily: 'Poppins, sans-serif' }}
                >
                    Chat Access Request
                </Typography>
                <List>
                    {usersData?.getAllUsersExcept.map((user: User) => (
                        <ListItem key={user.id} divider>
                            <ListItemAvatar>
                                <Avatar sx={{ fontFamily: 'Poppins, sans-serif' }}>{user.fullName.charAt(0)}</Avatar>
                            </ListItemAvatar>
                            <ListItemText
                                primary={user.fullName}
                                secondary={user.email}
                                primaryTypographyProps={{ sx: { fontFamily: 'Poppins, sans-serif' } }}
                                secondaryTypographyProps={{ sx: { fontFamily: 'Poppins, sans-serif' } }}
                            />
                            <Box sx={{ ml: 2 }}>
                                {
                                    // Get request status for this user
                                    (() => {
                                        const status = getRequestStatus(user.id);
                                        switch (status) {
                                            case 'accepted':
                                                return <Typography color="green">Accepted</Typography>;
                                            case 'rejected':
                                                return <Typography color="red">Rejected</Typography>;
                                            case 'pending':
                                                return <Typography color="blue">Sent</Typography>;
                                            default:
                                                return (
                                                    <Button
                                                        variant="contained"
                                                        color="primary"
                                                        onClick={() => handleSendRequest(user.id)}
                                                        disabled={!!loadingStates[user.id]}
                                                        sx={{
                                                            fontFamily: 'Poppins, sans-serif',
                                                            textTransform: 'none',
                                                            borderRadius: '20px',
                                                            px: 3,
                                                            py: 1,
                                                            fontWeight: 500,
                                                            color: loadingStates[user.id] ? 'black' : 'white',
                                                        }}
                                                    >
                                                        {loadingStates[user.id] ? 'Sending...' : 'Send Request'}
                                                    </Button>
                                                );
                                        }
                                    })()
                                }
                            </Box>
                        </ListItem>
                    ))}
                </List>
            </Paper>
        </Dashboard>
    );
};

export default Members;
