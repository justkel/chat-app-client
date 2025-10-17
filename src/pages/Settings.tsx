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
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    overflowY: 'auto',
                    backgroundColor: 'background.default',
                    fontFamily: 'Montserrat, sans-serif',
                    p: { xs: 2, md: 4 },
                    maxWidth: 800,
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
                        sx={{ color: 'primary.main' }}
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
                                p: 3,
                                mb: 3,
                                borderRadius: 3,
                                boxShadow: 3,
                                bgcolor: 'background.paper',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                            }}
                        >
                            <Box display="flex" alignItems="center" gap={2}>
                                {setting.icon}
                                <Typography fontWeight={600}>{setting.title}</Typography>
                            </Box>

                            {setting.switch ? (
                                <Switch
                                    checked={readReceipts}
                                    onChange={(e) => setReadReceipts(e.target.checked)}
                                    color="success"
                                />
                            ) : (
                                <Button
                                    variant="outlined"
                                    onClick={setting.onClick}
                                    sx={{ fontFamily: 'Montserrat, sans-serif' }}
                                >
                                    {setting.action}
                                </Button>
                            )}
                        </Box>
                    </motion.div>
                ))}

                {/* Password Modal */}
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
                            width: { xs: '90%', md: 400 },
                        }}
                    >
                        <Box
                            display="flex"
                            justifyContent="space-between"
                            alignItems="center"
                            mb={2}
                        >
                            <Typography variant="h6" fontWeight={600}>
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

                <Modal open={blockedUsersModal} onClose={() => setBlockedUsersModal(false)}>
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
                            width: { xs: '90%', md: 400 },
                        }}
                    >
                        <Box
                            display="flex"
                            justifyContent="space-between"
                            alignItems="center"
                            mb={2}
                        >
                            <Typography variant="h6" fontWeight={600}>
                                Blocked Users
                            </Typography>
                            <IconButton onClick={() => setBlockedUsersModal(false)}>
                                <CloseIcon />
                            </IconButton>
                        </Box>

                        {loading ? (
                            <Box display="flex" justifyContent="center" alignItems="center" height="150px">
                                <CircularProgress />
                            </Box>
                        ) : error ? (
                            <Typography
                                textAlign="center"
                                sx={{ fontFamily: 'Montserrat, sans-serif', color: 'error.main' }}
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
        </Dashboard>
    );
};

export default SettingsPage;
