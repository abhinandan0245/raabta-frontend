// src/features/contact/contactSlice.js
import { createSlice } from "@reduxjs/toolkit";
import { contactApi } from "../../api/contactApi";

const initialState = {
  contacts: [],
  loading: false,
  error: null,
};

const contactSlice = createSlice({
  name: "contact",
  initialState,
  reducers: {
    clearContacts: (state) => {
      state.contacts = [];
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Add contact
    builder.addMatcher(contactApi.endpoints.addContact.matchPending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addMatcher(contactApi.endpoints.addContact.matchFulfilled, (state, { payload }) => {
      state.loading = false;
      state.contacts.push(payload.contact);
    });
    builder.addMatcher(contactApi.endpoints.addContact.matchRejected, (state, { error }) => {
      state.loading = false;
      state.error = error?.data?.message || error.message;
    });

    // Update contact
    builder.addMatcher(contactApi.endpoints.updateContact.matchFulfilled, (state, { payload }) => {
      const index = state.contacts.findIndex(c => c._id === payload.contact._id);
      if (index !== -1) state.contacts[index] = payload.contact;
    });

    // Delete contact
    builder.addMatcher(contactApi.endpoints.deleteContact.matchFulfilled, (state, { meta }) => {
      const id = meta.arg;
      state.contacts = state.contacts.filter(c => c._id !== id);
    });

    // Block/Unblock contact
    builder.addMatcher(contactApi.endpoints.blockContact.matchFulfilled, (state, { payload }) => {
      const index = state.contacts.findIndex(c => c._id === payload.contact._id);
      if (index !== -1) state.contacts[index] = payload.contact;
    });
    builder.addMatcher(contactApi.endpoints.unblockContact.matchFulfilled, (state, { payload }) => {
      const index = state.contacts.findIndex(c => c._id === payload.contact._id);
      if (index !== -1) state.contacts[index] = payload.contact;
    });

    // Get all contacts
    builder.addMatcher(contactApi.endpoints.getAllContacts.matchFulfilled, (state, { payload }) => {
      state.contacts = payload.contacts;
    });
  },
});

export const { clearContacts } = contactSlice.actions;
export default contactSlice.reducer;
