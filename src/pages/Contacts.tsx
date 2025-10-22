import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Avatar,
  Typography,
  InputBase,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Chip,
  Button,
  Divider,
  CircularProgress,
  Paper,
  Stack,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import MessageIcon from '@mui/icons-material/ChatBubbleOutline';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import BoltIcon from '@mui/icons-material/FlashOn';
import { useAuth } from '../contexts/AuthContext';
import { useGetAcceptedChatUsersAll } from '../hooks/useGetAcceptedUsers';
import { jwtDecode } from 'jwt-decode';

import socket from '../socket';

function debounce<F extends (...args: any[]) => void>(fn: F, wait = 250) {
  let t: any;
  return (...args: Parameters<F>) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
}

type Contact = {
  id: string;
  fullName: string;
  email: string;
  profilePicture?: string | null;
  isOnline: boolean;
};

const Contacts: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);

  const { data: dataAll, loading: loadingAll, error: err } = useGetAcceptedChatUsersAll(userId);

  const [query, setQuery] = useState('');
  const [filtered, setFiltered] = useState<Contact[]>([]);

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

  const contacts: Contact[] = useMemo(() => dataAll?.getAcceptedChatUsersAll ?? [], [dataAll]);

  useEffect(() => {
    if (!contacts || !userId) return;
    contacts.forEach((c) => {
      try {
        if (socket && (socket as any).connected) {
          socket.emit('joinRoom', { userId, otherUserId: c.id });
        }
      } catch (e) {
      }
    });
  }, [contacts, userId]);

  useEffect(() => {
    const doFilter = () => {
      if (!contacts || contacts.length === 0) {
        setFiltered([]);
        return;
      }
      const q = query.trim().toLowerCase();
      if (!q) {
        setFiltered(contacts);
      } else {
        setFiltered(
          contacts.filter((c) => {
            return (
              (c.fullName ?? '').toLowerCase().includes(q) ||
              (c.email ?? '').toLowerCase().includes(q)
            );
          })
        );
      }
    };
    const debounced = debounce(doFilter, 150);
    debounced();

    return () => {
    };
  }, [query, contacts]);

  useEffect(() => {
    setFiltered(contacts);
  }, [contacts]);

  const handleMessage = async (contact: Contact) => {
    if (!userId) return;
    try {
      if (socket && (socket as any).connected) {
        socket.emit('joinRoom', { userId, otherUserId: contact.id });
      }
      navigate(`/chats`);
    } catch (err) {
    }
  };

  const isSocketConnected = Boolean((socket as any)?.connected);

  const wrapperSx = {
    minHeight: '100vh',
    py: { xs: 4, md: 8 },
    px: { xs: 2, md: 6 },
    background: 'linear-gradient(180deg,#f7fbff 0%, #eef6ff 45%, #f1f9ff 100%)',
    fontFamily: `'Montserrat', system-ui, -apple-system, "Segoe UI", Roboto`,
  } as const;

  const headerSx = {
    maxWidth: 1200,
    mx: 'auto',
    mb: 4,
    px: { xs: 2, md: 3 },
    py: { xs: 2, md: 3 },
    borderRadius: 3,
    background: 'linear-gradient(180deg, rgba(255,255,255,0.98), rgba(250,250,255,0.96))',
    boxShadow: '0 8px 26px rgba(13, 14, 26, 0.06)',
    border: '1px solid rgba(12,18,40,0.04)',
    display: 'flex',
    alignItems: 'center',
    gap: 2,
    justifyContent: 'space-between',
  } as const;

  const searchBoxSx = {
    flex: 1,
    ml: 2,
    mr: 2,
    display: 'flex',
    alignItems: 'center',
    gap: 1,
    background: 'rgba(14, 25, 52, 0.03)',
    px: 1.5,
    py: 0.5,
    borderRadius: 999,
    border: '1px solid rgba(12,18,40,0.03)',
  } as const;

  const listContainerSx = {
    maxWidth: 1200,
    mx: 'auto',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 2,
  } as const;

  const rowCardSx = {
    display: 'flex',
    alignItems: 'center',
    gap: 2,
    px: { xs: 2, md: 3 },
    py: { xs: 2.5, md: 3.5 },
    borderRadius: 3,
    background: 'linear-gradient(90deg, rgba(255,255,255,0.95), rgba(250,250,255,0.95))',
    boxShadow: '0 6px 22px rgba(12,18,40,0.04)',
    border: '1px solid rgba(12,18,40,0.04)',
  } as const;

  return (
    <Box sx={wrapperSx}>
      <Box sx={headerSx}>
        <Stack direction="row" spacing={2} alignItems="center">
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: 2,
              display: 'grid',
              placeItems: 'center',
              background: 'linear-gradient(135deg,#7c3aed,#06b6d4)',
              boxShadow: '0 8px 30px rgba(124,58,237,0.12)',
            }}
          >
            <BoltIcon sx={{ color: '#fff', fontSize: 28 }} />
          </Box>

          <Box>
            <Typography sx={{ fontWeight: 900, fontSize: 18, color: '#021026' }}>Contacts</Typography>
            <Typography sx={{ color: '#475569', fontSize: 13 }}>All people you can privately chat with</Typography>
          </Box>
        </Stack>

        <Box sx={searchBoxSx}>
          <IconButton aria-label="search" size="small" sx={{ ml: 0.25 }}>
            <SearchIcon fontSize="small" />
          </IconButton>
          <InputBase
            placeholder="Search name or email"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            sx={{ flex: 1, fontSize: 14 }}
          />
          <Divider orientation="vertical" flexItem sx={{ mx: 1, borderColor: 'rgba(12,18,40,0.03)' }} />
          <Chip label={isSocketConnected ? 'Connected' : 'Offline'} color={isSocketConnected ? 'primary' : 'default'} />
        </Box>
      </Box>

      <Box sx={listContainerSx}>
        {loadingAll ? (
          <Box sx={{ display: 'grid', placeItems: 'center', py: 10 }}>
            <CircularProgress />
          </Box>
        ) : err ? (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <Typography color="error">Failed to load contacts: {err.message || 'Unknown'}</Typography>
          </Box>
        ) : filtered.length === 0 ? (
          <Paper elevation={0} sx={{ ...rowCardSx }}>
            <Box sx={{ flex: 1 }}>
              <Typography sx={{ fontWeight: 700, color: '#0f172a' }}>No contacts found</Typography>
              <Typography sx={{ color: '#64748b' }}>Try adjusting your search or refresh the page.</Typography>
            </Box>
            <Button
              onClick={() => {
                window.location.reload();
              }}
              variant="contained"
              sx={{
                borderRadius: 999,
                background: 'linear-gradient(90deg,#60a5fa,#7c3aed)',
                color: '#fff',
                px: 2.5,
                py: 0.8,
                fontWeight: 800,
                textTransform: 'none',
              }}
            >
              Refresh
            </Button>
          </Paper>
        ) : (
          <List disablePadding>
            {filtered.map((contact) => {
              const online = contact.isOnline;
              return (
                <React.Fragment key={contact.id}>
                  <ListItem
                    sx={{
                      ...rowCardSx,
                      mb: 0,
                    }}
                    secondaryAction={
                      <Stack direction="row" spacing={1}>
                        <Button
                          startIcon={<MessageIcon />}
                          variant="contained"
                          onClick={() => handleMessage(contact)}
                          sx={{
                            textTransform: 'none',
                            borderRadius: 999,
                            px: 2.5,
                            background: 'linear-gradient(90deg,#60a5fa,#7c3aed)',
                            boxShadow: '0 8px 30px rgba(99,102,241,0.12)',
                            color: '#fff',
                            fontWeight: 800,
                          }}
                        >
                          Message
                        </Button>
                        <IconButton edge="end" aria-label="more" size="large">
                          <MoreHorizIcon />
                        </IconButton>
                      </Stack>
                    }
                  >
                    <ListItemAvatar>
                      <Avatar
                        src={contact.profilePicture ? `http://localhost:5002${contact.profilePicture}` : undefined}
                        sx={{
                          width: 64,
                          height: 64,
                          bgcolor: '#eef2ff',
                          color: '#3730a3',
                          fontWeight: 800,
                          mr: 1,
                        }}
                      >
                        {!contact.profilePicture && (contact.fullName ? contact.fullName.charAt(0).toUpperCase() : '?')}
                      </Avatar>
                    </ListItemAvatar>

                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
                          <Typography sx={{ fontWeight: 800, fontSize: 16, color: '#021026' }} noWrap>
                            {contact.fullName}
                          </Typography>
                          <Chip
                            label={online ? 'Available' : 'Offline'}
                            size="small"
                            sx={{
                              ml: 1,
                              background: online ? 'linear-gradient(90deg,#dff6ff,#e6e8ff)' : 'rgba(12,18,40,0.03)',
                              color: online ? '#03435f' : '#475569',
                              fontWeight: 700,
                              borderRadius: 999,
                            }}
                          />
                        </Box>
                      }
                      secondary={<Typography sx={{ color: '#64748b', fontSize: 13 }} noWrap>{contact.email}</Typography>}
                    />
                  </ListItem>
                  <Divider sx={{ my: 1, borderColor: 'rgba(12,18,40,0.03)' }} />
                </React.Fragment>
              );
            })}
          </List>
        )}
      </Box>
    </Box>
  );
};

export default Contacts;
