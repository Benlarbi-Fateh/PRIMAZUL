"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Camera, Upload, X, Check, Sparkles, ArrowRight } from "lucide-react";
import api from "@/lib/api";
import { useTheme } from "@/context/ThemeContext";

export default function UploadProfilePicture({ userId, userName, onComplete }) {
  const [selectedImage, setSelectedImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  const { theme } = useTheme();
  const isDark = theme === "dark";

  const textStrong = isDark ? "text-slate-50" : "text-gray-900";
  const textMuted = isDark ? "text-slate-400" : "text-gray-600";

  const primaryButtonClass =
    "w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-4 rounded-2xl font-semibold transition-all duration-300 hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl flex items-center justify-center gap-3";

  const secondaryButtonClass =
    "w-full py-4 rounded-2xl font-semibold transition-all duration-300 flex items-center justify-center gap-3 border " +
    (isDark
      ? "bg-slate-900/80 border-slate-700 text-slate-100 hover:bg-slate-800"
      : "bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200 hover:border-gray-400");

  const errorAlertClass =
    "p-4 rounded-xl text-sm flex items-center gap-3 border " +
    (isDark
      ? "bg-rose-950/60 border-rose-700 text-rose-200"
      : "bg-red-50 border-red-200 text-red-700");

  // Générer les initiales
  const getInitials = (name) =>
    name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Veuillez sélectionner une image valide");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("L'image ne doit pas dépasser 5MB");
      return;
    }

    setSelectedImage(file);
    setError("");

    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!selectedImage) return;

    setUploading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("profilePicture", selectedImage);
      formData.append("userId", userId);

      const response = await api.post("/auth/upload-profile-picture", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      onComplete(response.data.user);
    } catch (error) {
      console.error("❌ Erreur upload:", error);
      setError(error.response?.data?.error || "Erreur lors de l'upload");
    } finally {
      setUploading(false);
    }
  };

  const handleSkip = async () => {
    setUploading(true);
    setError("");
    try {
      const response = await api.post("/auth/skip-profile-picture", { userId });
      onComplete(response.data.user);
    } catch (error) {
      console.error("❌ Erreur skip:", error);
      setError(error.response?.data?.error || "Erreur");
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl shadow-lg bg-gradient-to-br from-blue-500 to-blue-600">
          <Camera className="w-10 h-10 text-white" />
        </div>
        <div>
          <h2 className={`text-2xl font-bold ${textStrong}`}>Photo de profil</h2>
          <p className={textMuted}>Personnalisez votre compte</p>
        </div>
      </div>

      {/* Preview Zone */}
      <div className="flex justify-center">
        <div className="relative">
          {preview ? (
            <div className="relative">
              <Image
                src={preview}
                alt="Preview"
                width={160}
                height={160}
                className="w-40 h-40 rounded-full object-cover border-4 border-blue-500 shadow-[0_18px_45px_rgba(37,99,235,0.6)]"
                unoptimized
              />
              <button
                onClick={handleRemoveImage}
                disabled={uploading}
                className="absolute -top-2 -right-2 w-10 h-10 bg-rose-500 hover:bg-rose-600 text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110 disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <div className="w-40 h-40 rounded-full flex items-center justify-center text-5xl font-bold shadow-[0_18px_45px_rgba(37,99,235,0.5)] border-4 border-blue-200 bg-gradient-to-br from-blue-500 via-sky-500 to-indigo-500 text-white">
              {getInitials(userName)}
            </div>
          )}

          {/* Bouton caméra flottant */}
          {!preview && (
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className={
                "absolute bottom-2 right-2 w-12 h-12 rounded-full shadow-lg flex items-center justify-center border-2 transition-all hover:scale-110 disabled:opacity-50 " +
                (isDark
                  ? "bg-slate-900/90 border-slate-600 text-slate-100 hover:bg-slate-800"
                  : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50")
              }
            >
              <Camera className="w-6 h-6" />
            </button>
          )}
        </div>
      </div>

      {/* Input file caché */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={uploading}
      />

      {/* Error */}
      {error && (
        <div className={errorAlertClass}>
          <div className="w-2 h-2 bg-current rounded-full" />
          <span>{error}</span>
        </div>
      )}

      {/* Actions */}
      <div className="space-y-3">
        {preview ? (
          <button
            onClick={handleUpload}
            disabled={uploading}
            className={primaryButtonClass}
          >
            {uploading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Upload en cours...</span>
              </>
            ) : (
              <>
                <Check className="w-5 h-5" />
                <span>Confirmer cette photo</span>
              </>
            )}
          </button>
        ) : (
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className={primaryButtonClass}
          >
            <Upload className="w-5 h-5" />
            <span>Choisir une photo</span>
          </button>
        )}

        <button
          onClick={handleSkip}
          disabled={uploading}
          className={secondaryButtonClass}
        >
          {uploading ? (
            <>
              <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
              <span>Chargement...</span>
            </>
          ) : (
            <>
              <ArrowRight className="w-5 h-5" />
              <span>Continuer sans photo</span>
            </>
          )}
        </button>
      </div>

      {/* Info */}
      <div className="text-center space-y-2">
        <p
          className={
            "text-sm flex items-center justify-center gap-2 " + textMuted
          }
        >
          <Sparkles className="w-4 h-4 text-yellow-400" />
          Vous pourrez la modifier plus tard
        </p>
        <p className={`text-xs ${isDark ? "text-slate-500" : "text-gray-500"}`}>
          Formats acceptés : JPG, PNG, WebP (5MB max)
        </p>
      </div>
    </div>
  );
}