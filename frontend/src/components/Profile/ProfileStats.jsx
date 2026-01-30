// app/profile/components/ProfileStats.jsx
"use client";

import { MessageCircle, Users, UsersRound, Calendar } from "lucide-react";

export default function ProfileStats({ user, isDark, styles }) {
  const stats = [
    {
      icon: MessageCircle,
      label: "Messages",
      value: user.stats?.messagesCount || 0,
      color: "text-blue-500",
      bg: isDark ? "bg-blue-500/10" : "bg-blue-50",
    },
    {
      icon: Users,
      label: "Contacts",
      value: user.stats?.contactsCount || 0,
      color: "text-green-500",
      bg: isDark ? "bg-green-500/10" : "bg-green-50",
    },
    {
      icon: UsersRound,
      label: "Groupes",
      value: user.stats?.groupsCount || 0,
      color: "text-purple-500",
      bg: isDark ? "bg-purple-500/10" : "bg-purple-50",
    },
  ];

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <div className={`rounded-2xl border overflow-hidden ${styles.card}`}>
      <div
        className={`p-4 border-b ${isDark ? "border-slate-700/50" : "border-slate-200/50"}`}
      >
        <h3 className={`font-semibold ${styles.text.primary}`}>Statistiques</h3>
      </div>

      <div className="p-4 space-y-3">
        {stats.map((stat, index) => (
          <div
            key={index}
            className={`flex items-center justify-between p-3 rounded-xl ${stat.bg}`}
          >
            <div className="flex items-center gap-3">
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
              <span className={styles.text.secondary}>{stat.label}</span>
            </div>
            <span className={`font-bold ${styles.text.primary}`}>
              {stat.value.toLocaleString()}
            </span>
          </div>
        ))}

        {/* Membre depuis */}
        <div
          className={`flex items-center justify-between p-3 rounded-xl ${
            isDark ? "bg-slate-800/50" : "bg-slate-50"
          }`}
        >
          <div className="flex items-center gap-3">
            <Calendar
              className={`w-5 h-5 ${isDark ? "text-slate-400" : "text-slate-500"}`}
            />
            <span className={styles.text.secondary}>Membre depuis</span>
          </div>
          <span className={`text-sm font-medium ${styles.text.primary}`}>
            {formatDate(user.createdAt)}
          </span>
        </div>
      </div>
    </div>
  );
}
