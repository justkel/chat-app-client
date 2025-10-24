import React, { useCallback, useEffect, useState, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar, Spin, notification, message as antdMessage } from 'antd';
import EmojiPicker, { EmojiClickData } from "emoji-picker-react";
import HeaderWithInlineCard from '../components/HeaderCard';
import { jwtDecode } from 'jwt-decode';
import dayjs from 'dayjs';
import { useAuth } from '../contexts/AuthContext';
import { useGetChatMessages, useGetChatMessagesAll, useCheckUserOnline, useUpdateMessageStatus } from '../hooks/useGetChatMessages';
import { useGetOtherUserById, useGetUserById } from '../hooks/useGetOtherUser';
import { useChatSettings, useGetOtherUserChatSettings } from '../hooks/useGetOtherUserContactDetails';
import { useDeleteMessages } from '../hooks/useDeleteMessages';
import { useDeleteMessagesForEveryone } from '../hooks/useDeleteMessages';
import { useFetchLastValidMessages } from '../hooks/useGetLastMessage';
import { CHAT_UPLOAD_PREFIX, CHAT_UPLOAD_FILE_PREFIX, CHAT_UPLOAD_AUDIO_PREFIX, ChatMessage, UserTypingEvent } from '../utilss/types';
import '../App.css';
import ForwardModal from '../components/ForwardModal';
import { ImagePreviewModal } from '../components/ImagePreviewModal';
import InfoCard from '../components/InfoCard';
// import MessageActionCard from '../components/MessageActionCard';
import EditMessageModal from '../components/EditingMessageModal';
import ReplyCard from '../components/ReplyCard';
import ImagePreviewCard from '../components/ImagePreviewCard';
import MessageInputBar from '../components/MessageInputBar';
import DeleteMessageModal from '../components/DeleteMessageModal';
import SelectedMessagesBar from '../components/SelectedMessagesBar';
import { FilePreviewModal } from '../components/FilePreviewModal';
import { useGetUsersToForwardTo } from '../hooks/useGetAcceptedUsers';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faShare, faFileAlt, faHeadphones } from '@fortawesome/free-solid-svg-icons';
import { FilePreviewModalAudio } from '../components/FilePreviewModalAudio';
import AudioPlayerCustom from '../components/AudioPlayerCustom';
import { AudioOutlined, StarFilled, DownloadOutlined } from '@ant-design/icons';
import { useLocation } from "react-router-dom";
import { io } from 'socket.io-client';

const socket = io('http://localhost:5002', {
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 20000,
});

interface InteractPageProps {
  onSelectUser: (id: string) => void;
  otherUserId: string;
}

const InteractPage: React.FC<InteractPageProps> = ({ otherUserId, onSelectUser }) => {
  // const { id: otherUserId } = useParams();
  const { user } = useAuth();
  const [userId, setUserId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const [messagesAll, setMessagesAll] = useState<any[]>([]);
  const [isOtherUserTyping, setIsOtherUserTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const typingTimeoutR = useRef<NodeJS.Timeout | null>(null); //For ChatPage Component
  const [scrollLock, setScrollLock] = useState(false);
  const [isReceiverOnPage, setIsReceiverOnPage] = useState(false);
  const [newMessageCount, setNewMessageCount] = useState(0);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [selectedMessages, setSelectedMessages] = useState<any[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCard, setShowCard] = useState(false);
  const [showReplyCard, setShowReplyCard] = useState(false);
  const [showInfoCard, setShowInfoCard] = useState(false);
  const [showForwardModal, setShowForwardModal] = useState(false);
  const [errorOccurred, setErrorOccurred] = useState(false);
  const [isOtherUserBlocked, setIsOtherUserBlocked] = useState<boolean | null>(null);
  const [isUserBlocked, setIsUserBlocked] = useState<boolean | null>(null);
  const [searchResults, setSearchResults] = useState<ChatMessage[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  const toggleCard = () => setShowCard(!showCard);
  const [isEmojiPickerVisible, setIsEmojiPickerVisible] = useState<boolean>(false);
  const [editMessage, setEditMessage] = useState<string | undefined>(undefined);
  const [isEditing, setIsEditing] = useState(false);
  const [currentSelectedMessage, setCurrentSelectedMessage] = useState<any>(null);
  const [currentSelectedMessages, setCurrentSelectedMessages] = useState<any[]>([]);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileCaption, setFileCaption] = useState<string>("");
  const [showFilePreviewModal, setShowFilePreviewModal] = useState(false);
  const [showAudioPreviewModal, setShowAudioPreviewModal] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [showAllImagesModal, setShowAllImagesModal] = useState(false);
  const [activeImageGroup, setActiveImageGroup] = useState<any[]>([]);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [captions, setCaptions] = useState<string[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const actualFileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [selectedAudio, setSelectedAudio] = useState<File | null>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const location = useLocation();

  const imageMessages = useMemo(() => {
    return messages.filter((msg) =>
      msg.content?.startsWith(CHAT_UPLOAD_PREFIX)
    );
  }, [messages]);

  const selectedImage =
    selectedImageIndex !== null
      ? `http://localhost:5002${imageMessages[selectedImageIndex]?.content}`
      : undefined;


  const openImage = (imageUrl: string) => {
    const index = imageMessages.findIndex(
      (msg) => `http://localhost:5002${msg.content}` === imageUrl
    );
    if (index !== -1) setSelectedImageIndex(index);
  };

  const goPrev = () => {
    if (selectedImageIndex && selectedImageIndex > 0) {
      setSelectedImageIndex((prev) => prev! - 1);
    }
  };

  const goNext = () => {
    if (selectedImageIndex && selectedImageIndex < imageMessages.length - 1) {
      setSelectedImageIndex((prev) => prev! + 1);
    }
  };

  const closeImage = () => {
    setSelectedImageIndex(null);
  };

  useEffect(() => {
    if (selectedMessages.length === 1) {
      const selectedMessage = messages.find(msg => msg.id === selectedMessages[0]) || null;
      setCurrentSelectedMessage(selectedMessage);
    } else {
      setCurrentSelectedMessage(null);
    }
  }, [selectedMessages, messages]);

  useEffect(() => {
    if (selectedMessages.length > 0) {
      const selectedMessagesArray = messages.filter(msg => selectedMessages.includes(msg.id));
      setCurrentSelectedMessages(selectedMessagesArray);
    } else {
      setCurrentSelectedMessages([]);
    }
  }, [selectedMessages, messages]);

  const maxLength = 200;
  const [expandedMessages, setExpandedMessages] = useState<Set<string>>(new Set());

  const { data, loading, error, refetch } = useGetChatMessages(userId, otherUserId ?? null);
  const { data: dataAll, loading: loadingMsgAll } = useGetChatMessagesAll(userId, otherUserId ?? null);
  const { isOnline: onlineData, loading: onlineLoading, error: onlineError, refetch: isOnlineRefetch } = useCheckUserOnline(otherUserId ?? null);
  const { data: otherUserData, loading: otherUserLoading, refetch: otherUserRefetch } = useGetOtherUserById(otherUserId ?? null);
  const { data: userData, loading: userLoading } = useGetUserById(userId);
  const { data: chatSettings, loading: chatLoading } = useChatSettings(userId!, otherUserId!);
  const { data: otherUserChatSettings, loading: otherUserChatLoading } = useGetOtherUserChatSettings(userId!, otherUserId!);
  const { data: usersForForward } = useGetUsersToForwardTo(userId);
  const { updateMessageStatus } = useUpdateMessageStatus();
  const { deleteMessages } = useDeleteMessages();
  const { deleteMessagesForEveryone } = useDeleteMessagesForEveryone();
  const [fetchLastValidMessages] = useFetchLastValidMessages();

  const storedReplyMessage = JSON.parse(
    localStorage.getItem(`replyMessage_${userId}_${otherUserId}`) || "null"
  );

  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = 'http://localhost:5002/uploads/whatsapp-wallpaper.jpg';
    document.head.appendChild(link);
  }, []);

  const [backgroundImage, setBackgroundImage] = useState<string>('');

  useEffect(() => {
    if (chatSettings?.customWallpaper) {
      setBackgroundImage(`http://localhost:5002/wallpapers/${chatSettings.customWallpaper}`);
    } else if (userData?.getUserById?.defaultChatWallpaper) {
      setBackgroundImage(`http://localhost:5002/wallpapers/${userData.getUserById.defaultChatWallpaper}`);
    } else {
      setBackgroundImage(`http://localhost:5002/uploads/whatsapp-wallpaper.jpg`);
    }
  }, [
    chatSettings?.customWallpaper,
    userData?.getUserById?.defaultChatWallpaper
  ]);

  useEffect(() => {
    if (chatSettings?.isOtherUserBlocked !== undefined) {
      setIsOtherUserBlocked(chatSettings.isOtherUserBlocked);
    }
  }, [chatSettings]);

  useEffect(() => {
    if (otherUserChatSettings?.isOtherUserBlocked !== undefined) {
      setIsUserBlocked(otherUserChatSettings.isOtherUserBlocked);
    }
  }, [otherUserChatSettings]);

  // useEffect(() => {
  //   console.log('DID OTHER USER BLOCK ME', isUserBlocked);
  //   console.log('DID I BLOCK OTHER USER', isOtherUserBlocked);
  // }, [isOtherUserBlocked, isUserBlocked])


  useEffect(() => {
    if (dataAll?.getChatMessages) {
      setMessagesAll(dataAll.getChatMessages);
    } else {
      setMessagesAll([]);
    }
  }, [dataAll]);

  // useEffect(() => {
  //   refetchMsgAll();
  // }, [messages, refetchMsgAll]);

  useEffect(() => {
    // Scroll to the bottom of the page
    window.scrollTo(0, document.body.scrollHeight);
  }, []);

  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {

    const handleClickOutside = (event: MouseEvent) => {
      if (cardRef.current && !cardRef.current.contains(event.target as Node)) {
        setShowCard(false);
      }
    };

    if (showCard) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showCard]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (otherUserData) {
        otherUserRefetch();
      }
    }, 25000);

    // Cleanup the interval when the component unmounts
    return () => clearInterval(interval);
  }, [otherUserData, otherUserRefetch]);

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    setNewMessage((prevMessage) => prevMessage + emojiData.emoji);
  };

  useEffect(() => {
    setIsReceiverOnPage(true);

    return () => {
      setIsReceiverOnPage(false);
    };
  }, []);

  useEffect(() => {
    if (error) {
      if (error.message.includes('Chat does not exist between you and this user. Action not allowed.')) {
        notification.error({
          message: 'Action Not Allowed',
          description: 'Chat does not exist between you and this user.',
          duration: 4,
          style: {
            backgroundColor: 'rgba(255, 0, 0, 0.1)',
            border: '1px solid #ff4d4f',
            borderRadius: '8px',
            padding: '12px',
            fontWeight: 'bold',
            color: '#ff4d4f',
          },
        });
        setErrorOccurred(true);
      }
    }
  }, [error]);

  useEffect(() => {
    if (errorOccurred) {
      const timeout = setTimeout(() => {
        navigate('/chats');
      }, 5000);

      return () => clearTimeout(timeout);
    }
  }, [errorOccurred, navigate]);

  const formatTimestamp = (timestamp: string) => {
    const messageDate = dayjs(timestamp);
    const today = dayjs();
    const yesterday = today.subtract(1, 'day');

    if (messageDate.isSame(today, 'day')) {
      return 'Today';
    } else if (messageDate.isSame(yesterday, 'day')) {
      return 'Yesterday';
    } else {
      return messageDate.format('DD/MM/YY');
    }
  };

  const formatTimestampV2 = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();

    const formattedTime = date.toLocaleString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    const formattedDate = date.toLocaleString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
    });

    if (date.toDateString() === now.toDateString()) {
      return (
        <span>
          <span className="text-blue-500">today</span> {formattedTime}
        </span>
      );
    }

    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return (
        <span>
          <span className="text-red-500">yesterday</span> {formattedTime}
        </span>
      );
    }

    return (
      <span>
        {formattedDate} {formattedTime}
      </span>
    );
  };

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!otherUserId || !userId) return;

    const pollInterval = 10000;
    const interval = intervalRef.current;

    const startPolling = () => {
      if (interval) clearInterval(interval);

      intervalRef.current = setInterval(async () => {
        if (document.visibilityState !== 'visible') return; // Only poll if tab is visible
        if (onlineLoading || onlineError) return;

        try {
          await isOnlineRefetch();
        } catch (err) {
          console.error('Error refetching online status:', err);
        }
      }, pollInterval);
    };

    startPolling();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [otherUserId, userId, onlineLoading, onlineError, isOnlineRefetch]);

  const updatedMessageIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (onlineData?.status.toLowerCase() === 'yes' && (isUserBlocked === false) && (isOtherUserBlocked === false)) {
      const sentMessages = messages.filter(
        (msg) =>
          msg.status.toLowerCase() === 'sent' &&
          !updatedMessageIds.current.has(msg.id) &&
          msg.wasSentWhileCurrentlyBlocked === false
      );

      if (sentMessages.length === 0) return;

      sentMessages.forEach(async (msg) => {
        try {
          await updateMessageStatus(msg.id, 'DELIVERED');

          updatedMessageIds.current.add(msg.id); // track updated msg

          setMessages((prev) =>
            prev.map((message) =>
              message.id === msg.id
                ? { ...message, status: 'DELIVERED', deliveredAt: new Date() }
                : message
            )
          );

          const transformedMessage = {
            sender: { id: msg.sender.id },
            receiver: { id: msg.receiver.id },
            content: msg.content,
            timestamp: msg.timestamp,
            status: 'DELIVERED',
            deliveredAt: new Date(),
            id: msg.id,
            wasSentWhileCurrentlyBlocked: msg.wasSentWhileCurrentlyBlocked || false,
          };

          socket.emit('otherUserOnline', { userId, otherUserId, transformedMessage });
        } catch (err) {
          console.error('Error updating message status:', err);
        }
      });
    }
  }, [onlineData?.status, messages, otherUserId, updateMessageStatus, userId, isUserBlocked, isOtherUserBlocked]);

  const readMessageIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isReceiverOnPage || !isAtBottom) {
        console.log("Receiver not on page or not at bottom, skipping read update.");
        return;
      }

      const messagesToUpdate = messages.filter(
        (msg) =>
          (msg.status.toLowerCase() === 'delivered' || msg.status.toLowerCase() === 'read') &&
          msg.receiver.id === userId &&
          !readMessageIds.current.has(msg.id) &&
          !msg.deliveredThenBlocked
      );

      if (messagesToUpdate.length === 0 || isOtherUserBlocked === true) return;

      messagesToUpdate.forEach(async (msg) => {
        try {
          await updateMessageStatus(msg.id, 'READ');

          readMessageIds.current.add(msg.id); // prevent re-updating

          const transformedMessage = {
            sender: { id: msg.sender.id },
            receiver: { id: msg.receiver.id },
            content: msg.content,
            timestamp: msg.timestamp,
            status: 'READ',
            id: msg.id,
            deliveredAt: msg.deliveredAt,
            wasSentWhileCurrentlyBlocked: msg.wasSentWhileCurrentlyBlocked || false,
          };

          socket.emit('updateMessageStatusRead', { userId, otherUserId, transformedMessage });
        } catch (error) {
          console.error('Error updating message statuses:', error);
        }
      });
    }, 1000); // debounce duration

    return () => clearTimeout(timer);
  }, [messages, userId, updateMessageStatus, otherUserId, isReceiverOnPage, isAtBottom, isOtherUserBlocked]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    const { scrollTop, scrollHeight, clientHeight } = target;

    const atBottom = scrollTop + clientHeight >= scrollHeight - 8;
    setIsAtBottom(atBottom);

    const newScrollLock = !atBottom;
    setScrollLock(newScrollLock);
  };

  useEffect(() => {
    if (user) {
      try {
        const decodedToken: any = jwtDecode(user.token);
        setUserId(decodedToken.sub);
        socket.emit('joinRoom', { userId: decodedToken.sub, otherUserId });

        const savedMessage = localStorage.getItem(
          `message_${decodedToken.sub}_${otherUserId}`
        );
        if (savedMessage) setNewMessage(savedMessage);
      } catch (err) {
        notification.error({ message: 'Invalid token', description: 'Please log in again.' });
      }

      return () => {
        socket.disconnect();
      };
    }
  }, [user, otherUserId]);

  useEffect(() => {
    socket.on('receiveMessage', (message: ChatMessage) => {
      if (message.sender.id !== userId) { //RECHECK LOGIC
        if (isUserBlocked === true || isOtherUserBlocked === true) {
          return;
        }
      }

      setMessages((prevMessages) => {
        if (message.repliedTo?.id) {
          const repliedMessage = prevMessages.find(msg => msg.id === message.repliedTo?.id);

          if (repliedMessage) {
            message.repliedTo.content = repliedMessage.content;
            message.repliedTo.fileOriginalName = repliedMessage.fileOriginalName;
          }
        }

        const newMessages = [...prevMessages, message];

        if (message.sender.id !== userId && !isAtBottom && isOtherUserBlocked === false) {
          setNewMessageCount((prevCount) => prevCount + 1);
        }

        return newMessages;
      });

      setMessagesAll((prevMessages) => {
        if (message.repliedTo?.id) {
          const repliedMessage = prevMessages.find(msg => msg.id === message.repliedTo?.id);

          if (repliedMessage) {
            message.repliedTo.content = repliedMessage.content;
          }
        }

        const newMessages = [...prevMessages, message];
        return newMessages;
      });

      if (message.sender.id !== userId && isAtBottom) {
        socket.emit('resetUnreadCount', { userId, otherUserId });
      }
    });

    socket.on('userTyping', ({ userId: typingUserId, typing }: UserTypingEvent) => {
      if (typingUserId !== userId && (isOtherUserBlocked === false)) {
        setIsOtherUserTyping(typing);
      }
    });

    socket.on('userBlocked', ({ userId: uId, otherUserId: othId, isOtherUserBlocked: othBlocked, isUserBlocked: isB }) => {
      if (uId !== userId) {
        setIsUserBlocked(othBlocked);
        setIsOtherUserBlocked(isB);
      } else {
        setIsOtherUserBlocked(othBlocked);
        setIsUserBlocked(isB)
      }
    });


    // socket.on('messageDelivered', ({ transformedMessage }) => {
    //   setMessages((prevMessages) =>
    //     prevMessages.map((msg) =>
    //       msg.id === transformedMessage.id ? { ...msg, status: 'DELIVERED' } : msg
    //     )
    //   );
    // });

    socket.on('messageStatusUpdatedToRead', (updatedMessage: ChatMessage) => { //Found the delete issue
      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg.id === updatedMessage.id
            ? { ...msg, ...updatedMessage }
            : msg
        )
      );
    });

    socket.on('messagesDeletedForEveryone', ({ messageIds }: { messageIds: string[] }) => {
      setMessages((prevMessages) =>
        prevMessages.filter((msg) => !messageIds.includes(msg.id))
      );
    });

    socket.on('messageEdited', (updatedMessage: ChatMessage) => {
      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg.id === updatedMessage.id ? { ...msg, content: updatedMessage.content } : msg
        )
      );
    });

    return () => {
      socket.off('receiveMessage');
      socket.off('userTyping');
      // socket.off('messageDelivered');
      socket.off('messageStatusUpdatedToRead');
      socket.off('messagesDeletedForEveryone');
      socket.off('messageEdited');
      socket.off('userBlocked');
    };
  }, [userId, otherUserId, isAtBottom, isOtherUserBlocked, isUserBlocked]);

  useEffect(() => {
    if (data && data.getChatMessages) {
      refetch();
      setMessages(data.getChatMessages);
    }
  }, [data, refetch]);

  useEffect(() => {
    if (!scrollLock && isAtBottom && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'auto' });
    }
  }, [isAtBottom, messages, scrollLock]);


  // // Scroll to the bottom when the other user is typing
  // useEffect(() => {
  //   if (isOtherUserTyping && messagesEndRef.current) {
  //     messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
  //   }
  // }, [isOtherUserTyping]);

  useEffect(() => {
    const checkIfAtBottom = () => {
      if (messagesEndRef.current) {
        const { bottom } = messagesEndRef.current.getBoundingClientRect();
        const isNearBottom = bottom <= window.innerHeight + 400; // You can adjust the 50 to be the desired threshold

        if (isOtherUserTyping && isNearBottom) {
          messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
      }
    };

    checkIfAtBottom();

  }, [isOtherUserTyping, isAtBottom]);

  // // Scroll to the bottom when the other user is typing, only if the user is at the bottom
  // useEffect(() => {
  //   if (isOtherUserTyping && isAtBottom && messagesEndRef.current) {
  //     messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
  //   }
  // }, [isOtherUserTyping, isAtBottom]);

  useEffect(() => {
    if (isAtBottom) {
      setNewMessageCount(0);
    }
  }, [isAtBottom]);

  useEffect(() => {
    if (isAtBottom && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.sender.id !== userId) {
        socket.emit('resetUnreadCount', { userId, otherUserId: lastMessage.sender.id });
      }
    }
  }, [isAtBottom, messages, userId]);


  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    return () => {
      if (typingTimeoutR.current) {
        clearTimeout(typingTimeoutR.current);
      }
    };
  }, []);

  const handleTyping = () => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    if (typingTimeoutR.current) {
      clearTimeout(typingTimeoutR.current);
    }

    // Emit typing signal
    if (isUserBlocked === false) {
      socket.emit('typing', { userId, otherUserId, typing: true });

      socket.emit('userActivity', { userId, otherUserId, isActive: true });

      typingTimeoutR.current = setTimeout(() => {
        socket.emit('userActivity', { userId, otherUserId, isActive: false });
        typingTimeoutR.current = null;
      }, 2000);

      // Set a timeout to stop showing the typing indicator after 3 seconds of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('typing', { userId, otherUserId, typing: false });
        typingTimeoutRef.current = null; // Clear the ref
      }, 1000);

      // typingTimeoutRef.current = setTimeout(() => {
      //   if (newMessage.trim()) {
      //     localStorage.setItem(
      //       `message_${userId}_${otherUserId}`,
      //       newMessage
      //     );
      //   }
      // }, 2000);
    }
  };

  socket.on('disconnect', () => {
    console.warn('Socket disconnected, attempting to reconnect...');
    socket.connect();
  });

  const sendMessage = () => {
    if (!newMessage.trim()) {
      notification.error({ message: 'Message cannot be empty' });
      return;
    }

    if (!socket.connected) {
      socket.connect();

      setTimeout(() => {
        if (!socket.connected) {
          notification.error({
            message: 'Connection error',
            description: 'Unable to send message. Please refresh the page.',
          });
        }
      }, 3000);
      return;
    }

    const replyMessage = localStorage.getItem(`replyMessage_${userId}_${otherUserId}`);
    const repliedTo = replyMessage ? JSON.parse(replyMessage).id : null;

    const message = {
      sender: { id: userId },
      receiver: { id: otherUserId },
      content: newMessage,
      repliedTo,
      timestamp: new Date().toISOString(),
      status: 'SENT',
      senderDFM: false,
      receiverDFM: false,
      delForAll: false,
      wasSentWhileCurrentlyBlocked: isUserBlocked,
    };

    socket.emit('sendMessage', message);

    setNewMessage('');

    localStorage.removeItem(`replyMessage_${userId}_${otherUserId}`);
    setIsEmojiPickerVisible(false);

    setTimeout(() => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }, 500);
  };

  const uploadImageAndSend = async () => {
    if (!selectedImages.length || !userId || !otherUserId) return;

    const formData = new FormData();

    selectedImages.forEach((file, index) => {
      formData.append('images', file);
      formData.append('captions', captions[index] || '');
    });

    formData.append('senderId', userId ?? '');
    formData.append('receiverId', otherUserId ?? '');
    formData.append('wasSentWhileCurrentlyBlocked', isUserBlocked ? 'true' : 'false');

    const replyMessage = localStorage.getItem(`replyMessage_${userId}_${otherUserId}`);
    const repliedTo = replyMessage ? JSON.parse(replyMessage).id : '';
    formData.append('repliedTo', repliedTo.toString());

    try {
      const response = await fetch('http://localhost:5002/chat-control/upload-image', {
        method: 'POST',
        body: formData,
      });

      const messages = await response.json();

      messages.forEach((msg: any) => {
        socket.emit('sendMessage', msg);
      });

      setSelectedImages([]);
      setCaptions([]);
      setShowPreviewModal(false);
      localStorage.removeItem(`replyMessage_${userId}_${otherUserId}`);
      setShowReplyCard(false);
    } catch (err) {
      console.error('Image upload failed:', err);
    }
  };

  const uploadFileAndSend = async () => {
    if (!selectedFile || !userId || !otherUserId) {
      return;
    }
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append("caption", fileCaption);
    formData.append('senderId', userId);
    formData.append('receiverId', otherUserId);
    formData.append('fileOriginalName', selectedFile.name);
    formData.append('wasSentWhileCurrentlyBlocked', isUserBlocked ? 'true' : 'false');

    const replyMessage = localStorage.getItem(`replyMessage_${userId}_${otherUserId}`);
    const repliedTo = replyMessage ? JSON.parse(replyMessage).id : '';
    formData.append('repliedTo', repliedTo.toString());

    try {
      const response = await fetch('http://localhost:5002/chat-control/upload-file', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error(`Upload failed: ${response.status}`);

      const messages = await response.json();
      messages.forEach((msg: any) => {
        socket.emit('sendMessage', msg);
      });

      localStorage.removeItem(`replyMessage_${userId}_${otherUserId}`);
      setShowReplyCard(false);
      setSelectedFile(null);
    } catch (err) {
      console.error('File upload failed:', err);
    }
  };

  const uploadAudioAndSend = async () => {
    if (!selectedAudio || !userId || !otherUserId) return;

    const formData = new FormData();
    formData.append('audio', selectedAudio);
    formData.append('senderId', userId);
    formData.append('receiverId', otherUserId);
    formData.append('fileOriginalName', selectedAudio.name);
    formData.append('wasSentWhileCurrentlyBlocked', isUserBlocked ? 'true' : 'false');

    const replyMessage = localStorage.getItem(`replyMessage_${userId}_${otherUserId}`);
    const repliedTo = replyMessage ? JSON.parse(replyMessage).id : '';
    formData.append('repliedTo', repliedTo.toString());

    try {
      const response = await fetch('http://localhost:5002/chat-control/upload-audio', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error(`Upload failed: ${response.status}`);

      const messages = await response.json();
      messages.forEach((msg: any) => {
        socket.emit('sendMessage', msg);
      });

      localStorage.removeItem(`replyMessage_${userId}_${otherUserId}`);
      setSelectedAudio(null);
      setShowReplyCard(false);
    } catch (err) {
      console.error('Audio upload failed:', err);
    }
  };

  const truncateMessage = (content: string) => {
    if (content.length > maxLength) {
      return {
        truncated: content.substring(0, maxLength),
        fullContent: content,
      };
    }
    return { truncated: content, fullContent: null };
  };

  const handleReadMore = (messageId: string) => {
    setExpandedMessages((prev) => {
      const updated = new Set(prev);
      if (updated.has(messageId)) {
        updated.delete(messageId); // Collapse the message
      } else {
        updated.add(messageId); // Expand the message
      }
      return updated;
    });

    setMessages((prevMessages) =>
      prevMessages.map((message) =>
        message.id === messageId ? { ...message, isExpanded: !message.isExpanded } : message
      )
    );
  };

  const renderMessageContent = (message: any) => {
    const isImage = message.content?.startsWith(CHAT_UPLOAD_PREFIX);
    const imageUrl = `http://localhost:5002${message.content}`;

    if (isImage) {
      return (
        <div
          className="w-40 h-40 rounded-xl overflow-hidden shadow-lg cursor-pointer transition-transform hover:scale-105 bg-white"
          onClick={() => openImage(imageUrl)}
        >
          <img
            src={imageUrl}
            alt=""
            className="max-w-xs max-h-64 object-cover"
          />
        </div>
      );
    }

    const { truncated, fullContent } = truncateMessage(message.content);
    const isExpanded = expandedMessages.has(message.id);

    if (fullContent) {
      return (
        <>
          <span
            className="message-content-text"
            data-original={fullContent}
          >
            {isExpanded ? fullContent : truncated}
          </span>
          <button
            onClick={() => handleReadMore(message.id)}
            className="text-yellow-800 text-sm ml-2"
          >
            {isExpanded ? " Show Less" : " Read More"}
          </button>
        </>
      );
    }

    return (
      <span
        className="message-content-text"
        data-original={message.content}
      >
        {message.content}
      </span>
    );
  };

  useEffect(() => {
    setMessages((prevMessages) =>
      prevMessages.map((message) => ({
        ...message,
        isExpanded: expandedMessages.has(message.id),
      }))
    );
  }, [expandedMessages]);

  const toggleMessageSelection = (msg: any) => {
    setSelectedMessages((prev) =>
      prev.includes(msg.id)
        ? prev.filter((id) => id !== msg.id)
        : [...prev, msg.id]
    );
  };

  const deleteMessagess = async () => {
    closeDeleteModal();

    if (!selectedMessages || selectedMessages.length === 0) {
      console.error("No messages selected for deletion");
      return;
    }

    const messageIds = selectedMessages;
    deleteMessages(messageIds, String(userId));

    setMessages((prevMessages) => {
      const updatedMessages = prevMessages.filter((msg) => !messageIds.includes(msg.id));

      const lastValidMessage = [...updatedMessages]
        .reverse()
        .find((msg) => {
          const isMe = msg.sender?.id === userId;
          return !((isMe && msg.senderDFM) || (!isMe && msg.receiverDFM) || msg.delForAll || (!isMe && msg.wasSentWhileCurrentlyBlocked));
        });

      socket.emit("lastValidMessageForMe", {
        userId,
        otherUserId,
        message: lastValidMessage,
      });

      return updatedMessages;
    });
  };

  const handleDeleteForEveryone = async () => {
    const messageIds = selectedMessages;

    const unreadCount = messages.filter(
      (msg) => messageIds.includes(msg.id) && msg.status.toLowerCase() !== 'read'
    ).length;

    await deleteMessagesForEveryone(messageIds, String(userId));

    // await new Promise((resolve) => setTimeout(resolve, 1000));
    setMessages((prevMessages) =>
      prevMessages.filter((msg) => !messageIds.includes(msg.id))
    );

    try {
      const { data } = await fetchLastValidMessages({
        variables: { userId, otherUserId },
        fetchPolicy: 'network-only', // Force fresh data
      });

      const { senderLastMessage, receiverLastMessage } = data?.getLastValidMessages || {};
      socket.emit('lastValidMessages', {
        userId,
        otherUserId,
        senderMessage: senderLastMessage,
        receiverMessage: receiverLastMessage,
        unreadCount,
      });

    } catch (error) {
      console.error('Error fetching last valid messages:', error);
    }

    socket.emit('deleteForEveryone', { userId, otherUserId, messageIds });

    closeDeleteModal();
  };

  const handleEditMessage = async () => {
    if (!currentSelectedMessage || !editMessage) {
      console.error("Message or new content is missing");
      return;
    }

    socket.emit('editMessage', {
      messageId: currentSelectedMessage.id,
      newContent: editMessage,
      userId: userId,
    });

    const { data } = await fetchLastValidMessages({
      variables: { userId, otherUserId },
      fetchPolicy: 'network-only', // Ensure fresh data
    });

    let { senderLastMessage, receiverLastMessage } = data?.getLastValidMessages || {};

    if (senderLastMessage?.id === currentSelectedMessage.id) {
      senderLastMessage = { ...senderLastMessage, content: editMessage };
    }
    if (receiverLastMessage?.id === currentSelectedMessage.id) {
      receiverLastMessage = { ...receiverLastMessage, content: editMessage };
    }

    socket.emit('LastMessageAfterEdit', {
      userId,
      otherUserId,
      senderMessage: senderLastMessage,
      receiverMessage: receiverLastMessage,
    });

    setMessages((prevMessages) =>
      prevMessages.map((msg) =>
        msg.id === currentSelectedMessage.id ? { ...msg, content: editMessage } : msg
      )
    );

    setSelectedMessages([]);
    setIsEditing(false);
    setEditMessage(undefined);
  };

  const handleBlockOtherUser = async (action: 'block' | 'unblock') => {
    socket.emit('joinRoom', { userId, otherUserId });

    if (action === 'block') {
      const updatedMessages = messages.map((msg) => {
        if (
          msg.status.toLowerCase() === 'delivered' &&
          !msg.deliveredThenBlocked
        ) {
          return { ...msg, deliveredThenBlocked: true };
        }
        return msg;
      });

      setMessages(updatedMessages);

      const deliveredThenBlockedMessages = updatedMessages.filter(
        (msg) => msg.deliveredThenBlocked
      );

      if (deliveredThenBlockedMessages.length > 0) {
        socket.emit('markMessagesDeliveredThenBlocked', {
          userId,
          otherUserId,
          messageIds: deliveredThenBlockedMessages.map((msg) => msg.id),
        });
      }
    }

    socket.emit('sendBlockEvent', {
      userId,
      otherUserId,
      action,
      isOtherUserBlocked: action === 'block',
      isUserBlocked,
    });
  };

  useEffect(() => {
    socket.on('messagesMarkedDeliveredThenBlocked', ({ messageIds }) => {
      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          messageIds.includes(msg.id)
            ? { ...msg, deliveredThenBlocked: true }
            : msg
        )
      );
    });

    socket.on('messagesStarred', ({ messageIds, userId: uId, action }) => {
      setMessages(prevMessages =>
        prevMessages.map(msg => {
          if (!messageIds.includes(msg.id)) return msg;

          const isSender = msg.sender.id === uId;

          return {
            ...msg,
            isStarredByCurrentUser: isSender
              ? action === 'star'
              : msg.isStarredByCurrentUser,
            isStarredByOtherUser: !isSender
              ? action === 'star'
              : msg.isStarredByOtherUser,
          };
        })
      );
    });

    return () => {
      socket.off('messagesMarkedDeliveredThenBlocked');
      socket.off('messagesStarred');
    };
  }, [userId]);

  const isWithinTimeLimit = (timestamp: string | number | Date) => {
    const fifteenMinutes = 15 * 60 * 1000;
    const now = new Date().getTime();
    return now - new Date(timestamp).getTime() <= fifteenMinutes;
  };

  const canDeleteForEveryone = selectedMessages.every((msgId) => {
    const message = messages.find((msg) => msg.id === msgId);
    return (
      message &&
      message.sender.id === userId &&
      isWithinTimeLimit(message.timestamp)
    );
  });

  const handleDelete = () => {
    setShowDeleteModal(true);
  };

  const handleForward = () => {
    setShowForwardModal(true);
  };

  const starMessages = (action: 'star' | 'unstar') => {
    if (!selectedMessages || selectedMessages.length === 0) return;

    const messageIds = selectedMessages;

    socket.emit('starMessages', {
      userId,
      otherUserId,
      messageIds,
      action,
    });

    setMessages(prevMessages =>
      prevMessages.map(msg => {
        if (!messageIds.includes(msg.id)) return msg;

        const isSender = msg.sender.id === userId;

        return {
          ...msg,
          isStarredByCurrentUser: isSender
            ? action === 'star'
            : msg.isStarredByCurrentUser,
          isStarredByOtherUser: !isSender
            ? action === 'star'
            : msg.isStarredByOtherUser,
        };
      })
    );

    setSelectedMessages([]);
    setCurrentSelectedMessage([]);
  };

  const copyMessage = () => {
    if (!selectedMessages || selectedMessages.length === 0 || currentSelectedMessages.length === 0) return;

    if (currentSelectedMessages.length === 1) {
      const singleMessage = currentSelectedMessages[0];
      navigator.clipboard.writeText(singleMessage.content)
        .then(() => antdMessage.success('Message was copied successfully'));
    } else {
      const formattedMessages = [...currentSelectedMessages]
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
        .map(msg => {
          const senderName = msg.sender.id === userId
            ? userData?.getUserById?.username
            : chatSettings?.customUsername || otherUserData?.getOtherUserById?.username;

          const formattedTimestamp = dayjs(msg.timestamp).format('M/D/YYYY h:mm A');

          return `[${formattedTimestamp}] ${senderName}: ${msg.content}`;
        })
        .join('\n');

      navigator.clipboard.writeText(formattedMessages)
        .then(() => antdMessage.success('Messages were copied successfully'));
    }

    setSelectedMessages([]);
    setCurrentSelectedMessage([]);
    setShowCard(false);
  };

  const handleSearch = (searchText: string) => {
    if (searchText === '') {
      return ([]);
    }
    const results = messages.filter((msg) => {
      const isMe = msg.sender?.id === userId;
      setSearchTerm(searchText);

      const shouldExclude =
        (isMe && msg.senderDFM) ||
        (!isMe && msg.receiverDFM) ||
        msg.delForAll ||
        (!isMe && msg.wasSentWhileCurrentlyBlocked) ||
        msg.content.startsWith(CHAT_UPLOAD_PREFIX) ||
        msg.content.startsWith(CHAT_UPLOAD_FILE_PREFIX) ||
        msg.content.startsWith(CHAT_UPLOAD_AUDIO_PREFIX);

      if (shouldExclude) return false;

      return msg.content?.toLowerCase().includes(searchText.toLowerCase());
    });

    setSearchResults(results);
    return results;
  };

  const scrollToMessage = useCallback(
    (id: string | number) => {
      const el = document.getElementById(`message-${id}`);
      if (!el) return;

      const images = Array.from(el.querySelectorAll("img")) as HTMLImageElement[];
      const audios = Array.from(el.querySelectorAll("audio")) as HTMLAudioElement[];
      const videos = Array.from(el.querySelectorAll("video")) as HTMLVideoElement[];

      const mediaReadyPromises = [
        ...images.map(
          (img) =>
            new Promise<void>((resolve) => {
              if (img.complete) resolve();
              else {
                img.onload = () => resolve();
                img.onerror = () => resolve();
              }
            })
        ),
        ...audios.map(
          (audio) =>
            new Promise<void>((resolve) => {
              if (audio.readyState >= 2) resolve();
              else {
                audio.onloadeddata = () => resolve();
                audio.onerror = () => resolve();
              }
            })
        ),
        ...videos.map(
          (video) =>
            new Promise<void>((resolve) => {
              if (video.readyState >= 2) resolve();
              else {
                video.onloadeddata = () => resolve();
                video.onerror = () => resolve();
              }
            })
        ),
      ];

      Promise.all(mediaReadyPromises).then(() => {
        el.scrollIntoView({ behavior: "auto", block: "center" });

        // el.classList.add("bg-[#e1f3fb]");
        el.classList.add("animate-arrival", "bg-[#e1f3fb]");
        setTimeout(() => el.classList.remove("animate-arrival", "bg-[#e1f3fb]"), 2000);

        const contentSpan = el.querySelector(".message-content-text");
        if (contentSpan && searchTerm) {
          const originalText = contentSpan.getAttribute("data-original") || "";
          const regex = new RegExp(`(${searchTerm})`, "gi");

          const highlighted = originalText.replace(
            regex,
            "<mark class='bg-yellow-500 rounded'>$1</mark>"
          );
          contentSpan.innerHTML = highlighted;

          setTimeout(() => {
            contentSpan.innerHTML = originalText;
          }, 2500);
        }
      });
    },
    [searchTerm]
  );

  useEffect(() => {
    const messageId = location.state?.scrollToMessageId;
    if (messageId) {
      setTimeout(() => scrollToMessage(messageId), 500);
    }
  }, [location.state, scrollToMessage]);

  const scrollToMessageAsReply = (id: string | number) => {
    const el = document.getElementById(`message-${id}`);
    if (el) {
      el.scrollIntoView({ behavior: "auto", block: "center" });

      el.classList.add("bg-[#e1f3fb]");
      setTimeout(() => el.classList.remove("bg-[#e1f3fb]"), 1500);
    }
  };


  const handleSendForwardedMessage = (selectedUsers: string[]) => {
    if (!currentSelectedMessage && currentSelectedMessages.length === 0) return;

    selectedUsers.forEach(uid => {
      socket.emit('joinRoom', { userId: userId, otherUserId: uid });

      currentSelectedMessages.forEach(msgToForward => {
        const message = {
          sender: { id: userId },
          receiver: { id: uid },
          content: msgToForward.content,
          fileOriginalName: msgToForward.fileOriginalName || null,
          caption: msgToForward.caption || null,
          repliedTo: null,
          timestamp: new Date().toISOString(),
          status: 'SENT',
          senderDFM: false,
          receiverDFM: false,
          delForAll: false,
          wasForwarded: true,
        };
        socket.emit('sendMessage', message);
      });
    });

    setSelectedMessages([]);
    setCurrentSelectedMessages([]);
    setShowForwardModal(false);

    // Navigate to the chat with the first user in the list
    if (selectedUsers.length > 0) {
      // navigate(`/chat/${selectedUsers[0]}`);
      if (onSelectUser) {
        onSelectUser(String(selectedUsers[0]));
      }
    }

    // Scroll to the bottom after a short delay
    setTimeout(() => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }, 500);
  };

  const handleArrowBack = () => {
    setSelectedMessages([]);
    setShowCard(false);
  };

  const messageEdit = () => {
    setShowCard(false);
    setIsEditing(true);
  };

  const messageReply = () => {
    if (currentSelectedMessage) {
      const replyData = {
        id: currentSelectedMessage.id,
        senderId: currentSelectedMessage.sender.id,
        content: currentSelectedMessage.content,
        fileOriginalName: currentSelectedMessage.fileOriginalName,
      };

      localStorage.setItem(
        `replyMessage_${userId}_${otherUserId}`,
        JSON.stringify(replyData)
      );
    }

    setShowCard(false);
    setShowReplyCard(true);

    setSelectedMessages((prevSelected) =>
      prevSelected.filter((id) => id !== currentSelectedMessage?.id)
    );
  };

  const viewMessageInfo = () => {
    setShowCard(false);
    setShowInfoCard(true);
  };


  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setSelectedMessages([]);
  };

  const closeInfoCard = () => {
    setShowInfoCard(false);
    setSelectedMessages([]);
  };

  const closeImagePreviewModal = () => {
    setShowPreviewModal(false);
    setSelectedImages([]);
    setCaptions([]);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const fileArray = Array.from(files);
      setSelectedImages((prev) => [...prev, ...fileArray]);
      setShowPreviewModal(true);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setShowFilePreviewModal(true);
    }
  };

  const handleAudioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setSelectedAudio(e.target.files[0]);
      setShowAudioPreviewModal(true);
    }
  };

  const triggerAudioUpload = () => {
    audioInputRef.current?.click();
    setIsModalVisible(false);
  };

  const closeFilePreviewModal = () => {
    setShowFilePreviewModal(false);
    setSelectedFile(null);
    setFileCaption("");
  };

  const closeAudioPreviewModal = () => {
    setShowAudioPreviewModal(false);
    setSelectedAudio(null);
  };

  const triggerGalleryUpload = () => {
    fileInputRef.current?.click();
    setIsModalVisible(false);
  };

  const triggerFileUpload = () => {
    actualFileInputRef.current?.click();
    setIsModalVisible(false);
  };

  const triggerCamera = () => { //CURRENTLY NOT USED
    if (cameraInputRef.current) {
      cameraInputRef.current.click();
    }
    setIsModalVisible(false);
  };


  const groupMessagesByTimestamp = (messages: any[]) => {
    return messages.reduce((acc: any, message: any) => {
      const timestamp = new Date(message.timestamp).getTime();
      const roundedTimestamp = Math.floor(timestamp / 2000) * 2000;
      const groupKey = new Date(roundedTimestamp).toISOString();

      if (!acc[groupKey]) {
        acc[groupKey] = [];
      }
      acc[groupKey].push(message);
      return acc;
    }, {});
  };

  // Filter image messages
  const filterImageMessages = (messages: any[]) => {
    return messages.filter((msg) => msg.content?.startsWith(CHAT_UPLOAD_PREFIX));
  };

  const groupedMessages = groupMessagesByTimestamp(messages);

  const SingleTick = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );

  const DoubleTick = ({ className = "" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polyline points="20 6 9 17 4 12" />
      <polyline points="26 6 15 17 20 12" />
    </svg>
  );

  const isLoadingBlockedStatus =
    isOtherUserBlocked === null || isUserBlocked === null;

  if (
    isLoadingBlockedStatus ||
    loading ||
    chatLoading ||
    otherUserLoading ||
    userLoading ||
    loadingMsgAll ||
    otherUserChatLoading
  ) {
    return <Spin size="large" className="flex justify-center items-center h-screen" />;
  }
  // if (error) return <p>Error: {error.message}</p>;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <InfoCard
        showInfoCard={showInfoCard}
        closeInfoCard={closeInfoCard}
        currentSelectedMessage={currentSelectedMessage}
        messagesAll={messagesAll}
        userId={userId}
        chatSettings={chatSettings}
        otherUserData={otherUserData}
        formatTimestamp={formatTimestamp}
        formatTimestampV2={formatTimestampV2}
      />

      <HeaderWithInlineCard
        otherUserData={otherUserData}
        userId={userId}
        otherUserId={otherUserId ?? null}
        handleBlockOtherUser={handleBlockOtherUser}
        isOtherUserBlocked={isOtherUserBlocked}
        isUserBlocked={isUserBlocked}
        handleSearch={handleSearch}
        searchResults={searchResults}
        scrollToMessage={scrollToMessage}
      />
      <ForwardModal
        showModal={showForwardModal}
        setShowModal={setShowForwardModal}
        data={usersForForward?.getUsersToForwardTo || []}
        userId={userId!}
        onSendForwardedMessage={handleSendForwardedMessage}
      />

      {showCard && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div ref={cardRef} className="absolute top-44 right-4 bg-white shadow-md rounded-lg p-4 z-20 w-48">
            <ul className="space-y-8">
              {selectedMessages.length === 1 && (() => {
                const firstSelectedMessage = messages.find(
                  (msg) =>
                    msg.id === selectedMessages[0] &&
                    !currentSelectedMessage.content.startsWith(CHAT_UPLOAD_PREFIX) &&
                    !currentSelectedMessage.content.startsWith(CHAT_UPLOAD_FILE_PREFIX) &&
                    !currentSelectedMessage.content.startsWith(CHAT_UPLOAD_AUDIO_PREFIX) &&
                    !currentSelectedMessage.wasForwarded
                );
                return firstSelectedMessage && isWithinTimeLimit(firstSelectedMessage.timestamp);
              })() && (
                  <li>
                    <button
                      className="cursor-pointer hover:text-blue-500 disabled:text-gray-400 disabled:cursor-not-allowed"
                      onClick={messageEdit}
                      disabled={isOtherUserBlocked === true || isUserBlocked === true}
                    >
                      Edit
                    </button>
                  </li>
                )}

              {selectedMessages.length === 1 && messages.find(msg => msg.id === selectedMessages[0]) && (
                <li>
                  <button className="cursor-pointer hover:text-blue-500 disabled:text-gray-400 disabled:cursor-not-allowed" onClick={messageReply} disabled={isOtherUserBlocked === true || isUserBlocked === true}>
                    Reply
                  </button>
                </li>
              )}

              {selectedMessages.length === 1 && messages.find(msg => msg.id === selectedMessages[0] && msg.sender.id === userId) && (
                <li className="cursor-pointer hover:text-blue-500" onClick={viewMessageInfo}>
                  Info
                </li>
              )}

              {!currentSelectedMessages.some(
                msg =>
                  msg.content.startsWith(CHAT_UPLOAD_PREFIX) ||
                  msg.content.startsWith(CHAT_UPLOAD_FILE_PREFIX) ||
                  msg.content.startsWith(CHAT_UPLOAD_AUDIO_PREFIX)
              ) && (
                  <li className="cursor-pointer hover:text-blue-500" onClick={copyMessage}>Copy</li>
                )}

              {selectedMessages.length === 1 && (
                <li className="cursor-pointer hover:text-blue-500">Pin</li>
              )}

              {/* Fallback message if no conditions are met */}
              {(selectedMessages.length !== 1 ||
                !(
                  (messages.find(msg => msg.id === selectedMessages[0] && !currentSelectedMessage.content.startsWith(CHAT_UPLOAD_PREFIX) && !currentSelectedMessage.wasForwarded) && (currentSelectedMessage && isWithinTimeLimit(currentSelectedMessage.timestamp))) ||
                  messages.find(msg => msg.id === selectedMessages[0]) ||
                  messages.find(msg => msg.id === selectedMessages[0] && msg.sender.id === userId) ||
                  !currentSelectedMessages.some(msg => msg.content.startsWith(CHAT_UPLOAD_PREFIX)) ||
                  !currentSelectedMessages.some(msg => msg.content.startsWith(CHAT_UPLOAD_FILE_PREFIX)) ||
                  !currentSelectedMessages.some(msg => msg.content.startsWith(CHAT_UPLOAD_AUDIO_PREFIX)) ||
                  selectedMessages.length === 1
                )) && (
                  <li className="text-gray-500">No other actions available for the selected message(s)</li>
                )}
            </ul>
          </div>
        </div>
      )}

      <EditMessageModal
        isEditing={isEditing}
        currentSelectedMessage={currentSelectedMessage}
        editMessage={editMessage}
        setEditMessage={setEditMessage}
        setSelectedMessages={setSelectedMessages}
        setIsEditing={setIsEditing}
        handleEditMessage={handleEditMessage}
      />

      <SelectedMessagesBar
        count={selectedMessages.length}
        onBack={handleArrowBack}
        onDelete={handleDelete}
        onForward={handleForward}
        onMore={toggleCard}
        starMessages={starMessages}
        currentSelectedMessages={currentSelectedMessages}
        userId={userId ?? null}
      />

      <div className="flex flex-col h-screen pt-12 z-0">
        <div className="flex-1 p-4 overflow-hidden"
          style={{
            backgroundImage: `url(${backgroundImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column'
          }}>
          <div
            className="overflow-y-auto scrollbar-hide h-[80%] pr-2"
            onScroll={handleScroll}
          >
            <div className="space-y-8 pb-32 pt-8">
              <div>
                {Object.keys(groupedMessages).map((timestamp, index) => (
                  <div key={index}>
                    {/* Render non-image messages */}
                    {groupedMessages[timestamp]
                      .filter((msg: any) => {
                        const isMe = msg.sender?.id === userId;
                        return (
                          !msg.content.startsWith(CHAT_UPLOAD_PREFIX) &&
                          !msg.content.startsWith(CHAT_UPLOAD_FILE_PREFIX) &&
                          !msg.content.startsWith(CHAT_UPLOAD_AUDIO_PREFIX) &&
                          !((isMe && msg.senderDFM) || (!isMe && msg.receiverDFM) || msg.delForAll) &&
                          !((msg.wasSentWhileCurrentlyBlocked === true) && msg.sender.id !== userId)
                        );
                      })
                      .map((msg: any) => {
                        const isMe = msg.sender?.id === userId;
                        const isSelected = selectedMessages.includes(msg.id);
                        return (
                          <div
                            id={`message-${msg.id}`}
                            key={msg.id}
                            className={`flex ${isMe ? 'justify-end' : 'justify-start'} group relative py-2`}
                          >
                            {isSelected && (
                              <div
                                className="absolute inset-0 bg-black bg-opacity-20 rounded-lg pointer-events-auto"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleMessageSelection(msg);
                                }}
                              ></div>
                            )}

                            <div
                              className={`relative max-w-xs p-4 rounded-lg shadow-lg transition-all ease-in-out transform ${isMe
                                ? 'bg-gradient-to-r from-blue-500 to-blue-700 text-white'
                                : 'bg-gradient-to-r from-gray-200 to-gray-400 text-black'
                                } break-words hover:scale-105 hover:shadow-xl`}
                              style={{
                                wordBreak: 'break-word',
                                borderRadius: isMe ? '16px 0 16px 16px' : '16px',
                                boxShadow: isMe ? '0 4px 8px rgba(0, 0, 0, 0.1)' : '0 4px 8px rgba(0, 0, 0, 0.15)',
                                border: isMe ? 'none' : '1px solid rgba(0, 0, 0, 0.1)',
                                background: isMe
                                  ? 'linear-gradient(135deg, rgba(29, 78, 216, 1) 0%, rgba(56, 189, 248, 1) 100%)'
                                  : 'linear-gradient(135deg, rgba(156, 163, 175, 1) 0%, rgba(107, 114, 128, 1) 100%)',
                                padding: '12px 6px',
                                transition: 'all 0.3s ease',
                              }}
                            >
                              {msg.repliedTo && msg.repliedTo.content && (
                                <div
                                  className={`p-1 mb-2 border-l-4 rounded-md text-sm w-full ${isMe ? "bg-blue-600/50 text-white" : "bg-gray-500 text-black cursor-pointer"
                                    }`} onClick={() => scrollToMessageAsReply(msg.repliedTo?.id)}
                                >
                                  <span className="block font-semibold opacity-80 mb-2">
                                    {messagesAll.find((m) => m.id === msg.repliedTo.id)?.sender?.id === userId
                                      ? "You"
                                      : chatSettings?.customUsername || otherUserData?.getOtherUserById?.username}
                                  </span>
                                  {msg.repliedTo.content.startsWith(CHAT_UPLOAD_PREFIX) ? (
                                    <img
                                      src={`http://localhost:5002${msg.repliedTo.content}`}
                                      alt="Reply preview"
                                      className="w-20 h-20 object-cover object-top rounded-lg border border-gray-300 shadow-md transition-transform hover:scale-105"
                                    />
                                  ) : msg.repliedTo.content.startsWith(CHAT_UPLOAD_FILE_PREFIX) ? (
                                    <div className="flex items-center gap-3 overflow-hidden">
                                      <FontAwesomeIcon icon={faFileAlt} className="text-white text-xl" />
                                      <span
                                        onClick={() => window.open(`http://localhost:5002${msg.repliedTo.content}`, "_blank")}
                                        className="text-sm text-white truncate max-w-xs focus:outline-none bg-transparent border-none p-0 text-left cursor-pointer"
                                      >
                                        {msg.repliedTo.fileOriginalName || "View File"}
                                      </span>
                                    </div>
                                  ) : msg.repliedTo.content.startsWith(CHAT_UPLOAD_AUDIO_PREFIX) ? (
                                    <div className="flex items-center gap-3 overflow-hidden">
                                      <FontAwesomeIcon icon={faHeadphones} className="text-white text-xl" />
                                      <span className="text-sm text-white">Audio - {msg.repliedTo.fileOriginalName}</span>
                                    </div>
                                  ) : (
                                    msg.repliedTo.content.length > 30
                                      ? msg.repliedTo.content.slice(0, 30) + "..."
                                      : msg.repliedTo.content
                                  )}
                                </div>
                              )}

                              {msg.wasForwarded && (
                                <div className="flex items-center text-xs italic text-gray-700 mb-2">
                                  <FontAwesomeIcon icon={faShare} className="mr-1" />
                                  Forwarded
                                </div>
                              )}

                              {renderMessageContent(msg)}

                              <small
                                className={`block text-xs mt-1 text-right ${isMe ? 'text-white' : 'text-black'
                                  }`}
                              >
                                {new Date(msg.timestamp).toLocaleString('en-GB', {
                                  hour12: false,
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                })}
                              </small>

                              <div
                                className={`absolute top-2 ${isMe ? '-left-7' : '-right-7'} transition-opacity ${isSelected ? "opacity-100" : "opacity-0"} group-hover:opacity-100`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleMessageSelection(msg);
                                }}
                                style={{
                                  cursor: "pointer",
                                  color: "#007BFF",
                                  borderRadius: "50%",
                                  width: "24px",
                                  height: "24px",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                }}
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="16"
                                  height="16"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <circle cx="12" cy="12" r="10"></circle>
                                  <line x1="8" y1="12" x2="16" y2="12"></line>
                                </svg>
                              </div>

                              {isMe && (
                                <div className='flex mt-2 justify-between w-full'>
                                  <div>
                                    {msg.isStarredByCurrentUser && (
                                      <span
                                        className="mt-3 text-black font-semibold transition-transform duration-200 ease-in-out
                                                 hover:scale-110 focus:scale-110
                                                 text-[10px] sm:text-[12px] md:text-[14px]"
                                      >
                                        <StarFilled />
                                      </span>
                                    )}
                                  </div>

                                  <div>
                                    {msg.status.toLowerCase() === 'sent' && (
                                      <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="16"
                                        height="16"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        className="tick-icon"
                                      >
                                        <polyline points="20 6 9 17 4 12" />
                                      </svg>
                                    )}
                                    {msg.status.toLowerCase() === 'delivered' && (
                                      <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="24"
                                        height="16"
                                        viewBox="0 0 32 16"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        className="tick-icon"
                                      >
                                        <polyline points="20 6 9 17 4 12" />
                                        <polyline points="26 6 15 17 20 12" />
                                      </svg>
                                    )}
                                    {msg.status.toLowerCase() === 'read' && (
                                      (otherUserData?.getOtherUserById?.readReceipts && userData?.getUserById?.readReceipts)
                                        ? (
                                          <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            width="24"
                                            height="16"
                                            viewBox="0 0 32 16"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            className="tick-icon text-blue-900"
                                          >
                                            <polyline points="20 6 9 17 4 12" />
                                            <polyline points="26 6 15 17 20 12" />
                                          </svg>
                                        ) : (
                                          <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            width="24"
                                            height="16"
                                            viewBox="0 0 32 16"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            className="tick-icon"
                                          >
                                            <polyline points="20 6 9 17 4 12" />
                                            <polyline points="26 6 15 17 20 12" />
                                          </svg>
                                        )
                                    )}
                                  </div>
                                </div>

                              )}

                              {!isMe && (
                                <div>
                                  {msg.isStarredByOtherUser && (
                                    <span
                                      className="mt-3 text-black font-semibold transition-transform duration-200 ease-in-out
                                             hover:scale-110 focus:scale-110
                                             text-[10px] sm:text-[12px] md:text-[14px]"
                                    >
                                      <StarFilled />
                                    </span>
                                  )}
                                </div>
                              )}

                              {isMe && <div className="chat-pointer"></div>}
                            </div>
                          </div>
                        );
                      })}

                    {/* Grouped image messages */}
                    {groupedMessages[timestamp]
                      ?.filter((msg: any) =>
                        msg.sender?.id === userId &&
                        msg.content?.startsWith(CHAT_UPLOAD_PREFIX) &&
                        msg.content &&
                        !((msg.wasSentWhileCurrentlyBlocked === true) && msg.sender.id !== userId) &&
                        !((msg.sender?.id === userId && msg.senderDFM) ||
                          (msg.sender?.id !== userId && msg.receiverDFM) ||
                          msg.delForAll)
                      ).length > 0 && (

                        <div className="space-y-2 mt-2">
                          {/* My images */}
                          <div className="w-full flex justify-end">
                            <div
                              className={`border-2 border-blue-300 p-2 rounded-lg ${filterImageMessages(groupedMessages[timestamp]).length > 1 ? "max-w-full" : "inline-block"}`}
                            >
                              {filterImageMessages(groupedMessages[timestamp]).length > 0 && (
                                <div className="mt-1 text-left w-full block">
                                  {groupedMessages[timestamp][0].wasForwarded && (
                                    <div className="flex items-center text-xs italic text-gray-700 mb-2">
                                      <FontAwesomeIcon icon={faShare} className="mr-1" />
                                      Forwarded
                                    </div>
                                  )}
                                  {groupedMessages[timestamp][0].repliedTo && groupedMessages[timestamp][0].repliedTo.content && (
                                    <div className="p-1 mb-2 border-l-4 border-blue-400 rounded-lg border-dotted shadow-md text-sm" onClick={() => scrollToMessageAsReply(groupedMessages[timestamp][0].repliedTo?.id)}>
                                      <span className="block font-semibold text-blue-800 opacity-90 mb-2">
                                        {messagesAll.find((m) => m.id === groupedMessages[timestamp][0].repliedTo.id)?.sender?.id === userId
                                          ? "You"
                                          : chatSettings?.customUsername || otherUserData?.getOtherUserById?.username}
                                      </span>
                                      {groupedMessages[timestamp][0].repliedTo.content.startsWith(CHAT_UPLOAD_PREFIX) ? (
                                        <img
                                          src={`http://localhost:5002${groupedMessages[timestamp][0].repliedTo.content}`}
                                          alt="Reply preview"
                                          className="w-20 h-20 object-cover object-top rounded-lg border border-gray-300 shadow-md hover:scale-105 transition-transform"
                                          onClick={() => openImage(`http://localhost:5002${groupedMessages[timestamp][0].repliedTo.content}`)}
                                        />
                                      ) : groupedMessages[timestamp][0].repliedTo.content.startsWith(CHAT_UPLOAD_FILE_PREFIX) ? (
                                        <div className="flex items-center gap-3 overflow-hidden">
                                          <FontAwesomeIcon icon={faFileAlt} className="text-blue-600 text-xl" />
                                          <span
                                            onClick={() => window.open(`http://localhost:5002${groupedMessages[timestamp][0].repliedTo.content}`, "_blank")}
                                            className="text-sm text-gray-700 truncate max-w-xs focus:outline-none bg-transparent border-none p-0 text-left hover:bg-gray-100"
                                          >
                                            {groupedMessages[timestamp][0].repliedTo.fileOriginalName || "View File"}
                                          </span>
                                        </div>

                                      ) : groupedMessages[timestamp][0].repliedTo.content.startsWith(CHAT_UPLOAD_AUDIO_PREFIX) ? (
                                        <div className="flex items-center gap-3 overflow-hidden">
                                          <FontAwesomeIcon icon={faHeadphones} className="text-blue-600 text-xl" />
                                          <span className="text-sm text-white">Audio - {groupedMessages[timestamp][0].repliedTo.fileOriginalName}</span>
                                        </div>
                                      ) : (
                                        <p className="text-gray-600">
                                          {groupedMessages[timestamp][0].repliedTo.content.length > 20
                                            ? groupedMessages[timestamp][0].repliedTo.content.slice(0, 20) + "..."
                                            : groupedMessages[timestamp][0].repliedTo.content}
                                        </p>
                                      )}
                                    </div>
                                  )}
                                </div>
                              )}
                              <div
                                className={`${filterImageMessages(groupedMessages[timestamp]).length > 1 ? "grid grid-cols-2 gap-2" : ""}`}
                              >
                                {(() => {
                                  const allImages = filterImageMessages(groupedMessages[timestamp]).filter((msg: any) => msg.sender?.id === userId);
                                  const firstFour = allImages.slice(0, 4);
                                  const remainingCount = allImages.length - 4;

                                  return (
                                    <>
                                      {firstFour.map((msg: any, index: number) => {
                                        const isSelected = selectedMessages.includes(msg.id);
                                        const isGroup = allImages.length > 1;
                                        const isLastVisible = index === 3 && allImages.length > 4;

                                        return (
                                          <div id={`message-${msg.id}`} key={msg.id} className="relative group">

                                            <div className="relative w-32 h-32">
                                              <img
                                                src={`http://localhost:5002${msg.content}`}
                                                alt=""
                                                className="w-full h-full object-cover object-top rounded-lg border shadow-md"
                                                onClick={() => openImage(`http://localhost:5002${msg.content}`)}
                                              />

                                              {msg.isStarredByCurrentUser && (
                                                <span
                                                  className="absolute bottom-1 left-1 text-black font-semibold transition-transform duration-200 ease-in-out
                 hover:scale-110 focus:scale-110
                 text-[10px] sm:text-[12px] md:text-[14px] bg-white bg-opacity-70 p-1 rounded-full"
                                                >
                                                  <StarFilled />
                                                </span>
                                              )}
                                            </div>

                                            {isSelected && (
                                              <div
                                                className="absolute inset-0 bg-black bg-opacity-20 rounded-lg pointer-events-auto"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  toggleMessageSelection(msg);
                                                }}
                                              ></div>
                                            )}

                                            {/* Plus icon */}
                                            <div
                                              className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-[42%] transition-opacity ${isSelected ? "opacity-100" : "opacity-0"} group-hover:opacity-100`}
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                toggleMessageSelection(msg);
                                              }}
                                              style={{
                                                cursor: "pointer",
                                                color: "#007BFF",
                                                borderRadius: "50%",
                                                width: "24px",
                                                height: "24px",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                              }}
                                            >
                                              <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                width="16"
                                                height="16"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                              >
                                                <circle cx="12" cy="12" r="10"></circle>
                                                <line x1="8" y1="12" x2="16" y2="12"></line>
                                              </svg>
                                            </div>

                                            {/* "+X more" overlay ON 4th image */}
                                            {isLastVisible && (
                                              <div
                                                className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center rounded-lg text-white font-semibold text-sm cursor-pointer"
                                                onClick={() => {
                                                  setActiveImageGroup(allImages);
                                                  setShowAllImagesModal(true);
                                                }}
                                              >
                                                +{remainingCount}
                                              </div>
                                            )}

                                            {/* Solo timestamp + status */}
                                            {!isGroup && (
                                              <div className="mt-1 text-right">
                                                <small className="block text-xs text-zinc-950">
                                                  {new Date(msg.timestamp).toLocaleString("en-GB", {
                                                    hour12: false,
                                                    hour: "2-digit",
                                                    minute: "2-digit",
                                                    day: "2-digit",
                                                    month: "2-digit",
                                                    year: "numeric",
                                                  })}
                                                </small>

                                                {msg.sender?.id === userId && (
                                                  <div className="flex justify-end mt-1">
                                                    {msg.status.toLowerCase() === "sent" && <SingleTick />}
                                                    {msg.status.toLowerCase() === "delivered" && <DoubleTick />}
                                                    {msg.status.toLowerCase() === "read" &&
                                                      (
                                                        (otherUserData?.getOtherUserById?.readReceipts && userData?.getUserById?.readReceipts)
                                                          ? <DoubleTick className="text-blue-900" />
                                                          : <DoubleTick />
                                                      )
                                                    }
                                                  </div>
                                                )}
                                              </div>
                                            )}
                                          </div>
                                        );
                                      })}
                                    </>
                                  );
                                })()}
                              </div>

                              {/* Grouped status + timestamp */}
                              {filterImageMessages(groupedMessages[timestamp]).length > 1 && (
                                <div className="mt-2 text-right">
                                  <small className="block text-xs text-zinc-950">
                                    {new Date(timestamp).toLocaleString("en-GB", {
                                      hour12: false,
                                      hour: "2-digit",
                                      minute: "2-digit",
                                      day: "2-digit",
                                      month: "2-digit",
                                      year: "numeric",
                                    })}
                                  </small>
                                  <div className="flex justify-end mt-1">
                                    {groupedMessages[timestamp][0].status.toLowerCase() === "sent" && <SingleTick />}
                                    {groupedMessages[timestamp][0].status.toLowerCase() === "delivered" && <DoubleTick />}
                                    {groupedMessages[timestamp][0].status.toLowerCase() === "read" && (
                                      (otherUserData?.getOtherUserById?.readReceipts && userData?.getUserById?.readReceipts)
                                        ? <DoubleTick className="text-blue-900" />
                                        : <DoubleTick />
                                    )}

                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                    {showAllImagesModal && (
                      <div className="fixed inset-0 z-50 bg-black bg-opacity-60 flex items-center justify-center p-4">
                        <div className="bg-white rounded-lg p-4 max-h-[90vh] overflow-y-auto max-w-[90vw]">
                          <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-semibold">Group Set Images</h2>
                            <button
                              className="text-red-600 text-sm"
                              onClick={() => setShowAllImagesModal(false)}
                            >
                              Close
                            </button>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {activeImageGroup.map((msg: any) => {
                              const isSelected = selectedMessages.includes(msg.id);
                              return (
                                <div key={msg.id} className="relative group">
                                  <img
                                    src={`http://localhost:5002${msg.content}`}
                                    alt=""
                                    className="w-32 h-32 object-cover object-top rounded-lg border shadow-md"
                                    onClick={() =>
                                      openImage(`http://localhost:5002${msg.content}`)
                                    }
                                  />
                                  {isSelected && (
                                    <div
                                      className="absolute inset-0 bg-black bg-opacity-20 rounded-lg pointer-events-auto"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleMessageSelection(msg);
                                      }}
                                    ></div>
                                  )}
                                  {/* Plus icon */}
                                  <div
                                    className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-[42%] transition-opacity ${isSelected ? "opacity-100" : "opacity-0"
                                      } group-hover:opacity-100`}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleMessageSelection(msg);
                                    }}
                                    style={{
                                      cursor: "pointer",
                                      color: "#007BFF",
                                      borderRadius: "50%",
                                      width: "24px",
                                      height: "24px",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                    }}
                                  >
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      width="16"
                                      height="16"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    >
                                      <circle cx="12" cy="12" r="10"></circle>
                                      <line x1="8" y1="12" x2="16" y2="12"></line>
                                    </svg>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}


                    {groupedMessages[timestamp]
                      ?.filter((msg: any) =>
                        msg.sender?.id !== userId &&
                        msg.content?.startsWith(CHAT_UPLOAD_PREFIX) &&
                        msg.content &&
                        !((msg.wasSentWhileCurrentlyBlocked === true) && msg.sender.id !== userId) &&
                        !((msg.sender?.id === userId && msg.senderDFM) ||
                          (msg.sender?.id !== userId && msg.receiverDFM) ||
                          msg.delForAll)
                      ).length > 0 && (

                        <div className="space-y-2 mt-2">
                          {/* Other user's images */}
                          <div
                            className={`w-full flex justify-start ${filterImageMessages(groupedMessages[timestamp]).length === 1 ? "" : "max-w-full"
                              }`}
                          >
                            <div
                              className={`border-2 border-green-300 p-2 rounded-lg ${filterImageMessages(groupedMessages[timestamp]).length === 1 ? "" : "max-w-full"
                                }`}
                            >
                              {filterImageMessages(groupedMessages[timestamp]).length > 0 && (
                                <div className="mt-1 text-left">
                                  {groupedMessages[timestamp][0].wasForwarded && (
                                    <div className="flex items-center text-xs italic text-gray-700 mb-2">
                                      <FontAwesomeIcon icon={faShare} className="mr-1" />
                                      Forwarded
                                    </div>
                                  )}
                                  {groupedMessages[timestamp][0].repliedTo && groupedMessages[timestamp][0].repliedTo.content && (
                                    <div className="p-1 mb-2 border-l-4 border-blue-400 rounded-lg border-dotted shadow-md text-sm" onClick={() => scrollToMessageAsReply(groupedMessages[timestamp][0].repliedTo?.id)}>
                                      <span className="block font-semibold text-blue-800 opacity-90 mb-2">
                                        {messagesAll.find((m) => m.id === groupedMessages[timestamp][0].repliedTo.id)?.sender?.id === userId
                                          ? "You"
                                          : chatSettings?.customUsername || otherUserData?.getOtherUserById?.username}
                                      </span>
                                      {groupedMessages[timestamp][0].repliedTo.content.startsWith(CHAT_UPLOAD_PREFIX) ? (
                                        <img
                                          src={`http://localhost:5002${groupedMessages[timestamp][0].repliedTo.content}`}
                                          alt="Reply preview"
                                          className="w-20 h-20 object-cover object-top rounded-lg border border-gray-300 shadow-md hover:scale-105 transition-transform"
                                          onClick={() => openImage(`http://localhost:5002${groupedMessages[timestamp][0].repliedTo.content}`)}
                                        />
                                      ) : groupedMessages[timestamp][0].repliedTo.content.startsWith(CHAT_UPLOAD_FILE_PREFIX) ? (

                                        <div className="flex items-center gap-3 overflow-hidden">
                                          <FontAwesomeIcon icon={faFileAlt} className="text-blue-600 text-xl" />                                        <span
                                            onClick={() => window.open(`http://localhost:5002${groupedMessages[timestamp][0].repliedTo.content}`, "_blank")}
                                            className="text-sm text-gray-700 truncate max-w-xs focus:outline-none bg-transparent border-none p-0 text-left hover:bg-gray-100"
                                          >
                                            {groupedMessages[timestamp][0].repliedTo.fileOriginalName || "View File"}
                                          </span>
                                        </div>
                                      ) : groupedMessages[timestamp][0].repliedTo.content.startsWith(CHAT_UPLOAD_AUDIO_PREFIX) ? (
                                        <div className="flex items-center gap-3 overflow-hidden">
                                          <FontAwesomeIcon icon={faHeadphones} className="text-blue-600 text-xl" />
                                          <span className="text-sm text-gray-600">Audio - {groupedMessages[timestamp][0].repliedTo.fileOriginalName}</span>
                                        </div>
                                      ) : (
                                        <p className="text-gray-600">
                                          {groupedMessages[timestamp][0].repliedTo.content.length > 20
                                            ? groupedMessages[timestamp][0].repliedTo.content.slice(0, 20) + "..."
                                            : groupedMessages[timestamp][0].repliedTo.content}
                                        </p>
                                      )}
                                    </div>
                                  )}
                                </div>
                              )}
                              <div
                                className={`grid ${filterImageMessages(groupedMessages[timestamp]).length > 1
                                  ? "grid-cols-2 gap-2"
                                  : ""
                                  }`}
                              >
                                {filterImageMessages(groupedMessages[timestamp])
                                  .filter((msg: any) => msg.sender?.id !== userId)
                                  .slice(0, 4)
                                  .map((msg: any, index: number, arr: any[]) => {
                                    const allImages = filterImageMessages(groupedMessages[timestamp]).filter(
                                      (msg: any) => msg.sender?.id !== userId
                                    );
                                    const isSelected = selectedMessages.includes(msg.id);
                                    const isGroup = allImages.length > 1;
                                    const isLastVisible = index === 3 && allImages.length > 4;

                                    return (
                                      <div key={msg.id} id={`message-${msg.id}`} className="relative group">
                                        <div className="relative w-32 h-32">
                                          <img
                                            src={`http://localhost:5002${msg.content}`}
                                            alt=""
                                            className="w-full h-full object-cover object-top rounded-lg border shadow-md"
                                            onClick={() => openImage(`http://localhost:5002${msg.content}`)}
                                          />

                                          {msg.isStarredByOtherUser && (
                                            <span
                                              className="absolute bottom-1 left-1 text-black font-semibold transition-transform duration-200 ease-in-out
                 hover:scale-110 focus:scale-110
                 text-[10px] sm:text-[12px] md:text-[14px] bg-white bg-opacity-70 p-1 rounded-full"
                                            >
                                              <StarFilled />
                                            </span>
                                          )}

                                        </div>

                                        {isSelected && (
                                          <div
                                            className="absolute inset-0 bg-black bg-opacity-20 rounded-lg pointer-events-auto"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              toggleMessageSelection(msg);
                                            }}
                                          ></div>
                                        )}

                                        {/* Plus icon */}
                                        <div
                                          className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-[42%] transition-opacity ${isSelected ? "opacity-100" : "opacity-0"
                                            } group-hover:opacity-100`}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            toggleMessageSelection(msg);
                                          }}
                                          style={{
                                            cursor: "pointer",
                                            color: "#007BFF",
                                            borderRadius: "50%",
                                            width: "24px",
                                            height: "24px",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                          }}
                                        >
                                          <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            width="16"
                                            height="16"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                          >
                                            <circle cx="12" cy="12" r="10"></circle>
                                            <line x1="8" y1="12" x2="16" y2="12"></line>
                                          </svg>
                                        </div>

                                        {/* "+X more" overlay */}
                                        {isLastVisible && (
                                          <div
                                            className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center rounded-lg text-white font-semibold text-sm cursor-pointer"
                                            onClick={() => {
                                              setActiveImageGroup(allImages);
                                              setShowAllImagesModal(true);
                                            }}
                                          >
                                            +{allImages.length - 4}
                                          </div>
                                        )}

                                        {/* Solo timestamp */}
                                        {!isGroup && (
                                          <div className="mt-1 text-left">
                                            <small className="block text-xs text-gray-700">
                                              {new Date(msg.timestamp).toLocaleString("en-GB", {
                                                hour12: false,
                                                hour: "2-digit",
                                                minute: "2-digit",
                                                day: "2-digit",
                                                month: "2-digit",
                                                year: "numeric",
                                              })}
                                            </small>
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                              </div>

                              {/* Grouped timestamp */}
                              {filterImageMessages(groupedMessages[timestamp]).length > 1 && (
                                <div className="mt-2 text-left">
                                  <small className="block text-xs text-gray-700">
                                    {new Date(timestamp).toLocaleString("en-GB", {
                                      hour12: false,
                                      hour: "2-digit",
                                      minute: "2-digit",
                                      day: "2-digit",
                                      month: "2-digit",
                                      year: "numeric",
                                    })}
                                  </small>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                    {groupedMessages[timestamp]
                      .filter((msg: any) => {
                        const isMe = msg.sender?.id === userId;
                        return (
                          msg.content.startsWith(CHAT_UPLOAD_FILE_PREFIX) &&
                          !((msg.wasSentWhileCurrentlyBlocked === true) && msg.sender.id !== userId) &&
                          !((isMe && msg.senderDFM) || (!isMe && msg.receiverDFM) || msg.delForAll)
                        );
                      })
                      .map((msg: any) => {
                        const isMe = msg.sender?.id === userId;
                        const isSelected = selectedMessages.includes(msg.id);

                        return (
                          <div
                            key={msg.id}
                            id={`message-${msg.id}`}
                            className={`flex ${isMe ? 'justify-end' : 'justify-start'} group relative py-2`}
                          >
                            <div className="my-4 w-full max-w-md relative">

                              {isSelected && (
                                <div
                                  className="absolute inset-0 bg-black bg-opacity-20 rounded-lg z-10 pointer-events-auto"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleMessageSelection(msg);
                                  }}
                                ></div>
                              )}

                              <div
                                className={`absolute top-4 ${isMe ? '-left-8' : 'right-[-32px]'} transition-opacity ${isSelected ? 'opacity-100' : 'opacity-0'} group-hover:opacity-100`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleMessageSelection(msg);
                                }}
                                style={{
                                  cursor: 'pointer',
                                  color: '#007BFF',
                                  borderRadius: '50%',
                                  width: '24px',
                                  height: '24px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="16"
                                  height="16"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <circle cx="12" cy="12" r="10"></circle>
                                  <line x1="8" y1="12" x2="16" y2="12"></line>
                                </svg>
                              </div>

                              {msg.wasForwarded && (
                                <div className="flex items-center text-xs italic text-gray-700 mb-2">
                                  <FontAwesomeIcon icon={faShare} className="mr-1" />
                                  Forwarded
                                </div>
                              )}

                              {msg.repliedTo && msg.repliedTo.content && (
                                <div
                                  className="p-2 mb-1 border-l-4 border-blue-400 rounded-lg border-dotted shadow-md text-sm bg-gray-50 cursor-pointer"
                                  onClick={() => scrollToMessageAsReply(msg.repliedTo?.id)}
                                >
                                  <span className="block font-semibold text-blue-800 opacity-90 mb-2">
                                    {messagesAll.find((m) => m.id === msg.repliedTo.id)?.sender?.id === userId
                                      ? 'You'
                                      : chatSettings?.customUsername || otherUserData?.getOtherUserById?.username}
                                  </span>

                                  {msg.repliedTo.content.startsWith(CHAT_UPLOAD_PREFIX) ? (
                                    <img
                                      src={`http://localhost:5002${msg.repliedTo.content}`}
                                      alt="Replied preview"
                                      className="w-20 h-20 object-cover object-top rounded-lg border border-gray-300 shadow-md hover:scale-105 transition-transform mt-1"
                                      onClick={() => openImage(`http://localhost:5002${msg.repliedTo.content}`)}
                                    />
                                  ) : msg.repliedTo.content.startsWith(CHAT_UPLOAD_FILE_PREFIX) ? (
                                    <button
                                      onClick={() => window.open(`http://localhost:5002${msg.repliedTo.content}`, '_blank')}
                                      className="text-sm text-gray-700 truncate max-w-xs focus:outline-none bg-transparent border-none p-0 text-left hover:bg-gray-100"
                                    >
                                      {msg.repliedTo.fileOriginalName}
                                    </button>
                                  ) : msg.repliedTo.content.startsWith(CHAT_UPLOAD_AUDIO_PREFIX) ? (
                                    <div className="flex items-center gap-3 overflow-hidden">
                                      <FontAwesomeIcon icon={faHeadphones} className="text-blue-600 text-xl" />
                                      <span className="text-sm text-gray-600">Audio - {msg.repliedTo.fileOriginalName}</span>
                                    </div>
                                  ) : (
                                    <p className="text-gray-600 mt-1">
                                      {msg.repliedTo.content.length > 20
                                        ? msg.repliedTo.content.slice(0, 20) + '...'
                                        : msg.repliedTo.content}
                                    </p>
                                  )}
                                </div>
                              )}

                              {/* File Display */}
                              <div className="relative flex items-center justify-between bg-white border border-gray-300 rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow">
                                {(isMe ? msg.isStarredByCurrentUser : msg.isStarredByOtherUser) && (
                                  <span
                                    className="absolute -bottom-4 left-1 text-black font-semibold transition-transform duration-200 ease-in-out
                  hover:scale-110 focus:scale-110
                  text-[10px] sm:text-[12px] md:text-[14px] bg-white bg-opacity-70 p-1 rounded-full"
                                  >
                                    <StarFilled />
                                  </span>
                                )}

                                <div className="flex items-center gap-3 overflow-hidden">
                                  <FontAwesomeIcon icon={faFileAlt} className="text-blue-600 text-xl" />
                                  <button
                                    onClick={() => window.open(`http://localhost:5002${msg.content}`, '_blank')}
                                    className="text-sm text-gray-700 truncate max-w-xs focus:outline-none bg-transparent border-none p-0 text-left hover:bg-gray-100"
                                  >
                                    {msg.fileOriginalName}
                                  </button>

                                  <div className="relative group">
                                    <button
                                      onClick={() => {
                                        const link = document.createElement('a');
                                        link.href = `http://localhost:5002${msg.content}`;
                                        link.download = msg.fileOriginalName || 'download';
                                        document.body.appendChild(link);
                                        link.click();
                                        document.body.removeChild(link);
                                      }}
                                      className="text-blue-600 hover:text-blue-800 focus:outline-none"
                                    >
                                      <DownloadOutlined />
                                    </button>

                                    <span className="absolute bottom-6 left-1/2 transform -translate-x-1/2 text-[11px] bg-gray-800 text-white px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                                      Download file
                                    </span>
                                  </div>
                                </div>

                                {/* Timestamp and Status */}
                                <div className="text-right">
                                  <small className="block text-xs text-zinc-950">
                                    {new Date(msg.timestamp).toLocaleString('en-GB', {
                                      hour12: false,
                                      hour: '2-digit',
                                      minute: '2-digit',
                                      day: '2-digit',
                                      month: '2-digit',
                                      year: 'numeric',
                                    })}
                                  </small>
                                  {isMe && (
                                    <div className="flex justify-end mt-1">
                                      {msg.status.toLowerCase() === 'sent' && <SingleTick />}
                                      {msg.status.toLowerCase() === 'delivered' && <DoubleTick />}
                                      {msg.status.toLowerCase() === 'read' &&
                                        ((otherUserData?.getOtherUserById?.readReceipts && userData?.getUserById?.readReceipts)
                                          ? <DoubleTick className="text-blue-900" />
                                          : <DoubleTick />)}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}

                    {groupedMessages[timestamp]
                      .filter((msg: any) => {
                        const isMe = msg.sender?.id === userId;
                        return (
                          msg.content.startsWith(CHAT_UPLOAD_AUDIO_PREFIX) &&
                          !((msg.wasSentWhileCurrentlyBlocked === true) && msg.sender.id !== userId) &&
                          !((isMe && msg.senderDFM) || (!isMe && msg.receiverDFM) || msg.delForAll)
                        );
                      })
                      .map((msg: any) => {
                        const isMe = msg.sender?.id === userId;
                        const isSelected = selectedMessages.includes(msg.id);

                        return (
                          <div key={msg.id} id={`message-${msg.id}`} className={`flex ${isMe ? 'justify-end' : 'justify-start'} group relative py-2`}>
                            <div className="my-4 w-full max-w-md relative">

                              {isSelected && (
                                <div
                                  className="absolute inset-0 bg-black bg-opacity-20 rounded-lg pointer-events-auto"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleMessageSelection(msg);
                                  }}
                                ></div>
                              )}

                              <div
                                className={`absolute top-4 ${isMe ? '-left-8' : 'right-[-32px]'} transition-opacity ${isSelected ? "opacity-100" : "opacity-0"} group-hover:opacity-100`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleMessageSelection(msg);
                                }}
                                style={{
                                  cursor: "pointer",
                                  color: "#007BFF",
                                  borderRadius: "50%",
                                  width: "24px",
                                  height: "24px",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                }}
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="16"
                                  height="16"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <circle cx="12" cy="12" r="10"></circle>
                                  <line x1="8" y1="12" x2="16" y2="12"></line>
                                </svg>
                              </div>

                              {msg.wasForwarded && (
                                <div className="flex items-center text-xs italic text-gray-700 mb-2">
                                  <FontAwesomeIcon icon={faShare} className="mr-1" />
                                  Forwarded
                                </div>
                              )}

                              {msg.repliedTo && msg.repliedTo.content && (
                                <div className="p-2 mb-1 border-l-4 border-blue-400 rounded-lg border-dotted shadow-md text-sm bg-gray-50" onClick={() => scrollToMessageAsReply(msg.repliedTo?.id)}>
                                  <span className="block font-semibold text-blue-800 opacity-90 mb-2">
                                    {messagesAll.find((m) => m.id === msg.repliedTo.id)?.sender?.id === userId
                                      ? "You"
                                      : chatSettings?.customUsername || otherUserData?.getOtherUserById?.username}
                                  </span>

                                  {msg.repliedTo.content.startsWith(CHAT_UPLOAD_PREFIX) ? (
                                    <img
                                      src={`http://localhost:5002${msg.repliedTo.content}`}
                                      alt="Replied preview"
                                      className="w-20 h-20 object-cover object-top rounded-lg border border-gray-300 shadow-md hover:scale-105 transition-transform mt-1"
                                      onClick={() => openImage(`http://localhost:5002${msg.repliedTo.content}`)}
                                    />
                                  ) : msg.repliedTo.content.startsWith(CHAT_UPLOAD_AUDIO_PREFIX) ? (
                                    <div className="flex items-center gap-3 overflow-hidden">
                                      <span className="text-sm text-gray-600">Audio - {msg.repliedTo.fileOriginalName}</span>
                                    </div>
                                  ) : msg.repliedTo.content.startsWith(CHAT_UPLOAD_FILE_PREFIX) ? (
                                    <button
                                      onClick={() => window.open(`http://localhost:5002${msg.repliedTo.content}`, '_blank')}
                                      className="text-sm text-gray-700 truncate max-w-xs focus:outline-none bg-transparent border-none p-0 text-left hover:bg-gray-100"
                                    >
                                      {msg.repliedTo.fileOriginalName}
                                    </button>
                                  ) : (
                                    <p className="text-gray-600 mt-1">
                                      {msg.repliedTo.content.length > 20
                                        ? msg.repliedTo.content.slice(0, 20) + "..."
                                        : msg.repliedTo.content}
                                    </p>
                                  )}
                                </div>
                              )}

                              {/* Audio Display */}
                              <div className="border-2 border-dashed border-blue-400 bg-white rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow flex items-center">
                                <div className="relative flex items-center gap-3 w-[70%]">
                                  <div className="relative inline-block">
                                    <Avatar
                                      className="w-16 h-16"
                                      src={`http://localhost:5002${msg.sender?.id === userId
                                        ? userData?.getUserById?.profilePicture
                                        : otherUserData?.getOtherUserById?.profilePicture
                                        }`}
                                    />
                                    <AudioOutlined
                                      className="absolute bottom-0 right-0 text-blue-500 bg-white rounded-full p-1"
                                      style={{ fontSize: '16px' }}
                                    />
                                  </div>

                                  <AudioPlayerCustom src={`http://localhost:5002${msg.content}`} />

                                  {isMe ? (
                                    msg.isStarredByCurrentUser && (
                                      <span
                                        className="absolute bottom-1 left-1 text-black font-semibold transition-transform duration-200 ease-in-out
                   hover:scale-110 focus:scale-110
                   text-[10px] sm:text-[12px] md:text-[14px] bg-white bg-opacity-70 p-1 rounded-full"
                                      >
                                        <StarFilled />
                                      </span>
                                    )
                                  ) : (
                                    msg.isStarredByOtherUser && (
                                      <span
                                        className="absolute bottom-1 left-1 text-black font-semibold transition-transform duration-200 ease-in-out
                   hover:scale-110 focus:scale-110
                   text-[10px] sm:text-[12px] md:text-[14px] bg-white bg-opacity-70 p-1 rounded-full"
                                      >
                                        <StarFilled />
                                      </span>
                                    )
                                  )}
                                </div>

                                <div className="text-right ml-3">
                                  <small className="block text-xs text-zinc-950">
                                    {new Date(msg.timestamp).toLocaleString("en-GB", {
                                      hour12: false,
                                      hour: "2-digit",
                                      minute: "2-digit",
                                      day: "2-digit",
                                      month: "2-digit",
                                      year: "numeric",
                                    })}
                                  </small>
                                  {isMe && (
                                    <div className="flex justify-end mt-1">
                                      {msg.status.toLowerCase() === "sent" && <SingleTick />}
                                      {msg.status.toLowerCase() === "delivered" && <DoubleTick />}
                                      {msg.status.toLowerCase() === "read" &&
                                        (
                                          (otherUserData?.getOtherUserById?.readReceipts && userData?.getUserById?.readReceipts)
                                            ? <DoubleTick className="text-blue-900" />
                                            : <DoubleTick />
                                        )
                                      }
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                ))}
              </div>


              {newMessageCount > 0 && !isAtBottom && (
                <div className="absolute bottom-32 left-1/2 transform -translate-x-1/2 bg-green-600 text-white p-3 rounded-lg shadow-md flex items-center justify-between w-full max-w-xs">
                  <span className="text-sm font-semibold">
                    {newMessageCount === 1 ? '1 New Message' : `${newMessageCount} New Messages`}
                  </span>

                  <button
                    className="ml-0 text-lg font-bold hover:opacity-80 transition-opacity"
                    onClick={() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })}
                  >
                    ↓
                  </button>
                </div>
              )}

              {newMessageCount === 0 && !isAtBottom && messages.length !== 0 && (
                <div className="absolute top-24 left-1/2 transform -translate-x-1/2 z-10">
                  <button
                    onClick={() => messagesEndRef.current?.scrollIntoView({ behavior: 'auto' })}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-sm md:text-base px-3 md:px-4 py-2 rounded-full shadow-lg transition-all duration-200 flex items-center gap-2"
                  >
                    <span className="animate-bounce">↓</span>
                    <span className="hidden md:inline font-medium">Scroll to latest</span>
                  </button>
                </div>
              )}

              {isOtherUserTyping && (
                <div className="mt-4">
                  <div className="relative max-w-16 h-11 text-black p-4 rounded-lg">
                    {/* Pointed extension (speech bubble) */}
                    {/* <div className="absolute bottom-0 left-0 w-4 h-4 transform translate-y-1/2 -translate-x-1/2 rotate-45 clip-path-polygon"
                      style={{
                        background: 'linear-gradient(135deg, rgba(156, 163, 175, 1) 0%, rgba(107, 114, 128, 1) 100%)',
                      }}
                    ></div> */}

                    <div className="flex items-center space-x-1 pt-2">
                      <span className="w-4 h-2 rounded-full animate-wave motion-safe:animate-wave" style={{ backgroundColor: '#1B5E20' }}></span>
                      <span className="w-4 h-2 bg-indigo-700 rounded-full animate-waveMiddle motion-safe:animate-waveMiddle"></span>
                      <span className="w-4 h-2 bg-purple-800 rounded-full animate-waveReverse motion-safe:animate-waveReverse"></span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef}></div>
            </div>
          </div>

          <DeleteMessageModal
            show={showDeleteModal}
            selectedCount={selectedMessages.length}
            canDeleteForEveryone={canDeleteForEveryone}
            onClose={closeDeleteModal}
            onDeleteForMe={deleteMessagess}
            onDeleteForEveryone={handleDeleteForEveryone}
            isOtherUserBlocked={isOtherUserBlocked}
            isUserBlocked={isUserBlocked}
          />

          <ImagePreviewCard
            selectedImageIndex={selectedImageIndex}
            selectedImage={selectedImage}
            imageMessages={imageMessages}
            goPrev={goPrev}
            goNext={goNext}
            closeImage={closeImage}
          />

          <div className="relative pb-16">
            <ReplyCard
              showReplyCard={showReplyCard}
              storedReplyMessage={storedReplyMessage}
              userId={userId}
              otherUserId={otherUserId || null}
              setShowReplyCard={setShowReplyCard}
              openImage={openImage}
              otherUserData={otherUserData}
            />

            <div className="fixed bottom-0 w-full shadow-lg">
              <MessageInputBar
                newMessage={newMessage}
                setNewMessage={setNewMessage}
                handleTyping={handleTyping}
                selectedImages={selectedImages}
                fileInputRef={fileInputRef}
                cameraInputRef={cameraInputRef}
                audioInputRef={audioInputRef}
                actualFileInputRef={actualFileInputRef}
                handleImageChange={handleImageChange}
                handleFileChange={handleFileChange}
                handleAudioChange={handleAudioChange}
                isModalVisible={isModalVisible}
                setIsModalVisible={setIsModalVisible}
                triggerGalleryUpload={triggerGalleryUpload}
                triggerFileUpload={triggerFileUpload}
                triggerCamera={triggerCamera}
                triggerAudioUpload={triggerAudioUpload}
                setIsEmojiPickerVisible={setIsEmojiPickerVisible}
                sendMessage={sendMessage}
                isOtherUserBlocked={isOtherUserBlocked}
              />

              {showPreviewModal && (
                <ImagePreviewModal
                  selectedImages={selectedImages}
                  setSelectedImages={setSelectedImages}
                  captions={captions}
                  setCaptions={setCaptions}
                  onClose={closeImagePreviewModal}
                  onSend={uploadImageAndSend}
                />
              )}

              {showFilePreviewModal && (
                <FilePreviewModal
                  selectedFile={selectedFile}
                  setSelectedFile={setSelectedFile}
                  caption={fileCaption}
                  setCaption={setFileCaption}
                  onClose={closeFilePreviewModal}
                  onSend={uploadFileAndSend}
                />
              )}

              {showAudioPreviewModal && (
                <FilePreviewModalAudio
                  selectedFile={selectedAudio}
                  onClose={closeAudioPreviewModal}
                  onSend={uploadAudioAndSend}
                />
              )}

              {isEmojiPickerVisible && (
                <div className="absolute bottom-20 left-0 z-10 w-100 p-2 bg-white border rounded-lg shadow-xl overflow-auto scrollbar-hidden">
                  <EmojiPicker onEmojiClick={handleEmojiClick} />
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default InteractPage;
