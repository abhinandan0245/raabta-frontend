// src/components/ui/NotificationBell.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Bell, Check, X, MessageCircle, UserPlus, Info } from 'lucide-react';
import { 
  useGetNotificationsQuery,
  useMarkNotificationAsReadMutation,
  useMarkAllNotificationsAsReadMutation,
  useDeleteNotificationMutation 
} from '../../api/notificationApi';
import { 
  addNotification, 
  markAsRead, 
  markAllAsRead, 
  removeNotification,
  selectUnreadCount,
  selectNotifications
} from '../../socket/notificationSlice';
import { formatDistanceToNow } from 'date-fns';

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const dropdownRef = useRef(null);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const unreadCount = useSelector(selectUnreadCount);
  const notifications = useSelector(selectNotifications);
  
  const { data: apiNotifications = [], refetch } = useGetNotificationsQuery();
  const [markAsReadApi] = useMarkNotificationAsReadMutation();
  const [markAllAsReadApi] = useMarkAllNotificationsAsReadMutation();
  const [deleteNotificationApi] = useDeleteNotificationMutation();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Initialize notifications from API
  useEffect(() => {
    if (apiNotifications.length > 0) {
      dispatch(setNotifications(apiNotifications));
    }
  }, [apiNotifications, dispatch]);

  // Set up window handlers for socket notifications
  useEffect(() => {
    window.addNotification = (data) => {
      console.log('🔔 Adding notification:', data);
      if (data.notification) {
        dispatch(addNotification(data.notification));
        refetch(); // Refresh from API
      }
    };

    window.markNotificationRead = (notificationId) => {
      console.log('📖 Marking notification as read:', notificationId);
      dispatch(markAsRead(notificationId));
    };

    return () => {
      delete window.addNotification;
      delete window.markNotificationRead;
    };
  }, [dispatch, refetch]);

  const handleNotificationClick = async (notification) => {
    if (!notification.isRead) {
      try {
        await markAsReadApi(notification._id).unwrap();
        dispatch(markAsRead(notification._id));
      } catch (error) {
        console.error('Failed to mark as read:', error);
      }
    }
    
    if (notification.link) {
      navigate(notification.link);
    }
    setIsOpen(false);
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsReadApi().unwrap();
      dispatch(markAllAsRead());
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const handleDelete = async (e, notificationId) => {
    e.stopPropagation();
    try {
      await deleteNotificationApi(notificationId).unwrap();
      dispatch(removeNotification(notificationId));
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'message': return <MessageCircle size={18} className="text-blue-500" />;
      case 'friend_request': return <UserPlus size={18} className="text-green-500" />;
      default: return <Info size={18} className="text-gray-500" />;
    }
  };

  const displayNotifications = showAll ? notifications : notifications.slice(0, 5);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Icon */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <>
            <span className="absolute top-1 right-1 h-4 w-4 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
            <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full animate-ping"></span>
          </>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b border-gray-200">
            <h3 className="font-semibold text-gray-800">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
              >
                <Check size={14} />
                Mark all as read
              </button>
            )}
          </div>

          {/* Notification List */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Bell size={32} className="mx-auto mb-2 text-gray-300" />
                <p>No notifications</p>
              </div>
            ) : (
              displayNotifications.map((notification) => (
                <div
                  key={notification._id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`p-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors relative group ${
                    !notification.isRead ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 mt-1">
                      {getIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${!notification.isRead ? 'font-semibold' : 'text-gray-700'}`}>
                        {notification.content}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                    <button
                      onClick={(e) => handleDelete(e, notification._id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-200 rounded-full"
                    >
                      <X size={14} className="text-gray-500" />
                    </button>
                  </div>
                  {!notification.isRead && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-500 rounded-r"></div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 5 && (
            <div className="p-2 border-t border-gray-200">
              <button
                onClick={() => setShowAll(!showAll)}
                className="w-full text-center text-sm text-blue-600 hover:text-blue-800 py-1"
              >
                {showAll ? 'Show less' : 'View all notifications'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}