import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Avatar, Input, Spin, notification } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { SendOutlined } from '@ant-design/icons';
import { jwtDecode } from 'jwt-decode';
import socket from '../socket';
import { useAuth } from '../contexts/AuthContext';
import { useGetChatMessages, useCheckUserOnline, useUpdateMessageStatus } from '../hooks/useGetChatMessages';
import { useGetOtherUserById } from '../hooks/useGetOtherUser';
import '../App.css';

const { TextArea } = Input;

const InteractPage = () => {
  const { id: otherUserId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [userId, setUserId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const [isOtherUserTyping, setIsOtherUserTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const typingTimeoutR = useRef<NodeJS.Timeout | null>(null); //For ChatPage Component
  const [scrollLock, setScrollLock] = useState(false);
  const [isReceiverOnPage, setIsReceiverOnPage] = useState(false);
  const [newMessageCount, setNewMessageCount] = useState(0);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const maxLength = 200;
  const [expandedMessages, setExpandedMessages] = useState<Set<string>>(new Set());

  const { data, loading, error, refetch } = useGetChatMessages(userId, otherUserId ?? null);
  const { data: onlineData, loading: onlineLoading, error: onlineError, refetch: isOnlineRefetch } = useCheckUserOnline(otherUserId ?? null);
  const { data: otherUserData, loading: otherUserLoading, refetch: otherUserRefetch } = useGetOtherUserById(otherUserId ?? null);
  const { updateMessageStatus } = useUpdateMessageStatus();

  const handleBackNavigation = () => {
    navigate(-1);
  };

  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = 'http://localhost:5002/uploads/whatsapp-wallpaper.jpg';
    document.head.appendChild(link);
  }, []);

  useEffect(() => {
    // Scroll to the bottom of the page
    window.scrollTo(0, document.body.scrollHeight);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (otherUserData) {
        otherUserRefetch();
      }
    }, 5000);

    // Cleanup the interval when the component unmounts
    return () => clearInterval(interval);
  }, [otherUserData, otherUserRefetch]);

  useEffect(() => {
    setIsReceiverOnPage(true);

    return () => {
      setIsReceiverOnPage(false);
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(async () => {
      if (!otherUserId || !userId) return;

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

      if (onlineData?.isUserOnline) {
        const sentMessages = messages.filter((msg) => msg.status.toLowerCase() === 'sent');

        sentMessages.forEach(async (msg) => {
          try {
            await updateMessageStatus(msg.id, 'DELIVERED');

            setMessages((prev) =>
              prev.map((message) =>
                message.id === msg.id ? { ...message, status: 'DELIVERED' } : message
              )
            );

            const transformedMessage = {
              sender: { id: msg.sender.id },
              receiver: { id: msg.receiver.id },
              content: msg.content,
              timestamp: msg.timestamp,
              status: 'DELIVERED',
              id: msg.id,
            };
            socket.emit('otherUserOnline', { userId, otherUserId, transformedMessage });
          } catch (err) {
            console.error('Error updating message statuses:', err);
          }
        });
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [messages, otherUserId, userId, onlineData, onlineLoading, onlineError, updateMessageStatus, setMessages, isOnlineRefetch]);

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
          const transformedMessage = {
            sender: { id: msg.sender.id },
            receiver: { id: msg.receiver.id },
            content: msg.content,
            timestamp: msg.timestamp,
            status: 'READ',
            id: msg.id,
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
            };

            socket.emit('updateMessageStatusRead', { userId, otherUserId, transformedMessage });
          } catch (error) {
            console.error('Error updating message statuses:', error);
          }
        });
      }
    }, 2000);

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
    socket.on('receiveMessage', (message) => {
      setMessages((prevMessages) => {
        const newMessages = [...prevMessages, message];

        if (message.sender.id !== userId && !isAtBottom) {
          setNewMessageCount((prevCount) => prevCount + 1);
        }

        return newMessages;
      });

      if (message.sender.id !== userId && isAtBottom) {
        socket.emit('resetUnreadCount', { userId, otherUserId });
      }
    });

    socket.on('userTyping', ({ userId: typingUserId, typing }) => {
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

    socket.on('messageStatusUpdatedToRead', (updatedMessage) => {
      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg.id === updatedMessage.id ? updatedMessage : msg
        )
      );
    });

    return () => {
      socket.off('receiveMessage');
      socket.off('userTyping');
      // socket.off('messageDelivered');
      socket.off('messageStatusUpdatedToRead');
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

  const sendMessage = () => {
    if (!newMessage.trim()) {
      notification.error({ message: 'Message cannot be empty' });
      return;
    }

    if (!socket.connected) {
      notification.error({ message: 'Connection error', description: 'Unable to send message. Try again later.' });
      return;
    }

    const message = {
      sender: { id: userId },
      receiver: { id: otherUserId },
      content: newMessage,
      timestamp: new Date().toISOString(),
      status: 'SENT'
    };

    socket.emit('sendMessage', message);
    setNewMessage('');
    localStorage.removeItem(`message_${userId}_${otherUserId}`);

    setTimeout(() => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }, 500);
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
    const { truncated, fullContent } = truncateMessage(message.content);

    // If the message is long and needs truncation
    if (fullContent) {
      const isExpanded = expandedMessages.has(message.id);
      return (
        <>
          <span>{isExpanded ? fullContent : truncated}</span>
          {!isExpanded && (
            <button
              onClick={() => handleReadMore(message.id)}
              className="text-yellow-800 text-sm"
            >
              Read More
            </button>
          )}
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

  if (loading) return <Spin size="large" className="flex justify-center items-center h-screen" />;
  if (otherUserLoading) return <Spin size="large" className="flex justify-center items-center h-screen" />;
  if (error) return <p>Error: {error.message}</p>;

  return (
    <div>
      <div className="bg-white p-4 shadow-md flex items-center justify-between fixed top-0 left-0 z-10 w-full overflow-hidden">
        <ArrowLeftOutlined onClick={handleBackNavigation} className="text-xl cursor-pointer" />
        <div className="flex items-center space-x-4">
          <Avatar src={`http://localhost:5002${otherUserData?.getOtherUserById?.profilePicture}`} />
          <div className="flex flex-col">
            <span className="font-semibold">{otherUserData?.getOtherUserById?.username}</span>
            <span className={`text-sm ${otherUserData?.getOtherUserById?.isOnline ? 'text-green-500' : 'text-gray-500'}`}>
              {otherUserData?.getOtherUserById?.isOnline ? 'Online' : 'Offline'}
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-col h-screen pt-20">
        <div className="flex-1 p-4 background-container">
          <div className='overflow-y-auto scrollbar-hide' onScroll={handleScroll}>
            <div className="space-y-8 pb-20">
              {messages.map((msg: any, index: number) => {
                const isMe = msg.sender?.id === userId;
                return (
                  <div
                    key={index}
                    className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                  >
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
                        padding: '12px 16px',
                        transition: 'all 0.3s ease',
                      }}
                    >
                      {renderMessageContent(msg)}
                      <small className="block text-xs mt-1 text-right">
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


                      {isMe && (
                        <div className="chat-pointer"></div>
                      )}
                    </div>
                  </div>
                );
              })}

              {newMessageCount > 0 && !isAtBottom && (
                <div className="absolute bottom-32 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white p-3 rounded-lg shadow-md flex items-center justify-between w-full max-w-xs">
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
                  <div className="relative max-w-16 h-11 text-black p-4 rounded-lg"
                    style={{
                      background: 'linear-gradient(135deg, rgba(156, 163, 175, 1) 0%, rgba(107, 114, 128, 1) 100%)',
                    }}
                  >
                    {/* Pointed extension (speech bubble) */}
                    <div className="absolute bottom-0 left-0 w-4 h-4 transform translate-y-1/2 -translate-x-1/2 rotate-45 clip-path-polygon"
                      style={{
                        background: 'linear-gradient(135deg, rgba(156, 163, 175, 1) 0%, rgba(107, 114, 128, 1) 100%)',
                      }}
                    ></div>

                    <div className="flex items-center space-x-1 pt-2">
                      <span className="w-4 h-4 rounded-full animate-wave motion-safe:animate-wave" style={{ backgroundColor: '#1B5E20' }}></span>
                      <span className="w-4 h-4 bg-indigo-700 rounded-full animate-waveMiddle motion-safe:animate-waveMiddle"></span>
                      <span className="w-4 h-4 bg-purple-800 rounded-full animate-waveReverse motion-safe:animate-waveReverse"></span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef}></div>
            </div>
          </div>

          <div className="relative pb-16">
            <div className="fixed bottom-0 w-full shadow-lg">
              <div className="flex items-center justify-between max-w-4xl mx-auto p-4 space-x-4">
                <TextArea
                  value={newMessage}
                  onChange={(e) => {
                    setNewMessage(e.target.value);
                    handleTyping();
                  }}
                  placeholder="Type your message..."
                  aria-label="Message Input"
                  className="flex-grow resize-none rounded-lg border border-gray-300 bg-white p-3 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200 ease-in-out"
                  rows={2}
                />
                <button
                  onClick={sendMessage}
                  className="flex items-center justify-center bg-blue-500 text-white w-12 h-12 rounded-full hover:bg-blue-600 disabled:bg-gray-400 shadow-lg transition duration-200 ease-in-out"
                  disabled={!newMessage.trim()}
                >
                  <SendOutlined style={{ fontSize: '24px' }} />
                </button>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default InteractPage;
