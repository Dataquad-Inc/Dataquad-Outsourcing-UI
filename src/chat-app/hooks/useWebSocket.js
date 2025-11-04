import { useEffect, useRef } from 'react';
import WebSocketService from '../services/websocket';

export const useWebSocket = (onMessageReceived, onTypingReceived, onStatusReceived, userId) => {
  const wsRef = useRef(null);

  useEffect(() => {
    wsRef.current = WebSocketService;
    wsRef.current.connect(onMessageReceived, onTypingReceived, onStatusReceived, userId);

    return () => {
      wsRef.current.disconnect();
    };
  }, [onMessageReceived, onTypingReceived, onStatusReceived, userId]);

  const sendMessage = (message) => {
    if (wsRef.current) {
      wsRef.current.sendMessage(message);
    }
  };

  const sendTyping = (userId, recipientId = null) => {
    if (wsRef.current) {
      wsRef.current.sendTyping(userId, recipientId);
    }
  };

  const sendStopTyping = (userId, recipientId = null) => {
    if (wsRef.current) {
      wsRef.current.sendStopTyping(userId, recipientId);
    }
  };

  return { sendMessage, sendTyping, sendStopTyping };
};