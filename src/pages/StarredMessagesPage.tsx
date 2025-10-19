'use client';
import React, { useMemo, useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Avatar,
  CircularProgress,
  IconButton,
  Paper,
  Divider,
  Button,
} from '@mui/material';
import { motion } from 'framer-motion';
import { useGetStarredMessages } from '../hooks/useGetStarredMessages';
import { useAuth } from '../contexts/AuthContext';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import AudiotrackOutlinedIcon from '@mui/icons-material/AudiotrackOutlined';
import ImageNotSupportedOutlinedIcon from '@mui/icons-material/ImageNotSupportedOutlined';
import { jwtDecode } from 'jwt-decode';
import { CHAT_UPLOAD_PREFIX, CHAT_UPLOAD_FILE_PREFIX, CHAT_UPLOAD_AUDIO_PREFIX } from '../utilss/types';
import AudioPlayerCustom from '../components/AudioPlayerCustom';
const montserrat = 'Montserrat, sans-serif';

const MEDIA_BASE = 'http://localhost:5002';

const formatTimestamp = (iso?: string | null) => {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    const datePart = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    const timePart = d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
    return `${datePart} • ${timePart}`;
  } catch {
    return iso;
  }
};

export default function StarredMessagesPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      try {
        const decodedToken: any = jwtDecode(user.token);
        setUserId(String(decodedToken.sub));
      } catch {
        setUserId(null);
      }
    }
  }, [user]);

  const { data, loading, error, refetch } = useGetStarredMessages(userId);

    const messages = useMemo(() => {
        const msgs = data?.getStarredMessages ?? [];
        return [...msgs].sort((a: any, b: any) => {
            const ta = a.timestamp ? new Date(a.timestamp).getTime() : 0;
            const tb = b.timestamp ? new Date(b.timestamp).getTime() : 0;
            return tb - ta;
        });
    }, [data]);

  return (
    <Box
      sx={{
        p: { xs: 3, md: 6 },
        fontFamily: montserrat,
        display: 'flex',
        flexDirection: 'column',
        gap: 3,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          justifyContent: 'space-between',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton
            onClick={() => window.history.back()}
            sx={{
              bgcolor: 'background.paper',
              boxShadow: 1,
              '&:hover': { boxShadow: 3 },
            }}
            aria-label="back"
          >
            <ArrowBackIcon />
          </IconButton>

          <Box>
            <Typography variant="h5" sx={{ fontFamily: montserrat, fontWeight: 700 }}>
              Starred Messages
            </Typography>
            <Typography variant="body2" sx={{ fontFamily: montserrat, color: 'text.secondary' }}>
              Your starred messages — latest first
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <IconButton
            onClick={() => refetch()}
            sx={{
              bgcolor: 'background.paper',
              boxShadow: 1,
              '&:hover': { boxShadow: 3 },
            }}
            aria-label="refresh"
          >
            <StarBorderIcon />
          </IconButton>
        </Box>
      </Box>

      <Paper
        elevation={2}
        sx={{
          p: { xs: 2, md: 3 },
          borderRadius: 3,
          bgcolor: 'background.default',
        }}
      >
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" py={8}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Box display="flex" flexDirection="column" alignItems="center" py={8} gap={2}>
            <ChatBubbleOutlineIcon sx={{ fontSize: 48, color: 'error.main' }} />
            <Typography sx={{ fontFamily: montserrat, color: 'error.main' }}>
              Failed to load starred messages.
            </Typography>
            <Typography
              component="button"
              onClick={() => refetch()}
              sx={{
                mt: 1,
                fontFamily: montserrat,
                color: 'primary.main',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
              Retry
            </Typography>
          </Box>
        ) : !loading && messages.length === 0 ? (
          <Box display="flex" flexDirection="column" alignItems="center" py={12} gap={2}>
            <StarBorderIcon sx={{ fontSize: 56, color: 'text.secondary' }} />
            <Typography sx={{ fontFamily: montserrat, color: 'text.secondary', fontSize: '1.05rem' }}>
              No starred messages yet
            </Typography>
            <Typography sx={{ fontFamily: montserrat, color: 'text.secondary' }}>
              Star messages to find them quickly later.
            </Typography>
          </Box>
        ) : (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: '1fr',
                md: '1fr',
                lg: 'repeat(2, 1fr)',
                xl: 'repeat(3, 1fr)',
              },
              gap: 2,
            }}
          >
            {messages.map((msg: any) => {
              const otherUser = String(msg.sender?.id) === String(userId) ? msg.receiver : msg.sender;
            // const senderIsCurrentUser = String(msg.sender?.id) === String(userId);
              const avatarSrc = msg.sender?.profilePicture
                ? `${MEDIA_BASE}${msg.sender.profilePicture}`
                : undefined;

              const renderContent = () => {
                const content: string | null = msg.content ?? null;

                if (content && content.startsWith(CHAT_UPLOAD_PREFIX)) {
                  const url = `${MEDIA_BASE}${content}`;
                  return (
                    <Box sx={{ width: '100%', mt: 1 }}>
                      <img
                        src={url}
                        alt="uploaded"
                        style={{
                          width: '100%',
                          maxHeight: 250,
                          objectFit: 'cover',
                          borderRadius: 8,
                          display: 'block',
                        }}
                      />
                    </Box>
                  );
                }

                if (content && content.startsWith(CHAT_UPLOAD_FILE_PREFIX)) {
                  const url = `${MEDIA_BASE}${content}`;
                  return (
                    <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <DescriptionOutlinedIcon sx={{ fontSize: 28, color: 'primary.main' }} />
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => window.open(url, '_blank')}
                        sx={{
                          textTransform: 'none',
                          fontFamily: montserrat,
                          maxWidth: '100%',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {msg.fileOriginalName || 'Download file'}
                      </Button>
                    </Box>
                  );
                }

                if (content && content.startsWith(CHAT_UPLOAD_AUDIO_PREFIX)) {
                  const url = `${MEDIA_BASE}${content}`;
                  return (
                    <Box sx={{ mt: 1, display: 'flex', gap: 2, alignItems: 'center' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar
                          src={avatarSrc}
                          alt={msg.sender?.fullName || 'User'}
                          sx={{ width: 40, height: 40 }}
                        />
                        <AudiotrackOutlinedIcon sx={{ color: 'primary.main' }} />
                      </Box>

                      <Box sx={{ flex: 1 }}>
                        <AudioPlayerCustom src={url} />
                      </Box>
                    </Box>
                  );
                }

                if (msg.content) {
                  return (
                    <Typography
                      sx={{
                        fontFamily: montserrat,
                        fontSize: { xs: '0.9rem', md: '0.95rem' },
                        color: 'text.primary',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        lineHeight: 1.3,
                      }}
                    >
                      {msg.content}
                    </Typography>
                  );
                }

                if (msg.caption) {
                  return (
                    <Typography
                      sx={{
                        fontFamily: montserrat,
                        fontSize: { xs: '0.9rem', md: '0.95rem' },
                        color: 'text.primary',
                      }}
                    >
                      {msg.caption}
                    </Typography>
                  );
                }

                return (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ImageNotSupportedOutlinedIcon sx={{ color: 'text.secondary' }} />
                    <Typography sx={{ fontFamily: montserrat, color: 'text.secondary' }}>
                      Media
                    </Typography>
                  </Box>
                );
              };

              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.28, ease: 'easeOut' }}
                >
                  <Paper
                    elevation={1}
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      display: 'flex',
                      gap: 2,
                      alignItems: 'flex-start',
                      minHeight: 110,
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        transition: 'transform 0.18s ease',
                        boxShadow: 6,
                      },
                    }}
                  >
                    <Avatar
                      src={avatarSrc}
                      alt={msg.sender?.fullName || 'User'}
                      sx={{
                        width: { xs: 56, sm: 64 },
                        height: { xs: 56, sm: 64 },
                        flexShrink: 0,
                      }}
                    />

                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography
                            sx={{
                              fontFamily: montserrat,
                              fontWeight: 700,
                              fontSize: { xs: '0.95rem', md: '1rem' },
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              maxWidth: '70%',
                            }}
                          >
                            {msg.sender?.fullName}
                            <Typography
                              component="span"
                              sx={{
                                fontFamily: montserrat,
                                fontWeight: 500,
                                color: 'text.secondary',
                                fontSize: '0.8rem',
                                ml: 1,
                              }}
                            >
                              {` — ${otherUser?.fullName ?? ''}`}
                            </Typography>
                          </Typography>
                        </Box>

                        <Typography
                          sx={{
                            fontFamily: montserrat,
                            color: 'text.secondary',
                            fontSize: '0.8rem',
                            whiteSpace: 'nowrap',
                            alignSelf: 'flex-start',
                          }}
                        >
                          {formatTimestamp(msg.timestamp)}
                        </Typography>
                      </Box>

                      <Divider sx={{ my: 1.2 }} />

                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box sx={{ flex: 1, minWidth: 0 }}>{renderContent()}</Box>

                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                          <StarBorderIcon sx={{ color: 'goldenrod' }} />
                        </Box>
                      </Box>
                    </Box>
                  </Paper>
                </motion.div>
              );
            })}
          </Box>
        )}
      </Paper>
    </Box>
  );
}
