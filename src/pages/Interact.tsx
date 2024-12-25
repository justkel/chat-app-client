import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Input, Spin, notification } from 'antd';
import { jwtDecode } from 'jwt-decode';
import io from 'socket.io-client';
import { useAuth } from '../contexts/AuthContext';
import { useGetChatMessages, useCheckUserOnline, useUpdateMessageStatus } from '../hooks/useGetChatMessages';
import '../App.css';

const { TextArea } = Input;
const socket = io('http://localhost:5002', {
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 20000,
});

const InteractPage = () => {
  const { id: otherUserId } = useParams();
  const { user } = useAuth();
  const [userId, setUserId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const [isOtherUserTyping, setIsOtherUserTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isReceiverOnPage, setIsReceiverOnPage] = useState(false);

  const { data, loading, error, refetch } = useGetChatMessages(userId, otherUserId ?? null);
  const { data: onlineData, loading: onlineLoading, error: onlineError, refetch: isOnlineRefetch } = useCheckUserOnline(otherUserId ?? null);
  const { updateMessageStatus } = useUpdateMessageStatus();

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
            // socket.emit('otherUserOnline', { userId, otherUserId, message: msg.content });
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
        (msg) => msg.receiver.id === userId,
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
        (msg) => msg.status.toLowerCase() === 'delivered' && msg.receiver.id === userId
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
  }, [messages, userId, updateMessageStatus, otherUserId, isReceiverOnPage]);

  useEffect(() => {
    if (user) {
      try {
        const decodedToken: any = jwtDecode(user.token);
        setUserId(decodedToken.sub);
        socket.emit('joinRoom', { userId: decodedToken.sub, otherUserId });
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
      setMessages((prevMessages) => [...prevMessages, message]);
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
  }, [userId, otherUserId]);

  useEffect(() => {
    if (data && data.getChatMessages) {
      refetch();
      setMessages(data.getChatMessages);
    }
  }, [data, refetch]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Scroll to the bottom when the other user is typing
  useEffect(() => {
    if (isOtherUserTyping && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isOtherUserTyping]);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const handleTyping = () => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Emit typing signal
    socket.emit('typing', { userId, otherUserId, typing: true });

    // Set a timeout to stop showing the typing indicator after 3 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing', { userId, otherUserId, typing: false });
      typingTimeoutRef.current = null; // Clear the ref
    }, 1000);
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
  };

  if (loading) return <Spin size="large" className="flex justify-center items-center h-screen" />;
  if (error) return <p>Error: {error.message}</p>;

  return (
    <div className="flex flex-col h-screen">
      <div className="flex-1 overflow-y-auto p-4 bg-gray-100">
        <div className="space-y-4">
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
                  <p>{msg.content}</p>
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


                  {/* {isMe && (
                    <div className="chat-pointer"></div>
                  )} */}
                </div>
              </div>
            );
          })}

          <div ref={messagesEndRef}></div>
        </div>

        {isOtherUserTyping && (
          <div className="mt-4">
            <div className="relative max-w-16 h-11 bg-gray-300 text-black p-4 rounded-lg">
              {/* Pointed extension (speech bubble) */}
              <div className="absolute bottom-0 left-0 w-4 h-4 bg-gray-300 transform translate-y-1/2 -translate-x-1/2 rotate-45 clip-path-polygon"></div>

              <div className="flex items-center space-x-1 pt-2">
                <span className="w-4 h-4 rounded-full animate-wave motion-safe:animate-wave" style={{ backgroundColor: '#1B5E20' }}></span>
                <span className="w-4 h-4 bg-indigo-700 rounded-full animate-waveMiddle motion-safe:animate-waveMiddle"></span>
                <span className="w-4 h-4 bg-purple-800 rounded-full animate-waveReverse motion-safe:animate-waveReverse"></span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 bg-white border-t">
        <div className="flex items-center space-x-4">
          <TextArea
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              handleTyping();
            }}
            placeholder="Type a message..."
            aria-label="Message Input"
            className="flex-grow resize-none rounded-md border-gray-300 focus:ring-blue-500 focus:border-blue-500"
            rows={2}
          />
          <button
            onClick={sendMessage}
            className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 disabled:bg-gray-400"
            disabled={!newMessage.trim()}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default InteractPage;
