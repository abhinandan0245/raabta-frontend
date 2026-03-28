// src/components/ui/Input.jsx
// Reusable input field with smart Tailwind class conflict resolution.

import React from "react";
import { twMerge } from "tailwind-merge";

const Input = ({ type = "text", placeholder = "", value, onChange, className = "", ...props }) => {
  const baseClasses =
    "w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent";

  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className={twMerge(baseClasses, className)}
      {...props}
    />
  );
};

export default Input;
