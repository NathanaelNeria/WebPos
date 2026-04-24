import React from "react";

export default function LoadingSpinner({ size = "md", color = "white" }) {
  const sizeClass = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
  }[size];

  const colorClass = {
    white: "border-white border-t-transparent",
    blue: "border-blue-600 border-t-transparent",
    yellow: "border-yellow-400 border-t-transparent",
  }[color];

  return (
    <div
      className={`inline-block ${sizeClass} ${sizeClass} animate-spin rounded-full border-2 ${colorClass}`}
    ></div>
  );
}
