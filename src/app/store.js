import { configureStore } from "@reduxjs/toolkit";
import { authApi } from "../api/authApi";
import authReducer from "../features/auth/authSlice";
import socketReducer from "../socket/socketSlice";
import chatReducer from "../features/chat/chatSlice";
import messageReducer from "../features/message/messageSlice";
import notificationReducer from "../features/notification/notificationSlice";
import { chatApi } from "../api/chatApi";
import { messageApi } from "../api/messageApi";
import { contactApi } from "../api/contactApi";
import { notificationApi } from "../api/notificationApi";

export const store = configureStore({
  reducer: {
   
    [authApi.reducerPath]: authApi.reducer,
    [chatApi.reducerPath]: chatApi.reducer,
    
    [messageApi.reducerPath]: messageApi.reducer,
    [contactApi.reducerPath]: contactApi.reducer,
    [notificationApi.reducerPath]: notificationApi.reducer, 
    


    auth: authReducer,
    socket: socketReducer,
    chat: chatReducer,
    message: messageReducer,
    notifications: notificationReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(authApi.middleware , chatApi.middleware , messageApi.middleware , contactApi.middleware ,  notificationApi.middleware),
});

export default store;
