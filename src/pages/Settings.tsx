'use client';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Typography,
  Switch,
  Button,
  Modal,
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
import { useGetChatUserDetails } from '../hooks/useGetOtherUserdetails';
import UpdatePasswordModal from '../components/settings/UpdatePasswordModal';
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

  const blockedUsers = useMemo(
    () => data?.getBlockedUsers || [],
    [data?.getBlockedUsers]
  );

  const otherUserIds = blockedUsers.map((b: BlockedUser) => b.otherUser.id);

  const { data: chatUserData, loading: chatLoading } = useGetChatUserDetails(
    Number(userId),
    otherUserIds
  );

  useEffect(() => {
    if (userId && blockedUsers.length > 0 && socket.connected) {
      blockedUsers.forEach((blocked: BlockedUser) => {
        const otherUserId = blocked.otherUser.id;
        const room = [userId, otherUserId].sort().join('-');
        socket.emit('joinRoom', { userId, otherUserId });
        console.log(`Joined blocked user room: ${room}`);
      });
    }
  }, [userId, blockedUsers]);

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

          {userId && (
            <UpdatePasswordModal
              open={passwordModal}
              onClose={() => setPasswordModal(false)}
              userId={userId}
            />
          )}

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

              <Typography
                textAlign="center"
                mb={2}
                sx={{
                  fontFamily: 'Montserrat, sans-serif',
                  color: 'text.secondary',
                  fontSize: 14,
                }}
              >
                To unblock, visit individual chats.
              </Typography>

              {loading || chatLoading ? (
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
                  {blockedUsers.map((blocked: BlockedUser) => {
                    const chatDetail = chatUserData?.getOtherUserChatDetails?.find(
                      (chat: any) =>
                        chat &&
                        chat.otherUser &&
                        chat.otherUser.id === blocked.otherUser.id
                    );

                    const displayName =
                      chatDetail?.customUsername ||
                      blocked.otherUser.fullName;

                    return (
                      <ListItem key={blocked.id} divider>
                        <Avatar
                          src={blocked.otherUser.profilePicture}
                          alt={displayName}
                          sx={{ width: 40, height: 40, mr: 2 }}
                        />
                        <ListItemText
                          primary={displayName}
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
                    );
                  })}
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
