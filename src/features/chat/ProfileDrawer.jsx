import React, { useState, useEffect } from "react";
import {
  useGetProfileQuery,
  useUpdateProfileMutation,
  useUploadAvatarMutation,
} from "../../api/authApi";
import { X, Camera } from "lucide-react";
import Input from "../../components/ui/Input";
import toast from "react-hot-toast";
import { Button } from "@mui/material";

export default function ProfileDrawer({ isOpen, onClose }) {
  const { data: profileData, refetch } = useGetProfileQuery();
  const [updateProfile, { isLoading }] = useUpdateProfileMutation();
  const [uploadAvatar] = useUploadAvatarMutation();

  const [name, setName] = useState("");
  const [aboutMe, setAboutMe] = useState("");
  const [number, setNumber] = useState("");
  const [avatarPreview, setAvatarPreview] = useState("");

  useEffect(() => {
    if (profileData?.user) {
      setName(profileData.user.name || "");
      setAboutMe(profileData.user.aboutMe || "");
      setNumber(profileData.user.number || "");
      setAvatarPreview(profileData.user.avatar || "");
    }
  }, [profileData]);

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setAvatarPreview(URL.createObjectURL(file));

    try {
      const formData = new FormData();
      formData.append("avatar", file);
      const res = await uploadAvatar(formData).unwrap();
      setAvatarPreview(res.avatar);
      toast.success("Avatar updated");
    } catch (err) {
      toast.error("Avatar upload failed");
    }
  };

  const handleSave = async () => {
    const toastId = toast.loading("Updating profile...");
    try {
      const res = await updateProfile({ name, aboutMe, number }).unwrap();
      toast.success(res.message || "Profile updated", { id: toastId });
      refetch();
      onClose();
    } catch (err) {
      toast.error(err?.data?.message || "Update failed", { id: toastId });
    }
  };

  return (
    <div
      className={`fixed top-0 right-0 h-full w-[360px] bg-white shadow-2xl transform transition-transform duration-300 z-50 ${
        isOpen ? "translate-x-0" : "translate-x-full"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-200 bg-gray-50">
        <h2 className="text-lg font-semibold text-gray-800">
          Profile Settings
        </h2>
        <button
          onClick={onClose}
          className="p-2 rounded-full hover:bg-gray-200 transition"
        >
          <X size={18} />
        </button>
      </div>

      {/* Body */}
      <div className="px-5 py-6 flex flex-col gap-6 overflow-y-auto h-[calc(100%-64px)]">
        {/* Avatar */}
        <div className="flex flex-col items-center gap-3">
          <label
            htmlFor="avatarUpload"
            className="relative group cursor-pointer"
          >
            <img
              src={avatarPreview || "/default-avatar.png"}
              alt="avatar"
              className="w-28 h-28 rounded-full object-cover border border-gray-300 group-hover:ring-2 ring-blue-500 transition"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-white rounded-full opacity-0 group-hover:opacity-100 transition">
              <Camera size={20} />
            </div>
          </label>
          <input
            id="avatarUpload"
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            className="hidden"
          />
          <p className="text-xs text-gray-500">
            Click to change profile photo
          </p>
        </div>

        {/* Name */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">
            Full Name
          </label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            className="bg-gray-100 border-0 focus:bg-white"
          />
        </div>

        {/* About Me */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">
            About Me
          </label>
          <textarea
            value={aboutMe}
            onChange={(e) => setAboutMe(e.target.value)}
            rows={4}
            placeholder="Short bio"
            className="bg-gray-100 border-0 border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white resize-none"
          />
        </div>

        {/* Phone */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">
            Phone Number
          </label>
          <Input
            value={number}
            onChange={(e) => setNumber(e.target.value)}
            placeholder="+91 98765 43210"
            className="bg-gray-100 border-0 focus:bg-white"
          />
        </div>

        {/* Save */}
        <Button
        type="submit"
        variant="contained"
        color="primary"
          onClick={handleSave}
          disabled={isLoading}
          className="mt-4 w-full bg-blue-600 text-white py-2.5 rounded-md font-medium hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition"
        >
          {isLoading ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}
