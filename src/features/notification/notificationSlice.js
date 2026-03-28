// src/features/notification/notificationSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  notifications: [],
  unreadCount: 0,
  loading: false,
  error: null
};

const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    setNotifications: (state, action) => {
      state.notifications = action.payload;
      state.unreadCount = action.payload.filter(n => !n.isRead).length;
    },
    addNotification: (state, action) => {
      // Check if notification already exists
      const exists = state.notifications.some(n => n._id === action.payload._id);
      if (!exists) {
        state.notifications.unshift(action.payload);
        if (!action.payload.isRead) {
          state.unreadCount += 1;
        }
        console.log("🔔 Notification added to Redux, new unread count:", state.unreadCount);
      }
    },
    markAsRead: (state, action) => {
      const notification = state.notifications.find(n => n._id === action.payload);
      if (notification && !notification.isRead) {
        notification.isRead = true;
        state.unreadCount = Math.max(0, state.unreadCount - 1);
        console.log("📖 Notification marked as read, unread count:", state.unreadCount);
      }
    },
    markAllAsRead: (state) => {
      state.notifications.forEach(n => { n.isRead = true; });
      state.unreadCount = 0;
      console.log("✅ All notifications marked as read");
    },
    removeNotification: (state, action) => {
      const notification = state.notifications.find(n => n._id === action.payload);
      if (notification && !notification.isRead) {
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
      state.notifications = state.notifications.filter(n => n._id !== action.payload);
      console.log("🗑️ Notification removed, unread count:", state.unreadCount);
    },
    clearNotifications: (state) => {
      state.notifications = [];
      state.unreadCount = 0;
    }
  }
});

export const {
  setNotifications,
  addNotification,  // 👈 MAKE SURE THIS IS EXPORTED
  markAsRead,
  markAllAsRead,
  removeNotification,
  clearNotifications
} = notificationSlice.actions;

// Selectors
export const selectNotifications = (state) => state.notifications?.notifications || [];
export const selectUnreadCount = (state) => state.notifications?.unreadCount || 0;

export default notificationSlice.reducer;