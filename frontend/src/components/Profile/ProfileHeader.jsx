// app/profile/components/ProfileHeader.jsx
"use client";

import Image from "next/image";
import { User, Camera, Edit3, CheckCircle } from "lucide-react";

export default function ProfileHeader({
  user,
  isDark,
  styles,
  isUploadingPhoto,
  onEditPhoto,
  onEditProfile,
}) {
  return (
    <div className={`rounded-2xl border overflow-hidden ${styles.card}`}>
      {/* Cover Image */}
      <div
        className={`relative h-28 ${
          isDark
            ? "bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-700"
            : "bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-600"
        }`}
      >
        <div className="absolute inset-0 bg-[url('/patterns/grid.svg')] opacity-20" />

        {/* Edit button */}
        <button
          onClick={onEditProfile}
          className="absolute top-3 right-3 p-2 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-all"
        >
          <Edit3 className="w-4 h-4 text-white" />
        </button>
      </div>

      {/* Profile Info */}
      <div className="relative px-5 pb-5">
        {/* Avatar */}
        <div className="relative -mt-14 mb-4">
          <div className="relative w-28 h-28 mx-auto">
            <div
              className={`w-full h-full rounded-2xl overflow-hidden ring-4 ${
                isDark ? "ring-slate-900" : "ring-white"
              } shadow-xl`}
            >
              {user.profilePicture ? (
                <Image
                  src={user.profilePicture}
                  alt={user.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div
                  className={`w-full h-full flex items-center justify-center ${
                    isDark ? "bg-slate-800" : "bg-slate-100"
                  }`}
                >
                  <User
                    className={`w-12 h-12 ${isDark ? "text-slate-600" : "text-slate-400"}`}
                  />
                </div>
              )}
            </div>

            {/* Upload button */}
            <button
              onClick={onEditPhoto}
              disabled={isUploadingPhoto}
              className={`absolute -bottom-1 -right-1 p-2.5 rounded-xl shadow-lg transition-all ${
                isDark
                  ? "bg-slate-800 hover:bg-slate-700 text-white border border-slate-700"
                  : "bg-white hover:bg-slate-50 text-slate-700 border border-slate-200"
              } ${isUploadingPhoto ? "animate-pulse" : ""}`}
            >
              <Camera className="w-4 h-4" />
            </button>

            {/* Online indicator */}
            {user.isOnline && (
              <div className="absolute bottom-0 right-8 w-5 h-5 bg-green-500 rounded-full border-4 border-white dark:border-slate-900 shadow-lg" />
            )}
          </div>
        </div>

        {/* Name & Status */}
        <div className="text-center">
          <h1
            className={`text-xl font-bold flex items-center justify-center gap-2 ${styles.text.primary}`}
          >
            {user.name}
            {user.isVerified && (
              <CheckCircle className="w-5 h-5 text-blue-500" />
            )}
          </h1>

          {user.username && (
            <p className={`text-sm ${styles.text.secondary}`}>
              @{user.username}
            </p>
          )}

          <p className={`text-sm mt-2 ${styles.text.muted}`}>
            {user.bio || "Aucune biographie"}
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2 mt-5">
          <button
            onClick={onEditProfile}
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${styles.button.primary}`}
          >
            Modifier le profil
          </button>
        </div>
      </div>
    </div>
  );
}
