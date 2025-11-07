import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  TextField,
  IconButton,
  Typography,
  List,
  ListItem,
  ListItemText,
  Avatar,
  Button,
  Badge
} from '@mui/material';
import { Send, AttachFile, EmojiEmotions } from '@mui/icons-material';
import { api } from '../../services/api';

const ChatArea = ({ 
  selectedChat, 
  currentUser, 
  messages, 
  onSendMessage, 
  onTyping, 
  onStopTyping,
  onFileUpload,
  typingUsers = new Map(),
  onlineUsers = [],
  onLoadMore,
  hasMoreMessages,
  isLoadingMore
}) => {
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleScroll = (e) => {
    const { scrollTop } = e.target;
    if (scrollTop === 0 && hasMoreMessages && !isLoadingMore) {
      onLoadMore();
    }
  };

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      onSendMessage(newMessage);
      setNewMessage('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    } else if (e.key !== 'Enter') {
      onTyping();
    }
  };

  const handleInputChange = (e) => {
    setNewMessage(e.target.value);
    if (e.target.value.trim()) {
      onTyping();
    } else {
      onStopTyping();
    }
  };

  if (!selectedChat) {
    return (
      <Box sx={{ 
        flex: 1, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        bgcolor: '#f8f9fa'
      }}>
        <Typography variant="h6" color="textSecondary">
          Select a chat to start messaging
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Chat Header */}
      <Paper elevation={1} sx={{ p: 2, borderRadius: 0, borderBottom: '1px solid #e0e0e0' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {selectedChat.type === 'general' ? (
            <>
              <Avatar sx={{ width: 32, height: 32, mr: 2, bgcolor: '#ff6b35' }}>
                #
              </Avatar>
              <Box>
                <Typography variant="h6">{selectedChat.name}</Typography>
                <Typography variant="body2" color="textSecondary">
                  General chat for everyone
                </Typography>
              </Box>
            </>
          ) : (
            <>
              <Badge
                color={onlineUsers.includes(selectedChat.id) ? 'success' : 'default'}
                variant="dot"
                sx={{ mr: 2 }}
              >
                <Avatar sx={{ width: 32, height: 32, bgcolor: '#ff6b35' }}>
                  {selectedChat.name.charAt(0)}
                </Avatar>
              </Badge>
              <Box>
                <Typography variant="h6">{selectedChat.name}</Typography>
                <Typography variant="body2" color="textSecondary">
                  {onlineUsers.includes(selectedChat.id) ? 'Online' : 'Offline'}
                </Typography>
              </Box>
            </>
          )}
        </Box>
      </Paper>

      {/* Messages Area */}
      <Box 
        ref={messagesContainerRef}
        onScroll={handleScroll}
        sx={{ flex: 1, overflow: 'auto', p: 1, bgcolor: '#ffffff' }}
      >
        {isLoadingMore && (
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <Typography variant="body2" color="textSecondary">
              Loading more messages...
            </Typography>
          </Box>
        )}
        <List sx={{ p: 0 }}>
          {messages.map((message, index) => {
            const isOwnMessage = message.senderId === (currentUser.userId || currentUser.id);
            return (
              <ListItem key={index} sx={{ 
                py: 0.5, 
                flexDirection: isOwnMessage ? 'row-reverse' : 'row',
                alignItems: 'flex-start'
              }}>
                <Avatar sx={{ 
                  width: 36, 
                  height: 36, 
                  mx: 2, 
                  mt: 0.5, 
                  bgcolor: isOwnMessage ? '#ff6b35' : '#4ecdc4' 
                }}>
                  {message.senderName?.charAt(0) || 'U'}
                </Avatar>
                <Box sx={{ 
                  flex: 1, 
                  display: 'flex', 
                  flexDirection: 'column',
                  alignItems: isOwnMessage ? 'flex-end' : 'flex-start'
                }}>
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'baseline', 
                    mb: 0.5,
                    flexDirection: isOwnMessage ? 'row-reverse' : 'row'
                  }}>
                    <Typography variant="subtitle2" sx={{ 
                      fontWeight: 600, 
                      mx: 1,
                      color: isOwnMessage ? '#ff6b35' : '#2d3436'
                    }}>
                      {isOwnMessage ? 'You' : message.senderName}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {new Date(message.sentAt).toLocaleTimeString()}
                    </Typography>
                  </Box>
                  <Box sx={{
                    bgcolor: isOwnMessage ? '#fff0eb' : '#f0fdfc',
                    p: 1.5,
                    borderRadius: '12px',
                    maxWidth: '70%',
                    border: isOwnMessage ? '1px solid #ff6b35' : '1px solid #4ecdc4',
                    boxShadow: 'none'
                  }}>
                    {message.messageType === 'FILE' ? (
                      <Box>
                        <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                          File shared:
                        </Typography>
                        <Button 
                          size="small" 
                          variant="outlined"
                          onClick={() => api.downloadFile(message.fileId, message.fileName)}
                          sx={{ 
                            textTransform: 'none',
                            justifyContent: 'flex-start'
                          }}
                        >
                          📎 {message.fileName || 'Download File'}
                        </Button>
                      </Box>
                    ) : (
                      <Typography variant="body1" sx={{ wordBreak: 'break-word' }}>
                        {message.content}
                      </Typography>
                    )}
                  </Box>
                </Box>
              </ListItem>
            );
          })}
        </List>
        
        {typingUsers.size > 0 && (
          <Box sx={{ px: 2, py: 1 }}>
            {Array.from(typingUsers.entries()).map(([userId, userName]) => (
              <Box key={userId} sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                <Avatar sx={{ width: 24, height: 24, mr: 1, bgcolor: '#666666' }}>
                  {userName?.charAt(0) || 'U'}
                </Avatar>
                <Typography variant="body2" color="textSecondary" sx={{ fontStyle: 'italic' }}>
                  {userName} is typing...
                </Typography>
              </Box>
            ))}
          </Box>
        )}
        <div ref={messagesEndRef} />
      </Box>

      {/* Message Input */}
      <Box sx={{ p: 2, borderTop: '1px solid #e0e0e0', bgcolor: '#ffffff' }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1 }}>
          <TextField
            fullWidth
            multiline
            maxRows={4}
            value={newMessage}
            onChange={handleInputChange}
            onKeyDown={handleKeyPress}
            onBlur={onStopTyping}
            placeholder={`Message ${selectedChat.type === 'general' ? '#general' : selectedChat.name}`}
            variant="outlined"
            size="small"
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '20px',
                bgcolor: '#f8f9fa',
                border: '1px solid #e0e0e0',
                '&:hover': {
                  borderColor: '#ff6b35'
                },
                '&.Mui-focused': {
                  borderColor: '#ff6b35'
                }
              }
            }}
          />
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => {
              onFileUpload(e.target.files[0]);
              e.target.value = '';
            }}
            style={{ display: 'none' }}
          />
          <IconButton onClick={() => fileInputRef.current?.click()}>
            <AttachFile />
          </IconButton>
          <IconButton onClick={handleSendMessage} color="primary">
            <Send />
          </IconButton>
        </Box>
      </Box>
    </Box>
  );
};

export default ChatArea;