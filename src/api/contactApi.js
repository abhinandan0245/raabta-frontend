// src/api/contactApiSlice.js
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const contactApi = createApi({
  reducerPath: "contactApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "http://localhost:4000/api/contact",
    credentials: "include",
  }),
  tagTypes: ["Contact"],
  endpoints: (builder) => ({
    // Add contact (requires number to exist in User collection)
    addContact: builder.mutation({
      query: (data) => ({ 
        url: "/", 
        method: "POST", 
        body: data 
      }),
      invalidatesTags: ["Contact"],
    }),
    
    // Update contact name
    updateContact: builder.mutation({
      query: ({ id, ...data }) => ({ 
        url: `/${id}`, 
        method: "PUT", 
        body: data 
      }),
      invalidatesTags: ["Contact"],
    }),
    
    // Delete contact (removes from your list)
    deleteContact: builder.mutation({
      query: (id) => ({ 
        url: `/${id}`, 
        method: "DELETE" 
      }),
      invalidatesTags: ["Contact"],
    }),
    
    // Block contact
    blockContact: builder.mutation({
      query: (id) => ({ 
        url: `/${id}/block`, 
        method: "POST" 
      }),
      invalidatesTags: ["Contact"],
    }),
    
    // Unblock contact
    unblockContact: builder.mutation({
      query: (id) => ({ 
        url: `/${id}/unblock`, 
        method: "POST" 
      }),
      invalidatesTags: ["Contact"],
    }),
    
    // Get single contact
    getContact: builder.query({
      query: (id) => `/${id}`,
      providesTags: (result, error, id) => [
        { type: "Contact", id }
      ],
    }),
    
    // Get all contacts
    getAllContacts: builder.query({
      query: () => "/",
      providesTags: ["Contact"],
    }),
    
    // Search contacts
    searchContacts: builder.query({
      query: (query) => `/search?query=${encodeURIComponent(query)}`,
      providesTags: ["Contact"],
    }),
  }),
});

export const {
  useAddContactMutation,
  useUpdateContactMutation,
  useDeleteContactMutation,
  useBlockContactMutation,
  useUnblockContactMutation,
  useGetContactQuery,
  useGetAllContactsQuery,
  useSearchContactsQuery,
} = contactApi;