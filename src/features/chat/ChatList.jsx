import React, { useState } from "react";
import Input from "../../components/ui/Input";
import ChatListHeader from "./ChatListHeader";
import ChatsTab from "./tabs/ChatsTab";
import ContactsTab from "./tabs/ContactsTab";
import AddContactForm from "./tabs/AddContactForm";
import InboxTab from "./tabs/InboxTab";

export default function ChatList({ activeTab, setActiveTab, setSelectedChat, onContactBlocked }) {
  const [contactToEdit, setContactToEdit] = useState(null);

  const handleContactSaved = () => {
    // Reset contactToEdit after saving
    setContactToEdit(null);
    // Optionally switch back to contacts tab
    // setActiveTab("contacts");
  };

  const renderContent = () => {
    switch (activeTab) {
      case "chats":
        return <ChatsTab setSelectedChat={setSelectedChat} />;
      case "contacts":
        return (
          <ContactsTab 
            setSelectedChat={setSelectedChat} 
            setActiveTab={setActiveTab}
            setContactToEdit={setContactToEdit}
            onContactBlocked={onContactBlocked}
          />
        );
      case "new":
        return (
          <AddContactForm 
            contactToEdit={contactToEdit}
            onSaved={handleContactSaved}
            setActiveTab={setActiveTab}
          />
        );
      case "inbox":
        return <InboxTab />;
      default:
        return null;
    }
  };

  return (
    <div className="h-full flex flex-col">
      <ChatListHeader />

        

      <div className="flex-1 overflow-y-auto scrollbar-thin bg-gray-100">
        {renderContent()}
      </div>
    </div>
  );
}