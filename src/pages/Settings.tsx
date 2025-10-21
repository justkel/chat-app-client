'use client';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Typography,
  Switch,
  Button,
} from '@mui/material';
import { motion } from 'framer-motion';
import {
  Lock as LockIcon,
  Block as BlockIcon,
  Star as StarIcon,
  Visibility as VisibilityIcon,
  Palette as PaletteIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import Dashboard from '../components/Layout';
import { useGetBlockedUsers } from '../hooks/UseGetBlockedUsers';
import { useGetChatUserDetails } from '../hooks/useGetOtherUserdetails';
import UpdatePasswordModal from '../components/settings/UpdatePasswordModal';
import BlockedUsersModal from '../components/settings/BlockedUsersModal';
import { useAuth } from '../contexts/AuthContext';
import { notification } from 'antd';
import { jwtDecode } from 'jwt-decode';
import { io } from 'socket.io-client';
import { useGetUserById } from '../hooks/useGetOtherUser';
import { useUpdateReadReceipts } from '../hooks/useUpdateReadReceipts';

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
  const [passwordModal, setPasswordModal] = useState(false);
  const [blockedUsersModal, setBlockedUsersModal] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      const decodedToken: any = jwtDecode(user.token);
      setUserId(decodedToken.sub);
    }
  }, [user]);

  const { data: userData, refetch: refetchUser } = useGetUserById(userId);
  const { updateReadReceipts } = useUpdateReadReceipts();

  useEffect(() => {
    if (userData?.getUserById?.readReceipts !== undefined) {
      setReadReceipts(userData.getUserById.readReceipts);
    }
  }, [userData]);

  const handleToggleReadReceipts = async (checked: boolean) => {
    setReadReceipts(checked);

    if (!userId) return;

    try {
      await updateReadReceipts(userId, checked);
      await refetchUser();

      notification.success({
        message: checked
          ? 'Read receipts enabled'
          : 'Read receipts disabled',
        description: checked
          ? 'Others can now see when you read their messages'
          : 'Read receipts have been turned off',
        style: {
          fontFamily: 'Montserrat, sans-serif',
        },
      });
    } catch (err) {
      setReadReceipts(!checked);
      notification.error({
        message: 'Failed to update read receipts',
      });
    }
  };

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
              action: 'Visit',
              onClick: () => navigate('/starred'),
            },
            {
              icon: <VisibilityIcon sx={{ color: '#2ecc71' }} />,
              title: 'Read Receipts',
              switch: true,
            },
            {
              icon: <PaletteIcon sx={{ color: '#9b59b6' }} />,
              title: 'Default Chat Theme',
              action: 'Select',
              onClick: () => navigate('/wallpapers'),
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
                    onChange={(e) => handleToggleReadReceipts(e.target.checked)}
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

          <BlockedUsersModal
            open={blockedUsersModal}
            onClose={() => setBlockedUsersModal(false)}
            blockedUsers={blockedUsers}
            loading={loading || chatLoading}
            error={error}
            chatUserData={chatUserData}
          />
        </Box>
      </Box>
    </Dashboard>
  );
};

export default SettingsPage;
