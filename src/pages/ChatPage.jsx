import React, { useState } from "react";
import ChatList from "../features/chat/ChatList";
import ChatBox from "../features/chat/ChatBox";
import ChatMenu from "../features/chat/ChatMenu";

// export default function ChatPage() {
//   const [activeTab, setActiveTab] = useState("chats");
//   const [selectedChat, setSelectedChat] = useState(null);

//   return (
//     <div className="h-screen flex bg-white overflow-hidden">
      
//       {/* Sidebar */}
//       <div className="w-1/4 border-r border-gray-200 flex flex-col">
//         <ChatList 
//           activeTab={activeTab} 
//           setActiveTab={setActiveTab}
//           setSelectedChat={setSelectedChat} 
//         />
//         {/* ✅ PASS activeTab prop to ChatMenu */}
//         <ChatMenu activeTab={activeTab} setActiveTab={setActiveTab} />
//       </div>

//       {/* Chat Box */}
//       <div className="flex-1">
//         {selectedChat ? (
//           <ChatBox chat={selectedChat} />
//         ) : (
//           <p className="text-center mt-20 text-gray-400">
//             Select a chat or contact to start messaging
//           </p>
//         )}
//       </div>

//     </div>
//   );
// }


export default function ChatPage() {
  const [activeTab, setActiveTab] = useState("chats");
  const [selectedChat, setSelectedChat] = useState(null);

  // Add this function to update blocked status
  const handleContactBlocked = (contactId, isBlocked) => {
    if (selectedChat && (selectedChat.contactId === contactId || selectedChat._id === contactId)) {
      console.log("🔄 Updating selectedChat blocked status via callback");
      setSelectedChat(prev => ({
        ...prev,
        isBlocked: isBlocked,
        contactInfo: {
          ...prev.contactInfo,
          isBlocked: isBlocked
        }
      }));
    }
  };

  return (
    <div className="h-screen flex bg-white overflow-hidden">
      
      {/* Sidebar */}
      <div className="w-1/4 border-r border-gray-200 flex flex-col">
        <ChatList 
          activeTab={activeTab} 
          setActiveTab={setActiveTab}
          setSelectedChat={setSelectedChat}
          onContactBlocked={handleContactBlocked} // 👈 Pass callback
        />
        <ChatMenu activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>

      {/* Chat Box */}
      <div className="flex-1">
        {selectedChat ? (
          <ChatBox chat={selectedChat} />
        ) : (
          <p className="text-center mt-20 text-gray-400">
            Select a chat or contact to start messaging
          </p>
        )}
      </div>

    </div>
  );
}