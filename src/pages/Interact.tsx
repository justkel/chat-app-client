import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Input, Spin, notification } from 'antd';
import EmojiPicker, { EmojiClickData } from "emoji-picker-react";
import HeaderWithInlineCard from '../components/HeaderCard';
import { ArrowLeftOutlined, DeleteOutlined, MoreOutlined, SendOutlined, StarOutlined, PaperClipOutlined, CloseOutlined } from '@ant-design/icons';
import { jwtDecode } from 'jwt-decode';
import dayjs from 'dayjs';
import socket from '../socket';
import { useAuth } from '../contexts/AuthContext';
import { useGetChatMessages, useGetChatMessagesAll, useCheckUserOnline, useUpdateMessageStatus } from '../hooks/useGetChatMessages';
import { useGetOtherUserById } from '../hooks/useGetOtherUser';
import { useChatSettings } from '../hooks/useGetOtherUserContactDetails';
import { useDeleteMessages } from '../hooks/useDeleteMessages';
import { useDeleteMessagesForEveryone } from '../hooks/useDeleteMessages';
import { useFetchLastValidMessages } from '../hooks/useGetLastMessage';
import { ChatMessage, UserTypingEvent } from '../utilss/types';
import '../App.css';
import ForwardModal from '../components/ForwardModal';
import { useGetUsersToForwardTo } from '../hooks/useGetAcceptedUsers';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faShare } from '@fortawesome/free-solid-svg-icons';

const { TextArea } = Input;

const InteractPage = () => {
  const { id: otherUserId } = useParams();
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
  const navigate = useNavigate();

  const toggleCard = () => setShowCard(!showCard);
  const [isEmojiPickerVisible, setIsEmojiPickerVisible] = useState<boolean>(false);
  const [editMessage, setEditMessage] = useState<string | undefined>(undefined);
  const [isEditing, setIsEditing] = useState(false);
  const [currentSelectedMessage, setCurrentSelectedMessage] = useState<any>(null);
  const [currentSelectedMessages, setCurrentSelectedMessages] = useState<any[]>([]);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [showAllImagesModal, setShowAllImagesModal] = useState(false);
  const [activeImageGroup, setActiveImageGroup] = useState<any[]>([]);

  const imageMessages = useMemo(() => {
    return messages.filter((msg) =>
      msg.content?.startsWith('/chat-uploads')
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
  const { data: chatSettings, loading: chatLoading } = useChatSettings(userId!, otherUserId!);
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
    } else {
      setBackgroundImage('http://localhost:5002/uploads/whatsapp-wallpaper.jpg');
    }
  }, [chatSettings?.customWallpaper]);

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
    }, 5000);

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

    if (intervalRef.current) clearInterval(intervalRef.current);

    intervalRef.current = setInterval(async () => {

      if (onlineLoading) return;
      if (onlineError) {
        console.error('Error checking user online status:', onlineError);
        return;
      }

      try {
        await isOnlineRefetch();
      } catch (err) {
        console.error('Error refetching online status:', err);
      }
    }, 2000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [otherUserId, userId, onlineLoading, onlineError, isOnlineRefetch]);

  useEffect(() => {
    if (onlineData?.status.toLowerCase() === 'yes') {
      const sentMessages = messages.filter((msg) => msg.status.toLowerCase() === 'sent');

      sentMessages.forEach(async (msg) => {
        try {
          await updateMessageStatus(msg.id, 'DELIVERED');

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
          };

          socket.emit('otherUserOnline', { userId, otherUserId, transformedMessage });
        } catch (err) {
          console.error('Error updating message statuses:', err);
        }
      });
    }
  }, [messages, onlineData, otherUserId, updateMessageStatus, userId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isReceiverOnPage) {
        console.log("Receiver is not on the page, skipping message status update.");
        return;
      }

      const ReUpdatingMessages = messages.filter(
        (msg) => msg.receiver.id === userId && isAtBottom,
      );

      if (ReUpdatingMessages.length > 0) {
        ReUpdatingMessages.forEach(async (msg) => {
          await updateMessageStatus(msg.id, 'READ');

          const transformedMessage = {
            sender: { id: msg.sender.id },
            receiver: { id: msg.receiver.id },
            content: msg.content,
            timestamp: msg.timestamp,
            status: 'READ',
            id: msg.id,
            deliveredAt: msg.deliveredAt,
          };

          socket.emit('updateMessageStatusRead', { userId, otherUserId, transformedMessage });
        })
      }

      const receivedMessages = messages.filter(
        (msg) => msg.status.toLowerCase() === 'delivered' && msg.receiver.id === userId && isAtBottom
      );
      if (receivedMessages.length > 0) {
        receivedMessages.forEach(async (msg) => {
          try {
            await updateMessageStatus(msg.id, 'READ');

            const transformedMessage = {
              sender: { id: msg.sender.id },
              receiver: { id: msg.receiver.id },
              content: msg.content,
              timestamp: msg.timestamp,
              status: 'READ',
              id: msg.id,
              deliveredAt: msg.deliveredAt,
            };

            socket.emit('updateMessageStatusRead', { userId, otherUserId, transformedMessage });
          } catch (error) {
            console.error('Error updating message statuses:', error);
          }
        });
      }
    }, 1000);

    return () => clearTimeout(timer); // Cleanup on unmount
  }, [messages, userId, updateMessageStatus, otherUserId, isReceiverOnPage, isAtBottom]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    const { scrollTop, scrollHeight, clientHeight } = target;

    const atBottom = scrollTop + clientHeight >= scrollHeight - 10;
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
      setMessages((prevMessages) => {
        if (message.repliedTo?.id) {
          const repliedMessage = prevMessages.find(msg => msg.id === message.repliedTo?.id);

          if (repliedMessage) {
            message.repliedTo.content = repliedMessage.content;
          }
        }

        const newMessages = [...prevMessages, message];

        if (message.sender.id !== userId && !isAtBottom) {
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
      if (typingUserId !== userId) {
        setIsOtherUserTyping(typing);
      }
    });

    // socket.on('messageDelivered', ({ message }) => {
    //   setMessages((prevMessages) =>
    //     prevMessages.map((msg) =>
    //       msg.id === message.id ? { ...msg, status: 'DELIVERED' } : msg
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
    };
  }, [userId, otherUserId, isAtBottom]);

  useEffect(() => {
    if (data && data.getChatMessages) {
      refetch();
      setMessages(data.getChatMessages);
    }
  }, [data, refetch]);

  useEffect(() => {
    if (!scrollLock && isAtBottom && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
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

    selectedImages.forEach((file) => {
      formData.append('images', file); // Key must match backend interceptor field name
    });

    formData.append('senderId', userId ?? '');
    formData.append('receiverId', otherUserId ?? '');

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
      localStorage.removeItem(`replyMessage_${userId}_${otherUserId}`);
      setShowReplyCard(false);
    } catch (err) {
      console.error('Image upload failed:', err);
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
    const isImage = message.content?.startsWith("/chat-uploads/");
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
          <span>{isExpanded ? fullContent : truncated}</span>
          <button
            onClick={() => handleReadMore(message.id)}
            className="text-yellow-800 text-sm ml-2"
          >
            {isExpanded ? " Show Less" : " Read More"}
          </button>
        </>
      );
    }

    return <span>{message.content}</span>;
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
          return !((isMe && msg.senderDFM) || (!isMe && msg.receiverDFM) || msg.delForAll);
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

  const handleSendForwardedMessage = (selectedUsers: string[]) => {
    if (!currentSelectedMessage && currentSelectedMessages.length === 0) return;

    selectedUsers.forEach(uid => {
      socket.emit('joinRoom', { userId: userId, otherUserId: uid });

      currentSelectedMessages.forEach(msgToForward => {
        const message = {
          sender: { id: userId },
          receiver: { id: uid },
          content: msgToForward.content,
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
      navigate(`/chat/${selectedUsers[0]}`);
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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const fileArray = Array.from(files);
      setSelectedImages((prev) => [...prev, ...fileArray]);
    }
  };

  const removeImage = (index: number) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const groupMessagesByTimestamp = (messages: any[], intervalInSeconds = 60) => {
    return messages.reduce((acc: any, message: any) => {
      const timestamp = new Date(message.timestamp).getTime();
      const roundedTimestamp = Math.floor(timestamp / (intervalInSeconds * 1000)) * (intervalInSeconds * 1000);
      const groupKey = new Date(roundedTimestamp).toISOString(); // consistent, sortable format

      if (!acc[groupKey]) {
        acc[groupKey] = [];
      }
      acc[groupKey].push(message);
      return acc;
    }, {});
  };

  // Filter image messages
  const filterImageMessages = (messages: any[]) => {
    return messages.filter((msg) => msg.content?.startsWith('/chat-uploads'));
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


  if (loading) return <Spin size="large" className="flex justify-center items-center h-screen" />;
  if (otherUserLoading || chatLoading || loadingMsgAll) return <Spin size="large" className="flex justify-center items-center h-screen" />;
  // if (error) return <p>Error: {error.message}</p>;

  return (
    <div>
      {showInfoCard && (
        <div className="fixed inset-0 h-screen w-screen bg-black/50 flex justify-center z-[9999]">
          <div className="relative bg-gray-100 p-3 rounded-lg shadow-md w-screen mx-auto text-sm text-gray-700 opacity-100 pointer-events-auto">
            <button
              onClick={closeInfoCard}
              className="absolute top-2 right-2 sm:top-4 sm:right-4 text-xl sm:text-2xl text-gray-500 mr-10 hover:text-gray-700 transition duration-200 ease-in-out"
            >
              ✖
            </button>

            <p className="font-semibold text-center text-xl mb-5">Message info</p>
            <p className="font-semibold text-center text-md">
              {currentSelectedMessage.timestamp && formatTimestamp(currentSelectedMessage.timestamp)}
            </p>

            <div className="flex justify-end mt-5 mr-10">
              <div
                className="relative max-w-xs p-4 rounded-lg shadow-lg transition-all ease-in-out transform bg-gradient-to-r from-blue-500 to-blue-700 text-white break-words hover:scale-105 hover:shadow-xl"
                style={{
                  wordBreak: 'break-word',
                  borderRadius: '16px 0 16px 16px',
                  boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
                  padding: '12px 6px',
                  transition: 'all 0.3s ease',
                }}
              >
                {currentSelectedMessage.repliedTo && currentSelectedMessage.repliedTo.content && (
                  <div className="p-1 mb-2 border-l-4 rounded-md text-sm w-full bg-blue-600/50 text-white">
                    <span className="block font-semibold opacity-80">
                      {messagesAll.find((m) => m.id === currentSelectedMessage.repliedTo.id)?.sender?.id === userId
                        ? "You"
                        : chatSettings?.customUsername || otherUserData?.getOtherUserById?.username}
                    </span>
                    {currentSelectedMessage.repliedTo.content.startsWith('/chat-uploads')
                      ? (
                        <img
                          src={`http://localhost:5002${currentSelectedMessage.repliedTo.content}`}
                          alt="reply"
                          className="w-20 h-20 object-cover rounded-md shadow"
                        />
                      )
                      : (
                        currentSelectedMessage.repliedTo.content.length > 30
                          ? currentSelectedMessage.repliedTo.content.slice(0, 30) + "..."
                          : currentSelectedMessage.repliedTo.content
                      )
                    }
                  </div>
                )}

                {currentSelectedMessage.wasForwarded && (
                  <div className="flex items-center text-xs italic text-gray-700 mb-2">
                    <FontAwesomeIcon icon={faShare} className="mr-1" />
                    Forwarded
                  </div>
                )}

                <p className="font-semibold text-center">
                  {currentSelectedMessage.content.startsWith('/chat-uploads') ? (
                    <img
                      src={`http://localhost:5002${currentSelectedMessage.content}`}
                      alt="Reply preview"
                      className="w-20 h-10 object-cover rounded-lg border border-gray-300 shadow-md transition-transform hover:scale-105"
                    />
                  ) : (
                    currentSelectedMessage.content.length > 150
                      ? `${currentSelectedMessage.content.slice(0, 150)}...`
                      : currentSelectedMessage.content
                  )}
                </p>

                <small className="block text-xs mt-1 text-right text-white">
                  {new Date(currentSelectedMessage.timestamp).toLocaleString('en-GB', {
                    hour12: false,
                    hour: '2-digit',
                    minute: '2-digit',
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                  })}
                </small>

                <div className="flex items-center justify-end mt-1">
                  {currentSelectedMessage.status.toLowerCase() === 'sent' && (
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
                  {currentSelectedMessage.status.toLowerCase() === 'delivered' && (
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
                  {currentSelectedMessage.status.toLowerCase() === 'read' && (
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
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-col text-lg font-semibold mt-2 mr-10">
              <span className="flex items-center mb-7 justify-between gap-4">
                <span className="flex items-center gap-2">
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
                    className="tick-icon text-green-600 mb-1"
                  >
                    <polyline points="20 6 9 17 4 12" />
                    <polyline points="26 6 15 17 20 12" />
                  </svg>
                  Read
                </span>
                <span className="ml-auto text-sm">
                  {currentSelectedMessage.status.toLowerCase() === "read" ? "Yes" : "-"}
                </span>
              </span>

              <span className="flex items-center mb-7 justify-between gap-4">
                <span className="flex items-center gap-2">
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
                    className="tick-icon mb-1"
                  >
                    <polyline points="20 6 9 17 4 12" />
                    <polyline points="26 6 15 17 20 12" />
                  </svg>
                  Delivered
                </span>
                <span className="text-sm ml-auto">
                  {currentSelectedMessage.status.toLowerCase() !== "sent" &&
                    currentSelectedMessage.deliveredAt ? (
                    formatTimestampV2(currentSelectedMessage.deliveredAt)
                  ) : (
                    "-"
                  )}
                </span>
              </span>
            </div>
          </div>
        </div>
      )}
      <HeaderWithInlineCard otherUserData={otherUserData} userId={userId} otherUserId={otherUserId ?? null} />;
      <ForwardModal
        showModal={showForwardModal}
        setShowModal={setShowForwardModal}
        data={usersForForward?.getUsersToForwardTo || []}
        onSendForwardedMessage={handleSendForwardedMessage}
      />

      {showCard && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div ref={cardRef} className="absolute top-44 right-4 bg-white shadow-md rounded-lg p-4 z-20 w-48">
            <ul className="space-y-8">
              {selectedMessages.length === 1 && (() => {
                const firstSelectedMessage = messages.find(msg => msg.id === selectedMessages[0]);
                return firstSelectedMessage && isWithinTimeLimit(firstSelectedMessage.timestamp);
              })() && (
                  <li className="cursor-pointer hover:text-blue-500" onClick={messageEdit}>
                    Edit
                  </li>
                )}

              {selectedMessages.length === 1 && messages.find(msg => msg.id === selectedMessages[0]) && (
                <li className="cursor-pointer hover:text-blue-500" onClick={messageReply}>
                  Reply
                </li>
              )}

              {selectedMessages.length === 1 && messages.find(msg => msg.id === selectedMessages[0] && msg.sender.id === userId) && (
                <li className="cursor-pointer hover:text-blue-500" onClick={viewMessageInfo}>Info</li>
              )}
              <li className="cursor-pointer hover:text-blue-500">Copy</li>
              <li className="cursor-pointer hover:text-blue-500">Pin</li>
            </ul>
          </div>
        </div>
      )}

      {isEditing && currentSelectedMessage && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-xl shadow-xl w-[95%] max-w-lg">
            <p className="text-gray-500 text-sm mb-3">Editing message...</p>

            <div className="bg-gray-100 p-4 rounded text-gray-700 mb-4 opacity-60 max-h-32 overflow-y-auto">
              {currentSelectedMessage.content.length > 100
                ? `${currentSelectedMessage.content.substring(0, 100)}...`
                : currentSelectedMessage.content}
            </div>

            <textarea
              value={editMessage !== undefined ? editMessage : currentSelectedMessage.content.trim()}
              onChange={(e) => setEditMessage(e.target.value)}
              className="w-full h-32 border border-gray-300 p-3 rounded resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <div className="flex justify-end gap-4 mt-4">

              <button
                onClick={() => {
                  setSelectedMessages([]);
                  setIsEditing(false);
                }}
                className="text-gray-500 hover:text-red-500 text-lg"
              >
                ❌
              </button>

              <button
                className="text-green-500 hover:text-green-600 text-2xl disabled:text-gray-400 disabled:cursor-not-allowed"
                disabled={editMessage === "" || !currentSelectedMessage.content.trim()}
                onClick={handleEditMessage}
              >
                ✔
              </button>

            </div>
          </div>
        </div>
      )}

      {selectedMessages.length > 0 && (
        <div>
          <div className="bg-white p-4 shadow-md flex items-center justify-between fixed top-0 left-0 z-50 w-full overflow-hidden">
            <ArrowLeftOutlined className="text-xl cursor-pointer" onClick={handleArrowBack} />
            <p className='text-bold text-xl mr-36'>
              {selectedMessages.length}
            </p>
            <div>
              <StarOutlined className="text-2xl text-gray-600 hover:text-yellow-500 cursor-pointer mx-12" />
              <DeleteOutlined className="text-2xl text-gray-600 hover:text-red-500 cursor-pointer mx-12" onClick={handleDelete} />
              <FontAwesomeIcon
                icon={faShare}
                size="lg"
                className="text-2xl text-gray-600 hover:text-blue-500 cursor-pointer mx-12"
                onClick={handleForward}
              />
              <MoreOutlined className="text-3xl cursor-pointer" onClick={toggleCard} />
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col h-screen pt-12">
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
            <div className="space-y-8 pb-20">
              <div>
                {Object.keys(groupedMessages).map((timestamp, index) => (
                  <div key={index}>
                    {/* Render non-image messages */}
                    {groupedMessages[timestamp]
                      .filter((msg: any) => {
                        const isMe = msg.sender?.id === userId;
                        return (
                          !msg.content.startsWith('/chat-uploads') &&
                          !((isMe && msg.senderDFM) || (!isMe && msg.receiverDFM) || msg.delForAll)
                        );
                      })
                      .map((msg: any) => {
                        const isMe = msg.sender?.id === userId;
                        const isSelected = selectedMessages.includes(msg.id);
                        return (
                          <div
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
                                  className={`p-1 mb-2 border-l-4 rounded-md text-sm w-full ${isMe ? "bg-blue-600/50 text-white" : "bg-gray-500 text-black"
                                    }`}
                                >
                                  <span className="block font-semibold opacity-80">
                                    {messagesAll.find((m) => m.id === msg.repliedTo.id)?.sender?.id === userId
                                      ? "You"
                                      : chatSettings?.customUsername || otherUserData?.getOtherUserById?.username}
                                  </span>
                                  {msg.repliedTo.content.startsWith('/chat-uploads') ? (
                                    <img
                                      src={`http://localhost:5002${msg.repliedTo.content}`}
                                      alt="Reply preview"
                                      className="w-20 h-10 object-cover rounded-lg border border-gray-300 shadow-md transition-transform hover:scale-105"
                                    />
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
                                <div className="flex items-center justify-end mt-1">
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
                        msg.content?.startsWith("/chat-uploads") &&
                        msg.content &&
                        !((msg.sender?.id === userId && msg.senderDFM) ||
                          (msg.sender?.id !== userId && msg.receiverDFM) ||
                          msg.delForAll)
                      ).length > 0 && (

                        <div className="space-y-2 mt-2">
                          {/* My images */}
                          <div className="w-full flex justify-end">
                            <div
                              className={`border-2 border-green-600 p-2 rounded-lg ${filterImageMessages(groupedMessages[timestamp]).length > 1
                                ? "max-w-full"
                                : "inline-block"
                                }`}
                            >
                              {filterImageMessages(groupedMessages[timestamp]).length > 0 && (
                                <div className="mt-1 text-left w-full block">
                                  {groupedMessages[timestamp][0].wasForwarded && (
                                    <div className="flex items-center text-xs italic text-gray-700 mb-2">
                                      <FontAwesomeIcon icon={faShare} className="mr-1" />
                                      Forwarded
                                    </div>
                                  )}
                                </div>
                              )}
                              <div
                                className={`${filterImageMessages(groupedMessages[timestamp]).length > 1
                                  ? "grid grid-cols-2 gap-2"
                                  : ""
                                  }`}
                              >
                                {(() => {
                                  const allImages = filterImageMessages(groupedMessages[timestamp])
                                    .filter((msg: any) => msg.sender?.id === userId);

                                  const firstFour = allImages.slice(0, 4);
                                  const remainingCount = allImages.length - 4;

                                  return (
                                    <>
                                      {firstFour.map((msg: any, index: number) => {
                                        const isSelected = selectedMessages.includes(msg.id);
                                        const isGroup = allImages.length > 1;
                                        const isLastVisible = index === 3 && allImages.length > 4;

                                        return (
                                          <div key={msg.id} className="relative group">
                                            <img
                                              src={`http://localhost:5002${msg.content}`}
                                              alt=""
                                              className="w-32 h-32 object-cover rounded-lg border shadow-md"
                                              onClick={() => openImage(`http://localhost:5002${msg.content}`)}
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
                                                    {msg.status.toLowerCase() === "read" && (
                                                      <DoubleTick className="text-blue-900" />
                                                    )}
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
                                    {groupedMessages[timestamp][0].status.toLowerCase() === "sent" && (
                                      <SingleTick />
                                    )}
                                    {groupedMessages[timestamp][0].status.toLowerCase() ===
                                      "delivered" && <DoubleTick />}
                                    {groupedMessages[timestamp][0].status.toLowerCase() === "read" && (
                                      <DoubleTick className="text-blue-900" />
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
                                    className="w-32 h-32 object-cover rounded-lg border shadow-md"
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
                        msg.content?.startsWith("/chat-uploads") &&
                        msg.content &&
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
                              className={`border-2 border-yellow-400 p-2 rounded-lg ${filterImageMessages(groupedMessages[timestamp]).length === 1 ? "" : "max-w-full"
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
                                      <div key={msg.id} className="relative group">
                                        <img
                                          src={`http://localhost:5002${msg.content}`}
                                          alt=""
                                          className="w-32 h-32 object-cover rounded-lg border shadow-md"
                                          onClick={() => openImage(`http://localhost:5002${msg.content}`)}
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

          {showDeleteModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white w-1/3 rounded-lg shadow-lg p-6 relative">
                <h4 className="text-lg font-bold">
                  Delete {selectedMessages.length} Message(s)
                </h4>

                <div className="mt-6 text-right">
                  <button
                    className="block w-full text-left text-red-500 py-2 px-4 hover:bg-gray-100 rounded"
                    onClick={deleteMessagess}
                  >
                    Delete for me
                  </button>
                  <button
                    className={`block w-full text-left text-red-500 py-2 px-4 hover:bg-gray-100 rounded ${!canDeleteForEveryone ? 'hidden' : ''}`}
                    onClick={handleDeleteForEveryone}
                  >
                    Delete for everyone
                  </button>
                  <button
                    className="block w-full text-left text-gray-600 py-2 px-4 hover:bg-gray-100 rounded mt-4"
                    onClick={closeDeleteModal}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* {selectedImage && (
            <div className="fixed inset-0 z-50 bg-black bg-opacity-70 flex items-center justify-center">
              <div className="relative">
                <img
                  src={selectedImage}
                  alt="preview"
                  className="max-w-[90vw] max-h-[90vh] rounded-lg shadow-2xl"
                />
                <button
                  onClick={closeImage}
                  className="absolute top-2 right-2 bg-white rounded-full p-2 shadow hover:bg-gray-200 transition"
                >
                  ❌
                </button>
              </div>
            </div>
          )} */}

          {selectedImageIndex !== null && (
            <div className="fixed inset-0 z-50 bg-black bg-opacity-70 flex items-center justify-center">
              <div className="relative flex items-center">
                {selectedImageIndex > 0 && (
                  <button
                    onClick={goPrev}
                    className="absolute left-4 text-white text-4xl hover:scale-110 transition-transform"
                  >
                    ❮
                  </button>
                )}

                <img
                  src={selectedImage}
                  alt="preview"
                  className="max-w-[90vw] max-h-[90vh] rounded-lg shadow-2xl"
                />

                {selectedImageIndex < imageMessages.length - 1 && (
                  <button
                    onClick={goNext}
                    className="absolute right-4 text-white text-4xl hover:scale-110 transition-transform"
                  >
                    ❯
                  </button>
                )}

                <button
                  onClick={closeImage}
                  className="absolute top-2 right-2 bg-white rounded-full p-2 shadow hover:bg-gray-200 transition"
                >
                  ❌
                </button>
              </div>
            </div>
          )}

          <div className="relative pb-16">
            {showReplyCard && storedReplyMessage && (
              <div className="absolute bottom-16 w-full flex justify-center">
                <div className="relative bg-gray-100 p-3 rounded-lg shadow-md max-w-4xl w-full mx-auto text-sm text-gray-700 opacity-70 pointer-events-auto">

                  <button
                    onClick={() => {
                      localStorage.removeItem(`replyMessage_${userId}_${otherUserId}`);
                      setShowReplyCard(false);
                    }}
                    className="absolute top-2 right-2 text-xl text-gray-500 hover:text-gray-700 transition duration-200 ease-in-out"
                  >
                    ✖
                  </button>

                  <p className="font-semibold">
                    {storedReplyMessage.senderId === userId ? "You" : "Other User"}
                  </p>
                  {storedReplyMessage.content.startsWith('/chat-uploads') ? (
                    <img
                      src={`http://localhost:5002${storedReplyMessage.content}`}
                      alt="Reply preview"
                      className="w-20 h-10 object-cover rounded-lg border border-gray-300 shadow-md cursor-pointer transition-transform hover:scale-105"
                      onClick={() => openImage(`http://localhost:5002${storedReplyMessage.content}`)}
                    />
                  ) : (
                    <p>{storedReplyMessage.content}</p>
                  )}
                </div>
              </div>
            )}

            <div className="fixed bottom-0 w-full shadow-lg">
              <div className="flex items-center justify-between max-w-4xl mx-auto p-4 space-x-4">
                <TextArea
                  value={newMessage}
                  onChange={(e) => {
                    setNewMessage(e.target.value);
                    handleTyping();
                  }}
                  placeholder={
                    selectedImages.length > 0
                      ? "Remove image(s) to type a message..."
                      : "Type your message..."
                  }
                  aria-label="Message Input"
                  className="flex-grow resize-none rounded-lg border border-gray-300 bg-white p-3 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200 ease-in-out disabled:cursor-not-allowed disabled:opacity-60"
                  rows={2}
                  disabled={selectedImages.length > 0}
                />

                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    id="image-upload"
                    onChange={handleImageChange}
                  />
                  <label htmlFor="image-upload" className="flex items-center justify-center bg-gray-200 w-10 h-10 rounded-full hover:bg-gray-300 shadow-lg transition duration-200 ease-in-out cursor-pointer">
                    <PaperClipOutlined className="text-xl" />
                  </label>
                </div>

                <button
                  onClick={() => setIsEmojiPickerVisible((prev) => !prev)}
                  className="flex items-center justify-center bg-gray-200 w-10 h-10 rounded-full hover:bg-gray-300 shadow-lg transition duration-200 ease-in-out"
                >
                  <span role="img" aria-label="emoji" className="text-xl">😊</span>
                </button>

                {selectedImages.length === 0 ? (
                  <button
                    onClick={sendMessage}
                    className="bg-blue-600 text-white px-4 py-2 rounded-full flex items-center gap-2 hover:bg-blue-700 disabled:bg-gray-400 shadow-lg transition duration-200 ease-in-out"
                    disabled={!newMessage.trim()}
                  >
                    <SendOutlined style={{ fontSize: '20px' }} />
                    Send
                  </button>
                ) : (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      uploadImageAndSend();
                    }}
                    className="bg-blue-600 text-white px-4 py-2 rounded-full flex items-center gap-2 hover:bg-blue-700 disabled:bg-gray-400 shadow-lg transition duration-200 ease-in-out"
                  >
                    <SendOutlined style={{ fontSize: '20px' }} />
                    Send
                  </button>
                )}
              </div>

              {selectedImages.length > 0 && (
                <div className="flex flex-wrap gap-3 px-6 pb-2">
                  {selectedImages.map((image, index) => (
                    <div key={index} className="relative w-20 h-20 border rounded-lg overflow-hidden shadow-sm">
                      <img
                        src={URL.createObjectURL(image)}
                        alt={`preview-${index}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        onClick={() => removeImage(index)}
                        className="absolute top-0 right-0 bg-white bg-opacity-80 p-1 rounded-bl"
                      >
                        <CloseOutlined className="text-xs text-red-600" />
                      </button>
                    </div>
                  ))}
                </div>
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
