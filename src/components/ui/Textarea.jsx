// src/components/ui/Textarea.jsx
// Reusable textarea with Tailwind class merging for fully controlled styling.

import React from "react";
import { twMerge } from "tailwind-merge";

const Textarea = ({ placeholder = "", value, onChange, rows = 4, className = "", ...props }) => {
  const baseClasses =
    "w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent";

  return (
    <textarea
      rows={rows}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className={twMerge(baseClasses, className)}
      {...props}
    />
  );
};

export default Textarea;
