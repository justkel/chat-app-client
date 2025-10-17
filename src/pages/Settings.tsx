'use client';
import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Switch,
  Button,
  Modal,
  TextField,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  IconButton,
  Avatar,
} from '@mui/material';
import { motion } from 'framer-motion';
import {
  Lock as LockIcon,
  Block as BlockIcon,
  Star as StarIcon,
  Visibility as VisibilityIcon,
  Palette as PaletteIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import Dashboard from '../components/Layout';
import { useGetBlockedUsers } from '../hooks/UseGetBlockedUsers';
import { useAuth } from '../contexts/AuthContext';
import { notification } from 'antd';
import { jwtDecode } from 'jwt-decode';
import { io } from 'socket.io-client';
const socket = io('http://localhost:5002', {
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 20000,
});

interface OtherUser {
  id: string | number;
  fullName: string;
  email: string;
  profilePicture: string;
}

interface BlockedUser {
  id: string | number;
  isOtherUserBlocked: boolean;
  otherUser: OtherUser;
}

const SettingsPage: React.FC = () => {
  const [readReceipts, setReadReceipts] = useState(true);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [passwordModal, setPasswordModal] = useState(false);
  const [blockedUsersModal, setBlockedUsersModal] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      const decodedToken: any = jwtDecode(user.token);
      setUserId(decodedToken.sub);
    }
  }, [user]);

  const { data, loading, error, refetch } = useGetBlockedUsers(userId);

  useEffect(() => {
    if (userId && data?.getBlockedUsers.length > 0 && socket.connected) {
      data?.getBlockedUsers.forEach((blocked: BlockedUser) => {
        const otherUserId = blocked.otherUser.id;
        const room = [userId, otherUserId].sort().join('-');
        socket.emit('joinRoom', { userId, otherUserId });
        console.log(`Joined blocked user room: ${room}`);
      });
    }
  }, [userId, data]);

  const handlePasswordUpdate = () => setPasswordModal(true);
  const handleFetchBlockedUsers = async () => {
    setBlockedUsersModal(true);
    try {
      await refetch();
    } catch {
      notification.error({ message: 'Failed to load blocked users.' });
    }
  };
  const handleThemeChange = () =>
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));

  const blockedUsers: BlockedUser[] = data?.getBlockedUsers || [];

  return (
    <Dashboard>
      <Box
        sx={{
          fontFamily: 'Montserrat, sans-serif',
          minHeight: '100vh',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          overflowX: 'hidden',
          overflowY: 'auto',
          p: { xs: 2, md: 4 },
          backgroundColor: 'background.default',
        }}
      >
        <Box
          sx={{
            fontFamily: 'Montserrat, sans-serif',
            backgroundColor: 'background.paper',
            width: '100%',
            maxWidth: 700,
            borderRadius: 4,
            boxShadow: 4,
            p: { xs: 3, md: 5 },
            mx: 'auto',
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Typography
              variant="h4"
              fontWeight={700}
              textAlign="center"
              mb={4}
              sx={{
                fontFamily: 'Montserrat, sans-serif',
                color: 'primary.main',
              }}
            >
              Settings
            </Typography>
          </motion.div>

          {[
            {
              icon: <LockIcon sx={{ color: '#3498db' }} />,
              title: 'Update Password',
              action: 'Change',
              onClick: handlePasswordUpdate,
            },
            {
              icon: <BlockIcon sx={{ color: '#e74c3c' }} />,
              title: 'Blocked Users',
              action: 'View',
              onClick: handleFetchBlockedUsers,
            },
            {
              icon: <StarIcon sx={{ color: '#f1c40f' }} />,
              title: 'Starred Messages',
              action: 'Open',
            },
            {
              icon: <VisibilityIcon sx={{ color: '#2ecc71' }} />,
              title: 'Read Receipts',
              switch: true,
            },
            {
              icon: <PaletteIcon sx={{ color: '#9b59b6' }} />,
              title: 'Default Chat Theme',
              action: theme === 'light' ? 'Dark Mode' : 'Light Mode',
              onClick: handleThemeChange,
            },
          ].map((setting, i) => (
            <motion.div whileHover={{ scale: 1.02 }} key={i}>
              <Box
                sx={{
                  p: 2.5,
                  mb: 3,
                  borderRadius: 3,
                  boxShadow: 2,
                  bgcolor: 'background.default',
                  display: 'flex',
                  flexDirection: { xs: 'column', sm: 'row' },
                  alignItems: { xs: 'flex-start', sm: 'center' },
                  justifyContent: 'space-between',
                  gap: 2,
                  fontFamily: 'Montserrat, sans-serif',
                }}
              >
                <Box display="flex" alignItems="center" gap={2}>
                  {setting.icon}
                  <Typography
                    fontWeight={600}
                    sx={{ fontFamily: 'Montserrat, sans-serif' }}
                  >
                    {setting.title}
                  </Typography>
                </Box>

                {setting.switch ? (
                  <Switch
                    checked={readReceipts}
                    onChange={(e) => setReadReceipts(e.target.checked)}
                    color="success"
                    sx={{ fontFamily: 'Montserrat, sans-serif' }}
                  />
                ) : (
                  <Button
                    variant="outlined"
                    onClick={setting.onClick}
                    sx={{
                      fontFamily: 'Montserrat, sans-serif',
                      width: { xs: '100%', sm: 'auto' },
                    }}
                  >
                    {setting.action}
                  </Button>
                )}
              </Box>
            </motion.div>
          ))}

          <Modal open={passwordModal} onClose={() => setPasswordModal(false)}>
            <Box
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                bgcolor: 'background.paper',
                boxShadow: 24,
                borderRadius: 2,
                p: 4,
                width: { xs: '90%', sm: 400 },
                fontFamily: 'Montserrat, sans-serif',
              }}
            >
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                mb={2}
              >
                <Typography
                  variant="h6"
                  fontWeight={600}
                  sx={{ fontFamily: 'Montserrat, sans-serif' }}
                >
                  Update Password
                </Typography>
                <IconButton onClick={() => setPasswordModal(false)}>
                  <CloseIcon />
                </IconButton>
              </Box>

              {['Current Password', 'New Password'].map((label) => (
                <TextField
                  key={label}
                  label={label}
                  type="password"
                  fullWidth
                  sx={{
                    mb: 2,
                    '& .MuiInputBase-input, & .MuiInputLabel-root': {
                      fontFamily: 'Montserrat, sans-serif',
                    },
                  }}
                />
              ))}

              <Button
                variant="contained"
                color="primary"
                fullWidth
                sx={{ fontFamily: 'Montserrat, sans-serif' }}
              >
                Update
              </Button>
            </Box>
          </Modal>

          <Modal
            open={blockedUsersModal}
            onClose={() => setBlockedUsersModal(false)}
          >
            <Box
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                bgcolor: 'background.paper',
                boxShadow: 24,
                borderRadius: 2,
                p: 4,
                width: { xs: '90%', sm: 400 },
                fontFamily: 'Montserrat, sans-serif',
                maxHeight: '80vh',
                overflowY: 'auto',
              }}
            >
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                mb={2}
              >
                <Typography
                  variant="h6"
                  fontWeight={600}
                  sx={{ fontFamily: 'Montserrat, sans-serif' }}
                >
                  Blocked Users
                </Typography>
                <IconButton onClick={() => setBlockedUsersModal(false)}>
                  <CloseIcon />
                </IconButton>
              </Box>

              {loading ? (
                <Box
                  display="flex"
                  justifyContent="center"
                  alignItems="center"
                  height="150px"
                >
                  <CircularProgress />
                </Box>
              ) : error ? (
                <Typography
                  textAlign="center"
                  sx={{
                    fontFamily: 'Montserrat, sans-serif',
                    color: 'error.main',
                  }}
                >
                  Failed to load blocked users.
                </Typography>
              ) : blockedUsers.length > 0 ? (
                <List>
                  {blockedUsers.map((blocked: BlockedUser) => (
                    <ListItem key={blocked.id} divider>
                      <Avatar
                        src={blocked.otherUser.profilePicture}
                        alt={blocked.otherUser.fullName}
                        sx={{ width: 40, height: 40, mr: 2 }}
                      />
                      <ListItemText
                        primary={blocked.otherUser.fullName}
                        secondary={blocked.otherUser.email}
                        primaryTypographyProps={{
                          fontFamily: 'Montserrat, sans-serif',
                          fontWeight: 500,
                        }}
                        secondaryTypographyProps={{
                          fontFamily: 'Montserrat, sans-serif',
                          color: 'text.secondary',
                        }}
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography
                  textAlign="center"
                  sx={{ fontFamily: 'Montserrat, sans-serif' }}
                >
                  No blocked users found.
                </Typography>
              )}
            </Box>
          </Modal>
        </Box>
      </Box>
    </Dashboard>
  );
};

export default SettingsPage;
