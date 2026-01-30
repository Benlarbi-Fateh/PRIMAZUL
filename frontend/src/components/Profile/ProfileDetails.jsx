// app/profile/components/ProfileDetails.jsx
"use client";

import { User, Mail, Phone, MapPin, FileText, Edit3 } from "lucide-react";

export default function ProfileDetails({
  user,
  isDark,
  styles,
  onEditProfile,
  onEditEmail,
}) {
  const details = [
    {
      icon: User,
      label: "Nom complet",
      value: user.name,
      editable: true,
    },
    {
      icon: Mail,
      label: "Adresse email",
      value: user.email,
      editable: true,
      onEdit: onEditEmail,
      special: true,
    },
    {
      icon: Phone,
      label: "Téléphone",
      value: user.phoneNumber || "Non renseigné",
      editable: true,
      isEmpty: !user.phoneNumber,
    },
    {
      icon: MapPin,
      label: "Localisation",
      value: user.location || "Non renseignée",
      editable: true,
      isEmpty: !user.location,
    },
  ];

  return (
    <div className={`rounded-2xl border overflow-hidden ${styles.card}`}>
      {/* Header */}
      <div
        className={`p-5 border-b flex items-center justify-between ${
          isDark
            ? "border-slate-700/50 bg-slate-800/30"
            : "border-slate-200/50 bg-slate-50/50"
        }`}
      >
        <div>
          <h2
            className={`text-lg font-bold flex items-center gap-2 ${styles.text.primary}`}
          >
            <User className="w-5 h-5 text-blue-500" />
            Informations personnelles
          </h2>
          <p className={`text-sm mt-1 ${styles.text.secondary}`}>
            Gérez vos informations de profil
          </p>
        </div>
       
      </div>

      {/* Content */}
      <div className="p-6 space-y-4">
        {details.map((detail, index) => (
          <div
            key={index}
            className={`p-4 rounded-xl border transition-all ${
              isDark
                ? "bg-slate-800/30 border-slate-700/50 hover:bg-slate-800/50"
                : "bg-slate-50/50 border-slate-200/50 hover:bg-slate-100/50"
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div
                  className={`p-2.5 rounded-xl ${
                    isDark ? "bg-slate-700/50" : "bg-white"
                  }`}
                >
                  <detail.icon
                    className={`w-5 h-5 ${
                      isDark ? "text-blue-400" : "text-blue-600"
                    }`}
                  />
                </div>
                <div>
                  <label
                    className={`text-xs uppercase tracking-wider font-semibold ${
                      isDark ? "text-slate-500" : "text-slate-400"
                    }`}
                  >
                    {detail.label}
                  </label>
                  <p
                    className={`mt-1 font-medium ${
                      detail.isEmpty
                        ? "italic " + styles.text.muted
                        : styles.text.primary
                    }`}
                  >
                    {detail.value}
                  </p>
                </div>
              </div>

              {detail.special && (
                <button
                  onClick={detail.onEdit}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${styles.button.primary}`}
                >
                  Modifier
                </button>
              )}
            </div>
          </div>
        ))}

        {/* Bio */}
        <div
          className={`p-4 rounded-xl border ${
            isDark
              ? "bg-slate-800/30 border-slate-700/50"
              : "bg-slate-50/50 border-slate-200/50"
          }`}
        >
          <div className="flex items-start gap-4">
            <div
              className={`p-2.5 rounded-xl ${
                isDark ? "bg-slate-700/50" : "bg-white"
              }`}
            >
              <FileText
                className={`w-5 h-5 ${
                  isDark ? "text-blue-400" : "text-blue-600"
                }`}
              />
            </div>
            <div className="flex-1">
              <label
                className={`text-xs uppercase tracking-wider font-semibold ${
                  isDark ? "text-slate-500" : "text-slate-400"
                }`}
              >
                Biographie
              </label>
              <p
                className={`mt-2 leading-relaxed ${
                  user.bio ? styles.text.primary : "italic " + styles.text.muted
                }`}
              >
                {user.bio || "Aucune biographie renseignée"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
