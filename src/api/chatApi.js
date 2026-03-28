// src/api/chatApi.js
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const chatApi = createApi({
  reducerPath: "chatApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "http://localhost:4000/api/chat",
    credentials: "include",
  }),

  tagTypes: ["Chat"],

  endpoints: (builder) => ({
    // Create or get 1-to-1 chat from user ID
    accessChat: builder.mutation({
      query: (payload) => ({
        url: "/",
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["Chat"],
    }),

    // Create or get chat from contact ID
    accessChatFromContact: builder.mutation({
      query: (payload) => ({
        url: "/from-contact",
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["Chat"],
    }),

    // Fetch all chats for logged-in user
    fetchChats: builder.query({
      query: () => "/",
      providesTags: ["Chat"],
    }),

     getContactsWithChats: builder.query({
    query: () => "/contacts-with-chats",
    providesTags: ["Chat"],
  }),

    // Create group chat
    createGroupChat: builder.mutation({
      query: (payload) => ({
        url: "/group",
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["Chat"],
    }),

    // Update group chat
    updateGroupChat: builder.mutation({
      query: ({ chatId, ...payload }) => ({
        url: `/group/${chatId}`,
        method: "PUT",
        body: payload,
      }),
      invalidatesTags: ["Chat"],
    }),

    // Leave group
    leaveGroup: builder.mutation({
      query: (chatId) => ({
        url: `/group/${chatId}/leave`,
        method: "DELETE",
      }),
      invalidatesTags: ["Chat"],
    }),

    addContactAndCreateChat: builder.mutation({
      query: (data) => ({
        url: "/contact-and-chat",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["ChatContact"],
    }),

    // Get contact with chat info
    getContactWithChat: builder.query({
      query: (contactId) => `/contact-with-chat/${contactId}`,
      providesTags: (result, error, contactId) => [
        { type: "ChatContact", id: contactId }
      ],
    }),
  }),
});

export const {
  useAccessChatMutation,
  useAccessChatFromContactMutation,
  useFetchChatsQuery,
  useCreateGroupChatMutation,
  useUpdateGroupChatMutation,
  useLeaveGroupMutation,
useAddContactAndCreateChatMutation,
useGetContactWithChatQuery,
useGetContactsWithChatsQuery 
} = chatApi;