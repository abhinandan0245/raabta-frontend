import React, { useState } from "react";
import Logo from "../../components/ui/Logo";
import Dropdown from "../../components/ui/Dropdown";
import { MoreVertical, User, Settings, LogOut } from "lucide-react";
import ProfileDrawer from "../chat/ProfileDrawer";
import { useGetProfileQuery, useLogoutMutation } from "../../api/authApi";
import { useDispatch } from "react-redux";
import { logout } from "../auth/authSlice";
import { useNavigate } from "react-router-dom";
import RaabtaLogo from "../../components/ui/TaabtaLogo";

export default function ChatListHeader() {
  const [isDrawerOpen, setDrawerOpen] = useState(false);

  const { data: profileData } = useGetProfileQuery();
  const [logoutApi] = useLogoutMutation();

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleProfileOpen = () => setDrawerOpen(true);

  const handleLogout = async () => {
    try {
      await logoutApi().unwrap();
      dispatch(logout());
      navigate("/login");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  return (
    <div className="flex items-center justify-between p-3 border-b border-zinc-300 bg-white shadow-sm">

      <div className="flex items-center gap-3">
          <RaabtaLogo className="w-9 h-9" />
        <h1 className="text-2xl font-bold text-orange-500/50 tracking-widest">
          Raabta
        </h1>
      </div>

      <Dropdown
        trigger={
          <button className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition">
            <MoreVertical size={20} />
          </button>
        }
      >
        <button
          onClick={handleProfileOpen}
          className="flex items-center gap-3 px-4 py-2 hover:bg-gray-100 w-full text-left"
        >
          <User size={18} />
          <span>Profile</span>
        </button>

        <button
          className="flex items-center gap-3 px-4 py-2 hover:bg-gray-100 w-full text-left"
        >
          <Settings size={18} />
          <span>Settings</span>
        </button>

        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-2 hover:bg-gray-100 w-full text-left border-t border-zinc-400/20"
        >
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </Dropdown>

      <ProfileDrawer isOpen={isDrawerOpen} onClose={() => setDrawerOpen(false)} />
    </div>
  );
}
