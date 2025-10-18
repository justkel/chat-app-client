'use client';
import React from 'react';
import {
  Modal,
  Box,
  Typography,
  IconButton,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Avatar,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

interface BlockedUser {
  id: string;
  otherUser: {
    id: string;
    fullName: string;
    email: string;
    profilePicture: string;
  };
}

interface BlockedUsersModalProps {
  open: boolean;
  onClose: () => void;
  blockedUsers: BlockedUser[];
  loading: boolean;
  error: any;
  chatUserData: any;
}

const montserrat = 'Montserrat, sans-serif';

export default function BlockedUsersModal({
  open,
  onClose,
  blockedUsers,
  loading,
  error,
  chatUserData,
}: BlockedUsersModalProps) {
  return (
    <Modal open={open} onClose={onClose}>
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
          fontFamily: montserrat,
          maxHeight: '80vh',
          overflowY: 'auto',
        }}
      >
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6" fontWeight={600} sx={{ fontFamily: montserrat }}>
            Blocked Users
          </Typography>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>

        <Typography
          textAlign="center"
          mb={2}
          sx={{
            fontFamily: montserrat,
            color: 'text.secondary',
            fontSize: 14,
          }}
        >
          To unblock, visit individual chats.
        </Typography>

        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" height="150px">
            <CircularProgress />
          </Box>
        ) : error ? (
          <Typography textAlign="center" sx={{ fontFamily: montserrat, color: 'error.main' }}>
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
                chatDetail?.customUsername || blocked.otherUser.fullName;

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
                      fontFamily: montserrat,
                      fontWeight: 500,
                    }}
                    secondaryTypographyProps={{
                      fontFamily: montserrat,
                      color: 'text.secondary',
                    }}
                  />
                </ListItem>
              );
            })}
          </List>
        ) : (
          <Typography textAlign="center" sx={{ fontFamily: montserrat }}>
            No blocked users found.
          </Typography>
        )}
      </Box>
    </Modal>
  );
}
