import React, { useEffect, useState, useCallback } from 'react';
import { useFetchChatsQuery } from '../../../api/chatApi';
import { useSelector, useDispatch } from 'react-redux';
import { 
  initializeSocket, 
  getSocket, 
  joinChatRoom,
  isSocketConnected
} from '../../../socket/socket';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { selectUnreadCount } from '../../notification/notificationSlice';

export default function ChatsTab({ setSelectedChat }) {
  const { user, token } = useSelector(state => state.auth);
  const unreadNotificationCount = useSelector(selectUnreadCount);
  const { data: chatsData, isLoading, refetch, error } = useFetchChatsQuery();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const [socketInitialized, setSocketInitialized] = useState(false);
  const [activeChatId, setActiveChatId] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState({});
  const [typingUsers, setTypingUsers] = useState({});
  const [unreadCounts, setUnreadCounts] = useState({});
  const [showNotifications, setShowNotifications] = useState(false);
  
  const chats = chatsData?.chats || [];

  // Log chats data for debugging
  useEffect(() => {
    if (chatsData) {
      console.log("📥 Chats data received:", chatsData);
      console.log("📊 Chats array:", chats);
    }
    if (error) {
      console.error("❌ Error fetching chats:", error);
    }
  }, [chatsData, chats, error]);

  // Manual function to fetch unread counts from API
  const fetchUnreadCounts = useCallback(async () => {
    if (!token) return;
    
    try {
      console.log("📡 Fetching unread counts from API...");
      const response = await fetch('http://localhost:4000/api/message/unread/all', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log("📥 API Response - unread/all:", data);
        
        if (data.success && data.unreadCounts) {
          const counts = {};
          
          // Handle different response formats
          if (Array.isArray(data.unreadCounts)) {
            data.unreadCounts.forEach(item => {
              const chatId = item.chatId || item.chat?._id;
              if (chatId) {
                counts[chatId] = item.count || item.unreadCount || 0;
              }
            });
          } else if (typeof data.unreadCounts === 'object') {
            // If it's already an object with chatId as keys
            Object.assign(counts, data.unreadCounts);
          }
          
          console.log("✅ Processed unread counts:", counts);
          setUnreadCounts(counts);
        }
      } else {
        console.warn("⚠️ Manual unread counts fetch failed, using fallback");
        calculateUnreadFromChats();
      }
    } catch (error) {
      console.error("❌ Error fetching unread counts manually:", error);
      calculateUnreadFromChats();
    }
  }, [token]);

  // Fallback function to calculate unread counts from chats
  const calculateUnreadFromChats = useCallback(() => {
    if (!chats || chats.length === 0) return;
    
    const counts = {};
    chats.forEach(chat => {
      const chatId = chat._id;
      if (chatId) {
        counts[chatId] = 
          chat.unreadMessagesCount || 
          chat.unreadCount || 
          chat.unreadMessages || 
          0;
      }
    });
    console.log("📊 Fallback unread counts calculated:", counts);
    setUnreadCounts(counts);
  }, [chats]);

  // ChatsTab.jsx mein socket initialization ke baad yeh add karein
useEffect(() => {
  const socket = getSocket();
  if (socket?.connected) {
    console.log("🔍 Checking socket connection:", {
      id: socket.id,
      connected: socket.connected
    });
    
    // Test if user joined room
    socket.emit('test_room', { userId: user?._id });
    
    // Listen for room join confirmation
    socket.on('room_joined', (data) => {
      console.log("✅ Room joined confirmation:", data);
    });
  }
}, [user?._id]);

  // Extract unread counts from chat data on mount
  useEffect(() => {
    if (chats.length > 0) {
      const counts = {};
      chats.forEach(chat => {
        const chatId = chat._id;
        if (chatId) {
          counts[chatId] = 
            chat.unreadMessagesCount || 
            chat.unreadCount || 
            chat.unreadMessages || 
            chat.unread?.count ||
            0;
        }
      });
      console.log("📊 Initial unread counts from chats:", counts);
      setUnreadCounts(prev => ({ ...prev, ...counts }));
    }
  }, [chats]);

  // Fetch unread counts on mount and when chats change
  useEffect(() => {
    if (token && chats.length > 0) {
      fetchUnreadCounts();
    } else if (chats.length > 0) {
      calculateUnreadFromChats();
    }
  }, [token, chats.length, fetchUnreadCounts, calculateUnreadFromChats]);

  // Force update unread counts when chats change
  useEffect(() => {
    if (chats.length > 0) {
      // Update unread counts from chat data
      const newCounts = { ...unreadCounts };
      chats.forEach(chat => {
        const chatId = chat._id;
        if (chatId) {
          const chatUnread = 
            chat.unreadMessagesCount || 
            chat.unreadCount || 
            chat.unreadMessages || 
            0;
          if (chatUnread > 0) {
            newCounts[chatId] = chatUnread;
          }
        }
      });
      setUnreadCounts(newCounts);
    }
  }, [chats]);

  // Log unreadCounts changes
  useEffect(() => {
    console.log("🔄 unreadCounts updated:", unreadCounts);
  }, [unreadCounts]);

  // Initialize socket when component mounts
  useEffect(() => {
    if (user?._id && token && !socketInitialized) {
      try {
        console.log('🔌 Initializing socket connection...');
        const socket = initializeSocket(token, user._id);
        
        // Set up window handlers for socket events
        window.updateUserStatus = (userId, isOnline, lastSeen) => {
          setOnlineUsers(prev => ({
            ...prev,
            [userId]: { isOnline, lastSeen, lastUpdated: new Date().toISOString() }
          }));
          console.log(`🟢 User status updated: ${userId} is ${isOnline ? 'online' : 'offline'}`);
          refetch();
        };

        window.setTypingIndicator = (chatId, userId, isTyping) => {
          setTypingUsers(prev => {
            const newTypingUsers = { ...prev };
            if (!newTypingUsers[chatId]) {
              newTypingUsers[chatId] = {};
            }
            newTypingUsers[chatId][userId] = {
              isTyping,
              lastTypingTime: new Date().toISOString(),
              username: `User ${userId.substring(0, 4)}`
            };
            return newTypingUsers;
          });
        };

        window.dispatchNewMessage = (message) => {
          console.log('📨 New message via socket:', message);
          
          // Increment unread count for the correct chat
          const messageChatId = message.chat || message.chatId;
          if (message.sender?._id !== user?._id && messageChatId !== activeChatId) {
            setUnreadCounts(prev => {
              const newCount = (prev[messageChatId] || 0) + 1;
              console.log(`📈 Unread count incremented for chat ${messageChatId}: ${newCount}`);
              return {
                ...prev,
                [messageChatId]: newCount
              };
            });
            
            // Show toast for new message
            toast.success(`New message from ${message.sender?.name || 'Unknown'}`, {
              icon: '💬',
              duration: 3000
            });
          }
          
          refetch();
        };

        window.addNotification = (notificationData) => {
          console.log('🔔 Window notification handler:', notificationData);
          toast.success(notificationData.notification?.content || 'New notification', {
            icon: '🔔',
            duration: 3000,
            onClick: () => {
              if (notificationData.notification?.link) {
                navigate(notificationData.notification.link);
              }
            }
          });
        };

        window.markNotificationRead = (notificationId) => {
          console.log('📖 Marking notification as read:', notificationId);
        };

        // Listen for unread count updates
        socket.on('unread_count_updated', ({ chatId, unreadCount }) => {
          console.log(`🔄 Unread count updated for chat ${chatId}: ${unreadCount}`);
          setUnreadCounts(prev => ({
            ...prev,
            [chatId]: unreadCount
          }));
        });

        // Listen for chat marked as read
        socket.on('chat_marked_read', ({ chatId, readerId }) => {
          if (readerId === user?._id) {
            console.log(`✅ Chat ${chatId} marked as read by you`);
            setUnreadCounts(prev => ({
              ...prev,
              [chatId]: 0
            }));
          }
        });

        // Listen for new unread messages
        socket.on('new_unread_message', ({ chatId, messageId, sender, count }) => {
          if (sender !== user?._id && chatId !== activeChatId) {
            console.log(`📩 New unread message in chat ${chatId}`);
            setUnreadCounts(prev => ({
              ...prev,
              [chatId]: count || (prev[chatId] || 0) + 1
            }));
          }
        });

        // Listen for both notification events
        socket.on('notification_received', (data) => {
          console.log('🔔 notification_received in ChatsTab:', data);
          toast.success(data.notification?.content || 'New notification', {
            icon: '🔔',
            duration: 3000,
            onClick: () => {
              if (data.notification?.link) {
                navigate(data.notification.link);
              }
            }
          });
        });

        socket.on('new_notification', (data) => {
          console.log('🔔 new_notification in ChatsTab:', data);
          toast.success(data.notification?.content || 'New notification', {
            icon: '🔔',
            duration: 3000,
            onClick: () => {
              if (data.notification?.link) {
                navigate(data.notification.link);
              }
            }
          });
        });

        setSocketInitialized(true);
        
        // Join all chat rooms on connect
        const handleSocketConnect = () => {
          console.log('✅ Socket connected, joining chat rooms...');
          socket.emit('join_user', user._id);
          
          chats.forEach(chat => {
            if (chat._id) {
              joinChatRoom(chat._id, user._id);
            }
          });
        };

        if (socket.connected) {
          handleSocketConnect();
        } else {
          socket.on('connect', handleSocketConnect);
        }

        // Cleanup stale typing indicators periodically
        const cleanupInterval = setInterval(() => {
          const now = new Date();
          setTypingUsers(prev => {
            const newTypingUsers = { ...prev };
            Object.keys(newTypingUsers).forEach(chatId => {
              Object.keys(newTypingUsers[chatId]).forEach(userId => {
                const typingTime = new Date(newTypingUsers[chatId][userId].lastTypingTime);
                const diffMs = now - typingTime;
                if (diffMs > 10000) {
                  delete newTypingUsers[chatId][userId];
                }
              });
              if (Object.keys(newTypingUsers[chatId]).length === 0) {
                delete newTypingUsers[chatId];
              }
            });
            return newTypingUsers;
          });
        }, 5000);

        // Cleanup on unmount
        return () => {
          console.log('🧹 Cleaning up socket listeners...');
          clearInterval(cleanupInterval);
          
          chats.forEach(chat => {
            if (chat._id) {
              const socket = getSocket();
              if (socket?.connected) {
                socket.emit('leave_chat', { chatId: chat._id });
              }
            }
          });
          
          socket.off('unread_count_updated');
          socket.off('chat_marked_read');
          socket.off('new_unread_message');
          socket.off('notification_received');
          socket.off('new_notification');
          
          delete window.updateUserStatus;
          delete window.setTypingIndicator;
          delete window.dispatchNewMessage;
          delete window.addNotification;
          delete window.markNotificationRead;
        };

      } catch (error) {
        console.error('❌ Failed to initialize socket:', error);
      }
    }
  }, [user?._id, token, socketInitialized, chats, refetch, activeChatId, navigate]);

  // Join chat rooms when chats load or change
  useEffect(() => {
    if (socketInitialized && user?._id && chats.length > 0) {
      const socket = getSocket();
      if (socket?.connected) {
        console.log(`📱 Joining ${chats.length} chat rooms...`);
        chats.forEach(chat => {
          if (chat._id) {
            joinChatRoom(chat._id, user._id);
          }
        });
      }
    }
  }, [chats, socketInitialized, user?._id]);

  const handleNotificationClick = () => {
    navigate('/notifications');
  };

  const isUserTyping = (chatId, userId) => {
    return typingUsers[chatId]?.[userId]?.isTyping || false;
  };

  const getTypingUsersForChat = (chatId) => {
    const users = typingUsers[chatId];
    if (!users) return [];
    
    return Object.entries(users)
      .filter(([_, data]) => data.isTyping)
      .map(([userId, data]) => ({
        userId,
        username: data.username
      }));
  };

  const markChatAsRead = async (chatId) => {
    try {
      const response = await fetch(`http://localhost:4000/api/message/mark-read/chat/${chatId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        console.log(`✅ Chat ${chatId} marked as read`);
        setUnreadCounts(prev => ({
          ...prev,
          [chatId]: 0
        }));
        return true;
      } else {
        console.warn(`⚠️ Failed to mark chat ${chatId} as read: ${response.status}`);
        return false;
      }
    } catch (error) {
      console.error("Error marking chat as read:", error);
      return false;
    }
  };

  const handleChatClick = async (chat) => {
    console.log("=== CHAT CLICK DEBUG ===");
    
    const chatId = chat._id || chat.chatId || chat.id;
    if (!chatId) {
      console.error("No chat ID found!");
      return;
    }
    
    setActiveChatId(chatId);
    
    // Update unread count locally
    setUnreadCounts(prev => ({
      ...prev,
      [chatId]: 0
    }));
    
    // Mark as read on server
    markChatAsRead(chatId);
    
    if (user?._id) {
      joinChatRoom(chatId, user._id);
    }
    
    let otherUser = null;
    
    if (chat.otherUser && typeof chat.otherUser === 'object') {
      otherUser = {
        _id: chat.otherUser._id || chat.otherUser.userId || chat.otherUser.id,
        name: chat.otherUser.name,
        avatar: chat.otherUser.avatar,
        number: chat.otherUser.number,
        isOnline: chat.otherUser.isOnline,
        lastSeen: chat.otherUser.lastSeen
      };
    } 
    else if (chat.users && Array.isArray(chat.users) && chat.users.length > 0) {
      const foundUser = chat.users.find(u => {
        if (!u) return false;
        const userId = u._id || u.userId || u.id;
        return String(userId) !== String(user?._id);
      });
      
      if (foundUser) {
        otherUser = {
          _id: foundUser._id || foundUser.userId || foundUser.id,
          name: foundUser.name,
          avatar: foundUser.avatar,
          number: foundUser.number,
          isOnline: foundUser.isOnline,
          lastSeen: foundUser.lastSeen
        };
      }
    }
    
    let displayName = 'Unknown';
    if (chat.contactName) {
      displayName = chat.contactName;
    } else if (chat.displayName) {
      displayName = chat.displayName;
    } else if (otherUser?.name) {
      displayName = otherUser.name;
    } else if (chat.chatName) {
      displayName = chat.chatName;
    }
    
    const isOtherUserOnline = otherUser?._id ? onlineUsers[otherUser._id]?.isOnline || false : false;
    const isOtherUserTyping = otherUser?._id ? isUserTyping(chatId, otherUser._id) : false;
    
    const formattedChat = {
      _id: chatId,
      chatId: chatId,
      isGroupChat: chat.isGroupChat || false,
      users: chat.users || (otherUser ? [otherUser] : []),
      otherUser: otherUser,
      displayName: displayName,
      contactName: chat.contactName || otherUser?.name,
      savedName: chat.savedName || chat.contactName,
      chatName: chat.chatName || displayName,
      latestMessage: chat.latestMessage || null,
      isContactChat: !!chat.contactName || !!chat.savedName,
      contactNumber: otherUser?.number || chat.number,
      contactInfo: chat.contactInfo || (chat.contactName ? {
        savedName: chat.contactName,
        number: otherUser?.number || chat.number,
        targetUser: otherUser
      } : null),
      socketId: getSocket()?.id,
      isSocketConnected: isSocketConnected(),
      otherUserOnline: isOtherUserOnline,
      otherUserTyping: isOtherUserTyping,
      unreadCount: 0 // Already set to 0
    };
    
    console.log("Selected chat:", formattedChat.displayName);
    
    if (setSelectedChat && typeof setSelectedChat === 'function') {
      setSelectedChat(formattedChat);
    } else {
      console.error("setSelectedChat is not a function");
      localStorage.setItem('selectedChat', JSON.stringify(formattedChat));
    }
  };

  const getChatDisplayInfo = (chat) => {
    const chatId = chat._id || chat.chatId;
    const result = {
      displayName: 'Unknown',
      avatar: null,
      isGroup: chat.isGroupChat || false,
      otherUser: null,
      lastMessage: '',
      lastMessageTime: null,
      unreadCount: 0,
      typingUsers: []
    };
    
    // Get unread count from state first
    if (chatId) {
      // Try from unreadCounts state
      result.unreadCount = unreadCounts[chatId] || 0;
      
      // If still 0, try from chat object directly
      if (result.unreadCount === 0) {
        result.unreadCount = 
          chat.unreadMessagesCount || 
          chat.unreadCount || 
          chat.unreadMessages || 
          chat.unread?.count ||
          0;
      }
      
      // Log if there are unread messages
      if (result.unreadCount > 0) {
        console.log(`🔔 Chat ${chatId} (${chat.contactName || chat.chatName}) has ${result.unreadCount} unread messages`);
      }
    }
    
    if (chat.isGroupChat) {
      result.displayName = chat.chatName || 'Group Chat';
      result.avatar = chat.chatImage;
      result.lastMessage = `${chat.users?.length || 0} members`;
    } else {
      const otherUser = chat.otherUser || 
        (chat.users?.find(u => {
          if (!u) return false;
          const userId = u._id || u.userId || u.id;
          return String(userId) !== String(user?._id);
        }));
      
      result.otherUser = otherUser;
      result.displayName = chat.displayName || chat.contactName || otherUser?.name || 'Unknown';
      result.avatar = otherUser?.avatar;
      result.lastMessage = chat.latestMessage?.content || 'Start chatting';
      result.lastMessageTime = chat.latestMessage?.createdAt;
      
      if (otherUser?._id && chat._id) {
        result.isTyping = isUserTyping(chat._id, otherUser._id);
        if (result.isTyping) {
          result.typingUsers = getTypingUsersForChat(chat._id);
        }
      }
    }
    
    return result;
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  };

  const getTypingText = (typingUsers) => {
    if (!typingUsers || typingUsers.length === 0) return '';
    
    if (typingUsers.length === 1) {
      return `${typingUsers[0].username} is typing...`;
    }
    
    if (typingUsers.length === 2) {
      return `${typingUsers[0].username} and ${typingUsers[1].username} are typing...`;
    }
    
    return `${typingUsers[0].username} and ${typingUsers.length - 1} others are typing...`;
  };

  const renderSocketStatus = () => {
    const connected = isSocketConnected();
    const onlineCount = Object.values(onlineUsers).filter(u => u.isOnline).length;
    const totalUnread = Object.values(unreadCounts).reduce((a, b) => a + b, 0);

    return (
      <div className="flex items-center justify-between px-4 py-2 bg-gradient-to-r from-blue-50 to-purple-50 border-b border-gray-500/15">
        <div className="flex items-center gap-2">
          <div className={`h-2 w-2 rounded-full animate-pulse ${connected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-xs font-medium">
            {connected ? 'Live' : 'Offline'}
          </span>
          <span className="text-xs text-gray-500">
            {totalUnread > 0 ? `• ${totalUnread} unread` : '• All caught up'}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={handleNotificationClick}
            className="relative focus:outline-none group"
            title="View notifications"
          >
            <div className="p-1 hover:bg-gray-100 rounded-full transition-colors">
              <svg 
                className="w-4 h-4 text-gray-600 group-hover:text-blue-600" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" 
                />
              </svg>
            </div>
            {unreadNotificationCount > 0 && (
              <>
                <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                  {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
                </span>
                <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 rounded-full animate-ping opacity-75"></span>
              </>
            )}
          </button>
          
          <div className="flex -space-x-1">
            {Object.keys(onlineUsers)
              .filter(userId => onlineUsers[userId]?.isOnline)
              .slice(0, 3)
              .map(userId => (
                <div 
                  key={userId}
                  className="h-4 w-4 rounded-full bg-green-500 border border-white"
                  title="Online user"
                />
              ))}
          </div>
          <span className="text-xs text-gray-500">
            {onlineCount} online
          </span>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex flex-col">
        {renderSocketStatus()}
        <div className="p-8 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <p className="mt-2 text-gray-500">Loading chats...</p>
        </div>
      </div>
    );
  }
  
  if (chats.length === 0) {
    return (
      <div className="flex flex-col">
        {renderSocketStatus()}
        <div className="p-8 text-center">
          <p className="text-gray-500">No chats yet. Start a conversation!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {renderSocketStatus()}
      
      {chats.map(chat => {
        const {
          displayName,
          avatar,
          isGroup,
          otherUser,
          lastMessage,
          lastMessageTime,
          unreadCount,
          typingUsers,
          isTyping
        } = getChatDisplayInfo(chat);
        
        const firstLetter = displayName.charAt(0).toUpperCase();
        const typingText = getTypingText(typingUsers);
        const isOnline = otherUser?._id ? onlineUsers[otherUser._id]?.isOnline || false : false;

        return (
          <div
            key={chat._id || chat.id}
            className="group flex items-center gap-3 px-4 py-3 border-b border-gray-200 border-gray-700/10 cursor-pointer hover:bg-gray-50 transition-colors"
            onClick={() => handleChatClick(chat)}
          >
            <div className="relative">
              {avatar ? (
                <img
                  src={avatar}
                  alt={displayName}
                  className="h-12 w-12 rounded-full object-cover border border-gray-200 group-hover:border-blue-300 transition-colors"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              ) : (
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold text-lg shadow-sm group-hover:shadow-md transition-shadow">
                  {firstLetter}
                </div>
              )}
              
              {/* Online indicator */}
              {!isGroup && isOnline && (
                <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-white shadow-sm animate-pulse">
                  <div className="absolute inset-0 rounded-full bg-green-400 animate-ping opacity-75"></div>
                </div>
              )}
              
              {/* Typing indicator */}
              {!isGroup && isTyping && (
                <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-blue-500 border-2 border-white flex items-center justify-center">
                  <div className="flex space-x-0.5">
                    <div className="h-1 w-1 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="h-1 w-1 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="h-1 w-1 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-center mb-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-gray-800 truncate">
                    {displayName}
                  </h3>
                  {isGroup && (
                    <span className="text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full">
                      Group
                    </span>
                  )}
                </div>
                {lastMessageTime && (
                  <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                    {formatTime(lastMessageTime)}
                  </span>
                )}
              </div>
              
              <div className="flex justify-between items-center">
                <div className="flex-1 min-w-0">
                  {isTyping && typingText ? (
                    <p className="text-sm text-blue-600 font-medium truncate">
                      {typingText}
                    </p>
                  ) : (
                    <p className="text-sm text-gray-600 truncate">
                      {lastMessage}
                    </p>
                  )}
                </div>
                
                {/* Unread message badge - FIXED */}
                {unreadCount > 0 && (
                  <div className="relative ml-2 flex-shrink-0">
                    <span className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs font-bold rounded-full h-5 min-w-5 flex items-center justify-center px-1.5 shadow-lg">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                    <span className="absolute inset-0 bg-blue-400 rounded-full animate-ping opacity-30"></span>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}