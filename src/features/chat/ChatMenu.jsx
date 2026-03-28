import React from "react";
import { Plus, Users, MailIcon } from "lucide-react";
import { ChatBubbleOutlineOutlined } from "@mui/icons-material";
import { Badge, Tooltip } from "@mui/material";
import { useSelector } from "react-redux";
import { selectUnreadCount } from "../notification/notificationSlice";

export default function ChatMenu({ activeTab, setActiveTab }) {
  const unreadCount = useSelector(selectUnreadCount);
  
  const menuItems = [
    { 
      id: "inbox", 
      label: "Inbox", 
      icon: <MailIcon size={18} />, 
      badge: unreadCount,
      tooltip: "Messages and notifications"
    },
    { 
      id: "chats", 
      label: "Chats", 
      icon: <ChatBubbleOutlineOutlined fontSize="small" />,
      tooltip: "Your conversations"
    },
    { 
      id: "new", 
      label: "New", 
      icon: <Plus size={18} />,
      tooltip: "Add new contact"
    },
    { 
      id: "contacts", 
      label: "Contacts", 
      icon: <Users size={18} />,
      tooltip: "All your contacts"
    }
  ];

  return (
    <div className="h-20 border-t border-gray-200 bg-white flex items-center justify-around px-4 shadow-sm">
      {menuItems.map((item) => {
        const isActive = activeTab === item.id;
        
        return (
          <Tooltip key={item.id} title={item.tooltip} arrow placement="top">
            <button
              className="flex flex-col items-center gap-1 relative group"
              onClick={() => setActiveTab(item.id)}
            >
              {/* Icon Container */}
              <div className={`relative p-2 rounded-full transition-all duration-200 ${
                isActive 
                  ? 'bg-blue-50 ring-2 ring-blue-100' 
                  : 'group-hover:bg-gray-50'
              }`}>
                {item.badge ? (
                  <Badge 
                    badgeContent={item.badge} 
                    color="error"
                    overlap="circular"
                    anchorOrigin={{
                      vertical: 'top',
                      horizontal: 'right',
                    }}
                  >
                    <div className={`transition-colors duration-200 ${
                      isActive ? 'text-blue-600' : 'text-gray-500 group-hover:text-blue-500'
                    }`}>
                      {item.icon}
                    </div>
                  </Badge>
                ) : (
                  <div className={`transition-colors duration-200 ${
                    isActive ? 'text-blue-600' : 'text-gray-500 group-hover:text-blue-500'
                  }`}>
                    {item.icon}
                  </div>
                )}
                
                {/* Active Indicator Dot */}
                {/* {isActive && (
                  <div className="absolute -top-1 -right-1 h-3 w-3 bg-blue-600 rounded-full border-2 border-white shadow-sm"></div>
                )} */}
              </div>
              
              {/* Label */}
              <span className={`text-xs font-medium transition-colors duration-200 ${
                isActive 
                  ? 'text-blue-600 font-semibold' 
                  : 'text-gray-600 group-hover:text-blue-500'
              }`}>
                {item.label}
              </span>
              
              {/* Active Indicator Bar */}
              {isActive && (
                <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 h-1 w-10 bg-gradient-to-r from-blue-500 to-blue-400 rounded-t-full animate-slideUp"></div>
              )}
              
              {/* Hover Indicator (inactive tabs) */}
              {!isActive && (
                <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 h-0.5 w-0 group-hover:w-8 bg-blue-400/30 rounded-full transition-all duration-300"></div>
              )}
            </button>
          </Tooltip>
        );
      })}
      
      {/* CSS Animation */}
      <style jsx>{`
        @keyframes slideUp {
          from {
            transform: translateY(5px) translateX(-50%);
            opacity: 0;
          }
          to {
            transform: translateY(0) translateX(-50%);
            opacity: 1;
          }
        }
        
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}