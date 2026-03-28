import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:4000";

let socket = null;

export const initializeSocket = (userToken, userId) => {
      console.log("🔌 Initializing Connecto socket...");
    
    // If token not provided, try to get from cookie
    if (!userToken) {
      const getCookie = (name) => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
        return null;
      };
      
      userToken = getCookie('connectoToken');
      console.log("Token from cookie:", userToken ? "Found" : "Not found");
    }


    // If socket already exists and is connected, return it
    if (socket?.connected) {
        return socket;
    }

    // Disconnect existing socket if any
    if (socket) {
        socket.disconnect();
    }

    // Create new socket connection
    socket = io(SOCKET_URL, {
        autoConnect: true,
        auth: {
            token: userToken
        },
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        transports: ['websocket', 'polling']
    });

    // Connection events
    socket.on('connect', () => {
        console.log('✅ Socket connected:', socket.id);
        
        // Join user's personal room for notifications
        socket.emit('join_user', userId);  // Backend expects just userId
        
        // Emit online status
        socket.emit('user_online', { 
            userId, 
            isOnline: true 
        });
    });

    socket.on('connect_error', (error) => {
        console.error('❌ Socket connection error:', error.message);
    });

    socket.on('disconnect', (reason) => {
        console.log('🔌 Socket disconnected:', reason);
        
        // Emit offline status if user is authenticated
        if (userId) {
            socket.emit('user_online', { 
                userId, 
                isOnline: false 
            });
        }
    });

    socket.on('reconnect', (attemptNumber) => {
        console.log('🔄 Socket reconnected on attempt:', attemptNumber);
        
        // Re-join user's personal room
        if (userId) {
            socket.emit('join_user', userId);
            socket.emit('user_online', { 
                userId, 
                isOnline: true 
            });
        }
    });

    // ========== CHAT EVENTS (Backend Events) ==========
    
    // User joined chat notification
    socket.on('user_joined_chat', (data) => {
        console.log('👤 User joined chat:', data);
        // Optional: Handle if needed
    });

    // User left chat notification
    socket.on('user_left_chat', (data) => {
        console.log('🚪 User left chat:', data);
        // Optional: Handle if needed
    });

    // Typing indicator (Backend से आ रहा है)
    socket.on('typing', ({ userId, chatId }) => {
        console.log(`⌨️ User ${userId} is typing in chat ${chatId}`);
        if (window.setTypingIndicator) {
            window.setTypingIndicator(chatId, userId, true);
        }
    });

    // Stop typing indicator (Backend से आ रहा है)
    socket.on('stop_typing', ({ userId, chatId }) => {
        console.log(`⏹️ User ${userId} stopped typing in chat ${chatId}`);
        if (window.setTypingIndicator) {
            window.setTypingIndicator(chatId, userId, false);
        }
    });

    // Message read receipt (Backend से आ रहा है)
    socket.on('message_read', ({ messageId, readerId, chatId }) => {
        console.log(`👁️ Message ${messageId} read by ${readerId}`);
        if (window.updateMessageReadStatus) {
            window.updateMessageReadStatus(chatId, messageId, readerId);
        }
    });

    // ========== NOTIFICATION EVENTS (Backend Events) ==========
    
    // 👇 FIX: Add both event listeners for compatibility
    
    // Listen for 'notification_received' (from your socket notification.js)
    socket.on('notification_received', (notificationData) => {
        console.log('🔔 New notification (notification_received):', notificationData);
        if (window.addNotification) {
            window.addNotification(notificationData);
        }
    });

    // Listen for 'new_notification' (from your controller)
    socket.on('new_notification', (notificationData) => {
        console.log('🔔 New notification (new_notification):', notificationData);
        if (window.addNotification) {
            window.addNotification(notificationData);
        }
    });

    // Listen for 'notification_marked_read' (from your socket notification.js)
    socket.on('notification_marked_read', ({ notificationId, readAt }) => {
        console.log('📖 Notification marked read:', notificationId);
        if (window.markNotificationRead) {
            window.markNotificationRead(notificationId);
        }
    });

    // Listen for 'notification_read' (from your controller)
    socket.on('notification_read', ({ notificationId, readAt }) => {
        console.log('📖 Notification read:', notificationId);
        if (window.markNotificationRead) {
            window.markNotificationRead(notificationId);
        }
    });

    // socket.js - inside initializeSocket function, after connection

socket.on('connect', () => {
  console.log('✅ Socket connected:', socket.id);
  
  // Join user's personal room for notifications
  console.log(`📤 Emitting join_user for userId: ${userId}`);
  socket.emit('join_user', userId);
  
  // Emit online status
  socket.emit('user_online', { 
    userId, 
    isOnline: true 
  });
  
  // Request room confirmation
  setTimeout(() => {
    socket.emit('check_room', { userId });
  }, 1000);
});

// Listen for room confirmation
socket.on('room_confirmed', (data) => {
  console.log('✅ Room confirmed:', data);
});

socket.on('error', (error) => {
  console.log('❌ Socket error:', error);
});

    // ========== CUSTOM EVENTS FOR YOUR FRONTEND ==========
    
    // New message event
    socket.on('new_message', (message) => {
        console.log('💬 New message:', message);
        if (window.dispatchNewMessage) {
            window.dispatchNewMessage(message);
        }
    });

    // User status changed
    socket.on('user_status_changed', ({ userId, isOnline, lastSeen }) => {
        console.log(`🟢 User ${userId} is now ${isOnline ? 'online' : 'offline'}`);
        if (window.updateUserStatus) {
            window.updateUserStatus(userId, isOnline, lastSeen);
        }
    });

    return socket;
};

// ========== SOCKET UTILITY FUNCTIONS ==========

// Get socket instance
export const getSocket = () => {
    return socket;
};

// Join chat room
export const joinChatRoom = (chatId, userId) => {
    if (socket?.connected) {
        socket.emit('join_chat', { chatId, userId });
        console.log(`📱 Joined chat room: ${chatId}`);
    } else {
        console.warn('⚠️ Socket not connected. Cannot join chat room.');
    }
};

// Leave chat room
export const leaveChatRoom = (chatId) => {
    if (socket?.connected) {
        socket.emit('leave_chat', { chatId });
        console.log(`🚪 Left chat room: ${chatId}`);
    }
};

// Send typing indicator
export const sendTyping = (chatId, userId, isTyping) => {
    if (socket?.connected) {
        const event = isTyping ? 'typing' : 'stop_typing';
        socket.emit(event, { chatId, userId });
        console.log(`⌨️ ${isTyping ? 'Started' : 'Stopped'} typing in ${chatId}`);
    }
};

// Update online status
export const updateOnlineStatus = (userId, isOnline) => {
    if (socket?.connected) {
        socket.emit('user_online', { userId, isOnline });
    }
};

// Send message via socket
export const sendSocketMessage = (messageData) => {
  if (socket?.connected) {
    socket.emit('send_message', messageData);
    console.log('📤 Message sent via socket (send_message):', messageData);
  } else {
    console.warn('⚠️ Socket not connected. Cannot send message.');
  }
};

// Mark message as read
export const markMessageRead = (messageId, chatId, readerId) => {
    if (socket?.connected) {
        socket.emit('message_read', { messageId, chatId, readerId });
        console.log(`👁️ Marked message as read: ${messageId}`);
    }
};

// Create notification via socket
export const createSocketNotification = (notificationData) => {
    if (socket?.connected) {
        socket.emit('create_notification', notificationData);
        console.log('🔔 Created notification via socket:', notificationData);
    }
};

// Disconnect socket
export const disconnectSocket = () => {
    if (socket) {
        socket.disconnect();
        socket = null;
        console.log('🔌 Socket disconnected');
    }
};

// Emit contact blocked
export const emitContactBlocked = (contactId, isBlocked) => {
  const socket = getSocket();
  if (socket?.connected) {
    socket.emit('contact_blocked', { contactId, isBlocked });
  }
};

// Listen for contact blocked
export const onContactBlocked = (callback) => {
  const socket = getSocket();
  socket?.on('contact_blocked', callback);
  return () => socket?.off('contact_blocked', callback);
};

// Check socket connection status
export const isSocketConnected = () => {
    return socket?.connected || false;
};

// Reconnect socket manually
export const reconnectSocket = () => {
    if (socket) {
        socket.connect();
    }
};

// Default export
export default socket;