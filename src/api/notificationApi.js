// src/api/notificationApi.js
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const notificationApi = createApi({
  reducerPath: "notificationApi",
  
  baseQuery: fetchBaseQuery({
    baseUrl: "http://localhost:4000/api",
    credentials: "include",
    prepareHeaders: (headers, { getState }) => {
      const token = getState()?.auth?.token;
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),

  tagTypes: ["Notifications"],

  endpoints: (builder) => ({
    // Get all notifications for logged-in user
    getNotifications: builder.query({
      query: () => "/notification",
      providesTags: ["Notifications"],
      transformResponse: (response) => response.notifications || [],
    }),

    // Create a notification
    createNotification: builder.mutation({
      query: (notificationData) => ({
        url: "/notification",
        method: "POST",
        body: notificationData,
      }),
      invalidatesTags: ["Notifications"],
    }),

    // Mark notification as read
    markNotificationAsRead: builder.mutation({
      query: (notificationId) => ({
        url: "/notification/read",
        method: "PUT",
        body: { notificationId },
      }),
      invalidatesTags: ["Notifications"],
    }),

    // Mark all notifications as read
    markAllNotificationsAsRead: builder.mutation({
      query: () => ({
        url: "/notification/read-all",
        method: "PUT",
      }),
      invalidatesTags: ["Notifications"],
    }),

    // Delete notification
    deleteNotification: builder.mutation({
      query: (notificationId) => ({
        url: `/notification/${notificationId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Notifications"],
    }),
  }),
});

export const {
  useGetNotificationsQuery,
  useCreateNotificationMutation,
  useMarkNotificationAsReadMutation,
  useMarkAllNotificationsAsReadMutation,
  useDeleteNotificationMutation,
} = notificationApi;