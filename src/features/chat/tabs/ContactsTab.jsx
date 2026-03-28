// import { useEffect, useState, useCallback } from "react";
// import { useSelector } from "react-redux";
// import { 
//   useBlockContactMutation, 
//   useGetAllContactsQuery, 
//   useUnblockContactMutation 
// } from "../../../api/contactApi";
// import { useAccessChatFromContactMutation } from "../../../api/chatApi";
// import { 
//   initializeSocket, 
//   getSocket, 
//   joinChatRoom,
//   isSocketConnected,
//   sendTyping,
//   updateOnlineStatus
// } from "../../../socket/socket";
// import Dropdown from "../../../components/ui/Dropdown";
// import { Delete, Edit, LogOut, MoreVertical, Settings, User } from "lucide-react";

// //  MOVE SOCKET STATUS INDICATOR COMPONENT HERE - BEFORE MAIN COMPONENT
// const SocketStatusIndicator = ({ onlineUsers }) => {
//   const socket = getSocket();
//   const connected = isSocketConnected();
//   const onlineCount = Object.values(onlineUsers).filter(u => u.isOnline).length;
  
//   return (
//     <div className="flex items-center justify-between px-4 py-2 bg-gradient-to-r from-blue-50 to-purple-50 border-b">
//       <div className="flex items-center gap-2">
//         <div className={`h-2 w-2 rounded-full animate-pulse ${connected ? 'bg-green-500' : 'bg-red-500'}`} />
//         <span className="text-xs font-medium">
//           {connected ? 'Live' : 'Offline'}
//         </span>
//         <span className="text-xs text-gray-500">
//           {connected ? '• Real-time updates active' : '• Connecting...'}
//         </span>
//       </div>
//       <div className="flex items-center gap-2">
//         <div className="flex -space-x-1">
//           {Object.keys(onlineUsers)
//             .filter(userId => onlineUsers[userId]?.isOnline)
//             .slice(0, 3)
//             .map(userId => (
//               <div 
//                 key={userId}
//                 className="h-4 w-4 rounded-full bg-green-500 border border-white"
//                 title="Online contact"
//               />
//             ))}
//         </div>
//         <span className="text-xs text-gray-500">
//           {onlineCount} online
//         </span>
//       </div>
//     </div>
//   );
// };

// export default function ContactsTab({ setSelectedChat }) {
//   const { user, token } = useSelector(state => state.auth);
//   const { data: contactsData, isLoading, refetch } = useGetAllContactsQuery();
//   const [blockContact] = useBlockContactMutation();
//   const [unblockContact] = useUnblockContactMutation();
//   const [accessChatFromContact] = useAccessChatFromContactMutation();

//   const [socketInitialized, setSocketInitialized] = useState(false);
//   const [onlineUsers, setOnlineUsers] = useState({});
//   const [typingUsers, setTypingUsers] = useState({});

//   const contacts = contactsData?.contacts || [];

//   // Initialize socket when component mounts
//   useEffect(() => {
//     if (user?._id && token && !socketInitialized) {
//       try {
//         console.log('🔌 ContactsTab: Initializing socket connection...');
//         const socket = initializeSocket(token, user._id);
        
//         // Set up window handlers for socket events
//         window.updateContactUserStatus = (userId, isOnline, lastSeen) => {
//           setOnlineUsers(prev => ({
//             ...prev,
//             [userId]: { isOnline, lastSeen, lastUpdated: new Date().toISOString() }
//           }));
//           console.log(`🟢 Contact status: ${userId} is ${isOnline ? 'online' : 'offline'}`);
//         };

//         window.setContactTypingIndicator = (chatId, userId, isTyping) => {
//           setTypingUsers(prev => {
//             const newTypingUsers = { ...prev };
//             if (!newTypingUsers[chatId]) {
//               newTypingUsers[chatId] = {};
//             }
//             newTypingUsers[chatId][userId] = {
//               isTyping,
//               lastTypingTime: new Date().toISOString()
//             };
//             return newTypingUsers;
//           });
//           console.log(`⌨️ Contact typing: ${userId} in ${chatId}`);
//         };

//         window.contactNewMessage = (message) => {
//           console.log('📨 New message for contact:', message);
//           // Refresh contacts to update any chat status
//           refetch();
//         };

//         // Cleanup stale typing indicators periodically
//         const cleanupInterval = setInterval(() => {
//           const now = new Date();
//           setTypingUsers(prev => {
//             const newTypingUsers = { ...prev };
//             Object.keys(newTypingUsers).forEach(chatId => {
//               Object.keys(newTypingUsers[chatId]).forEach(userId => {
//                 const typingTime = new Date(newTypingUsers[chatId][userId].lastTypingTime);
//                 const diffMs = now - typingTime;
//                 if (diffMs > 10000) { // 10 seconds timeout
//                   delete newTypingUsers[chatId][userId];
//                 }
//               });
//               // Remove empty chat objects
//               if (Object.keys(newTypingUsers[chatId]).length === 0) {
//                 delete newTypingUsers[chatId];
//               }
//             });
//             return newTypingUsers;
//           });
//         }, 5000);

//         setSocketInitialized(true);

//         // Cleanup on unmount
//         return () => {
//           console.log('🧹 ContactsTab: Cleaning up socket listeners...');
//           clearInterval(cleanupInterval);
//           delete window.updateContactUserStatus;
//           delete window.setContactTypingIndicator;
//           delete window.contactNewMessage;
//         };

//       } catch (error) {
//         console.error('❌ ContactsTab: Failed to initialize socket:', error);
//       }
//     }
//   }, [user?._id, token, socketInitialized, refetch]);

//   // Update own online status periodically
//   useEffect(() => {
//     if (socketInitialized && user?._id) {
//       // Update online status when component mounts
//       updateOnlineStatus(user._id, true);
      
//       // Update status every 30 seconds to keep alive
//       const interval = setInterval(() => {
//         updateOnlineStatus(user._id, true);
//       }, 30000);
      
//       return () => {
//         clearInterval(interval);
//         // Update offline status when component unmounts
//         updateOnlineStatus(user._id, false);
//       };
//     }
//   }, [socketInitialized, user?._id]);

//   // Helper to check if a user is online
//   const checkUserOnline = useCallback((userId) => {
//     return onlineUsers[userId]?.isOnline || false;
//   }, [onlineUsers]);

//   // Helper to check if a user is typing in a specific chat
//   const checkUserTyping = useCallback((chatId, userId) => {
//     return typingUsers[chatId]?.[userId]?.isTyping || false;
//   }, [typingUsers]);

//   const handleContactClick = async (contact) => {
//     try {
//       console.log("=== CONTACT CLICK DEBUG ===");
//       console.log("Clicked contact:", contact);
      
//       // Find the saved name for this contact
//       const currentUserEntry = contact.createdBy?.find(
//         entry => entry.userId === user?._id || entry.userId?._id === user?._id
//       );
//       const savedName = currentUserEntry?.name || "Unknown";
      
//       // Use accessChatFromContact
//       const result = await accessChatFromContact({ 
//         contactId: contact._id 
//       }).unwrap();
      
//       console.log("Chat result:", result);
      
//       if (result.success && result.chat) {
//         const chat = result.chat;
//         const chatId = chat._id;
        
//         // Join the chat room via socket
//         if (user?._id) {
//           joinChatRoom(chatId, user._id);
//         }
        
//         // Check if other user is online
//         let otherUser = null;
//         let otherUserId = null;
        
//         if (chat.otherUser) {
//           otherUser = chat.otherUser;
//           otherUserId = otherUser._id;
//         } else if (chat.users && Array.isArray(chat.users)) {
//           otherUser = chat.users.find(u => {
//             const userId = u._id || u.userId || u.id;
//             return String(userId) !== String(user?._id);
//           });
//           otherUserId = otherUser?._id;
//         }
        
//         const isOtherUserOnline = otherUserId ? checkUserOnline(otherUserId) : false;
//         const isOtherUserTyping = otherUserId && chatId ? checkUserTyping(chatId, otherUserId) : false;
        
//         // Enhance chat with contact and socket info
//         const enhancedChat = {
//           ...chat,
//           savedName: savedName,
//           contactNumber: contact.number,
//           isContactChat: true,
//           socketInfo: {
//             isConnected: isSocketConnected(),
//             socketId: getSocket()?.id,
//             otherUserOnline: isOtherUserOnline,
//             otherUserTyping: isOtherUserTyping,
//             otherUserId: otherUserId
//           }
//         };
        
//         console.log("Enhanced chat with socket info:", enhancedChat);
//         console.log("=== END DEBUG ===");
        
//         setSelectedChat(enhancedChat);
//       }
//     } catch (error) {
//       console.error("Failed to access chat:", error);
//       alert(error.data?.message || "Failed to start chat");
//     }
//   };

//   const handleBlockToggle = async (e, contact) => {
//     e.stopPropagation();
    
//     try {
//       // Check if user has already blocked this contact
//       const currentUserEntry = contact.createdBy?.find(
//         entry => entry.userId === user?._id || entry.userId?._id === user?._id
//       );
      
//       const isCurrentlyBlocked = currentUserEntry?.isBlock || false;
      
//       if (isCurrentlyBlocked) {
//         await unblockContact(contact._id).unwrap();
//         console.log("Contact unblocked");
//       } else {
//         await blockContact(contact._id).unwrap();
//         console.log("Contact blocked");
//       }
      
//       // Refresh contacts list
//       refetch();
//     } catch (error) {
//       console.error("Block/Unblock failed:", error);
//       alert(error.data?.message || "Failed to update contact");
//     }
//   };

//   // Send typing indicator (if needed for testing)
//   const handleTestTyping = useCallback((e, chatId, userId) => {
//     e.stopPropagation();
    
//     if (user?._id) {
//       // Send typing indicator for 3 seconds
//       sendTyping(chatId, user._id, true);
      
//       setTimeout(() => {
//         sendTyping(chatId, user._id, false);
//       }, 3000);
      
//       console.log(`⌨️ Sent typing indicator to chat: ${chatId}`);
//     }
//   }, [user?._id]);

//   // Get online status text
//   const getOnlineStatusText = (userId) => {
//     const status = onlineUsers[userId];
//     if (!status) return 'Offline';
    
//     if (status.isOnline) return 'Online';
    
//     if (status.lastSeen) {
//       const lastSeen = new Date(status.lastSeen);
//       const now = new Date();
//       const diffMinutes = Math.floor((now - lastSeen) / (1000 * 60));
      
//       if (diffMinutes < 1) return 'Just now';
//       if (diffMinutes < 60) return `${diffMinutes}m ago`;
//       if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`;
//       return `${Math.floor(diffMinutes / 1440)}d ago`;
//     }
    
//     return 'Offline';
//   };

//   // Get contact's target user ID (the actual app user, not just contact entry)
//   const getContactTargetUserId = (contact) => {
//     // This would require additional logic to find the registered user with this number
//     // For now, we'll return null and implement later
//     return null;
//   };

//   if (isLoading) {
//     return (
//       <div className="flex flex-col">
//         <SocketStatusIndicator onlineUsers={onlineUsers} />
//         <div className="p-8 text-center">
//           <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
//           <p className="mt-2 text-gray-500">Loading contacts...</p>
//         </div>
//       </div>
//     );
//   }
  
//   if (contacts.length === 0) {
//     return (
//       <div className="flex flex-col">
//         <SocketStatusIndicator onlineUsers={onlineUsers} />
//         <div className="p-8 text-center">
//           <p className="text-gray-500">No contacts found.</p>
//           <p className="text-sm text-gray-400 mt-1">Add contacts to start chatting</p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="flex flex-col">
//       <SocketStatusIndicator onlineUsers={onlineUsers} />
      
//       {contacts.map(contact => {
//         // Find current user's entry in createdBy array
//         const currentUserEntry = contact.createdBy?.find(
//           entry => {
//             if (typeof entry.userId === 'object') {
//               return entry.userId._id === user?._id;
//             } else {
//               return entry.userId === user?._id;
//             }
//           }
//         );
        
//         // Get the saved contact name
//         const savedName = currentUserEntry?.name || "Unknown";
//         const isBlocked = currentUserEntry?.isBlock || false;
//         const firstLetter = savedName.charAt(0).toUpperCase();
        
//         // Try to get target user ID for online status
//         const targetUserId = getContactTargetUserId(contact);
//         const isOnline = targetUserId ? checkUserOnline(targetUserId) : false;
//         const onlineStatusText = targetUserId ? getOnlineStatusText(targetUserId) : '';

//         return (
//           <div
//             key={contact._id}
//             className="group flex items-center justify-between px-4 py-3 border-b border-gray-200 cursor-pointer hover:bg-gradient-to-r hover:from-blue-50 hover:to-white transition-all duration-200"
//             onClick={() => handleContactClick(contact)}
//           >
//             <div className="flex items-center gap-3 flex-1">
//               {/* Avatar with online indicator */}
//               <div className="relative">
//                 <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold text-lg shadow-sm group-hover:shadow-md transition-shadow">
//                   {firstLetter}
//                 </div>
                
//                 {/* Online indicator dot */}
//                 {isOnline && (
//                   <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-white shadow-sm animate-pulse">
//                     <div className="absolute inset-0 rounded-full bg-green-400 animate-ping opacity-75"></div>
//                   </div>
//                 )}
//               </div>

//               <div className="flex-1 min-w-0">
//                 <div className="flex items-center gap-2">
//                   <h3 className="font-semibold text-gray-800 truncate">
//                     {savedName}
//                   </h3>
//                   {isBlocked && (
//                     <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">
//                       Blocked
//                     </span>
//                   )}
//                 </div>
                
//                 <div className="flex items-center gap-2 mt-1">
//                   <p className="text-sm text-gray-600 truncate">
//                     {contact.number || "-"}
//                   </p>
                  
//                   {isOnline && (
//                     <>
//                       <span className="h-1 w-1 rounded-full bg-green-500"></span>
//                       <span className="text-xs text-green-600 font-medium">
//                         Online
//                       </span>
//                     </>
//                   )}
                  
//                   {onlineStatusText && !isOnline && (
//                     <span className="text-xs text-gray-500">
//                       • {onlineStatusText}
//                     </span>
//                   )}
//                 </div>
//               </div>
//             </div>

//             <div className="flex items-center gap-2">
//               {/* Socket test button (optional) */}
//               {process.env.NODE_ENV === 'development' && targetUserId && (
//                 <button
//                   className="ml-2 px-2 py-1 rounded text-xs bg-gray-100 text-gray-600 hover:bg-gray-200 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity"
//                   onClick={(e) => {
//                     e.stopPropagation();
//                     console.log('Test socket for contact:', contact._id);
//                     alert('Socket test would go here');
//                   }}
//                   title="Test socket connection"
//                 >
//                   Test
//                 </button>
//               )}
              
             
//               <Dropdown
//                       trigger={
//                         <button className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition">
//                           <MoreVertical size={20} />
//                         </button>
//                       }
//                     >
//                       <button
//                         className="flex items-center gap-3 px-4 py-2 hover:bg-gray-100 w-full text-left"
//                       >
//                         <Edit size={18} />
//                         <span>Update</span>
//                       </button>
              
//                       <button
//                         className="flex items-center gap-3 px-4 py-2 hover:bg-gray-100 w-full text-left"
//                       >
//                         <Delete size={18} />
//                         <span>Delete</span>
//                       </button>
              
//                        <button
//                 className={`ml-2 px-3 py-1.5 rounded text-white text-sm whitespace-nowrap font-medium transition-all ${
//                   isBlocked 
//                     ? "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700" 
//                     : "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
//                 }`}
//                 onClick={(e) => handleBlockToggle(e, contact)}
//                 title={isBlocked ? "Unblock this contact" : "Block this contact"}
//               >
//                 {isBlocked ? "Unblock" : "Block"}
//               </button>
//                     </Dropdown>
//             </div>
//           </div>
//         );
//       })}
      
//       {/* Socket connection tips */}
//       {!isSocketConnected() && (
//         <div className="mt-4 px-4">
//           <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
//             <div className="flex items-start">
//               <div className="flex-shrink-0">
//                 <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
//                   <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
//                 </svg>
//               </div>
//               <div className="ml-3">
//                 <h3 className="text-sm font-medium text-yellow-800">
//                   Real-time features disabled
//                 </h3>
//                 <div className="mt-2 text-sm text-yellow-700">
//                   <p>Online status and typing indicators require an active connection.</p>
//                   <button 
//                     className="mt-1 text-yellow-800 font-medium hover:text-yellow-900"
//                     onClick={() => {
//                       if (user?._id && token) {
//                         initializeSocket(token, user._id);
//                       }
//                     }}
//                   >
//                     Try reconnecting →
//                   </button>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

import { useEffect, useState, useCallback } from "react";
import { useSelector } from "react-redux";
import { 
  useBlockContactMutation, 
  useGetAllContactsQuery, 
  useUnblockContactMutation,
  useDeleteContactMutation, 
  useSearchContactsQuery
} from "../../../api/contactApi";
import { useAccessChatFromContactMutation } from "../../../api/chatApi";
import { 
  initializeSocket, 
  getSocket, 
  joinChatRoom,
  isSocketConnected,
  updateOnlineStatus,
  emitContactBlocked
} from "../../../socket/socket";
import Dropdown from "../../../components/ui/Dropdown";
import { Ban, Circle, Edit, MoreVertical, Search, Trash2, X } from "lucide-react";
import toast from "react-hot-toast";
import Swal from "sweetalert2";
import Input from "../../../components/ui/Input";

// SocketStatusIndicator component
const SocketStatusIndicator = ({ onlineUsers }) => {
  const socket = getSocket();
  const connected = isSocketConnected();
  const onlineCount = Object.values(onlineUsers).filter(u => u.isOnline).length;
  
  return (
    <div className="flex items-center justify-between px-4 py-2 bg-gradient-to-r from-blue-50 to-purple-50 border-b">
      <div className="flex items-center gap-2">
        <div className={`h-2 w-2 rounded-full animate-pulse ${connected ? 'bg-green-500' : 'bg-red-500'}`} />
        <span className="text-xs font-medium">
          {connected ? 'Live' : 'Offline'}
        </span>
        <span className="text-xs text-gray-500">
          {connected ? '• Real-time updates active' : '• Connecting...'}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex -space-x-1">
          {Object.keys(onlineUsers)
            .filter(userId => onlineUsers[userId]?.isOnline)
            .slice(0, 3)
            .map(userId => (
              <div 
                key={userId}
                className="h-4 w-4 rounded-full bg-green-500 border border-white"
                title="Online contact"
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

export default function ContactsTab({ setSelectedChat, setActiveTab, setContactToEdit, onContactBlocked}) {
  const { user, token } = useSelector(state => state.auth);
  const [blockContact] = useBlockContactMutation();
  const [unblockContact] = useUnblockContactMutation();
  const [deleteContact] = useDeleteContactMutation();
  const [accessChatFromContact] = useAccessChatFromContactMutation();

  const [socketInitialized, setSocketInitialized] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState({});
  const [typingUsers, setTypingUsers] = useState({});

  // State for search
  const [searchQuery, setSearchQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");
  
  // Queries
  const { data: contactsData, isLoading, refetch } = useGetAllContactsQuery();
  
  // Debounced search
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchInput);
    }, 300);
    
    return () => {
      clearTimeout(handler);
    };
  }, [searchInput]);
  
  useEffect(() => {
    setSearchQuery(debouncedSearchQuery);
  }, [debouncedSearchQuery]);

  const { 
    data: searchResults
  } = useSearchContactsQuery(searchQuery, {
    skip: !searchQuery.trim()
  });

  const contacts = contactsData?.contacts || [];
  const displayContacts = searchQuery.trim() 
    ? (searchResults?.contacts || []) 
    : contacts;

  const handleInputChange = (e) => {
    setSearchInput(e.target.value);
  };

  const handleClearSearch = () => {
    setSearchInput("");
    setSearchQuery("");
  };

  // Initialize socket
  useEffect(() => {
    if (user?._id && token && !socketInitialized) {
      try {
        console.log('🔌 ContactsTab: Initializing socket connection...');
        const socket = initializeSocket(token, user._id);
        
        window.updateContactUserStatus = (userId, isOnline, lastSeen) => {
          setOnlineUsers(prev => ({
            ...prev,
            [userId]: { isOnline, lastSeen, lastUpdated: new Date().toISOString() }
          }));
        };

        window.setContactTypingIndicator = (chatId, userId, isTyping) => {
          setTypingUsers(prev => {
            const newTypingUsers = { ...prev };
            if (!newTypingUsers[chatId]) {
              newTypingUsers[chatId] = {};
            }
            newTypingUsers[chatId][userId] = {
              isTyping,
              lastTypingTime: new Date().toISOString()
            };
            return newTypingUsers;
          });
        };

        window.contactNewMessage = (message) => {
          console.log('📨 New message for contact:', message);
          refetch();
        };

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

        setSocketInitialized(true);

        return () => {
          console.log('🧹 ContactsTab: Cleaning up socket listeners...');
          clearInterval(cleanupInterval);
          delete window.updateContactUserStatus;
          delete window.setContactTypingIndicator;
          delete window.contactNewMessage;
        };

      } catch (error) {
        console.error('❌ ContactsTab: Failed to initialize socket:', error);
      }
    }
  }, [user?._id, token, socketInitialized, refetch]);

  // Update own online status
  useEffect(() => {
    if (socketInitialized && user?._id) {
      updateOnlineStatus(user._id, true);
      
      const interval = setInterval(() => {
        updateOnlineStatus(user._id, true);
      }, 30000);
      
      return () => {
        clearInterval(interval);
        updateOnlineStatus(user._id, false);
      };
    }
  }, [socketInitialized, user?._id]);

  const checkUserOnline = useCallback((userId) => {
    return onlineUsers[userId]?.isOnline || false;
  }, [onlineUsers]);

  const checkUserTyping = useCallback((chatId, userId) => {
    return typingUsers[chatId]?.[userId]?.isTyping || false;
  }, [typingUsers]);

  const handleContactClick = async (contact) => {
  try {
    console.log("=== CONTACT CLICK DEBUG ===");
    console.log("Full contact object:", contact);
    
    // Find current user's entry - IMPORTANT: isBlock yahan se milega
    const currentUserEntry = contact.createdBy?.find(entry => {
      // Check various possible formats
      if (entry.user?._id === user?._id) return true;
      if (entry.userId === user?._id) return true;
      if (typeof entry.userId === 'object' && entry.userId._id === user?._id) return true;
      return false;
    });
    
    console.log("Current user entry:", currentUserEntry);
    
    const savedName = currentUserEntry?.name || "Unknown";
    const isBlocked = currentUserEntry?.isBlock || false; // 👈 Get blocked status
    
    console.log("isBlocked value:", isBlocked);
    
    const result = await accessChatFromContact({ 
      contactId: contact._id 
    }).unwrap();
    
    console.log("Chat result:", result);
    
    if (result.success && result.chat) {
      const chat = result.chat;
      const chatId = chat._id;
      
      if (user?._id) {
        joinChatRoom(chatId, user._id);
      }
      
      let otherUser = null;
      let otherUserId = null;
      
      if (chat.otherUser) {
        otherUser = chat.otherUser;
        otherUserId = otherUser._id;
      } else if (chat.users && Array.isArray(chat.users)) {
        otherUser = chat.users.find(u => {
          const userId = u._id || u.userId || u.id;
          return String(userId) !== String(user?._id);
        });
        otherUserId = otherUser?._id;
      }
      
      const isOtherUserOnline = otherUserId ? checkUserOnline(otherUserId) : false;
      const isOtherUserTyping = otherUserId && chatId ? checkUserTyping(chatId, otherUserId) : false;
      
      // 👇 CRITICAL: Add isBlocked to the chat object
     // In handleContactClick function, update enhancedChat:

const enhancedChat = {
  ...chat,
  savedName: savedName,
  contactNumber: contact.number,
  contactId: contact._id, // 👈 ADD THIS - actual contact ID
  isContactChat: true,
  isBlocked: isBlocked,
  contactInfo: {
    savedName: savedName,
    number: contact.number,
    contactId: contact._id, // 👈 ADD THIS
    isBlocked: isBlocked
  },
  socketInfo: {
    isConnected: isSocketConnected(),
    socketId: getSocket()?.id,
    otherUserOnline: isOtherUserOnline,
    otherUserTyping: isOtherUserTyping,
    otherUserId: otherUserId
  }
};
      
      console.log("Enhanced chat with isBlocked:", enhancedChat.isBlocked);
      console.log("=== END DEBUG ===");
      
      setSelectedChat(enhancedChat);
    }
  } catch (error) {
    console.error("Failed to access chat:", error);
    alert(error.data?.message || "Failed to start chat");
  }
};


// Then update handleBlockToggle function:
 const handleBlockToggle = async (e, contact) => {
    e.stopPropagation();
    
    try {
      const currentUserEntry = getCurrentUserEntry(contact);
      const isCurrentlyBlocked = currentUserEntry?.isBlock || false;
      const newBlockedStatus = !isCurrentlyBlocked;
      
      if (isCurrentlyBlocked) {
        const res = await unblockContact(contact._id).unwrap();
        toast.success(res.message || "Contact unblocked");
      } else {
        const res = await blockContact(contact._id).unwrap();
        toast.success(res.message || "Contact blocked");
      }
      
      // 👇 Call the callback if provided
      if (onContactBlocked) {
        onContactBlocked(contact._id, newBlockedStatus);
      }
      
      // Also emit socket event
      if (getSocket()?.connected) {
        emitContactBlocked(contact._id, newBlockedStatus);
      }
      
      refetch();
    } catch (error) {
      console.error("Block/Unblock failed:", error);
      toast.error(error.data?.message || "Failed to update contact");
    }
  };


  const handleUpdateContact = (e, contact) => {
    e.stopPropagation();
    
    const currentUserEntry = getCurrentUserEntry(contact);
    
    const contactToEdit = {
      _id: contact._id,
      name: currentUserEntry?.name || "",
      number: contact.number || "",
    };
    
    if (setContactToEdit) {
      setContactToEdit(contactToEdit);
    }
    
    if (setActiveTab) {
      setActiveTab("new");
    }
  };

  const handleDeleteContact = async (e, contactId) => {
    e.stopPropagation();

    const result = await Swal.fire({
      title: "Are you sure?",
      text: "This contact will be permanently deleted.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
    });

    if (!result.isConfirmed) return;

    try {
      await deleteContact(contactId).unwrap();
      refetch();

      Swal.fire({
        icon: "success",
        title: "Deleted!",
        text: "The contact has been deleted.",
        timer: 2000,
        showConfirmButton: false,
      });

    } catch (error) {
      console.error("Delete contact failed:", error);
      Swal.fire({
        icon: "error",
        title: "Failed!",
        text: error?.data?.message || "Failed to delete contact",
      });
    }
  };

  const getOnlineStatusText = (userId) => {
    const status = onlineUsers[userId];
    if (!status) return 'Offline';
    
    if (status.isOnline) return 'Online';
    
    if (status.lastSeen) {
      const lastSeen = new Date(status.lastSeen);
      const now = new Date();
      const diffMinutes = Math.floor((now - lastSeen) / (1000 * 60));
      
      if (diffMinutes < 1) return 'Just now';
      if (diffMinutes < 60) return `${diffMinutes}m ago`;
      if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`;
      return `${Math.floor(diffMinutes / 1440)}d ago`;
    }
    
    return 'Offline';
  };

  // Get current user entry
  const getCurrentUserEntry = (contact) => {
    if (!contact?.createdBy || !Array.isArray(contact.createdBy)) return null;
    
    return contact.createdBy.find(entry => {
      // Check if this entry belongs to current user
      if (entry.user?._id === user?._id) return true;
      if (entry.userId === user?._id) return true;
      if (typeof entry.userId === 'object' && entry.userId._id === user?._id) return true;
      return false;
    });
  };

  // Get other user data - UPDATED with userMap workaround
  const getOtherUserData = (contact) => {
    // First check if otherUser is directly available
    if (contact.otherUser) {
      return contact.otherUser;
    }
    
    // Workaround: Map phone numbers to user data
    // This is temporary until backend is fixed
    const userMap = {
      "8005524567": { // ravi's number
        _id: "692ec4b9aa04f42ac64cec43",
        name: "ravi",
        avatar: "http://localhost:4000/uploads/profile/1764824104775-795741235.webp"
      },
      "7854961235": { // ashish's number
        _id: "6933c76a97f051dd89fe2259",
        name: "ashish",
        avatar: null
      },
      "7854129635": { // rajesh's number
        _id: "6933c7cb97f051dd89fe2260",
        name: "rajesh",
        avatar: null
      }
    };
    
    if (contact.number && userMap[contact.number]) {
      console.log("✅ Found user in map for number:", contact.number);
      return userMap[contact.number];
    }
    
    return null;
  };

  // Get other user ID
  const getOtherUserId = (contact) => {
    const otherUser = getOtherUserData(contact);
    return otherUser?._id || null;
  };

  // Get avatar for contact
  const getContactAvatar = (contact) => {
    console.log("Getting avatar for contact:", contact._id);
    
    // First check if otherUser is available
    const otherUser = getOtherUserData(contact);
    
    if (otherUser?.avatar) {
      console.log("✅ Found avatar in otherUser.avatar:", otherUser.avatar);
      return otherUser.avatar;
    }
    
    // Fallback: check if contact has avatar directly
    if (contact.avatar) {
      console.log("✅ Found avatar in contact.avatar:", contact.avatar);
      return contact.avatar;
    }
    
    console.log("❌ No avatar found");
    return null;
  };

  // Get display name for contact
  const getDisplayName = (contact) => {
    // First priority: name from current user's entry
    const currentEntry = getCurrentUserEntry(contact);
    if (currentEntry?.name) return currentEntry.name;
    
    // Second priority: other user's name
    const otherUser = getOtherUserData(contact);
    if (otherUser?.name) return otherUser.name;
    
    // Fallback: "Unknown"
    return "Unknown";
  };

  if (isLoading) {
    return (
      <div className="flex flex-col">
        <SocketStatusIndicator onlineUsers={onlineUsers} />
        <div className="p-8 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <p className="mt-2 text-gray-500">Loading contacts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {/* Search Input */}
      <div className="p-3 border-b border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <Input
            type="text"
            placeholder="Search contacts by name or number..."
            value={searchInput}
            onChange={handleInputChange}
            className="w-full pl-10 pr-10 py-2 border focus:outline-none focus:ring border-none bg-gray-100 shadow rounded-full"
          />
          {searchInput && (
            <button
              onClick={handleClearSearch}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X size={18} />
            </button>
          )}
        </div>
        {searchInput && displayContacts.length > 0 && (
          <div className="mt-2 text-xs text-gray-500">
            Found {displayContacts.length} contact{displayContacts.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      <SocketStatusIndicator onlineUsers={onlineUsers} />
      
      {displayContacts.length === 0 ? (
        <div className="p-8 text-center text-gray-500">
          No contacts found
        </div>
      ) : (
        displayContacts.map(contact => {
          const currentEntry = getCurrentUserEntry(contact);
          const otherUser = getOtherUserData(contact);
          
          const savedName = getDisplayName(contact);
          const isBlocked = currentEntry?.isBlock || false;
          const firstLetter = savedName.charAt(0).toUpperCase();
          
          const otherUserId = getOtherUserId(contact);
          const avatar = getContactAvatar(contact);
          const isOnline = otherUserId ? checkUserOnline(otherUserId) : false;
          const onlineStatusText = otherUserId ? getOnlineStatusText(otherUserId) : '';

          // Debug log
          console.log(`Contact ${savedName}:`, {
            avatar,
            otherUserId,
            otherUser,
            currentEntry,
            contactNumber: contact.number
          });

          return (
            <div
              key={contact._id}
              className="group flex items-center justify-between px-4 py-3 border-b border-gray-200 cursor-pointer hover:bg-gradient-to-r hover:from-blue-50 hover:to-white transition-all duration-200"
              onClick={() => handleContactClick(contact)}
            >
              <div className="flex items-center gap-3 flex-1">
                {/* Avatar */}
                <div className="relative">
                  {avatar ? (
                    <img
                      src={avatar}
                      alt={savedName}
                      className="h-12 w-12 rounded-full object-cover border-2 border-gray-200 group-hover:border-blue-300 transition-colors"
                      onError={(e) => {
                        console.log(`Image failed to load: ${avatar}`);
                        e.target.style.display = 'none';
                        const parent = e.target.parentNode;
                        const fallback = parent.querySelector('.initials-fallback');
                        if (fallback) {
                          fallback.style.display = 'flex';
                        }
                      }}
                      onLoad={() => {
                        console.log(`Image loaded successfully: ${avatar}`);
                      }}
                    />
                  ) : null}
                  
                  {/* Fallback to initials */}
                  <div 
                    className={`h-12 w-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold text-lg shadow-sm group-hover:shadow-md transition-shadow ${
                      avatar ? 'hidden' : 'initials-fallback'
                    }`}
                  >
                    {firstLetter}
                  </div>
                  
                  {isOnline && (
                    <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-white shadow-sm animate-pulse">
                      <div className="absolute inset-0 rounded-full bg-green-400 animate-ping opacity-75"></div>
                    </div>
                  )}
                </div>

                {/* Contact info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-800 truncate">
                      {savedName}
                    </h3>
                    {isBlocked && (
                      <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">
                        Blocked
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-sm text-gray-600 truncate">
                      {contact.number || "-"}
                    </p>
                    
                    {isOnline ? (
                      <>
                        <span className="h-1 w-1 rounded-full bg-green-500"></span>
                        <span className="text-xs text-green-600 font-medium">
                          Online
                        </span>
                      </>
                    ) : onlineStatusText ? (
                      <span className="text-xs text-gray-500">
                        • {onlineStatusText}
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>

              {/* Dropdown menu */}
              <div className="flex items-center gap-2">
                <Dropdown
                  trigger={
                    <button 
                      className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition opacity-0 group-hover:opacity-100"
                    >
                      <MoreVertical size={20} />
                    </button>
                  }
                >
                  <button
                    className="flex items-center gap-3 px-4 py-2 hover:bg-gray-100 w-full text-left"
                    onClick={(e) => handleUpdateContact(e, contact)}
                  >
                    <Edit size={18} />
                    <span>Update</span>
                  </button>
          
                  <button
                    className="flex items-center gap-3 px-4 py-2 hover:bg-gray-100 w-full text-left text-red-600"
                    onClick={(e) => handleDeleteContact(e, contact._id)}
                  >
                    <Trash2 size={18} />
                    <span>Delete</span>
                  </button>
                  
                  <button
                    className={`flex items-center gap-3 px-4 py-2 hover:bg-gray-100 w-full text-left ${
                      isBlocked ? "text-green-600" : "text-red-600"
                    }`}
                    onClick={(e) => handleBlockToggle(e, contact)}
                  >
                    {isBlocked ? <Circle size={18} /> : <Ban size={18} />}
                    <span>{isBlocked ? "Unblock" : "Block"}</span>
                  </button>
                </Dropdown>
              </div>
            </div>
          );
        })
      )}
      
      {/* Socket connection warning */}
      {!isSocketConnected() && (
        <div className="mt-4 px-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  Real-time features disabled
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>Online status and typing indicators require an active connection.</p>
                  <button 
                    className="mt-1 text-yellow-800 font-medium hover:text-yellow-900"
                    onClick={() => {
                      if (user?._id && token) {
                        initializeSocket(token, user._id);
                      }
                    }}
                  >
                    Try reconnecting →
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}