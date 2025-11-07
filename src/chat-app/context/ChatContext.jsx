import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { api } from '../services/api';

const ChatContext = createContext();

const initialState = {
  messages: [],
  selectedChat: { type: 'general', name: 'General', id: 'general' },
  typingUsers: new Map(),
  onlineUsers: [],
  unreadCounts: {},
  allUsers: [],
  directMessageUsers: [],
  isConnected: false,
  connectionStatus: 'disconnected'
};

const chatReducer = (state, action) => {
  switch (action.type) {
    case 'SET_MESSAGES':
      return { ...state, messages: action.payload };
    case 'ADD_MESSAGE':
      return { ...state, messages: [...state.messages, action.payload] };
    case 'SET_SELECTED_CHAT':
      return { ...state, selectedChat: action.payload, messages: [] };
    case 'SET_TYPING_USERS':
      return { ...state, typingUsers: action.payload };
    case 'SET_ONLINE_USERS':
      return { ...state, onlineUsers: action.payload };
    case 'SET_UNREAD_COUNTS':
      return { ...state, unreadCounts: action.payload };
    case 'SET_ALL_USERS':
      return { ...state, allUsers: action.payload };
    case 'SET_DIRECT_MESSAGE_USERS':
      return { ...state, directMessageUsers: action.payload };
    case 'SET_CONNECTION_STATUS':
      return { ...state, connectionStatus: action.payload, isConnected: action.payload === 'connected' };
    case 'CLEAR_UNREAD':
      const newUnreadCounts = { ...state.unreadCounts };
      delete newUnreadCounts[action.payload];
      return { ...state, unreadCounts: newUnreadCounts };
    default:
      return state;
  }
};

export const ChatProvider = ({ children, user }) => {
  const [state, dispatch] = useReducer(chatReducer, {
    ...initialState,
    directMessageUsers: user ? JSON.parse(localStorage.getItem(`directMessages_${user.userId}`) || '[]') : []
  });

  useEffect(() => {
    if (user) {
      // Load initial data
      api.getAllUsers().then(users => {
        dispatch({ type: 'SET_ALL_USERS', payload: users });
      });
    }
  }, [user]);

  const contextValue = {
    state,
    dispatch,
    user
  };

  return (
    <ChatContext.Provider value={contextValue}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};