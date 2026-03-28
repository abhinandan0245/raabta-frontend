// src/features/socket/socketSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  isConnected: false,
  socketId: null,
  typingUsers: {}, // Structure: { [chatId]: { userId: string, username: string, isTyping: boolean, lastTypingTime: number }[] }
  onlineUsers: {}, // Structure: { [userId]: { isOnline: boolean, lastSeen: string, lastUpdated: string } }
  notifications: [], // Array of notification objects
  connectionError: null,
  lastActivity: null,
  reconnectionAttempts: 0,
  subscribedChats: [], // Array of chat IDs the user has joined
  contactStatuses: {}, // Contact-specific status: { [contactId]: { lastSeen: string, typingIn: string|null } }
};

const socketSlice = createSlice({
  name: 'socket',
  initialState,
  reducers: {
    // Connection status
    setSocketConnected: (state, action) => {
      state.isConnected = true;
      state.socketId = action.payload.socketId || null;
      state.connectionError = null;
      state.reconnectionAttempts = 0;
      state.lastActivity = new Date().toISOString();
    },
    
    setSocketDisconnected: (state, action) => {
      state.isConnected = false;
      state.socketId = null;
      state.lastActivity = new Date().toISOString();
      if (action.payload?.error) {
        state.connectionError = action.payload.error;
      }
    },
    
    setConnectionError: (state, action) => {
      state.connectionError = action.payload;
      state.lastActivity = new Date().toISOString();
    },
    
    incrementReconnectionAttempts: (state) => {
      state.reconnectionAttempts += 1;
    },
    
    resetReconnectionAttempts: (state) => {
      state.reconnectionAttempts = 0;
    },
    
    updateLastActivity: (state) => {
      state.lastActivity = new Date().toISOString();
    },
    
    // Typing indicators management
    setUserTyping: (state, action) => {
      const { chatId, userId, username, isTyping } = action.payload;
      
      if (!state.typingUsers[chatId]) {
        state.typingUsers[chatId] = [];
      }
      
      const existingUserIndex = state.typingUsers[chatId].findIndex(
        user => user.userId === userId
      );
      
      if (existingUserIndex >= 0) {
        if (isTyping) {
          state.typingUsers[chatId][existingUserIndex] = { 
            userId, 
            username: username || `User ${userId.substring(0, 4)}`, 
            isTyping: true,
            lastTypingTime: Date.now()
          };
        } else {
          // Remove user from typing list
          state.typingUsers[chatId] = state.typingUsers[chatId].filter(
            user => user.userId !== userId
          );
        }
      } else if (isTyping) {
        state.typingUsers[chatId].push({ 
          userId, 
          username: username || `User ${userId.substring(0, 4)}`, 
          isTyping: true,
          lastTypingTime: Date.now()
        });
      }
      
      state.lastActivity = new Date().toISOString();
    },
    
    clearTypingUsers: (state, action) => {
      const { chatId } = action.payload;
      if (state.typingUsers[chatId]) {
        state.typingUsers[chatId] = [];
      }
    },
    
    clearAllTypingIndicators: (state) => {
      state.typingUsers = {};
    },
    
    // Clean stale typing indicators (auto-called periodically)
    cleanStaleTypingIndicators: (state, action) => {
      const timeout = action.payload?.timeout || 10000; // 10 seconds default
      const now = Date.now();
      
      Object.keys(state.typingUsers).forEach(chatId => {
        state.typingUsers[chatId] = state.typingUsers[chatId].filter(user => {
          return (now - user.lastTypingTime) < timeout;
        });
        
        // Remove empty arrays
        if (state.typingUsers[chatId].length === 0) {
          delete state.typingUsers[chatId];
        }
      });
    },
    
    // Online status management
    setUserOnlineStatus: (state, action) => {
      const { userId, isOnline, lastSeen } = action.payload;
      
      state.onlineUsers[userId] = { 
        isOnline, 
        lastSeen: lastSeen || new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      };
      
      state.lastActivity = new Date().toISOString();
    },
    
    setMultipleUsersOnlineStatus: (state, action) => {
      const usersStatus = action.payload;
      
      Object.entries(usersStatus).forEach(([userId, status]) => {
        state.onlineUsers[userId] = {
          isOnline: status.isOnline,
          lastSeen: status.lastSeen || new Date().toISOString(),
          lastUpdated: new Date().toISOString()
        };
      });
      
      state.lastActivity = new Date().toISOString();
    },
    
    removeUserOnlineStatus: (state, action) => {
      const userId = action.payload;
      delete state.onlineUsers[userId];
    },
    
    clearAllOnlineStatuses: (state) => {
      state.onlineUsers = {};
    },
    
    // Notifications management
    addNotification: (state, action) => {
      const notification = {
        ...action.payload,
        id: action.payload.id || `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: action.payload.createdAt || new Date().toISOString(),
        isRead: false
      };
      
      state.notifications.unshift(notification);
      
      // Keep only last 100 notifications
      if (state.notifications.length > 100) {
        state.notifications = state.notifications.slice(0, 100);
      }
      
      state.lastActivity = new Date().toISOString();
    },
    
    markNotificationRead: (state, action) => {
      const notificationId = action.payload;
      const notification = state.notifications.find(n => n.id === notificationId);
      if (notification) {
        notification.isRead = true;
        notification.readAt = new Date().toISOString();
      }
    },
    
    markAllNotificationsRead: (state) => {
      state.notifications.forEach(notification => {
        notification.isRead = true;
        notification.readAt = new Date().toISOString();
      });
    },
    
    removeNotification: (state, action) => {
      const notificationId = action.payload;
      state.notifications = state.notifications.filter(n => n.id !== notificationId);
    },
    
    clearAllNotifications: (state) => {
      state.notifications = [];
    },
    
    // Chat room subscriptions
    addSubscribedChat: (state, action) => {
      const chatId = action.payload;
      if (!state.subscribedChats.includes(chatId)) {
        state.subscribedChats.push(chatId);
      }
    },
    
    removeSubscribedChat: (state, action) => {
      const chatId = action.payload;
      state.subscribedChats = state.subscribedChats.filter(id => id !== chatId);
    },
    
    clearSubscribedChats: (state) => {
      state.subscribedChats = [];
    },
    
    // Contact status management
    setContactStatus: (state, action) => {
      const { contactId, status } = action.payload;
      state.contactStatuses[contactId] = {
        ...status,
        lastUpdated: new Date().toISOString()
      };
    },
    
    removeContactStatus: (state, action) => {
      const contactId = action.payload;
      delete state.contactStatuses[contactId];
    },
    
    // Reset entire state
    resetSocketState: () => {
      return initialState;
    }
  },
});

// Export actions
export const {
  setSocketConnected,
  setSocketDisconnected,
  setConnectionError,
  incrementReconnectionAttempts,
  resetReconnectionAttempts,
  updateLastActivity,
  
  setUserTyping,
  clearTypingUsers,
  clearAllTypingIndicators,
  cleanStaleTypingIndicators,
  
  setUserOnlineStatus,
  setMultipleUsersOnlineStatus,
  removeUserOnlineStatus,
  clearAllOnlineStatuses,
  
  addNotification,
  markNotificationRead,
  markAllNotificationsRead,
  removeNotification,
  clearAllNotifications,
  
  addSubscribedChat,
  removeSubscribedChat,
  clearSubscribedChats,
  
  setContactStatus,
  removeContactStatus,
  
  resetSocketState,
} = socketSlice.actions;

// Selectors
export const selectSocketState = (state) => state.socket;

export const selectSocketConnected = (state) => state.socket.isConnected;
export const selectSocketId = (state) => state.socket.socketId;
export const selectConnectionError = (state) => state.socket.connectionError;
export const selectLastActivity = (state) => state.socket.lastActivity;
export const selectReconnectionAttempts = (state) => state.socket.reconnectionAttempts;

export const selectTypingUsers = (chatId) => (state) => 
  state.socket.typingUsers[chatId] || [];

export const selectAllTypingUsers = (state) => state.socket.typingUsers;

export const selectUserOnlineStatus = (userId) => (state) =>
  state.socket.onlineUsers[userId] || { isOnline: false, lastSeen: null, lastUpdated: null };

export const selectMultipleUsersOnlineStatus = (userIds) => (state) => {
  const result = {};
  userIds.forEach(userId => {
    result[userId] = state.socket.onlineUsers[userId] || { 
      isOnline: false, 
      lastSeen: null,
      lastUpdated: null 
    };
  });
  return result;
};

export const selectOnlineUsersCount = (state) => 
  Object.values(state.socket.onlineUsers).filter(user => user.isOnline).length;

export const selectAllOnlineUsers = (state) => 
  Object.entries(state.socket.onlineUsers)
    .filter(([_, user]) => user.isOnline)
    .map(([userId, user]) => ({ userId, ...user }));

export const selectNotifications = (state) => state.socket.notifications;

export const selectUnreadNotificationsCount = (state) =>
  state.socket.notifications.filter(n => !n.isRead).length;

export const selectUnreadNotifications = (state) =>
  state.socket.notifications.filter(n => !n.isRead);

export const selectSubscribedChats = (state) => state.socket.subscribedChats;

export const selectIsSubscribedToChat = (chatId) => (state) =>
  state.socket.subscribedChats.includes(chatId);

export const selectContactStatus = (contactId) => (state) =>
  state.socket.contactStatuses[contactId] || null;

export const selectAllContactStatuses = (state) => state.socket.contactStatuses;

// Helper selector to get formatted online status text
export const selectFormattedOnlineStatus = (userId) => (state) => {
  const status = state.socket.onlineUsers[userId];
  
  if (!status) {
    return {
      isOnline: false,
      text: 'Offline',
      lastSeen: null,
      formattedLastSeen: 'Unknown'
    };
  }
  
  let formattedLastSeen = '';
  if (status.lastSeen) {
    const lastSeen = new Date(status.lastSeen);
    const now = new Date();
    const diffMs = now - lastSeen;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffMins < 1) formattedLastSeen = 'Just now';
    else if (diffMins < 60) formattedLastSeen = `${diffMins}m ago`;
    else if (diffHours < 24) formattedLastSeen = `${diffHours}h ago`;
    else if (diffDays === 1) formattedLastSeen = 'Yesterday';
    else if (diffDays < 7) formattedLastSeen = `${diffDays}d ago`;
    else formattedLastSeen = lastSeen.toLocaleDateString();
  }
  
  return {
    isOnline: status.isOnline,
    text: status.isOnline ? 'Online' : formattedLastSeen || 'Offline',
    lastSeen: status.lastSeen,
    formattedLastSeen: formattedLastSeen || 'Unknown',
    lastUpdated: status.lastUpdated
  };
};

// Helper selector to get typing users for multiple chats
export const selectTypingUsersForChats = (chatIds) => (state) => {
  const result = {};
  chatIds.forEach(chatId => {
    result[chatId] = state.socket.typingUsers[chatId] || [];
  });
  return result;
};

// Helper selector to get typing text for a chat
export const selectTypingTextForChat = (chatId) => (state) => {
  const typingUsers = state.socket.typingUsers[chatId] || [];
  
  if (typingUsers.length === 0) return null;
  
  if (typingUsers.length === 1) {
    return `${typingUsers[0].username} is typing...`;
  }
  
  if (typingUsers.length === 2) {
    return `${typingUsers[0].username} and ${typingUsers[1].username} are typing...`;
  }
  
  return `${typingUsers[0].username} and ${typingUsers.length - 1} others are typing...`;
};

// Export reducer
export default socketSlice.reducer;