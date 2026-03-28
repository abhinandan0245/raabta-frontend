import React, { useRef, useEffect, useState, useCallback } from "react";
import { Button } from "@mui/material";
import { Send } from "@mui/icons-material";
import Input from "../../components/ui/Input";
import FileUpload from "../../components/ui/FileUpload";
import { Image, File, Video, Download } from "lucide-react";
import {
  useGetMessagesQuery,
  useSendMessageMutation,
} from "../../api/messageApi";
import { useUnblockContactMutation } from "../../api/contactApi";
import { useSelector } from "react-redux";
import {
  getSocket,
  sendTyping,
  sendSocketMessage,
  initializeSocket,
  joinChatRoom,
  onContactBlocked
} from "../../socket/socket";
import toast from "react-hot-toast";

export default function ChatBox({ chat }) {
  const { user, token } = useSelector((state) => state.auth); 
  const currentUserId = user?._id;
  const socket = getSocket();

  const [text, setText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState({});
  const [messages, setMessages] = useState([]);
  const [isBlocked, setIsBlocked] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState({});
  const fileUploadRef = useRef(null);
  const [unblockContact] = useUnblockContactMutation();
  
  const newMessageSoundRef = useRef(null);

  useEffect(() => {
    if (typeof Audio !== 'undefined' && !newMessageSoundRef.current) {
      newMessageSoundRef.current = new Audio('/notification.mp3');
    }
  }, []);

  const bottomRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const lastTypingSentRef = useRef(null);
  const chatContainerRef = useRef(null);
  const isAtBottomRef = useRef(true);

  useEffect(() => {
    if (!socket && user?._id && token) {
      console.log("ChatBox: Initializing socket...");
      initializeSocket(token, user._id);
    }
  }, [socket, user, token]);

  useEffect(() => {
    if (!chat) return;
    
    console.log("🔄 Checking blocked status for chat:", chat);
    
    let blocked = false;
    
    if (chat.isBlocked !== undefined) {
      blocked = chat.isBlocked;
      console.log("✅ Found isBlocked directly:", blocked);
    } else if (chat.contactInfo?.isBlocked !== undefined) {
      blocked = chat.contactInfo.isBlocked;
      console.log("✅ Found isBlocked in contactInfo:", blocked);
    } else if (chat.isContactChat) {
      console.log("ℹ️ Contact chat but no blocked status found, defaulting to false");
      blocked = false;
    }
    
    console.log("🚫 Final blocked status:", blocked);
    setIsBlocked(blocked);
    
  }, [chat]);

  useEffect(() => {
    if (!socket || !chat?._id) return;

    console.log("📡 Setting up DIRECT socket listeners for chat:", chat._id);

    const handleNewMessage = (message) => {
      console.log("📨 DIRECT new_message received:", message);
      
      if (message.chat === chat._id || message.chatId === chat._id) {
        console.log("✅ Message is for this chat, adding...");
        
        setMessages(prev => {
          const exists = prev.some(msg => 
            msg._id === message._id || 
            (msg.isOptimistic && msg.tempId === message.tempId)
          );
          
          if (!exists) {
            console.log("➕ Adding new message to state");
            return [...prev, message];
          }
          console.log("⏭️ Message already exists, skipping");
          return prev;
        });

        if (message.sender?._id !== currentUserId && newMessageSoundRef.current) {
          newMessageSoundRef.current.currentTime = 0;
          newMessageSoundRef.current.play().catch(console.error);
        }

        if (message.sender?._id !== currentUserId && socket.connected) {
          socket.emit('message_read', {
            messageId: message._id,
            chatId: chat._id,
            readerId: currentUserId
          });
        }

        if (isAtBottomRef.current) {
          setTimeout(() => {
            if (bottomRef.current) {
              bottomRef.current.scrollIntoView({ behavior: "smooth" });
            }
          }, 100);
        }
      }
    };

    const handleTypingIndicator = ({ userId, chatId }) => {
      if (chatId === chat._id && userId !== currentUserId) {
        console.log(`⌨️ DIRECT: User ${userId} is typing`);
        setOtherUserTyping(true);
      }
    };

    const handleStopTyping = ({ userId, chatId }) => {
      if (chatId === chat._id && userId !== currentUserId) {
        console.log(`⏹️ DIRECT: User ${userId} stopped typing`);
        setOtherUserTyping(false);
      }
    };

    const handleMessageRead = ({ messageId, readerId, chatId }) => {
      if (chatId === chat._id && readerId !== currentUserId) {
        console.log(`👁️ DIRECT: Message ${messageId} read by ${readerId}`);
        setMessages(prev => prev.map(msg => {
          if (msg._id === messageId) {
            const isAlreadyRead = msg.readBy?.some(r => r.userId === readerId);
            if (!isAlreadyRead) {
              return {
                ...msg,
                readBy: [...(msg.readBy || []), { userId: readerId, readAt: new Date() }]
              };
            }
          }
          return msg;
        }));
      }
    };

    const handleUserStatus = ({ userId, isOnline, lastSeen }) => {
      console.log(`🟢 DIRECT: User ${userId} is ${isOnline ? 'online' : 'offline'}`);
      setOnlineUsers(prev => ({
        ...prev,
        [userId]: { isOnline, lastSeen }
      }));
    };

    socket.on('new_message', handleNewMessage);
    socket.on('typing', handleTypingIndicator);
    socket.on('stop_typing', handleStopTyping);
    socket.on('message_read', handleMessageRead);
    socket.on('user_status_changed', handleUserStatus);
    socket.on('message_received', handleNewMessage);

    if (currentUserId) {
      console.log(`Joining chat room: ${chat._id}`);
      joinChatRoom(chat._id, currentUserId);
    }

    return () => {
      console.log("🧹 Cleaning up DIRECT socket listeners");
      
      socket.off('new_message', handleNewMessage);
      socket.off('typing', handleTypingIndicator);
      socket.off('stop_typing', handleStopTyping);
      socket.off('message_read', handleMessageRead);
      socket.off('user_status_changed', handleUserStatus);
      socket.off('message_received', handleNewMessage);
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      if (lastTypingSentRef.current && chat?._id) {
        sendTyping(chat._id, currentUserId, false);
      }
    };
  }, [socket, chat?._id, currentUserId]);

  useEffect(() => {
    if (!socket || !chat?._id) return;

    console.log("🪟 Setting up window handlers for chat:", chat._id);

    window.updateChatUserStatus = (userId, isOnline, lastSeen) => {
      setOnlineUsers(prev => ({
        ...prev,
        [userId]: { isOnline, lastSeen }
      }));
    };

    window.setChatTypingIndicator = (chatId, userId, typing) => {
      if (chatId === chat._id && userId !== currentUserId) {
        setOtherUserTyping(typing);
      }
    };

    window.dispatchChatNewMessage = (message) => {
      if (message.chat === chat._id) {
        setMessages(prev => {
          const exists = prev.some(msg => msg._id === message._id);
          return !exists ? [...prev, message] : prev;
        });
      }
    };

    return () => {
      delete window.updateChatUserStatus;
      delete window.setChatTypingIndicator;
      delete window.dispatchChatNewMessage;
    };
  }, [socket, chat?._id, currentUserId]);

  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
      isAtBottomRef.current = distanceFromBottom < 100;
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  const handleTyping = useCallback(() => {
    if (!socket?.connected || !chat?._id || !currentUserId || isBlocked) return;

    const now = Date.now();
    const TYPING_INTERVAL = 2000;

    if (!lastTypingSentRef.current || (now - lastTypingSentRef.current) > TYPING_INTERVAL) {
      sendTyping(chat._id, currentUserId, true);
      lastTypingSentRef.current = now;
      setIsTyping(true);
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      sendTyping(chat._id, currentUserId, false);
      setIsTyping(false);
      lastTypingSentRef.current = null;
    }, 3000);
  }, [socket, chat?._id, currentUserId, isBlocked]);

  const getLastSeenText = useCallback((lastSeen) => {
    if (!lastSeen) return "Never";
    
    const now = new Date();
    const lastSeenDate = new Date(lastSeen);
    const diffMs = now - lastSeenDate;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return lastSeenDate.toLocaleDateString();
  }, []);

  const { 
    data: messagesData, 
    isLoading, 
    refetch 
  } = useGetMessagesQuery(
    { chatId: chat?._id, page: 1, limit: 50 },
    { skip: !chat?._id }
  );

  const [sendMessage] = useSendMessageMutation();

  useEffect(() => {
    if (messagesData?.messages) {
      console.log("📋 Initializing messages from API:", messagesData.messages.length);
      setMessages(messagesData.messages);
    }
  }, [messagesData]);

  useEffect(() => {
    if (isAtBottomRef.current && bottomRef.current) {
      setTimeout(() => {
        bottomRef.current.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  }, [messages]);

  useEffect(() => {
    if (!chat?._id || !currentUserId || !messages.length || isBlocked) return;

    const unreadMessages = messages.filter(msg => 
      msg.sender?._id !== currentUserId && 
      !msg.readBy?.some(r => r.userId === currentUserId)
    );

    if (unreadMessages.length > 0 && socket?.connected) {
      console.log(`Marking ${unreadMessages.length} messages as read`);
      unreadMessages.forEach(msg => {
        socket.emit('message_read', {
          messageId: msg._id,
          chatId: chat._id,
          readerId: currentUserId
        });
      });
    }
  }, [chat?._id, currentUserId, messages, socket, isBlocked]);

  useEffect(() => {
    console.log("🔌 ChatBox Socket Status:", {
      socketExists: !!socket,
      connected: socket?.connected,
      socketId: socket?.id,
      chatId: chat?._id,
      currentUserId,
      isBlocked
    });
  }, [socket, chat, currentUserId, isBlocked]);

  useEffect(() => {
    if (!socket) {
      console.log("📢 No socket yet, skipping blocked listener setup");
      return;
    }
    
    if (!chat) {
      console.log("📢 No chat yet, skipping blocked listener setup");
      return;
    }
    
    console.log("📢 Setting up contact blocked listener for chat:", {
      chatId: chat._id,
      contactId: chat.contactId,
      isContactChat: chat.isContactChat
    });
    
    const handleContactBlocked = ({ contactId, isBlocked }) => {
      console.log("📢📢📢 CONTACT BLOCKED EVENT RECEIVED IN CHATBOX:", {
        receivedContactId: contactId,
        currentChatContactId: chat.contactId,
        currentChatId: chat._id,
        newBlockedStatus: isBlocked
      });
      
      const matches = 
        chat.contactId === contactId || 
        chat._id === contactId ||
        (chat.isContactChat && chat._id === contactId);
      
      if (matches) {
        console.log("✅ MATCH FOUND! Updating blocked status to:", isBlocked);
        setIsBlocked(isBlocked);
        
        if (isBlocked) {
          toast.success("Contact has been blocked", { icon: '🔴' });
        } else {
          toast.success("Contact has been unblocked", { icon: '✅' });
        }
      } else {
        console.log("❌ No match for this chat");
      }
    };
    
    const unsubscribe = onContactBlocked(handleContactBlocked);
    console.log("✅ Blocked listener registered");
    
    return () => {
      console.log("🧹 Cleaning up blocked listener");
      unsubscribe();
    };
  }, [socket, chat]);

const handleFilesSelected = (files) => {
  setSelectedFiles(files);
};
const handleSend = async () => {
  if ((!text.trim() && selectedFiles.length === 0) || !chat?._id) return;
  
  if (isBlocked) {
    toast.error("You cannot send messages to a blocked contact. Unblock them first.");
    return;
  }
  
  console.log("🚀 Sending message with files:", selectedFiles.length);
  
  // Store current files and text for optimistic update
  const currentFiles = [...selectedFiles];
  const currentText = text;
  const tempId = `temp_${Date.now()}`;
  
  try {
    let formData;
    let optimisticMessage;
    
    if (currentFiles.length > 0) {
      formData = new FormData();
      formData.append('chatId', chat._id);
      formData.append('content', currentText.trim() || '');
      
      // Append each file
      currentFiles.forEach((fileObj) => {
        formData.append('attachments', fileObj.file);
      });
      
      // Create optimistic message with file previews
      const attachments = currentFiles.map(f => ({
        url: f.preview,
        type: f.type,
        filename: f.name,
        size: f.size,
        mimeType: f.mimeType,
        isOptimistic: true
      }));
      
      optimisticMessage = {
        _id: tempId,
        tempId,
        sender: {
          _id: currentUserId,
          name: user?.name || 'User',
          avatar: user?.avatar,
          number: user?.number
        },
        content: currentText.trim() || '',
        attachments: attachments,
        chat: chat._id,
        chatId: chat._id,
        createdAt: new Date().toISOString(),
        isOptimistic: true,
        readBy: [{ userId: currentUserId, readAt: new Date().toISOString() }]
      };
    } else {
      // Text only message
      optimisticMessage = {
        _id: tempId,
        tempId,
        sender: {
          _id: currentUserId,
          name: user?.name || 'User',
          avatar: user?.avatar,
          number: user?.number
        },
        content: currentText.trim(),
        attachments: [],
        chat: chat._id,
        chatId: chat._id,
        createdAt: new Date().toISOString(),
        isOptimistic: true,
        readBy: [{ userId: currentUserId, readAt: new Date().toISOString() }]
      };
    }

    // Add optimistic message to UI
    setMessages(prev => [...prev, optimisticMessage]);
    
    // Clear input and files IMMEDIATELY
    setText("");
    setSelectedFiles([]);
    
    // Clear FileUpload component using ref
    if (fileUploadRef.current) {
      fileUploadRef.current.clearFiles();
    }
    
    // Send via socket for real-time preview
    if (socket?.connected) {
      console.log("📤 Sending via socket");
      sendSocketMessage({
        ...optimisticMessage,
        isOptimistic: false,
        attachments: optimisticMessage.attachments.map(a => ({...a, isOptimistic: false}))
      });
    }

    // Send via API
    console.log("📡 Sending via API...");
    let result;
    
    if (currentFiles.length > 0) {
      result = await sendMessage(formData).unwrap();
    } else {
      result = await sendMessage({ 
        chatId: chat._id, 
        content: currentText.trim() 
      }).unwrap();
    }
    
    console.log("✅ API call successful", result);
    
    // Clear typing indicator
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    if (lastTypingSentRef.current && chat?._id) {
      sendTyping(chat._id, currentUserId, false);
      setIsTyping(false);
      lastTypingSentRef.current = null;
    }
    
    // Refetch messages
    refetch();
    
  } catch (err) {
    console.error("❌ Message send failed:", err);
    
    // Remove optimistic message on error
    setMessages(prev => prev.filter(msg => msg.tempId !== tempId));
    
    // Restore files and text ONLY on error
    setSelectedFiles(currentFiles);
    setText(currentText);
    
    // Show specific error message
    if (err.data?.message) {
      toast.error(err.data.message);
    } else if (err.error) {
      toast.error(err.error);
    } else {
      toast.error("Failed to send message");
    }
  }
};

  const handleUnblock = async () => {
    try {
      let contactId = null;
      
      if (chat.contactId) {
        contactId = chat.contactId;
        console.log("✅ Found contactId directly:", contactId);
      } else if (chat.contactInfo?.contactId) {
        contactId = chat.contactInfo.contactId;
        console.log("✅ Found contactId in contactInfo:", contactId);
      } else if (chat.isContactChat && chat._id) {
        contactId = chat._id;
        console.log("⚠️ Using chat._id as contactId:", contactId);
      }
      
      if (!contactId) {
        console.error("❌ No contact ID found in chat:", chat);
        toast.error("Cannot unblock: contact ID not found");
        return;
      }
      
      console.log("🔄 Unblocking contact with ID:", contactId);
      
      const result = await unblockContact(contactId).unwrap();
      
      toast.success(result.message || "Contact unblocked successfully");
      
      setIsBlocked(false);
      
    } catch (error) {
      console.error("❌ Unblock failed:", error);
      toast.error(error.data?.message || "Failed to unblock contact");
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    } else {
      handleTyping();
    }
  };

  const handleInputChange = (e) => {
    setText(e.target.value);
    handleTyping();
  };

  const handleInputBlur = () => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    if (lastTypingSentRef.current && chat?._id) {
      sendTyping(chat._id, currentUserId, false);
      setIsTyping(false);
      lastTypingSentRef.current = null;
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getMessageStatus = (message) => {
    if (message.sender?._id !== currentUserId) return null;
    
    const readByOthers = message.readBy?.filter(r => r.userId !== currentUserId);
    const deliveredToOthers = message.deliveredTo?.filter(id => id !== currentUserId);
    
    if (readByOthers?.length > 0) {
      return { status: 'read', count: readByOthers.length };
    } else if (deliveredToOthers?.length > 0) {
      return { status: 'delivered', count: deliveredToOthers.length };
    } else {
      return { status: 'sent', count: 0 };
    }
  };

  const renderMessageStatus = (message) => {
    const status = getMessageStatus(message);
    if (!status) return null;

    switch (status.status) {
      case 'read':
        return (
          <span className="text-xs text-blue-500 ml-1" title="Read">
            ✓✓
          </span>
        );
      case 'delivered':
        return (
          <span className="text-xs text-gray-500 ml-1" title="Delivered">
            ✓✓
          </span>
        );
      case 'sent':
        return (
          <span className="text-xs text-gray-400 ml-1" title="Sent">
            ✓
          </span>
        );
      default:
        return null;
    }
  };

const renderAttachments = (attachments) => {
  if (!attachments || attachments.length === 0) return null;
  
  return (
    <div className="mt-2 space-y-2">
      {attachments.map((att, idx) => {
        // Make sure URL exists and is complete
        if (!att.url) {
          return (
            <div key={idx} className="text-sm text-gray-500 p-2 bg-gray-100 rounded">
              File: {att.filename || 'Unknown file'}
            </div>
          );
        }
        
        const fileUrl = att.url.startsWith('http') 
          ? att.url 
          : `http://localhost:4000${att.url}`;
          
        if (att.type === 'image') {
          return (
            <div key={idx} className="relative">
              <img 
                src={fileUrl} 
                alt={att.filename || 'Image'} 
                className="max-w-full max-h-64 rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => window.open(fileUrl, '_blank')}
              />
              {att.isOptimistic && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
                  <div className="text-white text-sm">Uploading...</div>
                </div>
              )}
            </div>
          );
        } else if (att.type === 'video') {
          return (
            <div key={idx} className="relative">
              <video 
                src={fileUrl} 
                controls 
                className="max-w-full max-h-64 rounded-lg"
              />
            </div>
          );
        } else {
          // Document/PDF display
          const isPDF = att.type === 'pdf' || att.filename?.toLowerCase().endsWith('.pdf');
          const isWord = att.filename?.toLowerCase().endsWith('.doc') || att.filename?.toLowerCase().endsWith('.docx');
          const isExcel = att.filename?.toLowerCase().endsWith('.xls') || att.filename?.toLowerCase().endsWith('.xlsx');
          const isText = att.filename?.toLowerCase().endsWith('.txt');
          
          // Determine icon color based on file type
          let iconColor = "text-gray-600";
          if (isPDF) iconColor = "text-red-500";
          else if (isWord) iconColor = "text-blue-500";
          else if (isExcel) iconColor = "text-green-500";
          else if (isText) iconColor = "text-yellow-500";
          
          // Format file size
          const formatSize = (bytes) => {
            if (!bytes) return 'Size unknown';
            if (bytes < 1024) return bytes + ' B';
            if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
            return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
          };
          
          // Get file extension for display
          const getFileExtension = (filename) => {
            if (!filename) return '';
            const ext = filename.split('.').pop().toUpperCase();
            return ext;
          };
          
          return (
            <div key={idx} className="flex items-center gap-3 p-3 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors group">
              <div className={`${iconColor}`}>
                <File size={24} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium truncate text-gray-500">{att.filename || 'Document'}</p>
                  <span className="text-xs px-1.5 py-0.5 bg-gray-300 rounded text-gray-700">
                    {getFileExtension(att.filename)}
                  </span>
                </div>
                <p className="text-xs text-gray-500">
                  {formatSize(att.size)}
                  {att.mimeType && ` • ${att.mimeType.split('/')[1]}`}
                </p>
              </div>
              <a 
                href={fileUrl} 
                download={att.filename}
                target="_blank" 
                rel="noopener noreferrer"
                className="p-2 hover:bg-gray-300 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                title="Download"
              >
                <Download size={18} />
              </a>
            </div>
          );
        }
      })}
    </div>
  );
};

  if (!chat) {
    return (
      <div className="h-full flex flex-col items-center justify-center">
        <p className="text-center text-gray-400 text-lg">
          Select a chat or contact to start messaging
        </p>
      </div>
    );
  }

  const chatId = chat._id;

  const getDisplayInfo = () => {
    if (chat.contactInfo?.savedName) {
      return {
        displayName: chat.contactInfo.savedName,
        avatar: chat.contactInfo.targetUser?.avatar || null,
        number: chat.contactInfo.number,
        isContact: true,
        otherUser: chat.contactInfo.targetUser || chat.otherUser
      };
    }
    
    if (chat.contactName) {
      return {
        displayName: chat.contactName,
        avatar: chat.otherUser?.avatar || null,
        number: chat.otherUser?.number,
        isContact: true,
        otherUser: chat.otherUser
      };
    }
    
    if (chat.savedName) {
      return {
        displayName: chat.savedName,
        avatar: chat.otherUser?.avatar || null,
        number: chat.otherUser?.number,
        isContact: true,
        otherUser: chat.otherUser
      };
    }
    
    if (!chat.isGroupChat && chat.users && chat.users.length === 2) {
      const otherUser = chat.users.find(u => 
        u._id !== currentUserId || (typeof u === 'object' && u.userId !== currentUserId)
      );
      
      const userObj = otherUser?.userId ? {
        _id: otherUser.userId,
        name: otherUser.name,
        avatar: otherUser.avatar,
        number: otherUser.number,
        isOnline: otherUser.isOnline,
        lastSeen: otherUser.lastSeen
      } : otherUser;
      
      return {
        displayName: userObj?.name || "Unknown",
        avatar: userObj?.avatar || null,
        number: userObj?.number,
        isContact: false,
        otherUser: userObj
      };
    }
    
    return {
      displayName: chat.chatName || "Group Chat",
      avatar: chat.chatImage || null,
      number: null,
      isContact: false,
      otherUser: null
    };
  };

  const { displayName, avatar, number, isContact, otherUser } = getDisplayInfo();
  const firstLetter = displayName?.charAt(0).toUpperCase() || "?";

  const isOtherUserOnline = otherUser?._id ? onlineUsers[otherUser._id]?.isOnline || otherUser.isOnline : false;
  const otherUserLastSeen = otherUser?._id ? onlineUsers[otherUser._id]?.lastSeen || otherUser.lastSeen : null;

  return (
    <div className="h-full flex flex-col">
      <div className="h-16 px-4 border-b border-gray-200 shadow-lg flex items-center justify-between shrink-0 bg-white">
        <div className="flex items-center gap-3">
          <div className="relative">
            {avatar ? (
              <img 
                src={avatar} 
                alt={displayName} 
                className="h-10 w-10 rounded-full object-cover" 
                onError={(e) => {
                  e.target.style.display = 'none';
                  const fallback = e.target.nextElementSibling;
                  if (fallback) {
                    fallback.style.display = 'flex';
                  }
                }}
              />
            ) : (
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                {firstLetter}
              </div>
            )}
            
            {otherUser && !isBlocked && (
              <div className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white ${
                isOtherUserOnline ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
              }`}>
                {isOtherUserOnline && (
                  <div className="absolute inset-0 rounded-full bg-green-400 animate-ping opacity-75"></div>
                )}
              </div>
            )}

            {isBlocked && (
              <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-red-500 border-2 border-white flex items-center justify-center">
                <div className="h-1 w-1 bg-white rounded-full"></div>
              </div>
            )}

            {otherUserTyping && !isBlocked && (
              <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-blue-500 border-2 border-white flex items-center justify-center">
                <div className="flex space-x-0.5">
                  <div className="h-1 w-1 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="h-1 w-1 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="h-1 w-1 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            )}
          </div>
          
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-medium">{displayName}</h2>
              {isBlocked && (
                <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
                  Blocked
                </span>
              )}
            </div>
            
            {otherUser ? (
              <div className="flex items-center">
                <p className="text-sm text-gray-500">
                  {isBlocked ? (
                    <span className="text-red-500">You blocked this contact</span>
                  ) : otherUserTyping ? (
                    <span className="flex items-center gap-1 text-blue-600 font-medium">
                      <span className="flex items-center">
                        <div className="flex space-x-0.5 mr-1">
                          <div className="h-1 w-1 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                          <div className="h-1 w-1 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                          <div className="h-1 w-1 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                        </div>
                        <span>Typing...</span>
                      </span>
                    </span>
                  ) : isOtherUserOnline ? (
                    <span className="flex items-center gap-1">
                      <span>Online</span>
                      {otherUser.number && (
                        <span className="ml-2 text-gray-400">• {otherUser.number}</span>
                      )}
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <span>Offline</span>
                      {otherUserLastSeen && (
                        <span className="ml-2 text-gray-400">• Last seen {getLastSeenText(otherUserLastSeen)}</span>
                      )}
                    </span>
                  )}
                </p>
              </div>
            ) : isContact ? (
              <p className="text-sm text-gray-500">
                {number || "Contact"}
              </p>
            ) : (
              <p className="text-sm text-gray-500">
                {chat.users?.length || 0} members
              </p>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {!socket?.connected && (
            <button 
              onClick={() => socket?.connect()}
              className="text-xs bg-yellow-100 text-yellow-600 px-2 py-1 rounded hover:bg-yellow-200 transition-colors"
              title="Reconnect socket"
            >
              Reconnect
            </button>
          )}
        </div>
      </div>

      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4 bg-gradient-to-b from-gray-50 to-white"
      >
        {isLoading ? (
          <div className="flex justify-center items-center h-full">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <p className="mt-2 text-gray-500">Loading messages...</p>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col justify-center items-center h-full text-center">
            <div className="h-20 w-20 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center mb-4">
              <svg className="w-10 h-10 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <p className="text-gray-400 text-lg">Start a conversation with {displayName}</p>
            <p className="text-gray-400 text-sm mt-1">Messages will appear here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map(msg => {
              const isOwnMessage = msg.sender?._id === currentUserId;
              const isOptimistic = msg.isOptimistic;
              const messageStatus = getMessageStatus(msg);
              
              return (
                <div 
                  key={msg._id || msg.tempId} 
                  className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                >
                  <div 
                    className={`max-w-xs lg:max-w-md px-3 py-2 rounded-lg break-words relative group ${
                      isOwnMessage 
                        ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-br-none' 
                        : 'bg-gray-100 text-gray-800 rounded-bl-none'
                    } ${isOptimistic ? 'opacity-80' : ''}`}
                  >
                    {msg.isEdited && (
                      <span className="absolute -top-2 right-2 text-xs text-gray-400 bg-white px-1 rounded">
                        edited
                      </span>
                    )}
                    
                    {msg.content && <p className="whitespace-pre-wrap">{msg.content}</p>}
                    {msg.attachments && renderAttachments(msg.attachments)}
                    
                    <div className="flex items-center justify-end mt-1">
                      <p className={`text-xs ${isOwnMessage ? 'text-blue-200' : 'text-gray-500'}`}>
                        {formatTime(msg.createdAt)}
                      </p>
                      
                      {isOwnMessage && renderMessageStatus(msg)}
                      
                      {isOptimistic && (
                        <span className="text-xs text-blue-200 ml-1">Sending...</span>
                      )}
                    </div>
                    
                    {isOwnMessage && messageStatus?.status === 'read' && msg.readBy && (
                      <div className="flex items-center gap-1 mt-1">
                        {msg.readBy
                          .filter(r => r.userId !== currentUserId)
                          .slice(0, 3)
                          .map((r, index) => (
                            <div 
                              key={index}
                              className="h-4 w-4 rounded-full bg-green-400 border border-white flex items-center justify-center text-[8px] text-white"
                              title={`Read by user`}
                            >
                              ✓
                            </div>
                          ))}
                        {msg.readBy.length > 4 && (
                          <span className="text-[10px] text-blue-200">+{msg.readBy.length - 3}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      <div className="border-t border-gray-200 bg-white p-3">
        {isBlocked && (
          <div className="mb-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            <div className="flex items-center justify-between">
              <span>You have blocked this contact. Unblock to send messages.</span>
              <button 
                onClick={handleUnblock}
                className="text-red-800 font-medium hover:text-red-900 bg-red-100 px-3 py-1 rounded-full"
              >
                Unblock
              </button>
            </div>
          </div>
        )}

        {!socket?.connected && (
          <div className="mb-2 px-3 py-1.5 bg-yellow-50 border border-yellow-200 rounded-lg text-xs text-yellow-700">
            <div className="flex items-center justify-between">
              <span>Real-time features temporarily unavailable</span>
              <button 
                onClick={() => socket?.connect()}
                className="text-yellow-800 font-medium hover:text-yellow-900"
              >
                Reconnect
              </button>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2">
          <FileUpload ref={fileUploadRef} onFilesSelected={handleFilesSelected} />
          <Input 
            type="text" 
            placeholder={isBlocked ? "Unblock to send messages" : `Message ${displayName}...`} 
            value={text}
            onChange={handleInputChange}
            onKeyDown={handleKeyPress}
            onBlur={handleInputBlur}
            className="flex-1 px-4 py-2.5 border border-gray-300 rounded-full focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
            disabled={!socket?.connected || isBlocked}
          />
          
          <Button 
            variant="contained" 
            endIcon={<Send />} 
            onClick={handleSend}
            disabled={(!text.trim() && selectedFiles.length === 0) || !socket?.connected || isBlocked}
            className="rounded-full px-6 py-2.5 shadow-sm"
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)',
              },
              '&.Mui-disabled': {
                background: '#9ca3af',
              }
            }}
          >
            Send
          </Button>
        </div>
        
        {/* {selectedFiles.length > 0 && (
          <div className="mt-2">
            <FileUpload onFilesSelected={handleFilesSelected} />
          </div>
        )} */}
         <div className="mt-2">
    {/* <FileUpload onFilesSelected={handleFilesSelected} /> */}
  </div>
        
        <div className="mt-2 flex items-center justify-between px-1">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            {isTyping && (
              <span className="flex items-center text-blue-600">
                <div className="flex space-x-0.5 mr-1">
                  <div className="h-1 w-1 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="h-1 w-1 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="h-1 w-1 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
                You're typing...
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}