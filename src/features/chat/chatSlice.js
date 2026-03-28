// chatSlice.js
// Manages UI-level chat state such as active conversation,
// unread counters, and refresh triggers. Complements RTK Query
// for seamless chat experience.

import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  activeChat: null,           // Currently opened chat
  unreadCount: {},            // Unread count per chat
  refreshKey: 0,              // Triggers RTK Query refetch
};

const chatSlice = createSlice({
  name: "chat",
  initialState,

  reducers: {
    // Store the currently selected chat details
    setActiveChat: (state, action) => {
      state.activeChat = action.payload;
    },

    // Increase unread messages count for a specific chat
    incrementUnread: (state, action) => {
      const chatId = action.payload;
      state.unreadCount[chatId] =
        (state.unreadCount[chatId] || 0) + 1;
    },

    // Reset unread count when chat is opened
    clearUnread: (state, action) => {
      const chatId = action.payload;
      state.unreadCount[chatId] = 0;
    },

    // Used to refresh chat list from server
    triggerRefresh: (state) => {
      state.refreshKey += 1;
    },
  },
});

export const {
  setActiveChat,
  incrementUnread,
  clearUnread,
  triggerRefresh,
} = chatSlice.actions;

export default chatSlice.reducer;
