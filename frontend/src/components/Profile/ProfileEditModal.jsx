// app/profile/components/ProfileEditModal.jsx
"use client";

import { useState } from "react";
import { X, User, Phone, MapPin, FileText, Save, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function ProfileEditModal({
  user,
  isDark,
  isUpdating,
  onClose,
  onSave,
}) {
  const [formData, setFormData] = useState({
    name: user.name || "",
    username: user.username || "",
    phoneNumber: user.phoneNumber || "",
    location: user.location || "",
    bio: user.bio || "",
  });

  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = "Le nom est requis";
    }
    if (formData.username && formData.username.length < 3) {
      newErrors.username = "Minimum 3 caractères";
    }
    if (formData.bio.length > 150) {
      newErrors.bio = "Maximum 150 caractères";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      // Erreur gérée par le hook
    }
  };

  const inputStyle = `w-full p-3.5 rounded-xl border transition-all focus:ring-2 focus:ring-blue-500/50 ${
    isDark
      ? "bg-slate-800/50 border-slate-700 text-white placeholder-slate-500"
      : "bg-white border-slate-200 text-slate-900 placeholder-slate-400"
  }`;

  const labelStyle = `block text-sm font-medium mb-2 ${
    isDark ? "text-slate-300" : "text-slate-700"
  }`;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className={`relative w-full max-w-lg max-h-[90vh] overflow-hidden rounded-2xl shadow-2xl ${
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
                Modifier le profil
              </h2>
              <p
                className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}
              >
                Mettez à jour vos informations
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

          {/* Form */}
          <form
            onSubmit={handleSubmit}
            className="p-5 space-y-5 overflow-y-auto max-h-[60vh]"
          >
            {/* Nom */}
            <div>
              <label className={labelStyle}>
                <User className="w-4 h-4 inline mr-2" />
                Nom complet *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className={`${inputStyle} ${errors.name ? "border-red-500" : ""}`}
                placeholder="Votre nom"
              />
              {errors.name && (
                <p className="text-red-500 text-sm mt-1">{errors.name}</p>
              )}
            </div>

            {/* Username */}
            <div>
              <label className={labelStyle}>@ Nom d&lsquo;utilisateur</label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    username: e.target.value.toLowerCase(),
                  })
                }
                className={`${inputStyle} ${errors.username ? "border-red-500" : ""}`}
                placeholder="votre_username"
              />
              {errors.username && (
                <p className="text-red-500 text-sm mt-1">{errors.username}</p>
              )}
            </div>

            {/* Téléphone */}
            <div>
              <label className={labelStyle}>
                <Phone className="w-4 h-4 inline mr-2" />
                Téléphone
              </label>
              <input
                type="tel"
                value={formData.phoneNumber}
                onChange={(e) =>
                  setFormData({ ...formData, phoneNumber: e.target.value })
                }
                className={inputStyle}
                placeholder="+33 6 12 34 56 78"
              />
            </div>

            {/* Localisation */}
            <div>
              <label className={labelStyle}>
                <MapPin className="w-4 h-4 inline mr-2" />
                Localisation
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) =>
                  setFormData({ ...formData, location: e.target.value })
                }
                className={inputStyle}
                placeholder="Paris, France"
              />
            </div>

            {/* Bio */}
            <div>
              <label className={labelStyle}>
                <FileText className="w-4 h-4 inline mr-2" />
                Biographie
                <span
                  className={`float-right font-normal ${
                    formData.bio.length > 150
                      ? "text-red-500"
                      : isDark
                        ? "text-slate-500"
                        : "text-slate-400"
                  }`}
                >
                  {formData.bio.length}/150
                </span>
              </label>
              <textarea
                value={formData.bio}
                onChange={(e) =>
                  setFormData({ ...formData, bio: e.target.value })
                }
                className={`${inputStyle} resize-none ${errors.bio ? "border-red-500" : ""}`}
                rows={3}
                placeholder="Parlez-nous de vous..."
              />
              {errors.bio && (
                <p className="text-red-500 text-sm mt-1">{errors.bio}</p>
              )}
            </div>
          </form>

          {/* Footer */}
          <div
            className={`p-5 border-t flex gap-3 ${
              isDark
                ? "border-slate-800 bg-slate-800/30"
                : "border-slate-100 bg-slate-50"
            }`}
          >
            <button
              type="button"
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
              disabled={isUpdating}
              className="flex-1 py-3 rounded-xl font-semibold transition-all bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white shadow-lg shadow-blue-500/25 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isUpdating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
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
