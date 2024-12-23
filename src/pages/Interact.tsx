import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Input, Spin, notification } from 'antd';
import { jwtDecode } from 'jwt-decode';
import io from 'socket.io-client';
import { useAuth } from '../contexts/AuthContext';
import { useGetChatMessages } from '../hooks/useGetChatMessages';

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

  const { data, loading, error, refetch } = useGetChatMessages(userId, otherUserId ?? null);

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

    return () => {
      socket.off('receiveMessage');
      socket.off('userTyping');
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
              <div key={index} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-xs p-4 rounded-lg shadow ${isMe ? 'bg-blue-500 text-white' : 'bg-gray-300 text-black'} break-words`}
                  style={{ wordBreak: 'break-word' }}
                >
                  <p>{msg.content}</p>
                  <small className="block text-xs mt-1 text-right">
                    {new Date(msg.timestamp).toLocaleString()}
                  </small>
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
              <div className="absolute top-0 left-0 w-3 h-3 bg-gray-300 transform -translate-y-1/2 -translate-x-1/2 rotate-45"></div>

              <div className="flex items-center space-x-1 pt-2">
                <span className="w-4 h-4 rounded-full animate-wave motion-safe:animate-wave" style={{ backgroundColor: '#80d4ff' }}></span>
                <span className="w-4 h-4 bg-indigo-400 rounded-full animate-waveMiddle motion-safe:animate-waveMiddle"></span>
                <span className="w-4 h-4 bg-purple-500 rounded-full animate-waveReverse motion-safe:animate-waveReverse"></span>
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
