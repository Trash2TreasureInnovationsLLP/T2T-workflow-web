"use client";

import React, { useState } from "react";

interface UserAvatarProps {
  user?: {
    fullName?: string | null;
    avatarUrl?: string | null;
    role?: string | null;
  } | null;
  src?: string | null;
  name?: string | null;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizeMap = {
  xs: "w-6 h-6 text-[10px]",
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-12 h-12 text-base",
  xl: "w-16 h-16 text-xl",
};

export const UserAvatar: React.FC<UserAvatarProps> = ({
  user,
  src,
  name,
  size = "sm",
  className = "",
}) => {
  const [hasError, setHasError] = useState(false);

  const fullName = name || user?.fullName || "User";
  let avatarUrl = src !== undefined ? src : user?.avatarUrl;

  // Filter out any legacy female placeholder photo
  if (avatarUrl && avatarUrl.includes("photo-1494790108377-be9c29b29330")) {
    avatarUrl = "/t2t-logo.png";
  }

  const box = sizeMap[size] || sizeMap.sm;

  // Compute initials: e.g. "Vishnu (CEO)" -> "V", "Sai Nikhil" -> "SN"
  const cleanedName = fullName.replace(/\s*\([^)]*\)/g, "").trim();
  const nameParts = cleanedName.split(" ").filter(Boolean);
  const initials =
    nameParts.length >= 2
      ? (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase()
      : (cleanedName.slice(0, 2) || "T2").toUpperCase();

  // Role gradient backgrounds for initial fallbacks
  const getGradient = (role?: string | null) => {
    switch (role?.toUpperCase()) {
      case "SUPER_ADMIN":
      case "CEO":
        return "bg-gradient-to-br from-emerald-600 to-teal-700 text-white";
      case "COO":
        return "bg-gradient-to-br from-teal-600 to-emerald-800 text-white";
      case "CTO":
        return "bg-gradient-to-br from-blue-600 to-indigo-700 text-white";
      case "CFO":
        return "bg-gradient-to-br from-amber-600 to-yellow-700 text-white";
      case "CMO":
        return "bg-gradient-to-br from-purple-600 to-pink-700 text-white";
      case "CAO":
        return "bg-gradient-to-br from-indigo-600 to-blue-800 text-white";
      case "INTERN":
        return "bg-gradient-to-br from-orange-500 to-amber-600 text-white";
      default:
        return "bg-gradient-to-br from-slate-600 to-slate-800 text-white";
    }
  };

  // If official logo is specified
  const isLogo =
    avatarUrl === "/t2t-logo.png" ||
    avatarUrl === "t2t-logo.png" ||
    (user?.role === "SUPER_ADMIN" && !hasError && avatarUrl);

  if (avatarUrl && !hasError) {
    if (isLogo) {
      return (
        <div
          className={`relative rounded-full overflow-hidden bg-white border border-emerald-200 shadow-2xs shrink-0 flex items-center justify-center p-0.5 ${box} ${className}`}
          title={fullName}
        >
          <img
            src="/t2t-logo.png"
            alt={fullName}
            className="w-full h-full object-contain"
            onError={() => setHasError(true)}
          />
        </div>
      );
    }

    return (
      <div
        className={`relative rounded-full overflow-hidden bg-slate-100 border border-slate-200 shadow-2xs shrink-0 ${box} ${className}`}
        title={fullName}
      >
        <img
          src={avatarUrl}
          alt={fullName}
          className="w-full h-full object-cover"
          onError={() => setHasError(true)}
        />
      </div>
    );
  }

  // Fallback Initials Avatar
  const bgClass = getGradient(user?.role);
  return (
    <div
      className={`rounded-full flex items-center justify-center font-bold tracking-tight shadow-2xs shrink-0 select-none ${bgClass} ${box} ${className}`}
      title={fullName}
    >
      {initials}
    </div>
  );
};
