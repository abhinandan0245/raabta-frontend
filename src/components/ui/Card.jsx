// src/components/ui/Card.jsx
// Reusable card container using Tailwind class merging for reliable customization.

import React from "react";
import { twMerge } from "tailwind-merge";

const Card = ({ children, className = "" }) => {
  const baseClasses = "bg-white shadow-md rounded-lg p-6";

  return <div className={twMerge(baseClasses, className)}>{children}</div>;
};

export default Card;
