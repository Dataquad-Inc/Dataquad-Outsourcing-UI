import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, 
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent
} from '@mui/material';
import { Close } from '@mui/icons-material';
import { useWebSocket } from '../../hooks/useWebSocket';
import { api } from '../../services/api';
import Sidebar from '../Chat/Sidebar';
import ChatArea from '../Chat/ChatArea';
import '../Chat/Chat.css';

const Chat = ({ user, open, onClose, onUnreadCountChange }) => {
  const [messages, setMessages] = useState([]);
  const [selectedChat, setSelectedChat] = useState({ type: 'general', name: 'General', id: 'general' });
  const [typingUsers, setTypingUsers] = useState(new Map());
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [allUsers, setAllUsers] = useState([]);
  const [directMessageUsers, setDirectMessageUsers] = useState(() => {
    const saved = localStorage.getItem(`directMessages_${user.userId}`);
    return saved ? JSON.parse(saved) : [];
  });
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const typingTimeoutRef = useRef(null);
  
  const onMessageReceived = (message) => {
    const currentUserId = user.userId;
    const selectedUserId = selectedChat.userId || selectedChat.id;
    
    // Add message to current chat view
    if ((selectedChat.type === 'general' && !message.recipientId) ||
        (selectedChat.type === 'direct' && message.recipientId && 
         ((message.senderId === selectedUserId && message.recipientId === currentUserId) ||
          (message.senderId === currentUserId && message.recipientId === selectedUserId)))) {
      setMessages(prev => [...prev, message]);
    }
    
    // Handle unread counts for messages not in current view
    if (message.senderId !== currentUserId) {
      if (!message.recipientId) {
        // General message - increment unread if not viewing general chat
        if (selectedChat.type !== 'general') {
          setUnreadCounts(prev => ({
            ...prev,
            general: (prev.general || 0) + 1
          }));
        }
      } else if (message.recipientId === currentUserId) {
        // Direct message to current user
        const senderUser = allUsers.find(u => (u.userId || u.id) === message.senderId);
        
        if (senderUser && !directMessageUsers.find(u => u.id === message.senderId)) {
          const newUser = {
            id: senderUser.userId || senderUser.id,
            name: senderUser.userName || senderUser.name
          };
          setDirectMessageUsers(prev => {
            const newDirectMessages = [...prev, newUser];
            localStorage.setItem(`directMessages_${currentUserId}`, JSON.stringify(newDirectMessages));
            return newDirectMessages;
          });
        }
        
        // Increment unread count if not viewing this direct chat
        if (selectedChat.type !== 'direct' || selectedUserId !== message.senderId) {
          setUnreadCounts(prev => ({
            ...prev,
            [message.senderId]: (prev[message.senderId] || 0) + 1
          }));
        }
      }
    }
  };

  const onTypingReceived = (typingData) => {
    try {
      const data = JSON.parse(typingData);
      const currentUserId = user.userId;
      const selectedUserId = selectedChat.userId || selectedChat.id;
      
      if (data.userId === currentUserId) return;
      if (selectedChat.type === 'direct' && data.userId !== selectedUserId) return;
      
      setTypingUsers(prev => {
        const newMap = new Map(prev);
        if (data.isTyping) {
          newMap.set(data.userId, data.userName);
        } else {
          newMap.delete(data.userId);
        }
        return newMap;
      });
    } catch (error) {
      if (typeof typingData === 'string' && typingData.includes('is typing')) {
        const userName = typingData.replace(' is typing...', '');
        setTypingUsers(prev => {
          const newMap = new Map(prev);
          newMap.set('unknown', userName);
          return newMap;
        });
        setTimeout(() => {
          setTypingUsers(prev => {
            const newMap = new Map(prev);
            newMap.delete('unknown');
            return newMap;
          });
        }, 3000);
      }
    }
  };

  const onStatusReceived = (status) => {
    setOnlineUsers(prev => {
      if (status.online) {
        return [...prev.filter(id => id !== status.userId), status.userId];
      } else {
        return prev.filter(id => id !== status.userId);
      }
    });
  };

  const { sendMessage, sendTyping, sendStopTyping } = useWebSocket(onMessageReceived, onTypingReceived, onStatusReceived, user.userId);

  useEffect(() => {
    if (open) {
      loadMessages();
      api.getAllUsers().then(setAllUsers).catch(console.error);
      api.login(user.userId).catch(console.error);
      
      const loadOnlineUsers = () => {
        api.getOnlineUsers().then(setOnlineUsers).catch(() => {});
      };
      
      loadOnlineUsers();
      const interval = setInterval(loadOnlineUsers, 30000);
      
      return () => clearInterval(interval);
    }
  }, [selectedChat, open]);

  const loadMessages = (page = 0, append = false) => {
    const currentUserId = user.userId;
    const selectedUserId = selectedChat.userId || selectedChat.id;
    
    if (selectedChat.type === 'general') {
      api.getMessages(page, 10).then(data => {
        if (data.length < 10) setHasMoreMessages(false);
        if (append) {
          setMessages(prev => [...data.reverse(), ...prev]);
        } else {
          setMessages(data.reverse());
        }
      }).catch(console.error);
    } else if (selectedChat.type === 'direct') {
      api.getDirectMessages(currentUserId, selectedUserId, page, 10).then(data => {
        if (data.length < 10) setHasMoreMessages(false);
        if (append) {
          setMessages(prev => [...data.reverse(), ...prev]);
        } else {
          setMessages(data.reverse());
        }
      }).catch(console.error);
    }
  };

  const loadMoreMessages = () => {
    if (isLoadingMore || !hasMoreMessages) return;
    setIsLoadingMore(true);
    const nextPage = currentPage + 1;
    setCurrentPage(nextPage);
    loadMessages(nextPage, true);
    setTimeout(() => setIsLoadingMore(false), 500);
  };

  const handleSendMessage = (content) => {
    handleStopTyping();
    
    const messageData = {
      senderId: user.userId,
      content,
      messageType: 'TEXT'
    };

    if (selectedChat.type === 'direct') {
      messageData.recipientId = selectedChat.userId || selectedChat.id;
    }

    sendMessage(messageData);
  };

  const handleTyping = () => {
    const currentUserId = user.userId;
    const recipientId = selectedChat.type === 'direct' ? (selectedChat.userId || selectedChat.id) : null;
    
    sendTyping(currentUserId, recipientId);
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      sendStopTyping(currentUserId, recipientId);
    }, 2000);
  };
  
  const handleStopTyping = () => {
    const currentUserId = user.userId;
    const recipientId = selectedChat.type === 'direct' ? (selectedChat.userId || selectedChat.id) : null;
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    sendStopTyping(currentUserId, recipientId);
  };

  const handleFileUpload = async (file) => {
    if (file && file.size <= 10 * 1024 * 1024) {
      try {
        const chatType = selectedChat.type === 'general' ? 'GENERAL' : 'DIRECT';
        const recipientId = selectedChat.type === 'direct' ? (selectedChat.userId || selectedChat.id) : null;
        
        const fileId = await api.uploadFile(file, user.userId, chatType, recipientId);
        
        const fileMessage = {
          senderId: user.userId,
          content: `📎 ${file.name}`,
          messageType: 'FILE',
          fileId: parseInt(fileId)
        };

        if (selectedChat.type === 'direct') {
          fileMessage.recipientId = recipientId;
        }

        sendMessage(fileMessage);
      } catch (error) {
        console.error('File upload failed:', error);
      }
    }
  };

  const handleChatSelect = (chat, addToDirectMessages = false) => {
    if (addToDirectMessages && !directMessageUsers.find(u => u.id === chat.id)) {
      const newDirectMessages = [...directMessageUsers, chat];
      setDirectMessageUsers(newDirectMessages);
      localStorage.setItem(`directMessages_${user.userId}`, JSON.stringify(newDirectMessages));
    }
    setSelectedChat(chat);
    setMessages([]);
    setCurrentPage(0);
    setHasMoreMessages(true);
    setTypingUsers(new Map());
  };

  const handleClearUnread = (userId) => {
    setUnreadCounts(prev => {
      const updated = { ...prev };
      delete updated[userId];
      return updated;
    });
  };
  
  // Calculate and send total unread count to parent
  useEffect(() => {
    if (onUnreadCountChange) {
      const total = Object.values(unreadCounts).reduce((sum, count) => sum + count, 0);
      onUnreadCountChange(total);
    }
  }, [unreadCounts, onUnreadCountChange]);

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="lg" 
      fullWidth
      PaperProps={{ sx: { height: '80vh' } }}
    >
      <DialogContent sx={{ p: 0, height: '100%', position: 'relative' }}>
        <IconButton 
          onClick={onClose}
          sx={{ position: 'absolute', top: 8, right: 8, zIndex: 1000, bgcolor: 'rgba(255,255,255,0.8)' }}
        >
          <Close />
        </IconButton>
        <Box sx={{ display: 'flex', height: '100%', bgcolor: '#ffffff' }}>
          <Sidebar 
            currentUser={user}
            selectedChat={selectedChat}
            onChatSelect={handleChatSelect}
            onlineUsers={onlineUsers}
            unreadCounts={unreadCounts}
            onClearUnread={handleClearUnread}
            directMessageUsers={directMessageUsers}
          />
          <ChatArea 
            selectedChat={selectedChat}
            currentUser={user}
            messages={messages}
            onSendMessage={handleSendMessage}
            onTyping={handleTyping}
            onStopTyping={handleStopTyping}
            onFileUpload={handleFileUpload}
            typingUsers={typingUsers}
            onlineUsers={onlineUsers}
            onLoadMore={loadMoreMessages}
            hasMoreMessages={hasMoreMessages}
            isLoadingMore={isLoadingMore}
          />
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default Chat;