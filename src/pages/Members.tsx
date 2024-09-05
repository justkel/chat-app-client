import React, { useEffect, useState } from 'react';
import { jwtDecode } from 'jwt-decode';
import { useGetAllUsersExcept } from '../hooks/useGetAllUsersExcept';
import { useAuth } from '../contexts/AuthContext';
import Dashboard from '../components/Layout';
import { List, ListItem, ListItemText, ListItemAvatar, Avatar, Typography, Paper, Button, Box } from '@mui/material';
import { useSendChatRequest } from '../hooks/sendChatRequest';

interface User {
  id: string;
  fullName: string;
  email: string;
}

const Members = () => {
  const { user } = useAuth();
  const [userId, setUserId] = useState<string | null>(null);
  const { sendChatRequest, loading: requestLoading, error: requestError } = useSendChatRequest();

  useEffect(() => {
    if (user) {
      const decodedToken: any = jwtDecode(user.token);
      setUserId(decodedToken.sub);
    }
  }, [user]);

  const { data, loading, error } = useGetAllUsersExcept(userId);

  const handleSendRequest = async (receiverId: string) => {
    if (!userId) return;

    try {
      await sendChatRequest(userId, receiverId);
      alert('Chat request sent successfully!');
    } catch (error) {
      alert('Failed to send chat request');
    }
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;

  return (
    <Dashboard>
      <Paper
        sx={{
          maxWidth: 600,
          margin: 'auto',
          padding: 3,
          mt: 5,
          fontFamily: 'Poppins, sans-serif'
        }}
      >
        <Typography
          variant="h4"
          gutterBottom
          align="center"
          color="primary"
          sx={{ fontFamily: 'Poppins, sans-serif' }}
        >
          Members
        </Typography>
        <List>
          {data?.getAllUsersExcept.map((user: User) => (
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
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => handleSendRequest(user.id)}
                  disabled={requestLoading}
                  sx={{
                    fontFamily: 'Poppins, sans-serif',
                    textTransform: 'none',
                    borderRadius: '20px',
                    px: 3,
                    py: 1,
                    fontWeight: 500,
                  }}
                >
                  {requestLoading ? 'Sending...' : 'Send Request'}
                </Button>
              </Box>
            </ListItem>
          ))}
        </List>
      </Paper>
    </Dashboard>
  );
};

export default Members;
