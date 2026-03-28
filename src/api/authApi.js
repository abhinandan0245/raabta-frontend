import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const authApi = createApi({
  reducerPath: "authApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "http://localhost:4000/api",
    credentials: "include",
  }),
  endpoints: (builder) => ({
    login: builder.mutation({
      query: (credentials) => ({
        url: "/auth/login",
        method: "POST",
        body: credentials,
      }),
    }),

    register: builder.mutation({
      query: (data) => ({
        url: "/auth/register",
        method: "POST",
        body: data,
      }),
    }),

    getProfile: builder.query({
      query: () => "/auth/me",
    }),

    logout: builder.mutation({
      query: () => ({
        url: "/auth/logout",
        method: "POST",
      }),
    }),

    // ===== New: Update Profile =====
    updateProfile: builder.mutation({
      query: (data) => ({
        url: "/auth/update-profile",
        method: "PUT",
        body: data,
      }),
    }),

    // ===== New: Upload Avatar =====
    uploadAvatar: builder.mutation({
      query: (formData) => ({
        url: "/auth/upload-avatar",
        method: "PUT",
        body: formData,
        // required for file uploads
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }),
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useGetProfileQuery,
  useLogoutMutation,
  useUpdateProfileMutation,
  useUploadAvatarMutation,
} = authApi;
