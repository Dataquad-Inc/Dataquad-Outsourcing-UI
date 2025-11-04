import React, { useState, useEffect } from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  TextField,
  Typography,
  Avatar,
  Divider,
  Badge,
  Tooltip
} from '@mui/material';
import { Search, Tag, Person } from '@mui/icons-material';
import { api } from '../../services/api';

const Sidebar = ({ currentUser, selectedChat, onChatSelect, onlineUsers, unreadCounts, onClearUnread, directMessageUsers }) => {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    api.getAllUsers().then(setUsers).catch(console.error);
  }, []);

  const searchResults = searchTerm ? users.filter(user => {
    const userId = user.userId || user.id;
    const userName = user.userName || user.name;
    const currentUserId = currentUser.userId || currentUser.id;
    return userId !== currentUserId && 
           userName.toLowerCase().includes(searchTerm.toLowerCase());
  }).map(user => ({
    ...user,
    id: user.userId || user.id,
    name: user.userName || user.name
  })) : [];

  const addToDirectMessages = (user) => {
    onChatSelect({ type: 'direct', ...user }, true);
    onClearUnread(user.id);
    setSearchTerm('');
  };

  const handleDirectMessageSelect = (user) => {
    onChatSelect({ type: 'direct', ...user });
    onClearUnread(user.id);
  };

  return (
    <Box sx={{ width: 280, bgcolor: '#ffffff', color: 'black', height: '100%', borderRight: '1px solid #e0e0e0', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 3, borderBottom: '1px solid #e0e0e0' }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 700, color: '#1d1c1d' }}>Mulya Messenger</Typography>
        <TextField
          fullWidth
          size="small"
          placeholder="Search users..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{
            '& .MuiOutlinedInput-root': {
              bgcolor: '#f8f9fa',
              color: 'black',
              '& input': { color: 'black' },
              '& fieldset': { borderColor: '#e0e0e0', borderRadius: '8px' },
              '&:hover fieldset': { borderColor: '#ff6b35' },
              '&.Mui-focused fieldset': { borderColor: '#ff6b35' }
            },
            '& .MuiInputBase-input::placeholder': {
              color: '#8b949e',
              opacity: 1
            }
          }}
          InputProps={{
            startAdornment: <Search sx={{ color: '#666666', mr: 1 }} />
          }}
        />
      </Box>

      <List sx={{ p: 0, flex: 1, overflow: 'auto' }}>
        <ListItem disablePadding>
          <ListItemButton
            selected={selectedChat?.type === 'general'}
            onClick={() => onChatSelect({ type: 'general', name: 'General', id: 'general' })}
            sx={{ 
              '&.Mui-selected': { bgcolor: '#ff8c00', color: 'white' },
              '&:hover': { bgcolor: '#f0f0f0', color: 'black' }
            }}
          >
            <Tag sx={{ mr: 2, color: '#666666' }} />
            <ListItemText primary="General" />
          </ListItemButton>
        </ListItem>

        <Divider sx={{ bgcolor: '#e0e0e0', my: 1 }} />

        {/* Search Results */}
        {searchTerm && searchResults.length > 0 && (
          <>
            <Box sx={{ maxHeight: 200, overflow: 'auto' }}>
              {searchResults.map((user) => (
                <ListItem key={`search-${user.id}`} disablePadding>
                  <Tooltip title={user.email || user.userEmail || `${user.name}@example.com`} placement="top">
                    <ListItemButton
                      onClick={() => addToDirectMessages(user)}
                      sx={{ '&:hover': { bgcolor: '#f0f0f0', color: 'black' } }}
                    >
                      <Avatar sx={{ width: 24, height: 24, bgcolor: '#ff6b35', mr: 2, fontSize: '12px', fontWeight: 600 }}>
                        {user.name.charAt(0)}
                      </Avatar>
                      <ListItemText primary={user.name} />
                    </ListItemButton>
                  </Tooltip>
                </ListItem>
              ))}
            </Box>
            <Divider sx={{ bgcolor: '#e0e0e0', my: 1 }} />
          </>
        )}

        <Box sx={{ px: 2, py: 1 }}>
          <Typography variant="caption" sx={{ color: '#666666' }}>
            DIRECT MESSAGES
          </Typography>
        </Box>

        {directMessageUsers.map((user) => {
          const unreadCount = unreadCounts[user.id] || 0;
          return (
            <ListItem key={user.id} disablePadding>
              <ListItemButton
                selected={selectedChat?.id === user.id}
                onClick={() => handleDirectMessageSelect(user)}
                sx={{ 
                  '&.Mui-selected': { bgcolor: '#ff8c00', color: 'white' },
                  '&:hover': { bgcolor: '#f0f0f0', color: 'black' }
                }}
              >
                <Badge
                  color={onlineUsers.includes(user.id) ? 'success' : 'default'}
                  variant="dot"
                  sx={{ mr: 2 }}
                >
                  <Avatar sx={{ width: 24, height: 24, bgcolor: '#ff6b35', fontSize: '12px', fontWeight: 600 }}>
                    {user.name.charAt(0)}
                  </Avatar>
                </Badge>
                <ListItemText primary={user.name} />
                {unreadCount > 0 && (
                  <Badge 
                    badgeContent={unreadCount} 
                    color="error" 
                    sx={{ 
                      '& .MuiBadge-badge': { 
                        fontSize: '0.75rem',
                        minWidth: '18px',
                        height: '18px'
                      } 
                    }}
                  />
                )}
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
    </Box>
  );
};

export default Sidebar;