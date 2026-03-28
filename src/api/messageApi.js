// src/api/messageApi.js
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const messageApi = createApi({
  reducerPath: "messageApi",

    baseQuery: fetchBaseQuery({
    baseUrl: "http://localhost:4000/api",     
    credentials: "include",                   
    prepareHeaders: (headers, { getState }) => {
      // Get token from Redux store
      const token = getState()?.auth?.token;
      
      // If token exists, add it to headers
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      
      headers.set("Content-Type", "application/json");
      return headers;
    },
  }),

  tagTypes: ["Messages", "UnreadCounts", "Chats"],

  endpoints: (builder) => ({

    // Fetch messages for a chat with pagination
    getMessages: builder.query({
      query: ({ chatId, page = 1, limit = 50 }) => 
        `/message/${chatId}?page=${page}&limit=${limit}`,
      providesTags: (result, error, { chatId }) => [
        { type: "Messages", id: chatId }
      ],
      keepUnusedDataFor: 10,
    }),

    // Send a new message
    // 👇 UPDATED: Send a new message with file attachments
    sendMessage: builder.mutation({
      query: (formData) => {
        // Check if it's FormData (has files) or regular object
        const isFormData = formData instanceof FormData;
        
        return {
          url: `/message`,
          method: "POST",
          body: formData,
          // Don't set Content-Type for FormData - browser sets it with boundary
          ...(isFormData ? {} : { headers: { 'Content-Type': 'application/json' } })
        };
      },
      invalidatesTags: (result, error, data) => {
        // Extract chatId from FormData or object
        let chatId;
        if (data instanceof FormData) {
          chatId = data.get('chatId');
        } else {
          chatId = data.chatId;
        }
        return [
          { type: "Messages", id: chatId },
          { type: "Chats" },
          { type: "UnreadCounts" }
        ];
      },
      async onQueryStarted(message, { dispatch, queryFulfilled, getState }) {
        // Extract data for optimistic update
        let chatId, content, attachments = [];
        
        if (message instanceof FormData) {
          chatId = message.get('chatId');
          content = message.get('content') || '';
          // Can't get files for optimistic update easily
        } else {
          chatId = message.chatId;
          content = message.content || '';
          attachments = message.attachments || [];
        }

        if (!chatId) return;

        // Optimistic update
        const patchResult = dispatch(
          messageApi.util.updateQueryData(
            'getMessages', 
            { chatId, page: 1, limit: 50 }, 
            (draft) => {
              const optimisticMessage = {
                _id: `temp_${Date.now()}`,
                sender: getState().auth.user,
                content: content || '',
                attachments: attachments || [],
                chat: chatId,
                createdAt: new Date().toISOString(),
                isOptimistic: true,
                readBy: [{ userId: getState().auth.user._id, readAt: new Date().toISOString() }]
              };
              if (draft.messages) {
                draft.messages.push(optimisticMessage);
              }
            }
          )
        );

        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
    }),

    // Get unread count for a specific chat
    getUnreadCount: builder.query({
      query: (chatId) => `/message/unread/${chatId}`,
      providesTags: (result, error, chatId) => [
        { type: "UnreadCounts", id: chatId }
      ],
    }),

    // Get all unread counts for user
    getAllUnreadCounts: builder.query({
      query: () => `/message/unread/all`,
      providesTags: ["UnreadCounts"],
      keepUnusedDataFor: 5,
    }),

    // Mark all messages in a chat as read
    markChatAsRead: builder.mutation({
      query: (chatId) => ({
        url: `/message/mark-read/chat/${chatId}`,
        method: "POST",
      }),
      invalidatesTags: (result, error, chatId) => [
        { type: "UnreadCounts", id: chatId },
        { type: "UnreadCounts" }
      ],
      async onQueryStarted(chatId, { dispatch, queryFulfilled }) {
        // Optimistic update for unread counts
        const patchResult = dispatch(
          messageApi.util.updateQueryData(
            'getAllUnreadCounts',
            undefined,
            (draft) => {
              if (draft?.unreadCounts) {
                draft.unreadCounts[chatId] = 0;
              }
            }
          )
        );

        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
    }),

    // Mark specific messages as read
    markMessagesAsRead: builder.mutation({
      query: (data) => ({
        url: `/message/mark-read/messages`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: (result, error, { chatId }) => [
        { type: "UnreadCounts", id: chatId }
      ],
    }),

    // Delete message
    deleteMessage: builder.mutation({
      query: ({ messageId, ...data }) => ({
        url: `/message/${messageId}`,
        method: "DELETE",
        body: data,
      }),
      invalidatesTags: (result, error, { messageId, chatId }) => [
        { type: "Messages", id: chatId }
      ],
    }),

    // Edit message
    editMessage: builder.mutation({
      query: ({ messageId, ...data }) => ({
        url: `/message/${messageId}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (result, error, { messageId, chatId }) => [
        { type: "Messages", id: chatId }
      ],
    }),

    // Update online status
    updateOnlineStatus: builder.mutation({
      query: (data) => ({
        url: `/message/status/online`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["Chats"],
    }),

  }),
});

export const {
  useGetMessagesQuery,
  useSendMessageMutation,
  useGetUnreadCountQuery,
  useGetAllUnreadCountsQuery,
  useMarkChatAsReadMutation,
  useMarkMessagesAsReadMutation,
  useDeleteMessageMutation,
  useEditMessageMutation,
  useUpdateOnlineStatusMutation
} = messageApi;