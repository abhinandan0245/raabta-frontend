// NotificationBadge.jsx
// A reusable and scalable badge component with variant-based color support.

import React from "react";
import clsx from "clsx";
import { twMerge } from "tailwind-merge";

export default function Badge({
  count = 0,
  size = "md",
  variant = "danger",
  className = "",
}) {
  // Size configurations for consistent scalability.
  const sizeClasses = {
    sm: "text-xs min-w-[16px] h-[16px]",
    md: "text-sm min-w-[20px] h-[20px]",
    lg: "text-base min-w-[24px] h-[24px]",
  };

  // Variant-based background color styles.
  const variantClasses = {
    primary: "bg-blue-600 text-white",
    danger: "bg-red-600 text-white",
    success: "bg-green-600 text-white",
    warning: "bg-yellow-500 text-white",
    info: "bg-sky-600 text-white",
    gray: "bg-gray-600 text-white",
  };

  // If count is 0, the badge stays hidden.
  if (!count) return null;

  return (
    <span
      className={twMerge(
        clsx(
          "inline-flex items-center justify-center rounded-full px-1 font-medium",
          sizeClasses[size],
          variantClasses[variant],
          className
        )
      )}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}
