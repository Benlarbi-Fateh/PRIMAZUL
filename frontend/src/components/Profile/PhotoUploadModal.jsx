// app/profile/components/PhotoUploadModal.jsx
"use client";

import { useState, useRef, useCallback } from "react";
import {
  X,
  Upload,
  Camera,
  Trash2,
  Loader2,
  Image as ImageIcon,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

export default function PhotoUploadModal({
  user,
  isDark,
  isUploading,
  onClose,
  onUpload,
}) {
  const [preview, setPreview] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const handleFile = (file) => {
    if (!file) return;

    const maxSize = 5 * 1024 * 1024;
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];

    if (!allowedTypes.includes(file.type)) {
      alert("Format non supporté. Utilisez JPG, PNG, WebP ou GIF");
      return;
    }

    if (file.size > maxSize) {
      alert("Image trop volumineuse (max 5MB)");
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target.result);
    reader.readAsDataURL(file);
  };

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleSubmit = async () => {
    if (!selectedFile) return;
    try {
      await onUpload(selectedFile);
      onClose();
    } catch (error) {
      // Erreur gérée dans le hook
    }
  };

  const clearSelection = () => {
    setPreview(null);
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className={`relative w-full max-w-md overflow-hidden rounded-2xl shadow-2xl ${
            isDark ? "bg-slate-900" : "bg-white"
          }`}
        >
          {/* Header */}
          <div
            className={`p-5 border-b flex items-center justify-between ${
              isDark
                ? "border-slate-800 bg-slate-800/50"
                : "border-slate-100 bg-slate-50"
            }`}
          >
            <div>
              <h2
                className={`text-xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}
              >
                Photo de profil
              </h2>
              <p
                className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}
              >
                JPG, PNG, WebP ou GIF (max 5MB)
              </p>
            </div>
            <button
              onClick={onClose}
              className={`p-2 rounded-xl transition-all ${
                isDark
                  ? "hover:bg-slate-800 text-slate-400"
                  : "hover:bg-slate-100 text-slate-500"
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Preview */}
            {preview ? (
              <div className="relative mb-6">
                <div className="relative w-40 h-40 mx-auto rounded-2xl overflow-hidden ring-4 ring-blue-500/20">
                  <Image
                    src={preview}
                    alt="Preview"
                    fill
                    className="object-cover"
                  />
                </div>
                <button
                  onClick={clearSelection}
                  className="absolute top-0 right-1/2 translate-x-24 -translate-y-2 p-2 rounded-full bg-red-500 text-white shadow-lg hover:bg-red-600 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ) : (
              /* Drop Zone */
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative p-8 rounded-2xl border-2 border-dashed cursor-pointer transition-all ${
                  dragActive
                    ? "border-blue-500 bg-blue-500/10"
                    : isDark
                      ? "border-slate-700 hover:border-slate-600 hover:bg-slate-800/50"
                      : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                <div className="text-center">
                  <div
                    className={`w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center ${
                      isDark ? "bg-slate-800" : "bg-slate-100"
                    }`}
                  >
                    {dragActive ? (
                      <Upload className="w-8 h-8 text-blue-500 animate-bounce" />
                    ) : (
                      <ImageIcon
                        className={`w-8 h-8 ${isDark ? "text-slate-600" : "text-slate-400"}`}
                      />
                    )}
                  </div>
                  <p
                    className={`font-medium ${isDark ? "text-white" : "text-slate-900"}`}
                  >
                    {dragActive
                      ? "Déposez l'image ici"
                      : "Glissez une image ou cliquez"}
                  </p>
                  <p
                    className={`text-sm mt-1 ${isDark ? "text-slate-500" : "text-slate-400"}`}
                  >
                    Formats supportés: JPG, PNG, WebP, GIF
                  </p>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={(e) => handleFile(e.target.files[0])}
                  className="hidden"
                />
              </div>
            )}

            {/* Current Photo */}
            {!preview && user.profilePicture && (
              <div className="mt-6 text-center">
                <p
                  className={`text-sm mb-3 ${isDark ? "text-slate-500" : "text-slate-400"}`}
                >
                  Photo actuelle
                </p>
                <div className="relative w-20 h-20 mx-auto rounded-xl overflow-hidden ring-2 ring-slate-200 dark:ring-slate-700">
                  <Image
                    src={user.profilePicture}
                    alt="Current"
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div
            className={`p-5 border-t flex gap-3 ${
              isDark
                ? "border-slate-800 bg-slate-800/30"
                : "border-slate-100 bg-slate-50"
            }`}
          >
            <button
              onClick={onClose}
              className={`flex-1 py-3 rounded-xl font-medium transition-all border ${
                isDark
                  ? "border-slate-700 text-slate-300 hover:bg-slate-800"
                  : "border-slate-200 text-slate-700 hover:bg-slate-100"
              }`}
            >
              Annuler
            </button>
            <button
              onClick={handleSubmit}
              disabled={!selectedFile || isUploading}
              className="flex-1 py-3 rounded-xl font-semibold transition-all bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white shadow-lg shadow-blue-500/25 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Upload...
                </>
              ) : (
                <>
                  <Camera className="w-5 h-5" />
                  Enregistrer
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
