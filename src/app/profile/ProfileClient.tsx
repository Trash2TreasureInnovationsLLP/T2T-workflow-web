"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  User,
  Camera,
  Upload,
  Link as LinkIcon,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Mail,
  Building2,
  Briefcase,
  IdCard,
  Calendar,
  Shield,
  Award,
  Trophy,
  Sparkles,
  Save,
  Tag,
  Loader2,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { calculateTaskPoints, getMemberTier } from "@/lib/scoring";
import Link from "next/link";

interface ProfileClientProps {
  initialUser: any;
  currentUser: any;
}

const AVATAR_PRESETS = [
  {
    id: "preset-1",
    label: "Professional 1",
    url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=256&h=256&fit=crop&crop=faces&auto=format&q=80",
  },
  {
    id: "preset-2",
    label: "Professional 2",
    url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=256&h=256&fit=crop&crop=faces&auto=format&q=80",
  },
  {
    id: "preset-3",
    label: "Professional 3",
    url: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=256&h=256&fit=crop&crop=faces&auto=format&q=80",
  },
  {
    id: "preset-4",
    label: "Professional 4",
    url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=256&h=256&fit=crop&crop=faces&auto=format&q=80",
  },
  {
    id: "preset-5",
    label: "Professional 5",
    url: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=256&h=256&fit=crop&crop=faces&auto=format&q=80",
  },
  {
    id: "preset-6",
    label: "Eco Bot",
    url: "https://api.dicebear.com/7.x/bottts/svg?seed=EcoT2TInnovations",
  },
  {
    id: "preset-7",
    label: "Tech Bot",
    url: "https://api.dicebear.com/7.x/bottts/svg?seed=T2TTechPlatform",
  },
  {
    id: "preset-8",
    label: "Abstract",
    url: "https://api.dicebear.com/7.x/shapes/svg?seed=Trash2TreasureLLP",
  },
];

export const ProfileClient: React.FC<ProfileClientProps> = ({
  initialUser,
  currentUser,
}) => {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [user, setUser] = useState(initialUser);
  const [fullName, setFullName] = useState(initialUser.fullName || "");
  const [skills, setSkills] = useState(initialUser.skills || "");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(
    initialUser.avatarUrl || null
  );
  const [customUrl, setCustomUrl] = useState("");
  const [showUrlInput, setShowUrlInput] = useState(false);

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Points & Tier calculation
  const completedTasks = (user.assignedTasks || []).filter(
    (t: any) => t.status === "COMPLETED"
  );
  const totalPoints = completedTasks.reduce((acc: number, task: any) => {
    return acc + calculateTaskPoints(task).totalPoints;
  }, 0);
  const tierInfo = getMemberTier(totalPoints);

  // File Upload Handler (with canvas auto-resize for crisp lightweight base64)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setMessage({ type: "error", text: "Please upload a valid image file." });
      return;
    }

    if (file.size > 6 * 1024 * 1024) {
      setMessage({
        type: "error",
        text: "Image file is too large (max 6MB). Please choose a smaller photo.",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const MAX_SIZE = 256;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_SIZE) {
            height = Math.round((height * MAX_SIZE) / width);
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width = Math.round((width * MAX_SIZE) / height);
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;
        ctx?.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL("image/jpeg", 0.88);
        setAvatarPreview(dataUrl);
        setShowUrlInput(false);
        setMessage({
          type: "success",
          text: "Photo selected! Click 'Save Profile' below to apply changes.",
        });
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleApplyCustomUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customUrl.trim()) return;
    setAvatarPreview(customUrl.trim());
    setShowUrlInput(false);
    setMessage({
      type: "success",
      text: "Custom URL set! Click 'Save Profile' below to apply.",
    });
  };

  const handleSelectPreset = (url: string) => {
    setAvatarPreview(url);
    setShowUrlInput(false);
    setMessage({
      type: "success",
      text: "Avatar chosen! Click 'Save Profile' below to apply.",
    });
  };

  const handleRemovePicture = () => {
    setAvatarPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setMessage({
      type: "success",
      text: "Picture removed. Click 'Save Profile' to keep default initials.",
    });
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/users/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          avatarUrl: avatarPreview,
          fullName: fullName.trim(),
          skills: skills.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update profile");
      }

      setUser((prev: any) => ({
        ...prev,
        ...data.user,
      }));

      setMessage({
        type: "success",
        text: "Your profile picture and details have been successfully updated!",
      });

      router.refresh();
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-900 to-slate-900 rounded-3xl p-6 md:p-8 text-white relative overflow-hidden shadow-lg">
        <div className="absolute right-0 top-0 translate-x-1/4 -translate-y-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 bottom-0 translate-y-1/2 w-64 h-64 bg-teal-400/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-6">
          {/* Avatar with Camera Trigger */}
          <div className="relative group">
            <div className="w-24 h-24 md:w-28 md:h-28 rounded-full ring-4 ring-white/30 shadow-xl overflow-hidden bg-white/10 flex items-center justify-center">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt={user.fullName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-emerald-600 flex items-center justify-center text-white font-bold text-3xl">
                  {user.fullName
                    ? user.fullName
                        .split(" ")
                        .map((n: string) => n[0])
                        .slice(0, 2)
                        .join("")
                        .toUpperCase()
                    : "T2"}
                </div>
              )}
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 p-2 rounded-full bg-emerald-500 hover:bg-emerald-400 text-white shadow-lg transition-transform hover:scale-110"
              title="Upload picture from device"
            >
              <Camera className="w-4 h-4" />
            </button>
          </div>

          {/* User Headline & Bio */}
          <div className="flex-1 text-center md:text-left space-y-2">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                {user.fullName}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold tracking-wide uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                {user.role}
              </span>
            </div>

            <p className="text-emerald-100/90 text-sm font-medium">
              {user.designation} &bull;{" "}
              {user.department?.name || "Operations Team"}
            </p>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 pt-1 text-xs text-emerald-200/80">
              <span className="flex items-center gap-1.5">
                <IdCard className="w-3.5 h-3.5" /> ID: {user.employeeId}
              </span>
              <span className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5" /> {user.email}
              </span>
              {user.joiningDate && (
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" /> Joined{" "}
                  {new Date(user.joiningDate).toLocaleDateString("en-IN", {
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              )}
            </div>
          </div>

          {/* Leaderboard Standing & Points Spotlight */}
          <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-4 flex md:flex-col items-center justify-between gap-3 text-center shrink-0">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-300" />
              <div className="text-left">
                <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-200 block">
                  Total Points
                </span>
                <span className="text-xl font-black text-amber-300">
                  {totalPoints} pts
                </span>
              </div>
            </div>
            <Link
              href="/leaderboard"
              className="px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-bold transition-colors inline-flex items-center gap-1.5"
            >
              <Award className="w-3.5 h-3.5 text-amber-300" />
              <span>{tierInfo.label}</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Notifications / Feedback Banner */}
      {message && (
        <div
          className={`p-4 rounded-2xl flex items-center gap-3 border ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-rose-50 text-rose-800 border-rose-200"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <span className="text-sm font-medium">{message.text}</span>
        </div>
      )}

      {/* Main Grid: Picture Management & Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Profile Picture Controls */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                  <Camera className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Profile Picture
                </h3>
              </div>
              {avatarPreview && (
                <button
                  type="button"
                  onClick={handleRemovePicture}
                  className="text-xs text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Remove</span>
                </button>
              )}
            </div>

            {/* Current Picture Preview */}
            <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="w-24 h-24 rounded-full overflow-hidden shadow-inner ring-2 ring-emerald-500/30 bg-slate-200 mb-3 flex items-center justify-center">
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-10 h-10 text-slate-400" />
                )}
              </div>
              <span className="text-xs text-slate-500 font-medium text-center">
                {avatarPreview
                  ? "Image ready. Click 'Save Profile' to persist."
                  : "No custom picture. Showing initials."}
              </span>
            </div>

            {/* Hidden native file picker */}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/png, image/jpeg, image/webp, image/jpg"
              onChange={handleFileUpload}
              className="hidden"
            />

            {/* Upload Action Buttons */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-all shadow-xs"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload From Device</span>
              </button>

              <button
                type="button"
                onClick={() => setShowUrlInput(!showUrlInput)}
                className="w-full py-2.5 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs flex items-center justify-center gap-2 transition-all"
              >
                <LinkIcon className="w-3.5 h-3.5 text-slate-500" />
                <span>{showUrlInput ? "Hide URL Input" : "Paste Image URL"}</span>
              </button>
            </div>

            {/* URL Input Form */}
            {showUrlInput && (
              <form onSubmit={handleApplyCustomUrl} className="space-y-2 pt-2">
                <input
                  type="url"
                  placeholder="https://example.com/avatar.jpg"
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
                <button
                  type="submit"
                  className="w-full py-1.5 rounded-lg bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors"
                >
                  Apply URL
                </button>
              </form>
            )}

            {/* Curated Preset Avatars */}
            <div className="pt-3 border-t border-slate-100">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-2.5">
                Or Select Preset Avatar
              </span>
              <div className="grid grid-cols-4 gap-2">
                {AVATAR_PRESETS.map((preset) => {
                  const isSelected = avatarPreview === preset.url;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleSelectPreset(preset.url)}
                      className={`relative rounded-xl overflow-hidden aspect-square border-2 transition-all group ${
                        isSelected
                          ? "border-emerald-600 ring-2 ring-emerald-500/20 scale-105"
                          : "border-slate-100 hover:border-emerald-400"
                      }`}
                      title={preset.label}
                    >
                      <img
                        src={preset.url}
                        alt={preset.label}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                      />
                      {isSelected && (
                        <div className="absolute inset-0 bg-emerald-600/30 flex items-center justify-center">
                          <CheckCircle2 className="w-4 h-4 text-white drop-shadow" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Editable Info & Official HR Details */}
        <div className="lg:col-span-2 space-y-6">
          <form
            onSubmit={handleSaveProfile}
            className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/80 shadow-xs space-y-6"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                  <User className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-slate-900 text-base">
                  Personal & Professional Details
                </h3>
              </div>
              <span className="text-xs text-slate-500 font-medium">
                T2T Operations Account
              </span>
            </div>

            {/* Editable Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  placeholder="e.g. Vishnu Konda"
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                  <span>Skills & Specializations</span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    Comma separated
                  </span>
                </label>
                <input
                  type="text"
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  placeholder="e.g. Mechanical Design, IoT Sensors, Quality Assurance, Circular Supply Chain"
                />
              </div>
            </div>

            {/* Read-Only Official Information Section */}
            <div className="pt-4 border-t border-slate-100">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">
                Official HR Records (Read Only)
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                <div className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-100">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                    Official Email
                  </span>
                  <span className="font-semibold text-slate-800 break-all">
                    {user.email}
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-100">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                    Employee ID
                  </span>
                  <span className="font-mono font-bold text-slate-800">
                    {user.employeeId}
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-100">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                    Assigned Role
                  </span>
                  <span className="font-bold text-emerald-700">
                    {user.role}
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-100">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                    Department
                  </span>
                  <span className="font-semibold text-slate-800">
                    {user.department?.name || "None Assigned"}
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-100">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                    Designation
                  </span>
                  <span className="font-semibold text-slate-800">
                    {user.designation}
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-100">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                    Account Status
                  </span>
                  <span className="inline-flex items-center gap-1 font-bold text-emerald-600">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    {user.accountStatus}
                  </span>
                </div>
              </div>
            </div>

            {/* Submit Bar */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-2 shadow-xs transition-all cursor-pointer"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Profile Picture & Changes</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Quick Password Change Link */}
          <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="w-4 h-4 text-emerald-700" />
              <div>
                <span className="text-xs font-bold text-slate-800 block">
                  Security & Access Credentials
                </span>
                <span className="text-[11px] text-slate-600">
                  Need to update your system password?
                </span>
              </div>
            </div>
            <Link
              href="/change-password"
              className="px-3 py-1.5 rounded-lg bg-white text-emerald-800 font-bold text-xs border border-emerald-200 hover:bg-emerald-100/50 transition-colors"
            >
              Change Password
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
