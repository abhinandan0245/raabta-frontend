import { createSlice } from "@reduxjs/toolkit";
import { authApi } from "../../api/authApi";

const initialState = { user: null };

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null;
    },
    setUser: (state, action) => {
      state.user = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder.addMatcher(authApi.endpoints.login.matchFulfilled, (state, { payload }) => {
      state.user = payload.user;
    });

    builder.addMatcher(authApi.endpoints.register.matchFulfilled, (state, { payload }) => {
      state.user = payload.user;
    });

    builder.addMatcher(authApi.endpoints.getProfile.matchFulfilled, (state, { payload }) => {
      state.user = payload.user;
    });

    builder.addMatcher(authApi.endpoints.getProfile.matchRejected, (state, action) => {
      if (action.error?.status === 401) {
        state.user = null;
      }
    });
    
     builder.addMatcher(authApi.endpoints.logout.matchFulfilled, (state) => {
      state.user = null;
    });
  },
});

export const { logout, setUser } = authSlice.actions;
export default authSlice.reducer;
