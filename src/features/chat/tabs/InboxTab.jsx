// src/features/chat/tabs/InboxTab.jsx
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { 
  useGetNotificationsQuery,
  useMarkNotificationAsReadMutation,
  useDeleteNotificationMutation,
  useMarkAllNotificationsAsReadMutation
} from '../../../api/notificationApi';
import { 
  setNotifications,
  addNotification,
  markAsRead,
  removeNotification,
  markAllAsRead,
  selectNotifications,
  selectUnreadCount
} from '../../../features/notification/notificationSlice';
import { formatDistanceToNow } from 'date-fns';
import { MessageCircle, UserPlus, Info, Check, X, Bell } from 'lucide-react';
import toast from 'react-hot-toast';

export default function InboxTab() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const notifications = useSelector(selectNotifications);
  const unreadCount = useSelector(selectUnreadCount);
  
  const { data: apiNotifications = [], isLoading, refetch, error } = useGetNotificationsQuery();
  const [markAsReadApi] = useMarkNotificationAsReadMutation();
  const [deleteNotificationApi] = useDeleteNotificationMutation();
  const [markAllAsReadApi] = useMarkAllNotificationsAsReadMutation();

  // Debug: Check API connection
  useEffect(() => {
    console.log("🔍 API Connection Check:", {
      hasApi: !!apiNotifications,
      count: apiNotifications?.length,
      error: error
    });
  }, [apiNotifications, error]);

  // Initialize notifications from API
  useEffect(() => {
    if (apiNotifications.length > 0) {
      console.log("📋 Setting notifications from API:", apiNotifications.length);
      dispatch(setNotifications(apiNotifications));
    } else {
      console.log("📋 No notifications from API");
    }
  }, [apiNotifications, dispatch]);

  // Set up socket listeners
  useEffect(() => {
    console.log("🔧 Setting up window notification handlers");
    
    window.addNotification = (data) => {
      console.log('🔔 New notification in InboxTab:', data);
      if (data?.notification) {
        console.log('✅ Dispatching addNotification');
        dispatch(addNotification(data.notification));
        refetch();
        toast.success(data.notification.content || 'New notification', {
          icon: '🔔',
          duration: 3000
        });
      } else {
        console.log('⚠️ No notification in data:', data);
      }
    };

    window.markNotificationRead = (notificationId) => {
      console.log('📖 Marking notification as read:', notificationId);
      dispatch(markAsRead(notificationId));
    };

    // Check if handlers are set
    console.log("✅ window.addNotification is:", typeof window.addNotification);
    console.log("✅ window.markNotificationRead is:", typeof window.markNotificationRead);

    return () => {
      console.log("🧹 Cleaning up notification handlers");
      delete window.addNotification;
      delete window.markNotificationRead;
    };
  }, [dispatch, refetch]);

  // Debug: Log when notifications or unreadCount changes
  useEffect(() => {
    console.log("📊 Redux notifications:", notifications.length, "Unread:", unreadCount);
  }, [notifications, unreadCount]);

  const handleNotificationClick = async (notification) => {
    if (!notification.isRead) {
      try {
        await markAsReadApi(notification._id).unwrap();
        dispatch(markAsRead(notification._id));
      } catch (error) {
        console.error("Failed to mark as read:", error);
      }
    }
    
    if (notification.link) {
      if (notification.link.startsWith('/chat/')) {
        console.log("Navigate to chat:", notification.link);
      } else {
        navigate(notification.link);
      }
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsReadApi().unwrap();
      dispatch(markAllAsRead());
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error("Failed to mark all as read:", error);
      toast.error('Failed to mark all as read');
    }
  };

  const handleDelete = async (e, notificationId) => {
    e.stopPropagation();
    try {
      await deleteNotificationApi(notificationId).unwrap();
      dispatch(removeNotification(notificationId));
      toast.success('Notification deleted');
    } catch (error) {
      console.error("Failed to delete:", error);
      toast.error('Failed to delete notification');
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'message': return <MessageCircle size={20} className="text-blue-500" />;
      case 'friend_request': return <UserPlus size={20} className="text-green-500" />;
      default: return <Info size={20} className="text-gray-500" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <p className="mt-2 text-gray-500">Loading notifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header with mark all as read */}
      <div className="px-4 py-3 border-b border-gray-200 flex justify-between items-center bg-white">
        <h2 className="font-semibold text-gray-800">Notifications</h2>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
          >
            <Check size={16} />
            Mark all as read
          </button>
        )}
      </div>

      {/* Debug button - temporary */}
      <button
        onClick={() => {
          console.log("Current state:", {
            notifications,
            unreadCount,
            apiNotifications: apiNotifications.length
          });
          toast.info(`Notifications: ${notifications.length}, Unread: ${unreadCount}`);
        }}
        className="text-xs bg-gray-200 px-2 py-1 rounded m-2"
      >
        Debug
      </button>

      {/* Notifications list */}
      <div className="flex-1 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <Bell size={48} className="mb-4 text-gray-300" />
            <p className="text-lg">No notifications</p>
            <p className="text-sm mt-2">When you get notifications, they'll appear here</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {notifications.map((notification) => (
              <div
                key={notification._id}
                onClick={() => handleNotificationClick(notification)}
                className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors relative group ${
                  !notification.isRead ? 'bg-blue-50/50' : ''
                }`}
              >
                <div className="flex gap-3">
                  <div className="flex-shrink-0 mt-1">
                    {getIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${!notification.isRead ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                      {notification.content}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                  <button
                    onClick={(e) => handleDelete(e, notification._id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-200 rounded-full self-center"
                    title="Delete"
                  >
                    <X size={16} className="text-gray-500" />
                  </button>
                </div>
                {!notification.isRead && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-500 rounded-r"></div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}