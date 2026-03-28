// src/components/ui/Button.jsx
// A scalable, themeable button component supporting variants, sizes, and Tailwind class merging.

import React from "react";
import { twMerge } from "tailwind-merge";

/**
 * Button Component
 * @param {ReactNode} children - Inner content of the button
 * @param {string} type - Button type ("button" | "submit" | "reset")
 * @param {string} variant - Visual theme (primary, secondary, success, danger, warning, outline, ghost)
 * @param {string} size - Size of the button ("sm" | "md" | "lg")
 * @param {boolean} disabled - Disable state
 * @param {function} onClick - Click handler
 */

const Button = ({
  children,
  type = "button",
  variant = "primary",
  size = "md",
  disabled = false,
  onClick,
}) => {
  const baseClasses =
    "inline-flex items-center justify-center font-medium rounded-md transition-colors duration-200 focus:outline-none";

  // Size presets for consistent spacing across UI
  const sizeClasses = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-5 py-3 text-lg",
  };

  // Theme variants to support brand consistency
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-300",

    secondary: "bg-gray-200 text-gray-800 hover:bg-gray-300 disabled:bg-gray-100",

    success: "bg-green-600 text-white hover:bg-green-700 disabled:bg-green-300",

    danger: "bg-red-600 text-white hover:bg-red-700 disabled:bg-red-300",

    warning: "bg-yellow-500 text-white hover:bg-yellow-600 disabled:bg-yellow-300",

    outline:
      "border border-gray-400 text-gray-800 hover:bg-gray-100 disabled:bg-gray-50",

    ghost:
      "bg-transparent text-gray-800 hover:bg-gray-100 disabled:text-gray-400",
  };

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={twMerge(baseClasses, sizeClasses[size], variants[variant])}
    >
      {children}
    </button>
  );
};

export default Button;
