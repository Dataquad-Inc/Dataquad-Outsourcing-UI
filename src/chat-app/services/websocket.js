import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

class WebSocketService {
  constructor() {
    this.client = null;
    this.connected = false;
    this.messageQueue = [];
  }

  connect(onMessageReceived, onTypingReceived, onStatusReceived, userId) {
    const socket = new SockJS('https://mymulya.com/chatservice/ws');
    this.client = new Client({
      webSocketFactory: () => socket,
      onConnect: () => {
        this.connected = true;
        
        this.client.subscribe('/topic/general', (message) => {
          onMessageReceived(JSON.parse(message.body));
        });
        
        this.client.subscribe('/topic/typing', (message) => {
          onTypingReceived(message.body);
        });
        
        this.client.subscribe('/topic/status', (message) => {
          onStatusReceived(message.body);
        });
        
        if (userId) {
          this.client.subscribe(`/user/${userId}/queue/messages`, (message) => {
            onMessageReceived(JSON.parse(message.body));
          });
          
          this.client.subscribe(`/user/${userId}/queue/typing`, (message) => {
            onTypingReceived(message.body);
          });
        }
        
        while (this.messageQueue.length > 0) {
          const queuedMessage = this.messageQueue.shift();
          this.client.publish(queuedMessage);
        }
      },
      onDisconnect: () => {
        this.connected = false;
        console.log('WebSocket disconnected');
      },
      onStompError: (frame) => {
        console.error('STOMP error:', frame);
        this.connected = false;
      }
    });
    
    this.client.activate();
  }

  sendMessage(message) {
    const messageData = {
      destination: '/app/chat.sendMessage',
      body: JSON.stringify(message)
    };
    
    if (this.connected && this.client) {
      try {
        // Send immediately without waiting for response
        this.client.publish(messageData);
      } catch (error) {
        console.error('Failed to send message:', error);
        this.messageQueue.push(messageData);
      }
    } else {
      this.messageQueue.push(messageData);
    }
  }

  sendTyping(userId, recipientId = null) {
    const typingMessage = {
      senderId: userId,
      recipientId: recipientId
    };
    
    const typingData = {
      destination: '/app/chat.typing',
      body: JSON.stringify(typingMessage)
    };
    
    if (this.connected && this.client) {
      try {
        this.client.publish(typingData);
      } catch (error) {
        console.error('Failed to send typing indicator:', error);
      }
    }
  }

  sendStopTyping(userId, recipientId = null) {
    const stopTypingMessage = {
      senderId: userId,
      recipientId: recipientId
    };
    
    const stopTypingData = {
      destination: '/app/chat.stopTyping',
      body: JSON.stringify(stopTypingMessage)
    };
    
    if (this.connected && this.client) {
      try {
        this.client.publish(stopTypingData);
      } catch (error) {
        console.error('Failed to send stop typing indicator:', error);
      }
    }
  }

  disconnect() {
    if (this.client) {
      this.client.deactivate();
    }
  }
}

export default new WebSocketService();