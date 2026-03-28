// src/components/ui/Select.jsx
// Reusable select field with unified Tailwind class handling.

import React from "react";
import { twMerge } from "tailwind-merge";

const Select = ({ options = [], value, onChange, className = "", ...props }) => {
  const baseClasses =
    "w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent";

  return (
    <select
      value={value}
      onChange={onChange}
      className={twMerge(baseClasses, className)}
      {...props}
    >
      <option value="">Select an option</option>
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
};

export default Select;
