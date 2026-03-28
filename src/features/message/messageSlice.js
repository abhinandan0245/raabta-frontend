// src/features/message/messageSlice.js
// Manages local message UI state including typing status,
// draft messages, and scroll triggers.

import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  typing: false,              // Tracks if user is typing
  draft: "",                  // Text saved in input box
  scrollKey: 0,               // Triggers message pane auto-scroll
};

const messageSlice = createSlice({
  name: "message",
  initialState,

  reducers: {
    // Saves the current input text
    setDraft: (state, action) => {
      state.draft = action.payload;
    },

    // Tracks user typing indicator
    setTyping: (state, action) => {
      state.typing = action.payload;
    },

    // Forces scroll to bottom
    triggerScroll: (state) => {
      state.scrollKey += 1;
    },
  },
});

export const {
  setDraft,
  setTyping,
  triggerScroll,
} = messageSlice.actions;

export default messageSlice.reducer;
