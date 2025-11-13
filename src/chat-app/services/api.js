const API_BASE_URL = 'https://mymulya.com/chatservice/api';

export const api = {
  getAllUsers: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/users/all`);
      if (!response.ok) throw new Error('Failed to fetch users');
      return response.json();
    } catch (error) {
      console.error('Error fetching users:', error);
      return [];
    }
  },

  login: async (userId) => {
    const response = await fetch(`${API_BASE_URL}/chat/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    });
    return response.text();
  },

  getMessages: async (page = 0, limit = 10) => {
    try {
      const response = await fetch(`${API_BASE_URL}/messages?page=${page}&limit=${limit}`);
      if (!response.ok) throw new Error('Failed to fetch messages');
      return response.json();
    } catch (error) {
      console.error('Error fetching messages:', error);
      return [];
    }
  },

  uploadFile: async (file, senderId, chatType, recipientId = null) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('senderId', senderId);
    formData.append('chatType', chatType);
    if (recipientId) {
      formData.append('recipientId', recipientId);
    }
    
    const response = await fetch(`${API_BASE_URL}/files/upload`, {
      method: 'POST',
      body: formData
    });
    if (!response.ok) {
      throw new Error('File upload failed');
    }
    return response.text();
  },

  getDirectMessages: async (userId1, userId2, page = 0, limit = 10) => {
    try {
      const response = await fetch(`${API_BASE_URL}/messages/direct?user1=${userId1}&user2=${userId2}&page=${page}&limit=${limit}`);
      if (!response.ok) throw new Error('Failed to fetch direct messages');
      return response.json();
    } catch (error) {
      console.error('Error fetching direct messages:', error);
      return [];
    }
  },

  getOnlineUsers: async () => {
    const response = await fetch(`${API_BASE_URL}/users/online`);
    return response.json();
  },

  downloadFile: async (fileId, fileName) => {
    try {
      const response = await fetch(`${API_BASE_URL}/files/${fileId}`);
      if (!response.ok) throw new Error('File download failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName || 'download';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download failed:', error);
    }
  }
};